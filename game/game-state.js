import { ARENA, BALANCE, clamp } from './balance.js';

const makeNet = () => ({ points: [], charge: 0, crossedAt: 0, lastHarvest: 0 });

export function createGameState(seed = 72031) {
  return {
    mode: 'START',
    seed,
    clock: 0,
    front: 1,
    frontTime: BALANCE.frontDuration,
    skiff: { x: ARENA.width * 0.5, y: 470, vx: 0, vy: 0, angle: -0.15 },
    net: makeNet(),
    buoysPlaced: 0,
    buoyCooldown: 0,
    hull: BALANCE.hullMax,
    heat: 0,
    score: 0,
    beacon: 0,
    multiplier: 1,
    largestHarvest: 0,
    harvests: 0,
    frontsSurvived: 0,
    sparks: [],
    bolts: [],
    effects: [],
    floatingText: [],
    shake: 0,
    flash: 0,
    hitCooldown: 0,
    heatStun: 0,
    hint: 'Drop a buoy to begin your first circuit.',
    hintTimer: 5,
    upgradeKind: null,
    upgradeOptions: [],
    upgrades: [],
    stats: { crossings: 0, sparksDodged: 0, vents: 0 },
    settings: { muted: false, reducedMotion: false },
    audioStarted: false,
  };
}

export function startGame(state, audio) {
  const fresh = createGameState(state.seed);
  Object.assign(state, fresh, { settings: state.settings, audioStarted: state.audioStarted });
  state.mode = 'PLAY';
  state.hint = 'WASD to steer. Space drops conductive buoys.';
  state.hintTimer = 7;
  audio?.start?.();
}

export function restartGame(state, audio) {
  state.seed = (state.seed + 7919) % 1000000;
  startGame(state, audio);
}

export function setHint(state, text, duration = 3.5) {
  state.hint = text;
  state.hintTimer = duration;
}

export function updateClock(state, dt) {
  state.clock += dt;
  state.frontTime -= dt;
  state.buoyCooldown = Math.max(0, state.buoyCooldown - dt);
  state.hitCooldown = Math.max(0, state.hitCooldown - dt);
  state.heatStun = Math.max(0, state.heatStun - dt);
  state.flash = Math.max(0, state.flash - dt * 3);
  state.shake = Math.max(0, state.shake - dt * 3);
  state.hintTimer = Math.max(0, state.hintTimer - dt);
  state.heat = clamp(state.heat - dt * BALANCE.heatDissipation, 0, BALANCE.heatMax);
  state.net.charge = Math.max(0, state.net.charge - dt * BALANCE.netChargeDecay);
}

export function finishFront(state) {
  state.frontsSurvived = Math.max(state.frontsSurvived, state.front);
  state.front += 1;
  state.frontTime = BALANCE.frontDuration;
  state.net = makeNet();
  state.buoysPlaced = 0;
  state.heat = Math.max(0, state.heat - 30);

  if (state.front > BALANCE.maxFronts) {
    if (state.beacon >= BALANCE.beaconGoal) {
      state.mode = 'VICTORY';
      setHint(state, 'The beacon answers. Dawn can find you.', 999);
    } else {
      state.mode = 'DEFEAT';
      state.defeatReason = 'Dawn arrived before the beacon was full.';
      setHint(state, state.defeatReason, 999);
    }
    return;
  }

  if (state.front === 3 || state.front === 5) {
    state.mode = 'UPGRADE';
    state.upgradeKind = state.front === 3 ? 'thermal' : 'survival';
    state.upgradeOptions = state.front === 3
      ? [
          { title: 'COOLING FINS', detail: 'Heat clears 35% faster', effect: 'heatDissipation', value: 1.35 },
          { title: 'LACE AMPLIFIER', detail: 'Harvest charge is 30% stronger', effect: 'harvestPower', value: 1.3 },
        ]
      : [
          { title: 'WIDE-RUDDER', detail: 'Skiff speed increases 22%', effect: 'mobility', value: 1.22 },
          { title: 'REINFORCED HULL', detail: 'The next impact is absorbed', effect: 'hull', value: 1 },
        ];
    setHint(state, 'Choose one retrofit before the next front.', 999);
  } else {
    setHint(state, `Front ${state.front} rolling in. Keep the circuit tight.`, 4);
  }
}

export function chooseUpgrade(state, index) {
  const option = state.upgradeOptions[index];
  if (!option) return;
  state.upgrades.push(option.title);
  if (option.effect === 'heatDissipation') state.heatDissipationBonus = option.value;
  if (option.effect === 'harvestPower') state.harvestPowerBonus = option.value;
  if (option.effect === 'mobility') state.mobilityBonus = option.value;
  if (option.effect === 'hull') state.hullGuard = option.value;
  state.mode = 'PLAY';
  state.upgradeKind = null;
  state.upgradeOptions = [];
  state.hint = 'Retrofit online. Place, stretch, seal, harvest.';
  state.hintTimer = 5;
}

export function damageHull(state, amount, reason) {
  if (state.hitCooldown > 0) return false;
  if (state.hullGuard > 0) {
    state.hullGuard -= 1;
    state.hitCooldown = 0.8;
    setHint(state, 'Reinforced hull absorbed the impact.', 2.5);
    return false;
  }
  state.hull = Math.max(0, state.hull - amount);
  state.hitCooldown = BALANCE.sparkDamageCooldown;
  state.flash = 1;
  state.shake = 1;
  setHint(state, reason, 2.5);
  if (state.hull <= 0) {
    state.mode = 'DEFEAT';
    state.defeatReason = 'The salvage skiff could not hold together.';
    setHint(state, state.defeatReason, 999);
  }
  return true;
}
