import { ARENA, BALANCE, COLORS, clamp } from './balance.js';
import { netArea, previewTriangle } from './lightning-nets.js';
import { sparkIntensity } from './storm-director.js';

const TAU = Math.PI * 2;

export function emitEffect(state, event) {
  const effects = state.effects;
  // Reserve a whole burst up front; the effect pool never exceeds 192 records.
  if (effects.length > 152) effects.splice(0, effects.length - 152);
  if (event.kind === 'harvest') {
    effects.push({ kind: 'seal', points: event.points, life: 1.25 });
    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * TAU;
      effects.push({ kind: 'ember', x: event.x, y: event.y, vx: Math.cos(angle) * (40 + i % 5 * 13), vy: Math.sin(angle) * (40 + i % 5 * 13), life: 1.1 + (i % 4) * 0.08, size: 2 + i % 3 });
    }
    effects.push({ kind: 'ring', x: event.x, y: event.y, life: 1.2, size: Math.max(45, Math.sqrt(event.area) * 0.8), energy: true });
    effects.push({ kind: 'text', x: event.x, y: event.y - 26, life: 1.8, text: `+${event.amount}`, color: COLORS.amberLight });
  } else if (event.kind === 'buoy') {
    effects.push({ kind: 'ring', x: event.x, y: event.y, life: 0.6, size: 18 });
  } else if (event.kind === 'crossing') {
    effects.push({ kind: 'cross', x: event.x, y: event.y, life: 0.46, size: 16 });
  } else if (event.kind === 'vent') {
    effects.push({ kind: 'ring', x: event.x, y: event.y, life: 0.8, size: event.size, coral: true });
    effects.push({ kind: 'text', x: event.x, y: event.y - 25, life: 1.1, text: 'VENT', color: COLORS.ivoryDim });
  } else if (event.kind === 'overheat') {
    effects.push({ kind: 'ring', x: event.x, y: event.y, life: 1.6, size: 56, coral: true });
    effects.push({ kind: 'text', x: event.x, y: event.y - 36, life: 1.4, text: 'OVERHEAT', color: COLORS.coral });
  } else if (event.kind === 'sparkHit') {
    for (let i = 0; i < 12; i += 1) effects.push({ kind: 'ember', x: event.x, y: event.y, vx: (i % 2 ? 1 : -1) * (30 + i * 4), vy: -50 + i * 9, life: 0.5, size: 2, coral: true });
  }
}

export function updateEffects(state, dt) {
  for (let i = state.effects.length - 1; i >= 0; i -= 1) {
    const effect = state.effects[i];
    effect.life -= dt;
    if (effect.kind === 'ember') {
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vx *= 0.96;
      effect.vy += 35 * dt;
    }
    if (effect.kind === 'ring' || effect.kind === 'cross') effect.size += dt * 70;
    if (effect.kind === 'text') effect.y -= dt * 19;
    if (effect.life <= 0) state.effects.splice(i, 1);
  }
}

function drawBolt(ctx, bolt) {
  const alpha = clamp(bolt.life / bolt.maxLife, 0, 1);
  const dx = bolt.b.x - bolt.a.x;
  const dy = bolt.b.y - bolt.a.y;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.strokeStyle = COLORS.ivory;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bolt.a.x, bolt.a.y);
  const steps = 9;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const offset = Math.sin((t + bolt.seed) * 23) * 10 * (i === steps ? 0 : 1);
    ctx.lineTo(bolt.a.x + dx * t + nx * offset, bolt.a.y + dy * t + ny * offset);
  }
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.16;
  ctx.lineWidth = 13;
  ctx.stroke();
  ctx.restore();
}

