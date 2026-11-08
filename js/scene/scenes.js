// Static pixel-art paintings for each world. Every function paints onto a
// low-res canvas context (W x H art pixels) and returns "meta" describing
// interesting spots (windows, chimneys, mushrooms…) that ambient.js animates.

import {
  mulberry32, clamp, ditherGradient, glow, disc, px, hills, peaks, pine, roundTree, cabin, bayer,
} from './pixel.js';

const unit = (H) => clamp(H / 190, 0.55, 1.35);

/* ------------------------------------------------------------------ Meadow */
function meadow(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(11), u = unit(H);
  const hz = Math.round(H * 0.56);

  ditherGradient(ctx, W, 0, hz + 6, [
    { at: 0, c: '#68bff2' }, { at: 0.55, c: '#a2ddfa' }, { at: 1, c: '#ebfbff' },
  ]);

  const sun = { x: Math.round(side ? W - margin / 2 : W * 0.8), y: Math.round(H * 0.16) };
  glow(ctx, sun.x, sun.y, 30 * u, '#fff8c8', 0.7);
  disc(ctx, '#ffe98a', sun.x, sun.y, Math.round(9 * u));
  disc(ctx, '#fff7c4', sun.x - 1, sun.y - 1, Math.round(7 * u));

  hills(ctx, W, H, hz - 8 * u, 8 * u, 0.034, 1.3, '#a9ddbb', '#c4eccf');
  hills(ctx, W, H, hz + 2 * u, 8 * u, 0.05, 4.1, '#86cf9b', '#a3e0b2');
  hills(ctx, W, H, hz + 11 * u, 6 * u, 0.07, 2.2, '#6fc27f', '#8ed89a');

  const gy = hz + Math.round(17 * u);
  ditherGradient(ctx, W, gy, H, [{ at: 0, c: '#93df80' }, { at: 1, c: '#62c25a' }]);

  // distant picket fence
  const fy = gy + Math.round(8 * u);
  if (fy < H - 12) {
    px(ctx, '#e2c9a0', 0, fy + 3, W, 2);
    px(ctx, '#fff1d6', 0, fy + 2, W, 1);
    for (let x = 4; x < W; x += Math.round(11 * u)) {
      px(ctx, '#e2c9a0', x, fy - 1, 3, Math.round(8 * u));
      px(ctx, '#fff1d6', x, fy - 1, 2, Math.round(8 * u));
      px(ctx, '#fff1d6', x, fy - 2, 1, 1);
    }
  }

  // grass tufts
  for (let i = 0; i < (W * (H - gy)) / 140; i++) {
    const x = Math.floor(r() * W), y = gy + 2 + Math.floor(r() * (H - gy - 2));
    const c = r() < 0.5 ? '#58b64f' : '#a9ec92';
    px(ctx, c, x, y, 1, 2); px(ctx, c, x - 1, y - 1, 1, 1); px(ctx, c, x + 1, y - 1, 1, 1);
  }

  // trees on the edges
  if (W > 180) {
    const tc = { trunk: '#a9774a', trunkDark: '#7f5632', dark: '#3f9e5b', mid: '#58bf72', light: '#7fdc8e', hi: '#b6f2b9' };
    roundTree(ctx, W * 0.07, hz + 30 * u, 13 * u, tc);
    roundTree(ctx, W * 0.94, hz + 26 * u, 11 * u, tc);
  }

  // flowers
  const petals = ['#ff8fab', '#ffe066', '#ffffff', '#c9a7ff', '#ffa86b'];
  const n = Math.round((W * (H - gy)) / 190);
  for (let i = 0; i < n; i++) {
    const x = 2 + Math.floor(r() * (W - 5)), y = gy + 6 + Math.floor(r() * (H - gy - 8));
    const c = petals[Math.floor(r() * petals.length)];
    px(ctx, '#4aa84a', x + 1, y + 2, 1, 2);
    px(ctx, c, x + 1, y, 1, 1); px(ctx, c, x, y + 1, 1, 1); px(ctx, c, x + 2, y + 1, 1, 1); px(ctx, c, x + 1, y + 2, 1, 1);
    px(ctx, '#ffd23f', x + 1, y + 1, 1, 1);
  }

  return { horizon: hz, sun, ground: gy };
}

