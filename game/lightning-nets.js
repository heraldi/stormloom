import { BALANCE, clamp } from './balance.js';
import { setHint } from './game-state.js';

function triangleArea(a, b, c) {
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) * 0.5);
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a, b, p) {
  return p.x >= Math.min(a.x, b.x) - 0.01 && p.x <= Math.max(a.x, b.x) + 0.01 &&
    p.y >= Math.min(a.y, b.y) - 0.01 && p.y <= Math.max(a.y, b.y) + 0.01;
}

export function segmentsCross(a, b, c, d) {
  const ab1 = cross(a, b, c);
  const ab2 = cross(a, b, d);
  const cd1 = cross(c, d, a);
  const cd2 = cross(c, d, b);
  if (((ab1 > 0 && ab2 < 0) || (ab1 < 0 && ab2 > 0)) &&
      ((cd1 > 0 && cd2 < 0) || (cd1 < 0 && cd2 > 0))) return true;
  return Math.abs(ab1) < 0.01 && onSegment(a, b, c) || Math.abs(ab2) < 0.01 && onSegment(a, b, d) ||
    Math.abs(cd1) < 0.01 && onSegment(c, d, a) || Math.abs(cd2) < 0.01 && onSegment(c, d, b);
}

export function netSegments(state) {
  const points = state.net.points;
  if (points.length < 2) return [];
  if (points.length === 2) return [[points[0], points[1]]];
  return [[points[0], points[1]], [points[1], points[2]], [points[2], points[0]]];
}

export function previewTriangle(state) {
  if (state.net.points.length !== 2) return null;
  return [state.net.points[0], state.net.points[1], state.skiff];
}

export function placeBuoy(state, audio, emit) {
  if (state.mode !== 'PLAY' || state.buoyCooldown > 0) return false;
  const point = {
    x: clamp(state.skiff.x, BALANCE.playBounds.left, BALANCE.playBounds.right),
    y: clamp(state.skiff.y, BALANCE.playBounds.top, BALANCE.playBounds.bottom),
  };
  const points = state.net.points;
  if (points.length > 0 && distanceSquared(points[points.length - 1], point) < 40 * 40) {
    setHint(state, 'Move farther before dropping another buoy.', 2.2);
    return false;
  }
  points.push(point);
  state.buoysPlaced = points.length;
  state.buoyCooldown = BALANCE.buoyCooldown;
  state.flash = 0.38;
  emit?.({ kind: 'buoy', x: point.x, y: point.y });
  audio?.buoy?.();

  if (points.length === 1) setHint(state, 'One anchor set. Stretch the circuit across the water.', 3);
  if (points.length === 2) setHint(state, 'Preview live: steer to shape the third corner.', 5);
  if (points.length === 3) {
    harvestNet(state, audio, emit);
  }
  return true;
}

export function ventNet(state, audio, emit) {
  if (state.mode !== 'PLAY' || state.net.points.length === 0) return false;
  const lostCharge = state.net.charge;
  state.net.points.length = 0;
  state.net.charge = 0;
  state.buoysPlaced = 0;
  state.multiplier = 1;
  state.stats.vents += 1;
  emit?.({ kind: 'vent', x: state.skiff.x, y: state.skiff.y, size: 34 + lostCharge * 24 });
  audio?.vent?.();
  setHint(state, lostCharge > 0.1 ? 'Circuit vented. The charge is gone, but the hull is safe.' : 'Unfinished circuit vented.', 3);
  return true;
}

export function harvestNet(state, audio, emit) {
  const [a, b, c] = state.net.points;
  const area = triangleArea(a, b, c);
  const charge = state.net.charge;
  if (area < BALANCE.minimumNetArea) {
    state.net.points.length = 0;
    state.net.charge = 0;
    state.buoysPlaced = 0;
    state.multiplier = 1;
    setHint(state, 'Net too tight to catch a useful storm current. Spread the anchors.', 3);
    audio?.vent?.();
    emit?.({ kind: 'vent', x: state.skiff.x, y: state.skiff.y, size: 28 });
    return 0;
  }
  const power = state.harvestPowerBonus ?? 1;
  const energy = (BALANCE.harvestBase + area * BALANCE.harvestAreaScale) *
    (1 + charge * BALANCE.harvestChargeScale) * power;
  const gained = Math.round(energy);
  state.beacon = clamp(state.beacon + gained, 0, BALANCE.beaconGoal);
  state.score += Math.round(gained * BALANCE.scorePerEnergy * (1 + state.front * 0.08));
  state.largestHarvest = Math.max(state.largestHarvest, gained);
  state.harvests += 1;
  state.multiplier = 1;
  state.net.lastHarvest = gained;
  emit?.({ kind: 'harvest', x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, amount: gained, area, charge, points: [a, b, c] });
  audio?.harvest?.(Math.min(1, charge));
  state.net.points.length = 0;
  state.net.charge = 0;
  state.buoysPlaced = 0;
  state.flash = 0.82;
  state.shake = Math.min(1.3, 0.25 + gained / 500);
  setHint(state, `Harvest +${gained} beacon energy. Reposition for the next net.`, 3.2);
  if (state.beacon >= BALANCE.beaconGoal) {
    state.mode = 'VICTORY';
    setHint(state, 'The beacon is alive. You found the way home.', 999);
  }
  return gained;
}

export function registerLightningCrossing(state, bolt, audio, emit) {
  const segments = netSegments(state);
  if (segments.length === 0) return 0;
  let crossed = 0;
  for (const [a, b] of segments) {
    if (segmentsCross(bolt.a, bolt.b, a, b)) crossed += 1;
  }
  if (crossed === 0) return 0;
  state.net.charge = clamp(state.net.charge + BALANCE.chargePerCrossing * crossed, 0, 1.5);
  state.stats.crossings += crossed;
  state.net.crossedAt = state.clock;
  state.multiplier = 1 + state.net.charge * BALANCE.harvestChargeScale;
  emit?.({ kind: 'crossing', x: bolt.b.x, y: bolt.b.y, count: crossed });
  audio?.crossing?.(Math.min(1, state.net.charge));
  setHint(state, `Lightning caught — charge x${state.multiplier.toFixed(2)}. Heat rising.`, 2.4);
  addWireHeat(state, BALANCE.heatPerCrossing * crossed, audio, emit);
  return crossed;
}

// Both ambient crossings and a strike on an open wire use the same overheat path.
export function addWireHeat(state, amount, audio = state.audio, emit = state.emitEffect) {
  state.heat = clamp(state.heat + amount, 0, BALANCE.heatMax);
  if (state.heat >= BALANCE.heatDamageThreshold) {
    state.heat = 38;
    state.net.points.length = 0;
    state.net.charge = 0;
    state.buoysPlaced = 0;
    state.multiplier = 1;
    state.heatStun = BALANCE.heatStun;
    state.hitCooldown = BALANCE.sparkDamageCooldown;
    state.shake = 1;
    state.flash = 1;
    emit?.({ kind: 'overheat', x: state.skiff.x, y: state.skiff.y });
    audio?.overheat?.();
    if (state.clock >= 6) state.hull = Math.max(0, state.hull - BALANCE.heatDamage);
    state.stats.overheats += 1;
    setHint(state, 'OVERHEAT — unfinished circuit destroyed, hull damaged.', 3.5);
    if (state.hull <= 0) {
      state.mode = 'DEFEAT';
      state.defeatReason = `Overheated on front ${state.front}`;
    }
  }
}

export function netArea(state) {
  return state.net.points.length === 3 ? triangleArea(...state.net.points) : 0;
}
