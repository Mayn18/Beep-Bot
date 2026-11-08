// The chat panel: message list, typing indicator, empty state, composer, HUD.

import { h, $, formatText, typewrite, formatClock, dayKey, dayLabel } from './dom.js';
import { iconEl } from './icons.js';
import { beepSVG } from './sprites.js';
import { STARTERS } from '../data/mockData.js';
import { getTheme } from '../themes.js';
import { levelInfo, XP_PER_LEVEL } from '../state/actions.js';
import { burstAt } from './fx.js';
import { sfx } from './sound.js';
import { toast } from './toast.js';

const isDesktop = () => window.matchMedia('(min-width: 981px)').matches;

export function createChat({ store, actions }) {
  const log = $('#chat-log');
  const inner = $('#chat-inner');
  const form = $('#composer');
  const input = $('#composer-input');
  const sendBtn = $('#btn-send');
  const jump = $('#btn-jump');
  const statusEl = $('#chat-title');
  const hudLv = $('#hud-lv');
  const hudXp = $('#hud-xp');

  let renderedId = null;
  const rendered = new Set();
  let lastDay = null;
  let typingNode = null;
  let emptyNode = null;
  let writer = null;
  let stick = true;

  /* ---------- scrolling ---------- */
  const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 90;
  const toBottom = (smooth = false) => log.scrollTo({ top: log.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  log.addEventListener('scroll', () => {
    stick = nearBottom();
    jump.hidden = stick;
  }, { passive: true });
  jump.addEventListener('click', () => { toBottom(true); input.focus({ preventScroll: true }); });

  /* ---------- node builders ---------- */
  const avatarBeep = () => {
    const el = h('div', { class: 'msg__avatar px px--s', 'aria-hidden': 'true' });
    el.innerHTML = beepSVG({ scale: 2, head: true });
    return el;
  };

  const dayDivider = (ts) => h('div', { class: 'day', role: 'separator' }, dayLabel(ts));

  function copyButton(text) {
    return h('button', {
      class: 'iconbtn', type: 'button', 'aria-label': 'Copy message',
      onClick: async (e) => {
        try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', { icon: 'check', duration: 1600 }); sfx.click(); }
        catch { toast('Copy is blocked in this browser', { icon: 'close', duration: 2200 }); }
        e.currentTarget.blur();
      },
    }, iconEl('copy', 2));
  }

  function botNode(msg, { animate }) {
    const text = h('div', { class: 'dialog__text' });
    text.innerHTML = formatText(msg.text);
    const dialog = h('div', { class: `dialog px${msg.error ? ' dialog--error' : ''}` }, text, h('span', { class: 'dialog__next', 'aria-hidden': 'true' }, iconEl('arrow-down', 1)));
    const node = h('article', { class: 'msg msg--bot', dataset: { id: msg.id } },
      avatarBeep(),
      h('div', { class: 'msg__col' },
        h('span', { class: 'plate' }, 'BEEP'),
        dialog,
        h('div', { class: 'msg__meta' }, h('time', { datetime: new Date(msg.ts).toISOString() }, formatClock(msg.ts)), copyButton(msg.text))));
    if (animate && store.state.settings.typewriter) {
      writer?.skip();
      const w = typewrite(text, {
        onTick: (n) => { if (n % 3 === 0) sfx.talk(); if (stick) toBottom(); },
        onDone: () => { dialog.classList.add('is-done'); sfx.done(); if (writer === w) writer = null; if (stick) toBottom(true); },
      });
      writer = w;
      dialog.addEventListener('click', () => w.skip());
    } else {
      dialog.classList.add('is-done');
    }
    return node;
  }

  function userNode(msg) {
    const text = h('div', { class: 'bubble__text' });
    text.innerHTML = formatText(msg.text);
    const avatar = h('div', { class: 'msg__avatar msg__avatar--user px px--s', 'aria-hidden': 'true' }, iconEl('star', 3));
    return h('article', { class: 'msg msg--user', dataset: { id: msg.id } },
      avatar,
      h('div', { class: 'msg__col' },
        h('span', { class: 'plate' }, store.state.settings.playerName || 'You'),
        h('div', { class: 'bubble px px--s' }, text),
        h('div', { class: 'msg__meta' }, h('time', { datetime: new Date(msg.ts).toISOString() }, formatClock(msg.ts)))));
  }

  function makeTyping() {
    return h('article', { class: 'msg msg--bot msg--typing', 'aria-label': 'Beep is thinking' },
      avatarBeep(),
      h('div', { class: 'msg__col' },
        h('span', { class: 'plate' }, 'BEEP'),
        h('div', { class: 'dialog px is-typing' },
          h('div', { class: 'typing' },
            h('div', { class: 'typing__dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
            h('span', { class: 'typing__label' }, 'thinking…')))));
  }

  function greeting(name) {
    const hr = new Date().getHours();
    if (hr < 5) return `Still up, ${name}?`;
    return `${hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'}, ${name}!`;
  }

  function makeEmpty() {
    const beep = h('div', { class: 'empty__beep' });
    beep.innerHTML = beepSVG({ scale: 7 });
    return h('div', { class: 'empty' },
      h('div', { class: 'empty__hero' },
        iconEl('sparkle', 2, 'empty__spark'), iconEl('star', 2, 'empty__spark'), iconEl('sparkle', 1, 'empty__spark'),
        beep, h('div', { class: 'empty__shadow' })),
      h('h2', { class: 'empty__title' }, greeting(store.state.settings.playerName || 'Traveler')),
      h('p', { class: 'empty__sub' }, "I'm Beep. Pick a quest below, or just tell me what's on your mind."),
      h('p', { class: 'empty__flavor' }, getTheme(store.state.theme).flavor),
      h('div', { class: 'starters' },
        STARTERS.map((s) => h('button', { class: 'starter px px--s', type: 'button', onClick: () => actions.send(s.prompt) }, iconEl(s.icon, 2), h('span', {}, s.text)))));
  }

  /* ---------- rendering ---------- */
  const activeConv = (s) => s.conversations.find((c) => c.id === s.activeId) || null;

  function appendMessage(msg, { animate, delay = 0 }) {
    const node = msg.role === 'user' ? userNode(msg) : botNode(msg, { animate });
    if (delay) node.style.animationDelay = `${delay}ms`;
    const dk = dayKey(msg.ts);
    const frag = document.createDocumentFragment();
    if (dk !== lastDay) { frag.append(dayDivider(msg.ts)); lastDay = dk; }
    frag.append(node);
    inner.insertBefore(frag, typingNode);   // typingNode may be null → append
    rendered.add(msg.id);
  }

  function markLast() {
    const msgs = [...inner.querySelectorAll('.msg:not(.msg--typing)')];
    msgs.forEach((m) => m.classList.remove('is-last'));
    msgs.at(-1)?.classList.add('is-last');
  }

  function fullRebuild(conv) {
    writer?.cancel(); writer = null;
    inner.replaceChildren();
    rendered.clear(); lastDay = null; typingNode = null; emptyNode = null;
    if (!conv || conv.messages.length === 0) {
      emptyNode = makeEmpty();
      inner.append(emptyNode);
    } else {
      conv.messages.forEach((m, i) => appendMessage(m, { animate: false, delay: Math.min(i, 8) * 35 }));
    }
    stick = true;
    requestAnimationFrame(() => { toBottom(); jump.hidden = true; });
  }

  function render(state, changed) {
    const conv = activeConv(state);

    const switched = (conv?.id ?? null) !== renderedId;
    const shrank = conv && conv.messages.length < rendered.size;
    if (switched || shrank) {
      renderedId = conv?.id ?? null;
      fullRebuild(conv);
      if (switched && isDesktop()) input.focus({ preventScroll: true });
    } else if (conv) {
      const fresh = conv.messages.filter((m) => !rendered.has(m.id));
      if (fresh.length) {
        if (emptyNode) { emptyNode.remove(); emptyNode = null; }
        const wasStuck = stick;
        fresh.forEach((m) => appendMessage(m, { animate: true }));
        const mine = fresh.some((m) => m.role === 'user');
        if (mine || wasStuck) { stick = true; requestAnimationFrame(() => toBottom(true)); }
        else jump.hidden = false;
      }
      if (changed.has('theme') && emptyNode) { const n = makeEmpty(); emptyNode.replaceWith(n); emptyNode = n; }
    }

    // typing indicator
    const typing = !!conv && state.ui.typingFor === conv.id;
    if (typing && !typingNode) {
      typingNode = makeTyping();
      inner.append(typingNode);
      if (stick) requestAnimationFrame(() => toBottom(true));
    } else if (!typing && typingNode) {
      typingNode.remove(); typingNode = null;
    }

    markLast();

    // header + HUD
    statusEl.textContent = typing ? 'Thinking…' : conv && conv.messages.length ? conv.title : 'Online and ready';
    const { level, xp } = levelInfo(state.stats.messages);
    hudLv.textContent = `LV ${level}`;
    hudXp.setAttribute('aria-valuenow', String(xp));
    hudXp.setAttribute('aria-valuetext', `${xp} of ${XP_PER_LEVEL} to next level`);
    [...hudXp.children].forEach((el, i) => el.classList.toggle('on', i < xp));

    syncSend();
  }

  /* ---------- composer ---------- */
  function resize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  }
  function syncSend() {
    sendBtn.disabled = !input.value.trim() || !!store.state.ui.typingFor;
  }
  function submit() {
    const text = input.value.trim();
    if (!text || store.state.ui.typingFor) return;
    burstAt(sendBtn);
    input.value = '';
    resize();
    syncSend();
    actions.send(text);
  }

  input.addEventListener('input', () => { resize(); syncSend(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  store.subscribe((state, changed) => {
    if (changed.has('conversations') || changed.has('activeId') || changed.has('ui') || changed.has('stats') || changed.has('theme')) render(state, changed);
  });
  render(store.state, new Set());

  return { focus: () => input.focus(), render: () => render(store.state, new Set()) };
}
