import { BALANCE, clamp } from './balance.js';
import { damageHull } from './game-state.js';
import { moveVector } from './skiff-controls.js';
import { netSegments, addWireHeat } from './lightning-nets.js';

function segmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}

export function resolveStrike(state, strike) {
  if (strike.resolved) return;
  strike.resolved = true;
  if (state.mode !== 'PLAY' || state.clock < 6) return;
  const radius = strike.radius;
  // Hull has priority even during immunity: one strike never hits both hull and wire.
  if (Math.hypot(state.skiff.x - strike.x, state.skiff.y - strike.y) <= radius + BALANCE.skiffRadius) {
    const damaged = damageHull(state, 1, `Struck by lightning on front ${state.front}`);
    if (damaged) state.emitEffect?.({ kind: 'sparkHit', x: state.skiff.x, y: state.skiff.y });
  } else if (netSegments(state).some(([a, b]) => segmentDistance(strike, a, b) <= radius)) {
    addWireHeat(state, BALANCE.strikeHeat);
  }
}

export function updateSkiff(state, input, dt) {
  if (state.heatStun > 0) return;
  const move = moveVector(input);
  const speedBonus = state.mobilityBonus ?? 1;
  const maxSpeed = BALANCE.skiffSpeed * speedBonus;
  const response = Math.min(1, dt * BALANCE.steeringResponse);
  state.skiff.vx += (move.x * maxSpeed - state.skiff.vx) * response;
  state.skiff.vy += (move.y * maxSpeed - state.skiff.vy) * response;
  const velocity = Math.hypot(state.skiff.vx, state.skiff.vy);
  state.skiff.x += state.skiff.vx * dt;
  state.skiff.y += state.skiff.vy * dt;
  const bounds = BALANCE.playBounds;
  state.skiff.x = clamp(state.skiff.x, bounds.left, bounds.right);
  state.skiff.y = clamp(state.skiff.y, bounds.top, bounds.bottom);
  if (velocity > 3) state.skiff.angle = Math.atan2(state.skiff.vy, state.skiff.vx);
}

export function checkSparkCollisions(state) {
  const hitDistance = BALANCE.skiffRadius + 7;
  const hitDistanceSquared = hitDistance * hitDistance;
  for (const spark of state.sparks) {
    if (state.mode !== 'PLAY') break;
    const dx = spark.x - state.skiff.x;
    const dy = spark.y - state.skiff.y;
    if (dx * dx + dy * dy >= hitDistanceSquared) continue;
    const damaged = damageHull(state, 1, `Drifting spark impact on front ${state.front}`);
    spark.x = BALANCE.playBounds.right + 30 + spark.id * 4;
    spark.y = BALANCE.playBounds.top + ((spark.id * 83 + state.front * 37) % 520);
    spark.vx = -Math.abs(spark.vx);
    if (damaged) state.emitEffect?.({ kind: 'sparkHit', x: state.skiff.x, y: state.skiff.y });
  }
}

export function nearSpark(state) {
  for (const spark of state.sparks) {
    const dx = spark.x - state.skiff.x;
    const dy = spark.y - state.skiff.y;
    if (dx * dx + dy * dy < 110 * 110) return true;
  }
  return false;
}
