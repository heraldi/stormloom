import { BALANCE, clamp } from './balance.js';
import { registerLightningCrossing } from './lightning-nets.js';

function random(state) {
  state.directorSeed = (state.directorSeed * 1664525 + 1013904223) >>> 0;
  return state.directorSeed / 4294967296;
}

function sparkFrom(state, index, fresh = false) {
  const bounds = BALANCE.playBounds;
  const x = fresh ? bounds.left + random(state) * (bounds.right - bounds.left) : bounds.right + 18;
  const y = bounds.top + random(state) * (bounds.bottom - bounds.top);
  const angle = Math.PI * (0.54 + random(state) * 0.35);
  return {
    id: index,
    x,
    y,
    vx: Math.cos(angle) * (BALANCE.sparkSpeedMin + random(state) * (BALANCE.sparkSpeedMax - BALANCE.sparkSpeedMin)),
    vy: Math.sin(angle) * (BALANCE.sparkSpeedMin + random(state) * (BALANCE.sparkSpeedMax - BALANCE.sparkSpeedMin)),
    phase: random(state) * Math.PI * 2,
    pulse: random(state),
    life: 1,
  };
}

export function seedStorm(state) {
  state.directorSeed = state.seed >>> 0;
  state.directorClock = 0.9;
  state.sparks.length = 0;
  for (let i = 0; i < BALANCE.sparkCount; i += 1) {
    const spark = sparkFrom(state, i, true);
    if (Math.hypot(spark.x - state.skiff.x, spark.y - state.skiff.y) < 160) spark.x = BALANCE.playBounds.right + 30;
    state.sparks.push(spark);
  }
  state.hitCooldown = 2;
  state.bolts.length = 0;
}

function spawnBolt(state) {
  const bounds = BALANCE.playBounds;
  const horizontal = random(state) > 0.38;
  let a;
  let b;
  if (horizontal) {
    const y = bounds.top + 40 + random(state) * (bounds.bottom - bounds.top - 80);
    a = { x: bounds.left - 24, y: y + (random(state) - 0.5) * 180 };
    b = { x: bounds.right + 24, y: y + (random(state) - 0.5) * 180 };
  } else {
    const x = bounds.left + random(state) * (bounds.right - bounds.left);
    a = { x: x + (random(state) - 0.5) * 190, y: bounds.top - 20 };
    b = { x: x + (random(state) - 0.5) * 190, y: bounds.bottom + 20 };
  }
  const bolt = { a, b, life: 0.38, maxLife: 0.38, seed: random(state) };
  state.bolts.push(bolt);
  registerLightningCrossing(state, bolt, state.audio, state.emitEffect);
}

export function updateStorm(state, dt) {
  if (!state.sparks.length) seedStorm(state);
  const bounds = BALANCE.playBounds;
  const targetCount = BALANCE.sparkCount + (state.front - 1) * 2;
  while (state.sparks.length < targetCount) state.sparks.push(sparkFrom(state, state.sparks.length));
  const speed = 1 + (state.front - 1) * 0.12;
  for (const spark of state.sparks) {
    spark.phase += dt * (1.2 + spark.pulse);
    spark.x += spark.vx * dt * speed;
    spark.y += spark.vy * dt * speed + Math.sin(spark.phase) * 5 * dt;
    if (spark.x < bounds.left - 50 || spark.y < bounds.top - 50 || spark.y > bounds.bottom + 50) {
      Object.assign(spark, sparkFrom(state, spark.id));
    }
  }

  state.directorClock -= dt;
  if (state.directorClock <= 0) {
    state.directorClock += Math.max(0.85, BALANCE.lightningInterval - state.front * 0.08);
    spawnBolt(state);
  }
  for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
    state.bolts[i].life -= dt;
    if (state.bolts[i].life <= 0) state.bolts.splice(i, 1);
  }
}

export function sparkIntensity(state, spark) {
  return clamp(0.7 + Math.sin(spark.phase) * 0.25 + state.front * 0.04, 0.45, 1.2);
}
