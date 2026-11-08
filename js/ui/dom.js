// Small DOM helpers shared by the views.

const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'textContent', 'innerHTML']);

/** h('button', { class: 'btn', onClick: fn }, 'Label', childNode) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const uid = () =>
  (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function formatClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(ts) {
  const now = new Date();
  const d = new Date(ts);
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function relativeTime(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 172800) return '1d';
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Tiny, safe formatter: **bold**, _italic_, `code`, "- " lists, "1. " lists. No raw HTML. */
export function formatText(src) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) =>
    esc(s)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>');

  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  for (const line of lines) {
    const ul = /^\s*[-•]\s+(.*)/.exec(line), ol = /^\s*\d+[.)]\s+(.*)/.exec(line);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      flushPara();
      if (list && list.tag !== tag) flushList();
      (list ||= { tag, items: [] }).items.push((ul || ol)[1]);
    } else if (!line.trim()) { flushPara(); flushList(); }
    else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return out.join('');
}

/** Reveal text node by node (keeps formatting intact). Returns { skip, cancel }. */
export function typewrite(el, { cps = 70, onTick, onDone } = {}) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push([n, n.nodeValue]);
  const total = nodes.reduce((a, [, s]) => a + s.length, 0);
  nodes.forEach(([n]) => (n.nodeValue = ''));

  const speed = Math.max(cps, total / 6); // never take longer than ~6s
  let shown = 0, last = performance.now(), raf = 0, done = false, lastWhole = 0;

  const render = (count) => {
    let left = count;
    for (const [node, full] of nodes) {
      if (left >= full.length) { node.nodeValue = full; left -= full.length; }
      else { node.nodeValue = full.slice(0, Math.max(0, left)); left = 0; }
    }
  };
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    render(total);
    onDone?.();
  };
  const frame = (now) => {
    shown = Math.min(total, shown + ((now - last) / 1000) * speed);
    last = now;
    const whole = Math.floor(shown);
    render(whole);
    if (whole !== lastWhole) { onTick?.(whole, total); lastWhole = whole; }
    if (shown >= total) finish(); else raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { skip: finish, cancel: () => { done = true; cancelAnimationFrame(raf); } };
}
