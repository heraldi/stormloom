import { ARENA, BALANCE, COLORS, formatNumber, clamp } from './balance.js';

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function label(ctx, text, x, y, size = 11, color = COLORS.ivoryDim, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function bar(ctx, x, y, width, value, max, color, back = 'rgba(246,239,220,.12)') {
  ctx.fillStyle = back;
  roundedRect(ctx, x, y, width, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(ctx, x, y, width * clamp(value / max, 0, 1), 7, 3.5);
  ctx.fill();
}

function button(ctx, x, y, w, h, title, subtitle = '') {
  ctx.fillStyle = 'rgba(246, 239, 220, .08)';
  ctx.strokeStyle = 'rgba(246, 239, 220, .35)';
  ctx.lineWidth = 1;
  roundedRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  label(ctx, title, x + w / 2, y + 27, 14, COLORS.ivory, 'center');
  if (subtitle) label(ctx, subtitle, x + w / 2, y + 48, 11, COLORS.ivoryDim, 'center');
}

function drawHud(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(4, 14, 24, .76)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.hudHeight);
  ctx.strokeStyle = 'rgba(246,239,220,.16)';
  ctx.beginPath(); ctx.moveTo(28, 99); ctx.lineTo(ARENA.width - 28, 99); ctx.stroke();

  label(ctx, 'STORMLOOM', 28, 34, 22, COLORS.ivory);
  label(ctx, 'LIGHTNING SALVAGE // SKIFF 03', 29, 56, 10, COLORS.foam);

  label(ctx, 'BEACON', 282, 27, 10, COLORS.ivoryDim);
  label(ctx, `${formatNumber(state.beacon)} / ${formatNumber(BALANCE.beaconGoal)}`, 282, 49, 15, COLORS.amberLight);
  bar(ctx, 282, 62, 170, state.beacon, BALANCE.beaconGoal, COLORS.amber);

  label(ctx, 'SCORE', 493, 27, 10, COLORS.ivoryDim);
  label(ctx, formatNumber(state.score), 493, 50, 18, COLORS.ivory);

  label(ctx, 'HULL', 624, 27, 10, COLORS.ivoryDim);
  for (let i = 0; i < BALANCE.hullMax; i += 1) {
    ctx.fillStyle = i < state.hull ? COLORS.ivory : 'rgba(246,239,220,.16)';
    ctx.beginPath();
    ctx.arc(632 + i * 20, 44, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  label(ctx, 'HEAT', 716, 27, 10, COLORS.ivoryDim);
  label(ctx, `${Math.round(state.heat)}/100`, 716, 50, 16, state.heat > 72 ? COLORS.coral : COLORS.ivory);
  bar(ctx, 716, 62, 112, state.heat, BALANCE.heatMax, state.heat > 72 ? COLORS.coral : COLORS.ivoryDim);
  // Persistent danger zone and threshold tick: critical heat is not color-only.
  ctx.fillStyle = 'rgba(234,111,97,.5)';
  ctx.fillRect(716 + 112 * 0.72, 62, 112 * 0.28, 7);
  ctx.fillStyle = COLORS.ivory;
  ctx.fillRect(716 + 112 * 0.72, 60, 2, 11);

  label(ctx, 'MULT', 871, 27, 10, COLORS.ivoryDim);
  label(ctx, `x${state.multiplier.toFixed(2)}`, 871, 50, 17, COLORS.ivory);

  label(ctx, `FRONT ${Math.min(state.front, BALANCE.maxFronts)} / ${BALANCE.maxFronts}`, 1018, 27, 10, COLORS.ivoryDim);
  label(ctx, `${Math.max(0, state.frontTime).toFixed(1)}s`, 1018, 50, 17, state.frontTime < 7 ? COLORS.coral : COLORS.ivory);
  bar(ctx, 1018, 62, 132, state.frontTime, BALANCE.frontDuration, state.frontTime < 7 ? COLORS.coral : COLORS.foam);

  label(ctx, `BUOYS ${state.buoysPlaced}/3`, 28, 87, 11, state.buoysPlaced === 2 ? COLORS.ivory : COLORS.ivoryDim);
  label(ctx, state.net.charge > 0.01 ? `CHARGE x${state.multiplier.toFixed(2)}` : 'CHARGE —', 126, 87, 11, state.net.charge > 0.01 ? COLORS.ivory : COLORS.ivoryDim);
  label(ctx, `HARVESTS ${state.harvests}`, 260, 87, 11, COLORS.ivoryDim);
  label(ctx, 'WASD MOVE   SPACE DROP   E VENT   ESC PAUSE', 1040, 87, 10, COLORS.ivoryDim, 'right');
  ctx.restore();
}

function drawHint(ctx, state) {
  const context = state.heat > 75 ? 'Heat critical — seal now, or E to vent the unfinished wire.'
    : state.net.points.length === 2 ? 'Preview active — shape your third corner, then Space to seal.'
    : state.net.points.length === 1 ? 'One anchor set — move to stretch the wire, then Space.'
    : 'Keep moving. Tight nets are safer; charged nets pay more.';
  const text = state.hintTimer > 0 ? state.hint : state.mode === 'PLAY' ? context : '';
  if (!text) return;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 14, 24, .72)';
  roundedRect(ctx, 28, ARENA.height - 54, 620, 30, 5);
  ctx.fill();
  label(ctx, text, 44, ARENA.height - 34, 12, COLORS.ivory);
  ctx.restore();
}

function drawStart(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 21, .84)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ivory;
  ctx.font = '700 72px system-ui, sans-serif';
  ctx.fillText('STORMLOOM', ARENA.width / 2, 166);
  ctx.fillStyle = COLORS.amberLight;
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('RELIGHT THE BEACON BEFORE DAWN', ARENA.width / 2, 203);
  ctx.fillStyle = COLORS.ivoryDim;
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('Weave triangular lightning nets across a stormy sea.', ARENA.width / 2, 238);
  ctx.fillText('Small nets are safe. Charged nets make the beacon sing.', ARENA.width / 2, 264);
  button(ctx, 490, 310, 300, 62, 'BEGIN THE SALVAGE', 'click or press Enter');
  ctx.fillStyle = 'rgba(246,239,220,.08)';
  roundedRect(ctx, 310, 420, 660, 124, 8);
  ctx.fill();
  label(ctx, 'CONTROLS', 340, 451, 11, COLORS.amberLight);
  label(ctx, 'WASD', 340, 482, 14, COLORS.ivory); label(ctx, 'steer the skiff', 410, 482, 13, COLORS.ivoryDim);
  label(ctx, 'SPACE', 580, 482, 14, COLORS.ivory); label(ctx, 'drop a buoy', 660, 482, 13, COLORS.ivoryDim);
  label(ctx, 'E', 790, 482, 14, COLORS.ivory); label(ctx, 'vent wire', 820, 482, 13, COLORS.ivoryDim);
  label(ctx, 'ESC', 340, 516, 14, COLORS.ivory); label(ctx, 'pause · audio · reduced motion', 410, 516, 13, COLORS.ivoryDim);
  label(ctx, 'A salvage run lasts six storm fronts.', ARENA.width / 2, 618, 13, COLORS.foam, 'center');
  label(ctx, 'Every crossing builds heat. Leave marked strike rings before they close.', ARENA.width / 2, 641, 13, COLORS.foam, 'center');
  ctx.restore();
}

function drawPause(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 21, .73)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ivory;
  ctx.font = '700 42px system-ui';
  ctx.fillText('PAUSED', ARENA.width / 2, 218);
  button(ctx, 470, 270, 340, 62, 'RESUME', 'Esc');
  button(ctx, 470, 354, 162, 64, state.settings.muted ? 'SOUND OFF' : 'SOUND ON', 'M');
  button(ctx, 648, 354, 162, 64, state.settings.reducedMotion ? 'MOTION LOW' : 'MOTION FULL', 'R · visual comfort');
  label(ctx, `VOLUME ${Math.round(state.settings.volume * 100)}%  (+ / −)`, 640, 448, 11, COLORS.foam, 'center');
  label(ctx, 'The sea keeps its shape while you plan the next net.', ARENA.width / 2, 475, 13, COLORS.ivoryDim, 'center');
  ctx.restore();
}