/* ------------------------------------------------------------------ Night */
function night(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(22), u = unit(H);
  const hz = Math.round(H * 0.68);

  ditherGradient(ctx, W, 0, hz + 4, [
    { at: 0, c: '#050820' }, { at: 0.4, c: '#14174e' }, { at: 0.78, c: '#3a2c78' }, { at: 1, c: '#7d509f' },
  ]);

  const stars = [];
  const count = Math.round((W * hz) / 62);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(r() * W), y = Math.floor(Math.pow(r(), 1.35) * hz * 0.92);
    const bright = r() < 0.25;
    const c = bright ? '#ffffff' : r() < 0.5 ? '#b9c2ff' : '#7f86d8';
    px(ctx, c, x, y);
    if (r() < 0.4) stars.push({ x, y, c, sp: 1.2 + r() * 3, ph: r() * 6.28 });
  }
  const crosses = [];
  for (let i = 0; i < Math.max(3, Math.round(W / 60)); i++) {
    crosses.push({ x: 3 + Math.floor(r() * (W - 6)), y: 3 + Math.floor(r() * hz * 0.6), ph: r() * 6.28 });
  }

  const moon = { x: Math.round(side ? W - margin / 2 : W * 0.78), y: Math.round(H * 0.2), r: Math.round(clamp(Math.min(10 * u, side ? margin / 2 - 3 : 99), 6, 15)) };
  glow(ctx, moon.x, moon.y, moon.r * 3.6, '#dcd8ff', 0.6);
  disc(ctx, '#f4e8b8', moon.x, moon.y, moon.r);
  disc(ctx, '#fff7d6', moon.x - 1, moon.y - 1, moon.r - 2);
  for (const [dx, dy, cr] of [[-0.35, -0.2, 0.2], [0.3, 0.25, 0.25], [0.1, -0.5, 0.14], [-0.2, 0.45, 0.14]]) {
    disc(ctx, '#e3d59a', moon.x + Math.round(dx * moon.r), moon.y + Math.round(dy * moon.r), Math.max(1, Math.round(cr * moon.r)));
  }

  peaks(ctx, W, H, hz - 4 * u, 28 * u, 70 * u, 0.2, '#2c2468', '#4a3f94');
  peaks(ctx, W, H, hz + 6 * u, 20 * u, 52 * u, 0.62, '#211a58', null);
  hills(ctx, W, H, hz + 14 * u, 5 * u, 0.05, 1, '#190f48', '#2d2266');
  const gy = hz + Math.round(20 * u);
  ditherGradient(ctx, W, gy, H, [{ at: 0, c: '#1b1448' }, { at: 1, c: '#0f0a30' }]);

  const pc = { trunk: '#0a0620', dark: '#0d0828', mid: '#150e38', light: '#1b1346' };
  const pines = Math.round(W / 38);
  for (let i = 0; i < pines; i++) {
    const side = i % 2 ? W - r() * W * 0.22 : r() * W * 0.22;
    pine(ctx, side, gy + 6 + r() * 14 * u, (24 + r() * 22) * u, pc);
  }

  const cu = side ? Math.min(u, (margin - 4) / 36) : u;
  const cab = cabin(ctx, side ? margin / 2 : W * 0.3, gy + 14 * u, cu, {
    wallDark: '#2a1b3c', wall: '#3a2750', roof: '#1b1034', roofSnow: null,
    door: '#150b24', doorHi: '#ffd36e', frame: '#150b24', window: '#ffd36e',
  });

  // grass sparkle on the ground
  for (let i = 0; i < W / 6; i++) px(ctx, '#2c2266', Math.floor(r() * W), gy + 2 + Math.floor(r() * (H - gy)), 2, 1);

  return { horizon: hz, moon, stars, crosses, chimney: cab.chimney, lights: cab.windows, ground: gy };
}

