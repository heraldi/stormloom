export const ARENA = Object.freeze({ width: 1280, height: 760, hudHeight: 108 });

export const BALANCE = Object.freeze({
  fixedStep: 1 / 60,
  frontDuration: 32,
  maxFronts: 6,
  beaconGoal: 1000,
  hullMax: 3,
  heatMax: 100,
  skiffSpeed: 270,
  skiffAccel: 1500,
  skiffDrag: 0.84,
  buoyCooldown: 0.24,
  netChargeDecay: 0.025,
  lightningInterval: 2.35,
  sparkCount: 20,
  sparkDamageCooldown: 0.9,
  heatPerCrossing: 8,
  chargePerCrossing: 0.14,
  heatDissipation: 4.8,
  heatDamageThreshold: 92,
  heatDamage: 1,
  heatStun: 1.15,
  harvestBase: 46,
  harvestAreaScale: 0.00088,
  harvestChargeScale: 1.75,
  frontGoalScale: 0.13,
  scorePerEnergy: 6,
  sparkSpeedMin: 15,
  sparkSpeedMax: 42,
  skiffRadius: 17,
  buoyRadius: 7,
  playBounds: { left: 48, right: 1232, top: 132, bottom: 714 },
});

export const COLORS = Object.freeze({
  ink: '#071925',
  deep: '#0b2433',
  sea: '#12384a',
  seaLight: '#1a4b5a',
  current: '#2d6670',
  ivory: '#f6efdc',
  ivoryDim: '#b9c7bd',
  amber: '#e7a83e',
  amberLight: '#ffd37a',
  coral: '#ea6f61',
  coralDark: '#9d3f4b',
  foam: '#8fb6ad',
});

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const formatNumber = (value) => Math.round(value).toLocaleString('en-US');
