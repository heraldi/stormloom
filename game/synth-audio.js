export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.14;
    master.connect(context.destination);
  }

  function tone(frequency, duration, type = 'sine', volume = 0.12, slide = 0) {
    if (!context || muted) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  return {
    start() { ensure(); tone(196, 0.18, 'triangle', 0.08, 70); tone(294, 0.28, 'sine', 0.07, 90); },
    setMuted(value) { muted = value; },
    buoy() { ensure(); tone(240, 0.09, 'square', 0.06, 35); },
    crossing(charge) { ensure(); tone(280 + charge * 130, 0.16, 'sawtooth', 0.05, 120); },
    harvest(charge) { ensure(); tone(330, 0.15, 'triangle', 0.07, 90); tone(495 + charge * 180, 0.34, 'sine', 0.09, 100); },
    vent() { ensure(); tone(160, 0.22, 'sawtooth', 0.07, -100); },
    overheat() { ensure(); tone(110, 0.35, 'square', 0.09, -55); },
  };
}