/* ------------------------------------------------------------------ Rainy Evening */
function rain(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(33), u = unit(H);

  // wallpaper
  ditherGradient(ctx, W, 0, H, [{ at: 0, c: '#474d82' }, { at: 0.7, c: '#69719f' }, { at: 1, c: '#69719f' }]);
  for (let x = 0; x < W; x += 10) { px(ctx, '#4f5588', x, 0, 3, H); px(ctx, '#7d85b4', x + 3, 0, 1, H); }
  for (let y = 4; y < H; y += 12) for (let x = 5; x < W; x += 10) px(ctx, '#8089ba', x, y, 1, 1);

  // wainscot + floor
  const wy = Math.round(H * 0.76), fy = Math.round(H * 0.9);
  px(ctx, '#3b4172', 0, wy, W, fy - wy);
  px(ctx, '#9aa2d6', 0, wy, W, 2); px(ctx, '#252a54', 0, wy + 2, W, 1);
  for (let x = 0; x < W; x += Math.round(18 * u)) px(ctx, '#2f3562', x, wy + 5, 1, fy - wy - 8);
  px(ctx, '#2e2a54', 0, fy, W, H - fy);
  for (let x = 0; x < W; x += 22) px(ctx, '#232046', x, fy, 1, H - fy);
  px(ctx, '#463f78', 0, fy, W, 1);

  // windows
  const nW = side ? 2 : W > 270 ? 3 : W > 150 ? 2 : 1;
  const ww = side ? clamp(margin - 14, 14, 30) : clamp(Math.round((W / (nW + 0.7)) * 0.58), 20, 78);
  const cw = side ? 4 : 8, cg = side ? 1 : 3;
  const wh = clamp(Math.round(H * 0.44), 24, 118);
  const wtop = Math.round(H * 0.07);
  const windows = [], lamps = [];
  for (let i = 0; i < nW; i++) {
    const wx = side ? Math.round((i === 0 ? margin / 2 : W - margin / 2) - ww / 2) : Math.round(((i + 1) * W) / (nW + 1) - ww / 2);
    px(ctx, '#dcd1f6', wx - 3, wtop - 3, ww + 6, wh + 6);
    px(ctx, '#a99bd2', wx - 3, wtop + wh + 1, ww + 6, 2);
    ditherGradient(ctx, ww, wtop, wtop + wh, [{ at: 0, c: '#202a66' }, { at: 0.6, c: '#434f94' }, { at: 1, c: '#6a74b6' }], wx);
    // distant city
    let bx = wx;
    while (bx < wx + ww) {
      const bw = 4 + Math.floor(r() * 7), bh = 6 + Math.floor(r() * 18);
      px(ctx, '#1a2056', bx, wtop + wh - bh, Math.min(bw, wx + ww - bx), bh);
      for (let k = 0; k < bh / 5; k++) if (r() < 0.55) px(ctx, r() < 0.5 ? '#ffd98a' : '#ffb870', bx + 1 + Math.floor(r() * (bw - 2)), wtop + wh - bh + 2 + k * 4, 1, 1);
      bx += bw + 1;
    }
    // mullions
    px(ctx, '#dcd1f6', wx + (ww >> 1) - 1, wtop, 2, wh);
    px(ctx, '#dcd1f6', wx, wtop + Math.round(wh * 0.42), ww, 2);
    // sill + curtains
    px(ctx, '#efe7ff', wx - 6, wtop + wh + 3, ww + 12, 3);
    px(ctx, '#a99bd2', wx - 6, wtop + wh + 6, ww + 12, 1);
    for (const side_ of [-1, 1]) {
      const cx = side_ < 0 ? wx - cw - cg : wx + ww + cg;
      for (let y = 0; y < wh + 6; y++) {
        const sway = Math.round(Math.sin(y * 0.15 + i) * 0.8);
        px(ctx, '#b88bd0', cx + sway, wtop - 5 + y, cw, 1);
        px(ctx, '#9d72ba', cx + sway + 1, wtop - 5 + y, 1, 1);
        if (cw > 5) px(ctx, '#9d72ba', cx + sway + 5, wtop - 5 + y, 1, 1);
      }
    }
    px(ctx, '#7f65a8', wx - cw - cg - 2, wtop - 7, ww + 2 * (cw + cg + 2), 2);
    windows.push({ x: wx, y: wtop, w: ww, h: wh });
  }

  // plant on the first sill, candle on the last
  const w0 = windows[0];
  const potX = w0.x + 4, potY = w0.y + w0.h + 3;
  px(ctx, '#d98a62', potX, potY - 6, 8, 6); px(ctx, '#b86c46', potX, potY - 2, 8, 2);
  for (const [dx, dy, c] of [[1, -9, '#5fc26b'], [4, -12, '#7fdc88'], [6, -9, '#4aa85a'], [2, -12, '#7fdc88'], [-1, -7, '#4aa85a'], [8, -7, '#5fc26b']]) px(ctx, c, potX + dx, potY + dy, 2, 3);
  const wl = windows[windows.length - 1];
  const candle = { x: wl.x + wl.w - 8, y: wl.y + wl.h + 3 };
  px(ctx, '#f3ead8', candle.x, candle.y - 6, 3, 6);
  px(ctx, '#ffd36e', candle.x + 1, candle.y - 8, 1, 2);
  lamps.push({ x: candle.x + 1, y: candle.y - 8, r: 22 * u });

  // wall sconce
  const sx = side ? Math.round(windows[0].x + windows[0].w / 2) : nW >= 2 ? Math.round((windows[0].x + windows[0].w + windows[1].x) / 2) : Math.round(W * 0.86);
  const sy = side ? wtop + wh + 16 : Math.round(H * 0.34);
  px(ctx, '#6e5a8c', sx - 2, sy + 5, 5, 2); px(ctx, '#6e5a8c', sx, sy + 3, 1, 3);
  px(ctx, '#fff0c8', sx - 2, sy, 5, 4); px(ctx, '#ffd98a', sx - 1, sy + 1, 3, 2);
  lamps.push({ x: sx, y: sy + 2, r: 34 * u });

  // bookshelf strip along the wainscot
  let bx = Math.round(W * 0.04);
  const bookCols = ['#e58a8a', '#f2c46d', '#8ac2e5', '#b69be6', '#7fd4a5'];
  for (let i = 0; i < 9 && bx < W - 14; i++) {
    const bw = 3 + Math.floor(r() * 3), bh = 7 + Math.floor(r() * 7);
    px(ctx, bookCols[Math.floor(r() * bookCols.length)], bx, wy - bh, bw, bh);
    bx += bw + 1;
    if (W < 200 && i > 4) break;
  }

  return { windows, lamps, horizon: wy };
}

