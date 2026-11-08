// Everything the UI can *do*. Views call these; they never touch storage or the API directly.

import { uid } from '../ui/dom.js';
import { sendMessage } from '../api/chatApi.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../ui/sound.js';

export const XP_PER_LEVEL = 5;
export const levelInfo = (count) => ({ level: 1 + Math.floor(count / XP_PER_LEVEL), xp: count % XP_PER_LEVEL });

const titleFrom = (text) => {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 34 ? `${t.slice(0, 33).trimEnd()}…` : t || 'New chat';
};

export function createActions(store) {
  let controller = null;
  const conv = (id) => store.state.conversations.find((c) => c.id === id);
  const update = (id, fn) =>
    store.set({ conversations: store.state.conversations.map((c) => (c.id === id ? fn(c) : c)) });

  const actions = {
    newChat() {
      const active = conv(store.state.activeId);
      if (active && active.messages.length === 0) { store.ui({ journalOpen: false }); return active.id; }
      const now = Date.now();
      const c = { id: uid(), title: 'New chat', createdAt: now, updatedAt: now, messages: [] };
      store.set({ conversations: [c, ...store.state.conversations], activeId: c.id });
      store.ui({ journalOpen: false, search: '' });
      return c.id;
    },

    selectChat(id) {
      if (!conv(id)) return;
      store.set({ activeId: id });
      store.ui({ journalOpen: false });
    },

    deleteChat(id) {
      const rest = store.state.conversations.filter((c) => c.id !== id);
      const patch = { conversations: rest };
      if (store.state.activeId === id) patch.activeId = rest[0]?.id ?? null;
      store.set(patch);
      if (store.state.ui.typingFor === id) { controller?.abort(); store.ui({ typingFor: null }); }
      toast('Chat deleted', { icon: 'trash' });
    },

    renameChat(id, title) {
      const t = title.trim();
      if (!t) return;
      update(id, (c) => ({ ...c, title: t.slice(0, 60) }));
    },

    async send(text) {
      text = text.trim();
      if (!text || store.state.ui.typingFor) return;

      let id = store.state.activeId;
      if (!id || !conv(id)) id = actions.newChat();
      const before = conv(id);
      const isFirst = before.messages.length === 0;

      const userMsg = { id: uid(), role: 'user', text, ts: Date.now() };
      update(id, (c) => ({ ...c, title: isFirst ? titleFrom(text) : c.title, updatedAt: userMsg.ts, messages: [...c.messages, userMsg] }));
      sfx.send();

      const prev = store.state.stats.messages;
      const next = prev + 1;
      store.set({ stats: { messages: next } });
      if (levelInfo(next).level > levelInfo(prev).level) {
        setTimeout(() => {
          toast(`Beep reached level ${levelInfo(next).level}!`, { icon: 'star', variant: 'level', duration: 3200 });
          sfx.level();
        }, 900);
      }

      store.ui({ typingFor: id });
      controller = new AbortController();
      let replyText;
      let failed = false;
      try {
        const history = conv(id).messages.map((m) => ({ role: m.role, text: m.text }));
        const res = await sendMessage({
          conversationId: id, messages: history, playerName: store.state.settings.playerName, signal: controller.signal,
        });
        replyText = res.text;
      } catch (err) {
        if (err.name === 'AbortError') return;
        failed = true;
        replyText = "My signal got scrambled and I couldn't answer that one. Check your connection, then send it again.";
      }

      if (!conv(id)) { store.ui({ typingFor: null }); return; }   // chat deleted while thinking
      const botMsg = { id: uid(), role: 'bot', text: replyText, ts: Date.now(), ...(failed ? { error: true } : {}) };
      store.ui({ typingFor: null });
      update(id, (c) => ({ ...c, updatedAt: botMsg.ts, messages: [...c.messages, botMsg] }));
    },

    setTheme(id) {
      if (id === store.state.theme) return;
      store.set({ theme: id });
      sfx.swap();
    },

    updateSettings(patch) {
      store.set({ settings: { ...store.state.settings, ...patch } });
    },

    clearChats() {
      controller?.abort();
      store.set({ conversations: [], activeId: null });
      store.ui({ typingFor: null });
      toast('All chats cleared', { icon: 'trash' });
    },

    exportChats() {
      const data = { exportedAt: new Date().toISOString(), app: 'beep-bot', conversations: store.state.conversations };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `beep-bot-chats-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Chats exported', { icon: 'check' });
    },

    resetAll() {
      store.resetAll();
      location.reload();
    },
  };
  return actions;
}
