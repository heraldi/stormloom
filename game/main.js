import { ARENA, BALANCE } from './balance.js';
import { createGameState, startGame, restartGame, updateClock, finishFront, chooseUpgrade } from './game-state.js';
import { bindSkiffControls, wasPressed, wasClicked, clearPressed } from './skiff-controls.js';
import { placeBuoy, ventNet } from './lightning-nets.js';
import { seedStorm, updateStorm } from './storm-director.js';
import { updateSkiff, checkSparkCollisions } from './collision.js';
import { createSeaLayer, drawSea } from './render-sea.js';
import { drawWorld, emitEffect, updateEffects } from './render-effects.js';
import { drawHudAndMenus, menuActionAt } from './hud-menus.js';
import { createAudio } from './synth-audio.js';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const input = bindSkiffControls(canvas);
const state = createGameState();
const audio = createAudio();
const sea = createSeaLayer(state.seed);
const fixedStep = BALANCE.fixedStep;
let accumulator = 0;
let lastTime = performance.now();

state.audio = audio;
state.emitEffect = (effect) => emitEffect(state, effect);
state.audioStarted = false;

function begin() {
  state.audioStarted = true;
  startGame(state, audio);
  audio.setVolume(state.settings.volume);
  seedStorm(state);
}

function restart() {
  restartGame(state, audio);
  seedStorm(state);
}

function clickAction() {
  const action = menuActionAt(state, input.pointer.x, input.pointer.y);
  if (action === 'start') begin();
  if (action === 'resume') state.mode = 'PLAY';
  if (action === 'restart') restart();
  if (action === 'mute') {
    state.settings.muted = !state.settings.muted;
    audio.setMuted(state.settings.muted);
  }
  if (action === 'motion') state.settings.reducedMotion = !state.settings.reducedMotion;
  if (action === 'upgrade0') chooseUpgrade(state, 0);
  if (action === 'upgrade1') chooseUpgrade(state, 1);
}

function handlePressed() {
  if (wasClicked(input)) clickAction();
  if (state.mode === 'START' && wasPressed(input, 'enter')) begin();
  else if ((state.mode === 'VICTORY' || state.mode === 'DEFEAT') && wasPressed(input, 'r')) restart();
  else if (state.mode === 'UPGRADE') {
    if (wasPressed(input, '1')) chooseUpgrade(state, 0);
    if (wasPressed(input, '2')) chooseUpgrade(state, 1);
  } else if (wasPressed(input, 'escape')) {
    if (state.mode === 'PLAY') state.mode = 'PAUSE';
    else if (state.mode === 'PAUSE') state.mode = 'PLAY';
  } else if (state.mode === 'PAUSE' && wasPressed(input, 'm')) {
    state.settings.muted = !state.settings.muted;
    audio.setMuted(state.settings.muted);
  } else if (state.mode === 'PAUSE' && wasPressed(input, 'r')) {
    state.settings.reducedMotion = !state.settings.reducedMotion;
  } else if (state.mode === 'PAUSE' && (wasPressed(input, '+') || wasPressed(input, '='))) {
    state.settings.volume = Math.min(1, state.settings.volume + 0.1);
    audio.setVolume(state.settings.volume);
  } else if (state.mode === 'PAUSE' && wasPressed(input, '-')) {
    state.settings.volume = Math.max(0, state.settings.volume - 0.1);
    audio.setVolume(state.settings.volume);
  } else if (state.mode === 'PLAY') {
    if (wasPressed(input, ' ')) placeBuoy(state, audio, state.emitEffect);
    if (wasPressed(input, 'e')) ventNet(state, audio, state.emitEffect);
  }
}

function simulate(dt) {
  if (state.mode !== 'PLAY') return;
  updateClock(state, dt);
  if (state.frontTime <= 0) {
    finishFront(state);
    return;
  }
  updateSkiff(state, input, dt);
  updateStorm(state, dt);
  if (state.mode === 'PLAY') checkSparkCollisions(state);
  updateEffects(state, dt);
}

function render() {
  ctx.save();
  if (!state.settings.reducedMotion && state.shake > 0) {
    const phase = state.clock * 38;
    ctx.translate(Math.sin(phase) * state.shake * 4, Math.cos(phase * 1.3) * state.shake * 3);
  }
  drawSea(ctx, sea);
  drawWorld(ctx, state);
  ctx.restore();
  drawHudAndMenus(ctx, state);
  if (state.flash > 0 && !state.settings.reducedMotion) {
    ctx.fillStyle = `rgba(246,239,220,${state.flash * 0.09})`;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  }
}

function frame(now) {
  const elapsed = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  accumulator += elapsed;
  handlePressed();
  while (accumulator >= fixedStep) {
    simulate(fixedStep);
    accumulator -= fixedStep;
  }
  render();
  clearPressed(input);
  requestAnimationFrame(frame);
}

// Read-only diagnostics for repeatable browser playtests; this cannot alter a run.
export function inspectRun() {
  return structuredClone({
    mode: state.mode, clock: state.clock, seed: state.seed,
    front: state.front, frontTime: state.frontTime, frontsSurvived: state.frontsSurvived,
    skiff: state.skiff, net: state.net, hull: state.hull, heat: state.heat,
    beacon: state.beacon, score: state.score, harvests: state.harvests,
    largestHarvest: state.largestHarvest, multiplier: state.multiplier,
    sparks: state.sparks, strikes: state.strikes, strikeClock: state.strikeClock,
    directorSeed: state.directorSeed, hitCooldown: state.hitCooldown,
    stats: state.stats, upgrades: state.upgrades,
    settings: state.settings, reason: state.defeatReason,
    effects: state.effects.length,
    bonuses: [state.heatDissipationBonus, state.harvestPowerBonus, state.mobilityBonus, state.hullGuard],
  });
}

window.addEventListener('blur', () => {
  if (state.mode === 'PLAY') state.mode = 'PAUSE';
});
requestAnimationFrame(frame);
