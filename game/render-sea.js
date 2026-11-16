import { ARENA, COLORS } from './balance.js';

export function createSeaLayer(seed = 1) {
  const layer = document.createElement('canvas');
  layer.width = ARENA.width;
  layer.height = ARENA.height;
  const ctx = layer.getContext('2d');
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const gradient = ctx.createLinearGradient(0, 0, 0, ARENA.height);
  gradient.addColorStop(0, '#071a29');
  gradient.addColorStop(0.42, '#0b2b3c');
  gradient.addColorStop(1, '#12394b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  ctx.fillStyle = 'rgba(4, 13, 23, .56)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.hudHeight);
  ctx.strokeStyle = 'rgba(143, 182, 173, .12)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 16; row += 1) {
    const baseY = 150 + row * 38 + random() * 14;
    ctx.beginPath();
    for (let x = -40; x <= ARENA.width + 40; x += 18) {
      const y = baseY + Math.sin(x * 0.009 + row * 0.7) * (7 + row * 0.2) + Math.sin(x * 0.021 + row) * 3;
      if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(246, 239, 220, .05)';
  for (let i = 0; i < 9; i += 1) {
    const x = 80 + random() * 1100;
    const y = 170 + random() * 450;
    ctx.beginPath();
    ctx.arc(x, y, 70 + random() * 120, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(640, 410, 130, 640, 410, 780);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(2, 8, 15, .42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, ARENA.width, 4);
  return layer;
}

export function drawSea(ctx, layer) {
  ctx.drawImage(layer, 0, 0);
}
