// Hand-drawn 8x8 pixel icons. 'k' = filled pixel. Rendered as crisp inline SVG
// that inherits `currentColor`, so themes recolor them for free.

const ICONS = {
  plus: ['...kk...', '...kk...', '...kk...', 'kkkkkkkk', 'kkkkkkkk', '...kk...', '...kk...', '...kk...'],
  menu: ['........', 'kkkkkkkk', '........', 'kkkkkkkk', '........', 'kkkkkkkk', '........', '........'],
  close: ['kk....kk', 'kkk..kkk', '.kkkkkk.', '..kkkk..', '..kkkk..', '.kkkkkk.', 'kkk..kkk', 'kk....kk'],
  send: ['.k......', '.kkk....', '.kkkkk..', '.kkkkkkk', '.kkkkk..', '.kkk....', '.k......', '........'],
  search: ['.kkkk...', 'k....k..', 'k....k..', 'k....k..', '.kkkk...', '....kkk.', '.....kkk', '......kk'],
  gear: ['...kk...', '.k.kk.k.', '..kkkk..', 'kkk..kkk', 'kkk..kkk', '..kkkk..', '.k.kk.k.', '...kk...'],
  trash: ['...kk...', 'kkkkkkkk', '.kkkkkk.', '.k.kk.k.', '.k.kk.k.', '.k.kk.k.', '.kkkkkk.', '........'],
  pencil: ['......kk', '.....kkk', '....kkk.', '...kkk..', '..kkk...', '.kkk....', 'kkk.....', 'kk......'],
  copy: ['kkkkkk..', 'k....k..', 'k.kkkkkk', 'k.k....k', 'kkk....k', '..k....k', '..kkkkkk', '........'],
  check: ['........', '......kk', '.....kk.', 'kk..kk..', '.kkkk...', '..kk....', '........', '........'],
  heart: ['.kk..kk.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '...kk...', '........'],
  star: ['...kk...', '...kk...', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '.kk..kk.', 'kk....kk', '........'],
  sparkle: ['...k....', '...k....', '..kkk...', 'kkkkkkk.', '..kkk...', '...k....', '...k....', '........'],
  chat: ['.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '..kk....', '.k......', '........'],
  'arrow-down': ['..kkkk..', '..kkkk..', '..kkkk..', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '...kk...', '........'],
  // world icons
  sun: ['...kk...', '.k.kk.k.', '..kkkk..', 'kkkkkkkk', 'kkkkkkkk', '..kkkk..', '.k.kk.k.', '...kk...'],
  moon: ['..kkkk..', '.kkk....', 'kkk.....', 'kkk.....', 'kkk.....', 'kkkk....', '.kkkkkk.', '..kkkk..'],
  rain: ['..kkkk..', '.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', '........', '.k..k..k', '..k..k..', '.k..k...'],
  sunset: ['........', '...kk...', '..kkkk..', '.kkkkkk.', 'kkkkkkkk', '........', 'kkkkkkkk', '..kkkk..'],
  mushroom: ['..kkkk..', '.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', '..kkkk..', '...kk...', '...kk...', '..kkkk..'],
  snow: ['k..kk..k', '.k.kk.k.', '..kkkk..', 'kkk..kkk', 'kkk..kkk', '..kkkk..', '.k.kk.k.', 'k..kk..k'],
};

function pathFor(rows) {
  let d = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === 'k') {
        let n = 1;
        while (row[x + n] === 'k') n++;
        d += `M${x} ${y}h${n}v1h-${n}z`;
        x += n;
      } else x++;
    }
  });
  return d;
}

export function iconSVG(name, size = 2) {
  const rows = ICONS[name] || ICONS.sparkle;
  const px = 8 * size;
  return `<svg class="pxi" viewBox="0 0 8 8" width="${px}" height="${px}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path d="${pathFor(rows)}"/></svg>`;
}

export function setIcon(el, name, size = 2) {
  el.innerHTML = iconSVG(name, size);
  el.classList.add('icon');
}

/** Replace every <span data-icon="name" data-size="2"> under root with an SVG. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    setIcon(el, el.dataset.icon, Number(el.dataset.size) || 2);
    el.removeAttribute('data-icon');
  });
}

export function iconEl(name, size = 2, cls = '') {
  const s = document.createElement('span');
  s.className = `icon ${cls}`.trim();
  s.innerHTML = iconSVG(name, size);
  return s;
}
