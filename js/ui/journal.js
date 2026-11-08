// The "Journal": conversation list with search, rename, delete, and mobile drawer.

import { h, $, relativeTime, dayLabel } from './dom.js';
import { iconEl } from './icons.js';

export function createJournal({ store, actions }) {
  const panel = $('#journal');
  const list = $('#chat-list');
  const search = $('#chat-search');
  const scrim = $('#drawer-scrim');
  const openBtn = $('#btn-journal');
  const closeBtn = $('#btn-journal-close');
  const newBtn = $('#btn-new');

  let renaming = null;
  let armedDelete = null;
  let armTimer = null;

  const lastText = (c) => {
    const m = c.messages.at(-1);
    return m ? m.text.replace(/[*_`]/g, '').replace(/\s+/g, ' ') : 'No messages yet';
  };

  function slot(c, active) {
    const isRenaming = renaming === c.id;
    const armed = armedDelete === c.id;

    const main = isRenaming
      ? h('div', { class: 'slot__main' },
        h('input', {
          class: 'slot__rename', value: c.title, maxlength: 60, 'aria-label': 'Chat name',
          onKeydown: (e) => {
            if (e.key === 'Enter') { actions.renameChat(c.id, e.currentTarget.value); renaming = null; render(); }
            if (e.key === 'Escape') { renaming = null; render(); }
          },
          onBlur: (e) => { if (renaming === c.id) { actions.renameChat(c.id, e.currentTarget.value); renaming = null; render(); } },
        }))
      : h('button', {
        class: 'slot__main', type: 'button', 'aria-current': active ? 'true' : null,
        onClick: () => actions.selectChat(c.id),
        onDblclick: () => { renaming = c.id; render(); },
      },
      h('span', { class: 'slot__title' }, c.title),
      h('span', { class: 'slot__meta' }, h('span', { class: 'slot__preview' }, lastText(c)), h('span', { class: 'slot__time' }, relativeTime(c.updatedAt))));

    const el = h('div', { class: `slot${active ? ' is-active' : ''}`, dataset: { id: c.id } },
      h('span', { class: 'slot__mark', 'aria-hidden': 'true' }, '▶'),
      main,
      h('div', { class: 'slot__actions' },
        h('button', { class: 'iconbtn', type: 'button', 'aria-label': `Rename ${c.title}`, onClick: () => { renaming = c.id; render(); } }, iconEl('pencil', 2)),
        h('button', {
          class: `iconbtn iconbtn--danger${armed ? ' is-armed' : ''}`, type: 'button',
          'aria-label': armed ? `Confirm delete ${c.title}` : `Delete ${c.title}`, title: armed ? 'Click again to delete' : 'Delete',
          onClick: () => {
            if (armedDelete === c.id) { clearTimeout(armTimer); armedDelete = null; actions.deleteChat(c.id); return; }
            armedDelete = c.id; render();
            clearTimeout(armTimer);
            armTimer = setTimeout(() => { armedDelete = null; render(); }, 2600);
          },
        }, iconEl(armed ? 'check' : 'trash', 2))));
    return el;
  }

  function render() {
    const { conversations, activeId, ui } = store.state;
    const q = ui.search.trim().toLowerCase();
    const items = conversations
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    list.replaceChildren();
    if (!items.length) {
      list.append(h('p', { class: 'journal__empty' }, q ? `No chats match "${ui.search.trim()}".` : 'No chats yet. Start a new one and it will show up here.'));
    } else {
      let group = null;
      for (const c of items) {
        const g = dayLabel(c.updatedAt);
        if (g !== group) { list.append(h('p', { class: 'journal__group' }, g)); group = g; }
        list.append(slot(c, c.id === activeId));
      }
    }
    // focus rename field
    if (renaming) { const i = list.querySelector('.slot__rename'); if (i && document.activeElement !== i) { i.focus(); i.select(); } }

    panel.classList.toggle('is-open', ui.journalOpen);
    scrim.hidden = !ui.journalOpen;
    openBtn.setAttribute('aria-expanded', String(ui.journalOpen));
  }

  newBtn.addEventListener('click', () => { actions.newChat(); });
  openBtn.addEventListener('click', () => store.ui({ journalOpen: true }));
  closeBtn.addEventListener('click', () => store.ui({ journalOpen: false }));
  scrim.addEventListener('click', () => store.ui({ journalOpen: false }));
  search.addEventListener('input', () => store.ui({ search: search.value }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && store.state.ui.journalOpen && !document.querySelector('.modal')) store.ui({ journalOpen: false }); });

  store.subscribe((_, changed) => {
    if (changed.has('conversations') || changed.has('activeId') || changed.has('ui')) {
      // don't clobber the rename input while typing in it
      if (renaming && document.activeElement?.classList.contains('slot__rename') && !changed.has('activeId')) return;
      render();
    }
  });
  render();
  setInterval(render, 60000); // keep "5m ago" fresh
}
