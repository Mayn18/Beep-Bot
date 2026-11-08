import { h } from './dom.js';
import { iconEl } from './icons.js';

/** Show a small game-style notification. variant: 'info' | 'level' */
export function toast(message, { icon = 'sparkle', variant = 'info', duration = 2600 } = {}) {
  const root = document.getElementById('toasts');
  if (!root) return;
  const el = h('div', { class: `toast px px--s${variant === 'level' ? ' toast--level' : ''}`, role: 'status' }, iconEl(icon, 2), h('span', {}, message));
  root.append(el);
  while (root.children.length > 3) root.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 260);
  }, duration);
}
