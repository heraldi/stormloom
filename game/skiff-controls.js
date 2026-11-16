const CONTROL_KEYS = new Set(['w', 'a', 's', 'd', ' ', 'e', 'escape', 'm', 'r', 'enter', '1', '2']);

export function bindSkiffControls(canvas) {
  const input = {
    down: new Set(),
    pressed: new Set(),
    pointer: { x: 640, y: 380, clicked: false },
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (!CONTROL_KEYS.has(key)) return;
    event.preventDefault();
    if (!input.down.has(key)) input.pressed.add(key);
    input.down.add(key);
  });
  window.addEventListener('keyup', (event) => input.down.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => input.down.clear());
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.pointer.x = (event.clientX - rect.left) * (1280 / rect.width);
    input.pointer.y = (event.clientY - rect.top) * (760 / rect.height);
  });
  canvas.addEventListener('pointerdown', () => { input.pointer.clicked = true; });
  canvas.tabIndex = 0;
  canvas.focus();

  return input;
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.down.has('a')) x -= 1;
  if (input.down.has('d')) x += 1;
  if (input.down.has('w')) y -= 1;
  if (input.down.has('s')) y += 1;
  if (x !== 0 && y !== 0) {
    const diagonal = 0.70710678;
    x *= diagonal;
    y *= diagonal;
  }
  return { x, y };
}

export function wasPressed(input, key) {
  if (!input.pressed.has(key)) return false;
  input.pressed.delete(key);
  return true;
}

export function wasClicked(input) {
  if (!input.pointer.clicked) return false;
  input.pointer.clicked = false;
  return true;
}

export function clearPressed(input) {
  input.pressed.clear();
}