function drawNet(ctx, state) {
  const points = state.net.points;
  const preview = previewTriangle(state);
  if (preview) {
    ctx.save();
    ctx.fillStyle = 'rgba(246, 239, 220, .07)';
    ctx.strokeStyle = 'rgba(246, 239, 220, .35)';
    ctx.setLineDash([7, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(preview[0].x, preview[0].y);
    ctx.lineTo(preview[1].x, preview[1].y);
    ctx.lineTo(preview[2].x, preview[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const [a, b, c] = preview;
    const area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5;
    const estimate = Math.round((BALANCE.harvestBase + area * BALANCE.harvestAreaScale) * state.multiplier * state.harvestPowerBonus);
    ctx.save();
    ctx.fillStyle = COLORS.ivory;
    ctx.font = '600 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(area < BALANCE.minimumNetArea ? 'SPREAD THE THIRD CORNER' : `SEAL ≈ ${estimate} ENERGY`, (a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3 - 10);
    ctx.restore();
  }
  if (points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = COLORS.ivory;
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = state.net.charge > 0.05 ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  if (points.length === 3) ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 0.11 + state.net.charge * 0.08;
  ctx.fillStyle = COLORS.ivory;
  if (points.length === 3) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    ctx.beginPath();
    ctx.fillStyle = COLORS.ivory;
    ctx.arc(point.x, point.y, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.font = '700 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), point.x, point.y + 0.5);
  }
}

function drawBeacon(ctx, state) {
  const x = ARENA.width - 82;
  const y = 57;
  const ratio = state.beacon / BALANCE.beaconGoal;
  ctx.save();
  ctx.strokeStyle = COLORS.ivoryDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 24, y + 29);
  ctx.lineTo(x + 24, y + 29);
  ctx.moveTo(x - 16, y + 29);
  ctx.lineTo(x - 8, y - 3);
  ctx.lineTo(x + 8, y - 3);
  ctx.lineTo(x + 16, y + 29);
  ctx.stroke();
  ctx.fillStyle = `rgba(231,168,62,${0.24 + ratio * 0.6})`;
  ctx.beginPath();
  ctx.arc(x, y - 8, 9 + ratio * 6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.amber;
  ctx.beginPath();
  ctx.arc(x, y - 8, 13, -Math.PI / 2, -Math.PI / 2 + TAU * ratio);
  ctx.stroke();
  ctx.restore();
}

function drawSparks(ctx, state) {
  for (const spark of state.sparks) {
    const intensity = sparkIntensity(state, spark);
    ctx.save();
    ctx.translate(spark.x, spark.y);
    ctx.rotate(spark.phase * 0.35);
    ctx.globalAlpha = intensity;
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-2, -4);
    ctx.lineTo(1, 1);
    ctx.lineTo(8, -3);
    ctx.stroke();
    ctx.globalAlpha = intensity * 0.35;
    ctx.strokeStyle = COLORS.ivory;
    ctx.beginPath();
    ctx.moveTo(-5, 7);
    ctx.lineTo(5, -7);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSkiff(ctx, state) {
  const skiff = state.skiff;
  const speed = Math.hypot(skiff.vx, skiff.vy);
  ctx.save();
  ctx.translate(skiff.x, skiff.y);
  if (state.hitCooldown > 0) {
    ctx.strokeStyle = COLORS.ivoryDim;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.rotate(skiff.angle);
  ctx.fillStyle = COLORS.ink;
  ctx.strokeStyle = state.heat > 70 ? COLORS.coral : COLORS.ivory;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(5, -12);
  ctx.lineTo(-19, -9);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-19, 9);
  ctx.lineTo(5, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.ivory;
  ctx.beginPath();
  ctx.arc(9, 0, 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.foam;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(-23, -5);
  ctx.lineTo(-38 - speed * 0.04, -3);
  ctx.moveTo(-23, 5);
  ctx.lineTo(-38 - speed * 0.04, 3);
  ctx.stroke();
  ctx.restore();
}

function drawEffect(ctx, effect) {
  const alpha = clamp(effect.life / 1.2, 0, 1);
  if (effect.kind === 'seal') {
    const [a, b, c] = effect.points;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(231,168,62,.13)';
    ctx.strokeStyle = COLORS.ivory;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i += 1) {
      const t = i / 10;
      ctx.beginPath();
      ctx.moveTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      ctx.lineTo(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t);
      ctx.moveTo(b.x + (a.x - b.x) * t, b.y + (a.y - b.y) * t);
      ctx.lineTo(b.x + (c.x - b.x) * t, b.y + (c.y - b.y) * t);
      ctx.stroke();
    }
    ctx.restore();
  } else if (effect.kind === 'ember') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = effect.coral ? COLORS.coral : COLORS.amberLight;
    ctx.fillRect(effect.x - effect.size * 0.5, effect.y - effect.size * 0.5, effect.size, effect.size);
    ctx.restore();
  } else if (effect.kind === 'ring') {
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = effect.coral ? COLORS.coral : effect.energy ? COLORS.amber : COLORS.ivory;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, TAU);
    ctx.stroke();
    ctx.restore();
  } else if (effect.kind === 'cross') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS.ivory;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(effect.x - effect.size, effect.y - effect.size); ctx.lineTo(effect.x + effect.size, effect.y + effect.size);
    ctx.moveTo(effect.x + effect.size, effect.y - effect.size); ctx.lineTo(effect.x - effect.size, effect.y + effect.size);
    ctx.stroke();
    ctx.restore();
  } else if (effect.kind === 'text') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = effect.color;
    ctx.font = '700 17px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(effect.text, effect.x, effect.y);
    ctx.restore();
  }
}

export function drawWorld(ctx, state) {
  drawSparks(ctx, state);
  for (const bolt of state.bolts) drawBolt(ctx, bolt);
  drawNet(ctx, state);
  drawBeacon(ctx, state);
  drawSkiff(ctx, state);
  for (const effect of state.effects) drawEffect(ctx, effect);
  if (netArea(state) > 0) {
    ctx.save();
    ctx.fillStyle = COLORS.ivoryDim;
    ctx.globalAlpha = 0.45;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    const points = state.net.points;
    const cx = (points[0].x + points[1].x + points[2].x) / 3;
    const cy = (points[0].y + points[1].y + points[2].y) / 3;
    ctx.fillText(`${Math.round(netArea(state))} m² capture`, cx, cy);
    ctx.restore();
  }
}
