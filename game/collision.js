import { BALANCE, clamp } from './balance.js';
import { damageHull } from './game-state.js';
import { moveVector } from './skiff-controls.js';

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
    const damaged = damageHull(state, 1, 'Drifting spark impact — keep the skiff moving.');
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
