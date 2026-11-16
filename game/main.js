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
  if (!state.audioStarted) {
    state.audioStarted = true;
    audio.start();
  }
  startGame(state, audio);
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
  checkSparkCollisions(state);
  updateEffects(state, dt);
  if (state.net.points.length === 2 && state.hintTimer <= 0) state.hint = 'Preview triangle active — steer to the third corner, then drop.';
}

function render() {
  ctx.save();
  if (!state.settings.reducedMotion && state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake * 8, (Math.random() - 0.5) * state.shake * 5);
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

requestAnimationFrame(frame);
