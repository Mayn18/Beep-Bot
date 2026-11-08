// Modal dialogs: the World picker and Settings.

import { h, $ } from './dom.js';
import { iconEl } from './icons.js';
import { THEMES } from '../themes.js';
import { renderPreview } from '../scene/sceneManager.js';
import { sfx, setSoundEnabled } from './sound.js';

let openModal = null;

function mount({ title, body, narrow = false, footer = null, onClose }) {
  closeModal();
  const prevFocus = document.activeElement;
  const titleId = `modal-title-${Date.now()}`;
  const panel = h('div', { class: `modal__panel${narrow ? ' modal__panel--narrow' : ''} px`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('div', { class: 'modal__head' },
      h('h2', { class: 'modal__title', id: titleId }, title),
      h('button', { class: 'btn btn--icon btn--ghost', type: 'button', 'aria-label': 'Close', onClick: () => closeModal() }, iconEl('close', 2))),
    h('div', { class: 'modal__body' }, body),
    footer);
  const overlay = h('div', { class: 'modal', onMousedown: (e) => { if (e.target === overlay) closeModal(); } }, panel);

  const trap = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"]), select, textarea')].filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trap, true);

  $('#modal-root').append(overlay);
  openModal = { overlay, trap, prevFocus, onClose };
  requestAnimationFrame(() => (panel.querySelector('[aria-checked="true"], .btn--ghost') || panel).focus?.());
  return panel;
}

export function closeModal() {
  if (!openModal) return;
  const { overlay, trap, prevFocus, onClose } = openModal;
  openModal = null;
  document.removeEventListener('keydown', trap, true);
  overlay.remove();
  onClose?.();
  prevFocus?.focus?.({ preventScroll: true });
}

/* ------------------------------------------------------------------ Worlds */

export function openWorldPicker({ store, actions }) {
  const cards = THEMES.map((t) => {
    const canvas = h('canvas', { 'aria-hidden': 'true' });
    const card = h('button', {
      class: 'world px', type: 'button', role: 'radio', 'aria-checked': String(store.state.theme === t.id), dataset: { theme: t.id },
      onClick: () => {
        actions.setTheme(t.id);
        cards.forEach((c) => c.setAttribute('aria-checked', String(c.dataset.theme === t.id)));
        cards.forEach((c) => c.querySelector('.world__badge')?.remove());
        card.append(h('span', { class: 'world__badge' }, 'ACTIVE'));
      },
    },
    h('div', { class: 'world__preview' }, canvas),
    h('div', { class: 'world__name' }, iconEl(t.icon, 2), t.name),
    h('p', { class: 'world__tag' }, t.tagline),
    h('div', { class: 'world__row' }, h('div', { class: 'swatches', 'aria-hidden': 'true' }, t.swatches.map((c) => h('i', { style: { background: c } })))));
    if (store.state.theme === t.id) card.append(h('span', { class: 'world__badge' }, 'ACTIVE'));
    requestAnimationFrame(() => renderPreview(canvas, t.id));
    return card;
  });

  const grid = h('div', { class: 'worlds', role: 'radiogroup', 'aria-label': 'World' }, cards);
  grid.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = cards.indexOf(document.activeElement);
    cards[(i + keys[e.key] + cards.length) % cards.length].focus();
  });

  mount({ title: 'Choose your world', body: [h('p', { class: 'modal__lede' }, 'Each world has its own sky, weather, and mood. Your pick is saved on this device.'), grid] });
}

/* ------------------------------------------------------------------ Settings */

function switchRow({ label, hint, value, onChange }) {
  const sw = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!value), 'aria-label': label,
    onClick: () => { const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on)); sfx.click(); onChange(on); } });
  return h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, label), hint && h('span', { class: 'row__hint' }, hint)), sw);
}

function segRow({ label, hint, value, options, onChange }) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label },
    options.map((o) => h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(o.value === value), 'aria-label': o.aria,
      onClick: (e) => {
        [...wrap.children].forEach((b) => b.setAttribute('aria-checked', 'false'));
        e.currentTarget.setAttribute('aria-checked', 'true');
        sfx.click(); onChange(o.value);
      },
    }, o.label)));
  return h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, label), hint && h('span', { class: 'row__hint' }, hint)), wrap);
}