/* ------------------------------------------------------------------ Sunset */
function sunset(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(44), u = unit(H);
  const hz = Math.round(H * 0.6);

  ditherGradient(ctx, W, 0, hz + 1, [
    { at: 0, c: '#2b2a6e' }, { at: 0.28, c: '#7b3f98' }, { at: 0.55, c: '#d65a8c' },
    { at: 0.78, c: '#ff8f6b' }, { at: 1, c: '#ffe0a8' },
  ]);

  // faint stars in the top band
  for (let i = 0; i < W / 5; i++) {
    const y = Math.floor(r() * hz * 0.25);
    px(ctx, '#e9d9ff', Math.floor(r() * W), y);
  }

  const sun = { x: Math.round(side ? W - margin / 2 : W * 0.5), y: hz - Math.round(2 * u), r: Math.round(clamp(Math.min(17 * u, side ? margin / 2 - 3 : 99), 8, 24)) };
  glow(ctx, sun.x, sun.y, sun.r * 3.6, '#ffc27a', 0.75);
  disc(ctx, '#ffd38a', sun.x, sun.y, sun.r + 2);
  disc(ctx, '#fff0c0', sun.x, sun.y, sun.r);
  disc(ctx, '#fffbe6', sun.x - 2, sun.y - 2, Math.round(sun.r * 0.6));

  // far islands
  hills(ctx, W, H, hz - 3 * u, 3 * u, 0.06, 2.1, '#6a3c80');
  hills(ctx, W, H, hz - 1 * u, 2 * u, 0.12, 0.4, '#4d2f6e');

  // sea
  ditherGradient(ctx, W, hz, H, [
    { at: 0, c: '#f08090' }, { at: 0.2, c: '#b05a98' }, { at: 0.55, c: '#5e3a8c' }, { at: 1, c: '#2c2060' },
  ]);
  // sun reflection
  for (let y = hz + 1; y < H; y += 2) {
    const t = (y - hz) / (H - hz);
    const w = Math.round((sun.r * 1.6 + t * 10) * (1 - t * 0.5));
    const c = t < 0.4 ? '#ffd9a0' : t < 0.7 ? '#ffb57a' : '#c07aa0';
    if (r() < 0.82) px(ctx, c, sun.x - (w >> 1) + Math.round(Math.sin(y) * 2), y, w, 1);
  }
  // horizon line glow
  px(ctx, '#ffe3b0', 0, hz, W, 1);

  // beach + palm, foreground
  const sandY = H - Math.round(22 * u);
  hills(ctx, W, H, sandY, 4 * u, 0.04, 0.6, '#3d2a63', '#5b3f86');
  hills(ctx, W, H, sandY + 10 * u, 3 * u, 0.06, 2, '#241a4a');
  const palm = { x: Math.round(W * 0.1), base: sandY + Math.round(8 * u), h: Math.round(58 * u) };
  if (W > 130) drawPalm(ctx, palm.x, palm.base, palm.h, u);
  if (W > 260) drawPalm(ctx, Math.round(W * 0.93), sandY + Math.round(10 * u), Math.round(44 * u), u, true);

  return { horizon: hz, sun };
}
function drawPalm(ctx, x, by, h, u, flip = false) {
  const c = '#1a1240', dir = flip ? -1 : 1;
  for (let i = 0; i < h; i++) {
    const t = i / h;
    px(ctx, c, x + Math.round(Math.sin(t * 1.6) * 7 * dir), by - i, 3, 1);
  }
  const tx = x + Math.round(Math.sin(1.6) * 7 * dir), ty = by - h;
  const fronds = [[-1, -0.2], [-0.7, -0.6], [-0.2, -1], [0.4, -0.9], [0.8, -0.5], [1, 0]];
  for (const [fx, fy] of fronds) {
    const len = Math.round(18 * u);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const ex = tx + Math.round(fx * i * 1.1), ey = ty + Math.round(fy * i * 0.9 + t * t * 9);
      px(ctx, c, ex, ey, 2, 1); px(ctx, c, ex, ey + 1, 1, 1);
    }
  }
}

