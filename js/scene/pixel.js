// Tiny toolkit for drawing crisp pixel art on a low-resolution canvas.
// Everything here works in "art pixels": the canvas is small (e.g. 480x270)
// and CSS scales it up with image-rendering: pixelated.

export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export const hex = (c) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// 4x4 ordered-dither matrix, normalised to (0..1)
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function px(ctx, color, x, y, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

export function disc(ctx, color, cx, cy, r) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r + r * 0.8 - y * y)));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

/** Vertical gradient between stops, ordered-dithered so it looks hand-painted. */
export function ditherGradient(ctx, W, y0, y1, stops, x0 = 0) {
  W = Math.round(W); x0 = Math.round(x0);
  const h = Math.round(y1 - y0);
  if (h <= 0 || W <= 0) return;
  const img = ctx.createImageData(W, h);
  const d = img.data;
  const cols = stops.map((s) => hex(s.c));
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1 || 1);
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1].at) i++;
    const a = stops[i], b = stops[i + 1];
    const f = clamp((t - a.at) / (b.at - a.at || 1), 0, 1);
    for (let x = 0; x < W; x++) {
      const c = f > bayer(x + x0, y + Math.round(y0)) ? cols[i + 1] : cols[i];
      const p = (y * W + x) * 4;
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
    }
  }
  ctx.putImageData(img, Math.round(x0), Math.round(y0));
}

/** A dithered radial light as a reusable sprite (transparent outside). */
export function glowSprite(r, color, strength = 0.5) {
  r = Math.max(2, Math.ceil(r));
  const size = r * 2 + 1;
  const c = makeCanvas(size, size);
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  const [R, G, B] = hex(color);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const dist = Math.hypot(i - r, j - r) / r;
      if (dist >= 1) continue;
      const f = Math.pow(1 - dist, 1.5) * strength;
      const v = f * 5;
      const lv = Math.floor(v) + (v - Math.floor(v) > bayer(i, j) ? 1 : 0);
      if (lv <= 0) continue;
      const p = (j * size + i) * 4;
      img.data[p] = R; img.data[p + 1] = G; img.data[p + 2] = B;
      img.data[p + 3] = Math.min(255, Math.round((lv / 5) * 255 * 0.9));
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

export function glow(ctx, cx, cy, r, color, strength = 0.5) {
  const s = glowSprite(r, color, strength);
  ctx.drawImage(s, Math.round(cx) - (s.width >> 1), Math.round(cy) - (s.height >> 1));
}

/** Rolling hills silhouette. */
export function hills(ctx, W, H, base, amp, freq, phase, color, rim) {
  for (let x = 0; x < W; x++) {
    const y = Math.round(base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.31 + phase * 1.7) * amp * 0.45);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, H - y);
    if (rim) { ctx.fillStyle = rim; ctx.fillRect(x, y, 1, 1); }
  }
}

/** Jagged mountain range with optional snow caps. */
export function peaks(ctx, W, H, base, amp, period, phase, color, snow) {
  for (let x = 0; x < W; x++) {
    const k = Math.abs((((x / period + phase) % 1) + 1) % 1 - 0.5) * 2;       // triangle wave 0..1
    const wob = Math.sin(x * 0.9) * 0.6;
    const y = Math.round(base - amp * (1 - k) + wob);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, H - y);
    if (snow) {
      const cap = Math.round(amp * 0.34 * (1 - k)) - (x & 1);
      if (cap > 0) { ctx.fillStyle = snow; ctx.fillRect(x, y, 1, cap); }
    }
  }
}

/** Draw a string-array bitmap using a char->color palette. '.' is transparent. */
export function bitmap(ctx, rows, pal, x, y, flip = false) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const ch = flip ? row[row.length - 1 - i] : row[i];
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
    }
  }
}