export function openSettings({ store, actions }) {
  const s = store.state.settings;
  const set = (patch) => actions.updateSettings(patch);

  const nameInput = h('input', { class: 'text-input', type: 'text', value: s.playerName, maxlength: 20, 'aria-label': 'Your name', placeholder: 'Traveler' });
  nameInput.addEventListener('input', () => set({ playerName: nameInput.value.trim() || 'Traveler' }));

  const clearBtn = h('button', { class: 'btn btn--danger btn--small', type: 'button' }, 'Clear all chats');
  let armed = false;
  clearBtn.addEventListener('click', () => {
    if (!armed) { armed = true; clearBtn.textContent = 'Tap again to confirm'; setTimeout(() => { armed = false; clearBtn.textContent = 'Clear all chats'; }, 2800); return; }
    actions.clearChats(); closeModal();
  });
  const resetBtn = h('button', { class: 'btn btn--small', type: 'button' }, 'Reset Beep-Bot');
  let resetArmed = false;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) { resetArmed = true; resetBtn.textContent = 'Tap again to confirm'; setTimeout(() => { resetArmed = false; resetBtn.textContent = 'Reset Beep-Bot'; }, 2800); return; }
    actions.resetAll();
  });

  const body = [
    h('section', { class: 'group' },
      h('h3', { class: 'group__title' }, 'You'),
      h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, 'Your name'), h('span', { class: 'row__hint' }, 'What Beep calls you')), nameInput)),
    h('section', { class: 'group' },
      h('h3', { class: 'group__title' }, 'Look and feel'),
      segRow({ label: 'Text size', value: s.textSize, options: [{ value: 's', label: 'S', aria: 'Small' }, { value: 'm', label: 'M', aria: 'Medium' }, { value: 'l', label: 'L', aria: 'Large' }], onChange: (v) => set({ textSize: v }) }),
      segRow({ label: 'Pixel size', hint: 'How chunky the backgrounds look', value: s.pixelSize, options: [{ value: 'chunky', label: 'Big', aria: 'Chunky pixels' }, { value: 'normal', label: 'Mid', aria: 'Normal pixels' }, { value: 'fine', label: 'Small', aria: 'Fine pixels' }], onChange: (v) => set({ pixelSize: v }) }),
      switchRow({ label: 'Ambient effects', hint: 'Rain, fireflies, drifting clouds', value: s.ambient, onChange: (v) => set({ ambient: v }) }),
      switchRow({ label: 'Animations', hint: 'Bouncing, blinking, and pop-ins', value: s.animations, onChange: (v) => set({ animations: v }) })),
    h('section', { class: 'group' },
      h('h3', { class: 'group__title' }, 'Chat'),
      switchRow({ label: 'Typewriter replies', hint: "Beep's words appear letter by letter", value: s.typewriter, onChange: (v) => set({ typewriter: v }) }),
      switchRow({ label: 'Sound effects', hint: 'Soft 8-bit blips', value: s.sound, onChange: (v) => { setSoundEnabled(v); set({ sound: v }); if (v) sfx.done(); } })),
    h('section', { class: 'group' },
      h('h3', { class: 'group__title' }, 'Your data'),
      h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, 'Export chats'), h('span', { class: 'row__hint' }, 'Download everything as a JSON file')),
        h('button', { class: 'btn btn--secondary btn--small', type: 'button', onClick: () => actions.exportChats() }, 'Export')),
      h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, 'Clear chats'), h('span', { class: 'row__hint' }, 'Removes every conversation on this device')), clearBtn),
      h('div', { class: 'row' }, h('div', { class: 'row__text' }, h('span', { class: 'row__label' }, 'Reset everything'), h('span', { class: 'row__hint' }, 'Chats, world, and settings go back to the start')), resetBtn)),
  ];

  mount({
    title: 'Settings', narrow: true, body,
    footer: h('div', { class: 'modal__foot' }, h('button', { class: 'btn btn--primary', type: 'button', onClick: () => closeModal() }, 'Done')),
  });
}
