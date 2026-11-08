// Beep, the robot companion. A 16x20 pixel bitmap rendered as SVG.
// Colors come from CSS variables (--bot-*), so Beep re-dresses for each world.
//
//  k outline   b body   h highlight   d screen   e eye (blinks)
//  m mouth     a antenna light

const BEEP = [
  '.......aa.......',
  '.......kk.......',
  '..kkkkkkkkkkkk..',
  '.kbbbbbbbbbbbbk.',
  '.kbkkkkkkkkkkbk.',
  '.kbkddddddddkbk.',
  '.kbkddddddddkbk.',
  '.kbkddddddddkbk.',
  '.kbkddddddddkbk.',
  '.kbkdmddddmdkbk.',
  '.kbkddmmmmddkbk.',
  '.kbkkkkkkkkkkbk.',
  '.khbbbbbbbbbbbk.',
  '..kkkkkkkkkkkk..',
  '...kkbbbbbbkk...',
  '..kbbhhbbbbbbk..',
  '.kkbbbbaabbbbkk.',
  '..kbbbbbbbbbbk..',
  '..kkkkkkkkkkkk..',
  '...kk......kk...',
];
const EYES = [{ x: 4, y: 5 }, { x: 10, y: 5 }]; // each 2x3
const HEAD_ROWS = 14;

function runs(rows) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let n = 1;
      while (row[x + n] === ch) n++;
      out.push({ ch, x, y, n });
      x += n;
    }
  });
  return out;
}

export function beepSVG({ scale = 3, head = false } = {}) {
  const rows = head ? BEEP.slice(0, HEAD_ROWS) : BEEP;
  const h = rows.length;
  const rects = runs(rows)
    .map((r) => `<rect class="c-${r.ch}${r.ch === 'a' ? ' ant' : ''}" x="${r.x}" y="${r.y}" width="${r.n}" height="1"/>`)
    .join('');
  const eyes = EYES.map((e) => `<rect class="c-e eye" x="${e.x}" y="${e.y}" width="2" height="3"/>`).join('');
  return `<svg class="spr" viewBox="0 0 16 ${h}" width="${16 * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}${eyes}</svg>`;
}

/** Replace every [data-sprite] element with Beep. */
export function hydrateSprites(root = document) {
  root.querySelectorAll('[data-sprite]').forEach((el) => {
    el.innerHTML = beepSVG({ scale: Number(el.dataset.scale) || 3, head: el.dataset.sprite === 'head' });
    el.removeAttribute('data-sprite');
  });
}
