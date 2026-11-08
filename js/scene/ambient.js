// Animated overlay for each world: clouds, twinkling stars, rain, fireflies…
// Each factory returns { draw(ctx, t, dt) } and keeps its own particle state.
// Everything is drawn in art pixels onto a transparent canvas above the painting.

import { mulberry32, clamp, disc, px, makeCanvas, glowSprite } from './pixel.js';

/* ---------- shared helpers ---------- */

function makeCloud(w, rng, pal) {
  const h = Math.round(w * 0.42);
  const c = makeCanvas(w, h + 2);
  const x = c.getContext('2d');
  const n = Math.max(3, Math.round(w / 9));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const r = Math.max(3, h * (0.28 + rng() * 0.3) * (1 - Math.abs(t - 0.5) * 0.7));
    disc(x, pal.light, (i + 0.5) * (w / n), h * 0.58, r);
  }
  x.fillStyle = pal.light;
  x.fillRect(3, Math.round(h * 0.58), w - 6, Math.round(h * 0.34));
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = pal.shade;
  x.fillRect(0, Math.round(h * 0.74), w, h);
  x.fillStyle = pal.mid;
  x.fillRect(0, Math.round(h * 0.66), w, Math.round(h * 0.08));
  return c;
}

function makeClouds(W, y0, y1, count, rng, pal, speed = [1.5, 4]) {
  return Array.from({ length: count }, () => {
    const w = Math.round(26 + rng() * 34);
    return {
      x: rng() * W, y: y0 + rng() * (y1 - y0), v: speed[0] + rng() * (speed[1] - speed[0]),
      sprite: makeCloud(w, rng, pal),
    };
  });
}
function drawClouds(ctx, W, clouds, dt, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (const c of clouds) {
    c.x += c.v * dt;
    if (c.x > W + 4) c.x = -c.sprite.width - 4;
    ctx.drawImage(c.sprite, Math.round(c.x), Math.round(c.y));
  }
  ctx.globalAlpha = 1;
}

