// A tiny observable store with localStorage persistence.
// State shape:
//   theme, settings, conversations[], activeId, stats{messages}   (persisted)
//   ui{ journalOpen, typingFor, search }                           (session only)

import { sampleConversations } from '../data/mockData.js';
import { DEFAULT_THEME, THEMES } from '../themes.js';

const KEYS = {
  theme: 'beepbot:theme',
  settings: 'beepbot:settings',
  conversations: 'beepbot:chats',
  activeId: 'beepbot:active',
  stats: 'beepbot:stats',
};

export function defaultSettings() {
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return {
    ambient: !calm,
    animations: !calm,
    typewriter: !calm,
    sound: false,
    textSize: 'm',          // s | m | l
    pixelSize: 'normal',    // chunky | normal | fine
    playerName: 'Traveler',
  };
}

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
};
const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } };

export function createStore() {
  const savedTheme = (() => { try { return localStorage.getItem(KEYS.theme); } catch { return null; } })();
  const firstVisit = (() => { try { return localStorage.getItem(KEYS.conversations) == null; } catch { return true; } })();

  const conversations = firstVisit ? sampleConversations() : readJSON(KEYS.conversations, []);
  const savedActive = readJSON(KEYS.activeId, null);
  const state = {
    theme: THEMES.some((t) => t.id === savedTheme) ? savedTheme : DEFAULT_THEME,
    settings: { ...defaultSettings(), ...readJSON(KEYS.settings, {}) },
    conversations,
    activeId: conversations.some((c) => c.id === savedActive) ? savedActive : (conversations[0]?.id ?? null),
    stats: { messages: 0, ...readJSON(KEYS.stats, {}) },
    ui: { journalOpen: false, typingFor: null, search: '' },
  };
  if (firstVisit) persistAll();

  const subs = new Set();
  let saveTimer = null;
  const dirty = new Set();

  function persist(keys) {
    keys.forEach((k) => dirty.add(k));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 120);
  }
  function flush() {
    for (const k of dirty) {
      if (k === 'theme') { try { localStorage.setItem(KEYS.theme, state.theme); } catch { /* ignore */ } }
      else if (KEYS[k]) writeJSON(KEYS[k], state[k]);
    }
    dirty.clear();
  }
  function persistAll() {
    try { localStorage.setItem(KEYS.theme, state.theme); } catch { /* ignore */ }
    ['settings', 'conversations', 'activeId', 'stats'].forEach((k) => writeJSON(KEYS[k], state[k]));
  }
  window.addEventListener('pagehide', flush);

  return {
    state,
    get: () => state,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    /** Merge a patch of top-level keys, persist what needs saving, notify subscribers. */
    set(patch) {
      const changed = new Set(Object.keys(patch));
      Object.assign(state, patch);
      persist([...changed].filter((k) => k !== 'ui'));
      subs.forEach((fn) => fn(state, changed));
    },
    ui(patch) { this.set({ ui: { ...state.ui, ...patch } }); },
    flush,
    resetAll() {
      Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
    },
  };
}