function drawUpgrade(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 21, .84)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.amberLight;
  ctx.font = '600 13px system-ui';
  ctx.fillText(`FRONT ${state.front - 1} SURVIVED  //  RETROFIT WINDOW`, ARENA.width / 2, 175);
  ctx.fillStyle = COLORS.ivory;
  ctx.font = '700 38px system-ui';
  ctx.fillText('CHOOSE YOUR ADVANTAGE', ARENA.width / 2, 222);
  ctx.fillStyle = COLORS.ivoryDim;
  ctx.font = '400 14px system-ui';
  ctx.fillText('One upgrade only. The storm will remember the choice.', ARENA.width / 2, 252);
  state.upgradeOptions.forEach((option, index) => {
    const x = index === 0 ? 300 : 670;
    ctx.fillStyle = 'rgba(246,239,220,.07)';
    ctx.strokeStyle = index === 0 ? 'rgba(231,168,62,.58)' : 'rgba(246,239,220,.28)';
    ctx.lineWidth = 2;
    roundedRect(ctx, x, 310, 310, 160, 9);
    ctx.fill(); ctx.stroke();
    label(ctx, `0${index + 1}`, x + 26, 345, 13, COLORS.amberLight);
    label(ctx, option.title, x + 26, 385, 19, COLORS.ivory);
    label(ctx, option.detail, x + 26, 417, 13, COLORS.ivoryDim);
    label(ctx, 'press 1 or 2', x + 26, 447, 11, COLORS.foam);
  });
  ctx.restore();
}