/* ------------------------------------------------------------------ Enchanted Forest */
function forest(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(55), u = unit(H);
  const hz = Math.round(H * 0.7);

  ditherGradient(ctx, W, 0, H, [
    { at: 0, c: '#071f26' }, { at: 0.45, c: '#0f4036' }, { at: 0.8, c: '#1a5a43' }, { at: 1, c: '#134a38' },
  ]);

  // three layers of trunks + canopies, back to front
  const layers = [
    { n: Math.round(W / 22), col: '#0b3330', cap: '#0e3d36', w: [4, 7], top: 0.16 },
    { n: Math.round(W / 30), col: '#082a29', cap: '#0a3530', w: [6, 10], top: 0.1 },
    { n: Math.round(W / 46), col: '#051e1f', cap: '#07282a', w: [8, 14], top: 0.04 },
  ];
  for (const L of layers) {
    for (let i = 0; i < L.n; i++) {
      const x = Math.floor(r() * W), w = L.w[0] + Math.floor(r() * (L.w[1] - L.w[0]));
      px(ctx, L.col, x, 0, w, hz + 8);
      px(ctx, L.cap, x + w - 2, 0, 2, hz + 8);
    }
    for (let i = 0; i < L.n * 1.5; i++) disc(ctx, L.cap, Math.floor(r() * W), Math.floor(r() * H * L.top), 8 + Math.floor(r() * 10));
  }

  // mossy ground
  const gy = hz + Math.round(2 * u);
  hills(ctx, W, H, gy, 4 * u, 0.05, 1.2, '#174d39', '#2d7a58');
  ditherGradient(ctx, W, gy + Math.round(8 * u), H, [{ at: 0, c: '#16482f' }, { at: 1, c: '#0b2c22' }]);
  for (let i = 0; i < (W * (H - gy)) / 90; i++) {
    const x = Math.floor(r() * W), y = gy + 6 + Math.floor(r() * (H - gy - 6));
    const c = r() < 0.5 ? '#2c7a52' : '#0d3426';
    px(ctx, c, x, y, 1, 2); px(ctx, c, x + 1, y + 1, 1, 1);
  }

  // ferns
  const fernC = ['#2f8a5c', '#3fb072'];
  for (let i = 0; i < Math.max(4, W / 40); i++) {
    const x = Math.floor(r() * W), y = gy + 8 + Math.floor(r() * (H - gy - 10));
    for (let k = 0; k < 7; k++) {
      px(ctx, fernC[k & 1], x - k, y - Math.round(k * 0.6), 1, 1);
      px(ctx, fernC[(k + 1) & 1], x + k, y - Math.round(k * 0.6), 1, 1);
    }
    px(ctx, fernC[0], x, y - 2, 1, 4);
  }

  // glowing mushrooms
  const mushrooms = [];
  const colors = [
    { cap: '#ff9fd6', spot: '#ffe0f2', glow: '#ff9fd6' },
    { cap: '#7ff0ff', spot: '#d9fbff', glow: '#7ff0ff' },
    { cap: '#b99cff', spot: '#e6dcff', glow: '#b99cff' },
  ];
  const mCount = side ? 8 : clamp(Math.round(W / 55), 3, 8);
  for (let i = 0; i < mCount; i++) {
    const col = colors[i % colors.length];
    const s = (3 + Math.floor(r() * 4)) * u;
    const x = side ? Math.round(i % 2 === 0 ? margin * (0.2 + 0.6 * r()) : W - margin * (0.2 + 0.6 * r())) : Math.round(W * ((i + 0.5) / mCount) + (r() - 0.5) * 20);
    const y = H - Math.round((8 + r() * (H - gy - 22)) );
    mushroom(ctx, x, Math.max(gy + 12, y), Math.max(3, Math.round(s)), col);
    mushrooms.push({ x, y: Math.max(gy + 12, y) - Math.round(s), color: col.glow, r: 14 * u + s * 2 });
  }

  return { horizon: hz, mushrooms, ground: gy };
}
function mushroom(ctx, x, by, s, col) {
  px(ctx, '#e9e2c8', x - 1, by - s, 2, s);
  px(ctx, '#bdb594', x, by - s, 1, s);
  const w = s + 2;
  for (let j = 0; j < s; j++) {
    const half = Math.round(w * Math.sqrt(1 - Math.pow((j - s) / s, 2)) * 0.9);
    px(ctx, col.cap, x - half, by - s - s + j, half * 2 + 1, 1);
  }
  px(ctx, col.spot, x - Math.round(s * 0.6), by - s - Math.round(s * 0.8), 1, 1);
  px(ctx, col.spot, x + Math.round(s * 0.4), by - s - Math.round(s * 0.5), 1, 1);
  px(ctx, 'rgba(0,0,0,.25)', x - w, by - 1, w * 2 + 1, 1);
}