export function pine(ctx, x, by, h, c) {
  x = Math.round(x); by = Math.round(by); h = Math.max(10, Math.round(h));
  px(ctx, c.trunk, x - 1, by - 3, 2, 3);
  const body = h - 3;
  const tiers = Math.max(3, Math.round(h / 8));
  const tierRows = Math.ceil(body / tiers);
  const maxHalf = Math.max(3, Math.round(h * 0.3));
  for (let r = 0; r < body; r++) {
    const within = r % tierRows;
    const half = Math.round((r / body) * maxHalf * 0.72 + (within / tierRows) * maxHalf * 0.34);
    const y = by - 3 - body + r;
    px(ctx, c.dark, x, y, half + 1, 1);
    px(ctx, c.light, x - half, y, half, 1);
    px(ctx, c.mid, x, y, 1, 1);
    if (c.snow && within < 2 && half > 1) px(ctx, c.snow, x - half + 1, y, half * 2 - 1, 1);
  }
}

export function roundTree(ctx, x, by, r, c) {
  x = Math.round(x); by = Math.round(by); r = Math.round(r);
  const th = Math.round(r * 0.9);
  px(ctx, c.trunkDark, x - 1, by - th, 4, th);
  px(ctx, c.trunk, x - 1, by - th, 2, th);
  const cy = by - th - r + 2;
  disc(ctx, c.dark, x + 1, cy + 2, r);
  disc(ctx, c.mid, x, cy, r - 1);
  disc(ctx, c.light, x - 2, cy - 2, Math.max(2, r - 4));
  for (let i = 0; i < r; i++) px(ctx, c.hi, x - r + 3 + ((i * 5) % (r + 2)), cy - r + 3 + ((i * 3) % (r - 1)), 2, 1);
}

export function cabin(ctx, x, by, u, c) {
  // x = center, by = ground line, u = scale (1 = ~30px wide)
  const w = Math.round(30 * u), h = Math.round(15 * u);
  const left = Math.round(x - w / 2), top = by - h;
  px(ctx, c.wallDark, left, top, w, h);
  for (let y = 0; y < h; y += 3) px(ctx, c.wall, left, top + y, w, 2);
  // roof
  const roofH = Math.round(11 * u), rw = w + 6;
  for (let r = 0; r < roofH; r++) {
    const half = Math.round(((r + 1) / roofH) * (rw / 2));
    px(ctx, c.roof, Math.round(x) - half, top - roofH + r, half * 2, 1);
    if (c.roofSnow && r > 0) px(ctx, c.roofSnow, Math.round(x) - half + 2, top - roofH + r, Math.max(0, half * 2 - 4), 1);
  }
  // chimney
  const cx = left + Math.round(w * 0.72);
  px(ctx, c.wallDark, cx, top - roofH - 3, 5, roofH);
  px(ctx, c.wall, cx, top - roofH - 3, 2, roofH);
  if (c.roofSnow) px(ctx, c.roofSnow, cx - 1, top - roofH - 5, 7, 2);
  // door + window(s)
  const dw = Math.max(5, Math.round(6 * u));
  px(ctx, c.door, Math.round(x - dw / 2), by - Math.round(10 * u), dw, Math.round(10 * u));
  px(ctx, c.doorHi, Math.round(x + dw / 2) - 2, by - Math.round(5 * u), 1, 1);
  const wins = [];
  const ww = Math.round(6 * u), wh = Math.round(6 * u);
  for (const wx of [left + Math.round(3 * u), left + w - Math.round(3 * u) - ww]) {
    const wy = by - Math.round(11 * u);
    px(ctx, c.frame, wx - 1, wy - 1, ww + 2, wh + 2);
    px(ctx, c.window, wx, wy, ww, wh);
    px(ctx, c.frame, wx + (ww >> 1), wy, 1, wh);
    px(ctx, c.frame, wx, wy + (wh >> 1), ww, 1);
    wins.push({ x: wx, y: wy, w: ww, h: wh });
  }
  return { chimney: { x: cx + 2, y: top - roofH - 4 }, windows: wins, door: { x: Math.round(x), y: by - Math.round(5 * u) } };
}
