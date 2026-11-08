// Optional 8-bit blips (off by default). No audio files: tiny square-wave
// notes synthesized with WebAudio, and only after the user turns sound on.

let ctx = null;
let enabled = false;

export function setSoundEnabled(on) { enabled = !!on; }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function blip(freq = 660, dur = 0.05, { type = 'square', vol = 0.035, slide = 0 } = {}) {
  if (!enabled) return;
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, a.currentTime + dur);
  gain.gain.setValueAtTime(vol, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur + 0.02);
}

export const sfx = {
  send: () => blip(520, 0.07, { slide: 260 }),
  talk: () => blip(380 + Math.random() * 140, 0.035, { vol: 0.02 }),
  done: () => { blip(660, 0.06); setTimeout(() => blip(880, 0.09), 70); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.1, { vol: 0.04 }), i * 90)),
  click: () => blip(440, 0.04, { vol: 0.025 }),
  swap: () => blip(300, 0.2, { type: 'triangle', slide: 400, vol: 0.04 }),
};