/* ------------------------------------------------------------------ Snowy Cabin */
function snow(ctx, W, H, margin = 0) {
  const side = margin >= 14;
  const r = mulberry32(66), u = unit(H);
  const hz = Math.round(H * 0.58);

  ditherGradient(ctx, W, 0, hz + 6, [
    { at: 0, c: '#1f2b5e' }, { at: 0.4, c: '#4a5f9f' }, { at: 0.78, c: '#c7a3c7' }, { at: 1, c: '#ffd9c7' },
  ]);
  for (let i = 0; i < W / 4; i++) {
    const y = Math.floor(r() * hz * 0.4);
    px(ctx, r() < 0.5 ? '#ffffff' : '#cdd8ff', Math.floor(r() * W), y);
  }

  peaks(ctx, W, H, hz + 2 * u, 40 * u, 90 * u, 0.1, '#6d7db8', '#f4f7ff');
  peaks(ctx, W, H, hz + 12 * u, 26 * u, 62 * u, 0.5, '#8b9ad0', '#ffffff');

  const gy = hz + Math.round(14 * u);
  hills(ctx, W, H, gy, 5 * u, 0.045, 0.8, '#e6eefc', '#ffffff');
  ditherGradient(ctx, W, gy + Math.round(8 * u), H, [{ at: 0, c: '#dfe8fa' }, { at: 0.6, c: '#c4d3f2' }, { at: 1, c: '#a8bbe6' }]);
  // snow drift shading
  for (let i = 0; i < (W * (H - gy)) / 160; i++) {
    const x = Math.floor(r() * W), y = gy + 4 + Math.floor(r() * (H - gy - 4));
    px(ctx, '#ffffff', x, y, 3, 1); px(ctx, '#b4c6ec', x + 1, y + 1, 3, 1);
  }

  const pc = { trunk: '#4a3a3a', dark: '#1e5a4a', mid: '#2f7d63', light: '#3f9a7a', snow: '#f4f8ff' };
  const spots = W > 220 ? [0.06, 0.13, 0.56, 0.7, 0.88, 0.95] : [0.04, 0.9];
  for (const s of spots) pine(ctx, W * s, gy + (10 + r() * 24) * u, (26 + r() * 22) * u, pc);

  const cabX = side ? margin / 2 : (W > 220 ? W * 0.33 : W * 0.5);
  const cs = side ? Math.min(1.15 * u, (margin - 4) / 36) : 1.15 * u;
  const cab = cabin(ctx, cabX, gy + 22 * u, cs, {
    wallDark: '#7a4a30', wall: '#9c6240', roof: '#b9544f', roofSnow: '#ffffff',
    door: '#4a2a1c', doorHi: '#ffd27a', frame: '#4a2a1c', window: '#ffd27a',
  });

  // string lights along the front
  const lights = [];
  const ly = gy + Math.round(22 * u + 9 * cs);
  for (let x = Math.round(cabX - 18 * cs); x < cabX + 18 * cs; x += 5) {
    const yy = ly + Math.round(Math.sin((x - cabX) * 0.4) * 1.5);
    px(ctx, '#6c5a5a', x, yy, 5, 1);
    lights.push({ x: x + 2, y: yy + 1, c: ['#ff8a80', '#ffd27a', '#74bbff', '#7fe0a0'][lights.length % 4] });
  }

  return { horizon: hz, chimney: cab.chimney, lights: cab.windows, bulbs: lights, ground: gy };
}

export const SCENES = { meadow, night, rain, sunset, forest, snow };

/** Paint a world onto a context. Returns meta for the ambient layer. */
export function paintScene(id, ctx, W, H, margin = 0) {
  ctx.imageSmoothingEnabled = false;
  const paint = SCENES[id] || SCENES.meadow;
  return paint(ctx, W, H, margin);
}