function smokeSystem(origin, rng) {
  const puffs = [];
  let timer = 0;
  return {
    draw(ctx, t, dt, color = '#cfd6f0', alpha = 0.7) {
      timer -= dt;
      if (timer <= 0 && origin) { puffs.push({ x: origin.x, y: origin.y, age: 0, dx: (rng() - 0.3) * 3 }); timer = 0.7 + rng() * 0.5; }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt; p.y -= 7 * dt; p.x += (4 + p.dx) * dt * 0.8;
        const life = p.age / 6;
        if (life >= 1) { puffs.splice(i, 1); continue; }
        ctx.globalAlpha = alpha * (1 - life);
        const s = 2 + Math.floor(life * 4);
        px(ctx, color, p.x, p.y, s, s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* ---------- worlds ---------- */

function meadow(W, H, meta, rng) {
  const hz = meta.horizon;
  const clouds = makeClouds(W, H * 0.04, hz * 0.55, Math.max(3, Math.round(W / 85)), rng,
    { light: '#ffffff', mid: '#eaf6ff', shade: '#cfe6f8' });
  const motes = Array.from({ length: Math.round(W / 10) }, () => ({
    x: rng() * W, y: rng() * H, vx: 3 + rng() * 5, vy: 2 + rng() * 4, ph: rng() * 6.28,
    c: ['#ffffff', '#ffd1e0', '#fff3a8'][Math.floor(rng() * 3)],
  }));
  const flies = Array.from({ length: W > 200 ? 3 : 1 }, (_, i) => ({
    cx: W * (0.25 + 0.3 * i + rng() * 0.15), cy: meta.ground + 14 + rng() * (H - meta.ground - 24), ph: rng() * 6.28,
    c: ['#ff8fc2', '#ffd36b', '#9ad9ff'][i % 3],
  }));
  return {
    draw(ctx, t, dt) {
      drawClouds(ctx, W, clouds, dt);
      for (const m of motes) {
        m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(t * 1.5 + m.ph) * 0.1;
        if (m.x > W) m.x = -2; if (m.y > H) m.y = -2;
        px(ctx, m.c, m.x + Math.sin(t + m.ph) * 2, m.y, 1, 1);
      }
      for (const f of flies) {
        const x = f.cx + Math.sin(t * 0.35 + f.ph) * 38 + Math.sin(t * 1.3 + f.ph) * 4;
        const y = f.cy + Math.cos(t * 0.6 + f.ph) * 10 + Math.sin(t * 2.2) * 2;
        const open = Math.floor(t * 7 + f.ph) % 2;
        px(ctx, f.c, x - 2, y - (open ? 2 : 1), 2, 2); px(ctx, f.c, x + 1, y - (open ? 2 : 1), 2, 2);
        px(ctx, '#4b3d2e', x, y - 1, 1, 3);
      }
    },
  };
}

function night(W, H, meta, rng) {
  const smoke = smokeSystem(meta.chimney, rng);
  const lamp = glowSprite(10, '#ffd36e', 0.7);
  const moonGlow = glowSprite(meta.moon.r * 2.4, '#fff3c8', 0.35);
  const clouds = makeClouds(W, H * 0.1, H * 0.35, 2, rng, { light: '#4a3f94', mid: '#3c3280', shade: '#2d2568' }, [1, 2]);
  const flies = Array.from({ length: 10 }, () => ({ x: rng() * W, y: meta.ground + rng() * (H - meta.ground), ph: rng() * 6.28, sp: 0.4 + rng() * 0.6 }));
  let shoot = null, nextShoot = 5 + rng() * 6;
  return {
    draw(ctx, t, dt) {
      for (const s of meta.stars) {
        const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
        ctx.globalAlpha = a; px(ctx, s.c, s.x, s.y); ctx.globalAlpha = 1;
      }
      for (const c of meta.crosses) {
        const a = 0.5 + 0.5 * Math.sin(t * 1.5 + c.ph);
        ctx.globalAlpha = 0.35 + 0.65 * a;
        px(ctx, '#ffffff', c.x, c.y); px(ctx, '#cfd6ff', c.x - 1, c.y); px(ctx, '#cfd6ff', c.x + 1, c.y);
        px(ctx, '#cfd6ff', c.x, c.y - 1); px(ctx, '#cfd6ff', c.x, c.y + 1);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 0.5 + 0.1 * Math.sin(t * 0.7);
      ctx.drawImage(moonGlow, meta.moon.x - (moonGlow.width >> 1), meta.moon.y - (moonGlow.height >> 1));
      ctx.globalAlpha = 1;
      drawClouds(ctx, W, clouds, dt, 0.8);

      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) { shoot = { x: rng() * W * 0.8, y: rng() * H * 0.25, age: 0 }; nextShoot = 9 + rng() * 10; }
      if (shoot) {
        shoot.age += dt; shoot.x += 70 * dt; shoot.y += 34 * dt;
        for (let i = 0; i < 9; i++) { ctx.globalAlpha = (1 - i / 9) * Math.max(0, 1 - shoot.age / 1.1); px(ctx, '#ffffff', shoot.x - i * 2, shoot.y - i, 1, 1); }
        ctx.globalAlpha = 1;
        if (shoot.age > 1.1) shoot = null;
      }

      for (const w of meta.lights) {
        ctx.globalAlpha = 0.55 + 0.12 * Math.sin(t * 3 + w.x);
        ctx.drawImage(lamp, w.x + (w.w >> 1) - lamp.width / 2, w.y + (w.h >> 1) - lamp.height / 2);
      }
      ctx.globalAlpha = 1;
      smoke.draw(ctx, t, dt, '#9a93c8', 0.65);

      for (const f of flies) {
        const x = f.x + Math.sin(t * f.sp + f.ph) * 12, y = f.y + Math.cos(t * f.sp * 1.3 + f.ph) * 5;
        ctx.globalAlpha = Math.pow(Math.max(0, Math.sin(t * 1.4 + f.ph)), 2);
        px(ctx, '#ffe58a', x, y, 1, 1);
        ctx.globalAlpha = 1;
      }
    },
  };
}

function rain(W, H, meta, rng) {
  const wins = meta.windows;
  const regions = wins.length ? wins : [{ x: 0, y: 0, w: W, h: H }];
  const drops = [];
  for (const w of regions) {
    const n = Math.round((w.w * w.h) / 42);
    for (let i = 0; i < n; i++) drops.push({ w, x: rng() * w.w, y: rng() * w.h, v: 70 + rng() * 60, len: 2 + Math.floor(rng() * 3), a: 0.4 + rng() * 0.5 });
  }
  const runs = [];
  for (const w of regions) for (let i = 0; i < Math.max(2, Math.round(w.w / 14)); i++) {
    runs.push({ w, x: 2 + rng() * (w.w - 4), y: rng() * w.h, v: 1 + rng() * 3, pause: 0, len: 2 + Math.floor(rng() * 3) });
  }
  const lamps = meta.lamps.map((l) => ({ ...l, s: glowSprite(l.r, '#ffd9a0', 0.55) }));
  let flash = 0, nextFlash = 12 + rng() * 14;
  const motes = Array.from({ length: 14 }, () => ({ x: rng() * W, y: rng() * H, ph: rng() * 6.28 }));
  return {
    draw(ctx, t, dt) {
      for (const l of lamps) {
        ctx.globalAlpha = 0.7 + 0.1 * Math.sin(t * 2.3 + l.x) + (rng() < 0.02 ? 0.08 : 0);
        ctx.drawImage(l.s, l.x - (l.s.width >> 1), l.y - (l.s.height >> 1));
      }
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.beginPath();
      for (const w of regions) ctx.rect(w.x, w.y, w.w, w.h);
      ctx.clip();

      for (const d of drops) {
        d.y += d.v * dt; d.x -= d.v * 0.22 * dt;
        if (d.y > d.w.h) { d.y = -d.len; d.x = rng() * (d.w.w + 20); }
        if (d.x < -2) d.x += d.w.w + 4;
        ctx.globalAlpha = d.a;
        for (let k = 0; k < d.len; k++) px(ctx, '#cfe0ff', d.w.x + d.x + k * 0.25, d.w.y + d.y - d.len + k, 1, 1);
      }
      for (const r of runs) {
        if (r.pause > 0) r.pause -= dt;
        else { r.y += r.v * 12 * dt; if (rng() < 0.012) r.pause = 0.4 + rng() * 1.2; }
        if (r.y > r.w.h) { r.y = -3; r.x = 2 + rng() * (r.w.w - 4); }
        ctx.globalAlpha = 0.9; px(ctx, '#d8e6ff', r.w.x + r.x, r.w.y + r.y, 1, 2);
        ctx.globalAlpha = 0.35; px(ctx, '#bcd0ff', r.w.x + r.x, r.w.y + r.y - r.len, 1, r.len);
      }

      nextFlash -= dt;
      if (nextFlash <= 0) { flash = 0.5; nextFlash = 14 + rng() * 20; }
      if (flash > 0) {
        flash -= dt;
        const on = Math.floor(flash * 14) % 2 === 0;
        if (on) { ctx.globalAlpha = 0.28; ctx.fillStyle = '#e8f0ff'; for (const w of regions) ctx.fillRect(w.x, w.y, w.w, w.h); }
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      for (const m of motes) {
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 0.8 + m.ph);
        px(ctx, '#ffe9c4', m.x + Math.sin(t * 0.3 + m.ph) * 6, m.y + Math.cos(t * 0.25 + m.ph) * 4, 1, 1);
      }
      ctx.globalAlpha = 1;
    },
  };
}

function sunset(W, H, meta, rng) {
  const hz = meta.horizon;
  const clouds = makeClouds(W, H * 0.06, hz * 0.7, Math.max(3, Math.round(W / 80)), rng,
    { light: '#ffc6d4', mid: '#ffa6bf', shade: '#d77aa6' }, [1.2, 3.2]);
  const sparkles = Array.from({ length: 36 }, () => ({
    x: meta.sun.x + (rng() - 0.5) * (30 + rng() * 40), y: hz + 2 + rng() * (H - hz) * 0.7, ph: rng() * 6.28, sp: 1 + rng() * 2.5,
  }));
  const birds = Array.from({ length: 4 }, (_, i) => ({ x: -20 - i * 14, y: hz * (0.25 + rng() * 0.25), v: 9 + rng() * 4, ph: rng() * 6, off: 0 }));
  let birdTimer = 2, flock = false;
  const boat = { x: rng() * W * 0.5, y: hz + 7 };
  return {
    draw(ctx, t, dt) {
      drawClouds(ctx, W, clouds, dt, 0.92);
      for (const s of sparkles) {
        const a = Math.sin(t * s.sp + s.ph);
        if (a > 0.35) { ctx.globalAlpha = a; px(ctx, '#fff2c4', s.x, s.y, 2, 1); }
      }
      ctx.globalAlpha = 1;

      birdTimer -= dt;
      if (!flock && birdTimer <= 0) { flock = true; birds.forEach((b, i) => { b.x = -10 - i * 12; b.y = hz * (0.2 + rng() * 0.3); }); }
      if (flock) {
        let alive = false;
        for (const b of birds) {
          b.x += b.v * dt; if (b.x < W + 10) alive = true;
          const y = b.y + Math.sin(t * 1.2 + b.ph) * 2, flap = Math.floor(t * 5 + b.ph) % 2;
          px(ctx, '#3b2260', b.x - 2, y + (flap ? 0 : 1), 2, 1); px(ctx, '#3b2260', b.x, y + (flap ? 1 : 0), 1, 1); px(ctx, '#3b2260', b.x + 1, y + (flap ? 0 : 1), 2, 1);
        }
        if (!alive) { flock = false; birdTimer = 12 + rng() * 14; }
      }

      boat.x += 1.6 * dt; if (boat.x > W + 10) boat.x = -10;
      const bob = Math.round(Math.sin(t * 1.2));
      px(ctx, '#2a1a4c', boat.x - 4, boat.y + bob + 3, 9, 2); px(ctx, '#2a1a4c', boat.x - 2, boat.y + bob + 5, 5, 1);
      px(ctx, '#ffe8d0', boat.x - 1, boat.y + bob - 4, 1, 7); px(ctx, '#ffd0b0', boat.x, boat.y + bob - 3, 3, 5);
    },
  };
}

function forest(W, H, meta, rng) {
  const flies = Array.from({ length: clamp(Math.round(W / 14), 14, 44) }, () => ({
    x: rng() * W, y: H * 0.25 + rng() * H * 0.7, ph: rng() * 6.28, sp: 0.3 + rng() * 0.6, amp: 6 + rng() * 14,
    c: rng() < 0.5 ? '#d9ff9a' : rng() < 0.5 ? '#9afff0' : '#ffd9f0',
  }));
  const halo = glowSprite(4, '#d9ff9a', 0.8);
  const spores = Array.from({ length: Math.round(W / 7) }, () => ({ x: rng() * W, y: rng() * H, v: 2 + rng() * 4, ph: rng() * 6.28 }));
  const glows = meta.mushrooms.map((m) => ({ ...m, s: glowSprite(m.r, m.color, 0.55) }));
  const rays = Array.from({ length: 4 }, (_, i) => ({ x: W * (0.12 + i * 0.27) + rng() * 20, w: 6 + rng() * 8, ph: rng() * 6.28 }));
  return {
    draw(ctx, t, dt) {
      ctx.fillStyle = '#f4ffc8';
      for (const r of rays) {
        ctx.globalAlpha = 0.045 + 0.035 * Math.sin(t * 0.5 + r.ph);
        for (let y = 0; y < meta.horizon + 6; y += 1) ctx.fillRect(Math.round(r.x + y * 0.45), y, Math.round(r.w + y * 0.08), 1);
      }
      ctx.globalAlpha = 1;
      for (const g of glows) {
        ctx.globalAlpha = 0.65 + 0.25 * Math.sin(t * 1.3 + g.x);
        ctx.drawImage(g.s, g.x - (g.s.width >> 1), g.y - (g.s.height >> 1));
      }
      ctx.globalAlpha = 1;
      for (const s of spores) {
        s.y -= s.v * dt; if (s.y < -2) { s.y = H + 2; s.x = rng() * W; }
        ctx.globalAlpha = 0.25 + 0.3 * Math.sin(t + s.ph) ** 2; px(ctx, '#d6fff0', s.x + Math.sin(t * 0.4 + s.ph) * 3, s.y);
      }
      ctx.globalAlpha = 1;
      for (const f of flies) {
        const x = f.x + Math.sin(t * f.sp + f.ph) * f.amp, y = f.y + Math.cos(t * f.sp * 1.2 + f.ph) * f.amp * 0.5;
        const a = Math.pow(Math.max(0, Math.sin(t * 1.1 + f.ph * 2)), 2);
        ctx.globalAlpha = a * 0.7; ctx.drawImage(halo, Math.round(x) - 4, Math.round(y) - 4);
        ctx.globalAlpha = 0.4 + a * 0.6; px(ctx, f.c, x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    },
  };
}

function snow(W, H, meta, rng) {
  const smoke = smokeSystem(meta.chimney, rng);
  const lamp = glowSprite(12, '#ffd27a', 0.8);
  const flakes = [];
  const layers = [{ n: Math.round(W / 3), s: 1, v: 7, a: 0.55 }, { n: Math.round(W / 4), s: 1, v: 12, a: 0.85 }, { n: Math.round(W / 9), s: 2, v: 20, a: 1 }];
  layers.forEach((L, li) => { for (let i = 0; i < L.n; i++) flakes.push({ x: rng() * W, y: rng() * H, ph: rng() * 6.28, ...L, li }); });
  const bulbGlow = glowSprite(3, '#ffffff', 0.7);
  return {
    draw(ctx, t, dt) {
      // aurora ribbons
      for (let x = 0; x < W; x += 2) {
        const y = H * 0.08 + Math.sin(x * 0.045 + t * 0.35) * 6 + Math.sin(x * 0.013 - t * 0.2) * 9;
        const hgt = 7 + Math.sin(x * 0.07 + t * 0.5) * 3;
        ctx.globalAlpha = 0.11; ctx.fillStyle = '#7fffd0'; ctx.fillRect(x, y, 2, hgt);
        ctx.globalAlpha = 0.07; ctx.fillStyle = '#ff9fe0'; ctx.fillRect(x, y + hgt, 2, 5);
      }
      ctx.globalAlpha = 1;
      for (const w of meta.lights) {
        ctx.globalAlpha = 0.6 + 0.12 * Math.sin(t * 5 + w.x * 2) * Math.sin(t * 1.3);
        ctx.drawImage(lamp, w.x + (w.w >> 1) - lamp.width / 2, w.y + (w.h >> 1) - lamp.height / 2);
      }
      ctx.globalAlpha = 1;
      meta.bulbs.forEach((b, i) => {
        const on = Math.floor(t * 1.5 + i) % 3 !== 0;
        ctx.globalAlpha = on ? 0.9 : 0.35; px(ctx, b.c, b.x, b.y, 1, 2);
        if (on) { ctx.globalAlpha = 0.35; ctx.drawImage(bulbGlow, b.x - 3, b.y - 2); }
      });
      ctx.globalAlpha = 1;
      smoke.draw(ctx, t, dt, '#f1f4ff', 0.8);
      for (const f of flakes) {
        f.y += f.v * dt; f.x += Math.sin(t * 0.9 + f.ph) * 6 * dt - 1.5 * dt;
        if (f.y > H + 2) { f.y = -2; f.x = rng() * W; }
        if (f.x < -2) f.x = W + 2;
        ctx.globalAlpha = f.a; px(ctx, '#ffffff', f.x, f.y, f.s, f.s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

const FACTORIES = { meadow, night, rain, sunset, forest, snow };

export function createAmbient(id, W, H, meta, seed = 7) {
  const make = FACTORIES[id];
  const rng = mulberry32(seed);
  return make ? make(W, H, meta, rng) : { draw() {} };
}