function drawEnd(ctx, state, victory) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 21, .96)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = victory ? COLORS.amberLight : COLORS.coral;
  ctx.font = '700 54px system-ui';
  ctx.fillText(victory ? 'BEACON RELIT' : 'THE STORM WINS', ARENA.width / 2, 190);
  ctx.fillStyle = COLORS.ivory;
  ctx.font = '400 17px system-ui';
  ctx.fillText(victory ? 'A warm signal cuts through the last cloudbank.' : state.defeatReason, ARENA.width / 2, 230);
  ctx.fillStyle = '#102734';
  roundedRect(ctx, 335, 278, 610, 176, 8); ctx.fill();
  label(ctx, 'FINAL SCORE', 390, 322, 11, COLORS.ivoryDim);
  label(ctx, formatNumber(state.score), 390, 357, 28, COLORS.ivory);
  label(ctx, 'FRONTS COMPLETED', 570, 322, 11, COLORS.ivoryDim);
  label(ctx, `${state.frontsSurvived} / ${BALANCE.maxFronts}`, 570, 357, 28, COLORS.ivory);
  label(ctx, 'LARGEST HARVEST', 770, 322, 11, COLORS.ivoryDim);
  label(ctx, `${formatNumber(state.largestHarvest)} E`, 770, 357, 28, COLORS.amberLight);
  label(ctx, state.upgrades.length ? `UPGRADES  ${state.upgrades.join('  ·  ')}` : 'UPGRADES  —', ARENA.width / 2, 414, 11, COLORS.foam, 'center');
  button(ctx, 490, 510, 300, 62, 'RUN IT BACK', 'click or press R');
  label(ctx, 'A new tide. A new shape. A better harvest.', ARENA.width / 2, 630, 13, COLORS.ivoryDim, 'center');
  ctx.restore();
}

export function drawHudAndMenus(ctx, state) {
  if (state.mode !== 'START' && state.mode !== 'VICTORY' && state.mode !== 'DEFEAT') {
    drawHud(ctx, state);
    drawHint(ctx, state);
  }
  if (state.mode === 'START') drawStart(ctx);
  if (state.mode === 'PAUSE') drawPause(ctx, state);
  if (state.mode === 'UPGRADE') drawUpgrade(ctx, state);
  if (state.mode === 'VICTORY') drawEnd(ctx, state, true);
  if (state.mode === 'DEFEAT') drawEnd(ctx, state, false);
}

export function menuActionAt(state, x, y) {
  if (state.mode === 'START') return x >= 490 && x <= 790 && y >= 310 && y <= 372 ? 'start' : null;
  if (state.mode === 'PAUSE') {
    if (x >= 470 && x <= 810 && y >= 270 && y <= 332) return 'resume';
    if (x >= 470 && x <= 632 && y >= 354 && y <= 418) return 'mute';
    if (x >= 648 && x <= 810 && y >= 354 && y <= 418) return 'motion';
  }
  if (state.mode === 'UPGRADE') {
    if (x >= 300 && x <= 610 && y >= 310 && y <= 470) return 'upgrade0';
    if (x >= 670 && x <= 980 && y >= 310 && y <= 470) return 'upgrade1';
  }
  if (state.mode === 'VICTORY' || state.mode === 'DEFEAT') {
    if (x >= 490 && x <= 790 && y >= 510 && y <= 572) return 'restart';
  }
  return null;
}
