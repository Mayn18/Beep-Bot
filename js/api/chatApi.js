// ===========================================================================
//  CHAT API ADAPTER: the one file to change when connecting the real backend.
//
//  The UI only ever calls `sendMessage()` below. It does not know or care
//  where replies come from. Today it returns canned, keyword-matched replies
//  after a short delay so the interface feels alive.
//
//  To connect Beep-Bot's backend, keep the same signature and return shape:
//
//    export async function sendMessage({ conversationId, messages, playerName, signal }) {
//      const res = await fetch('/api/chat', {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({ conversationId, messages }),
//        signal,
//      });
//      if (!res.ok) throw new Error(`Chat request failed (${res.status})`);
//      const data = await res.json();
//      return { text: data.reply };
//    }
//
//  Contract
//    messages : [{ role: 'user' | 'bot', text: string }]  (oldest first, includes the new message)
//    returns  : Promise<{ text: string }>
//    throws   : any Error; the UI shows a friendly message and lets the user retry.
// ===========================================================================

import { REPLIES, GREETING_REPLIES, KEYWORD_REPLIES } from '../data/mockData.js';

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
  });

let cursor = Math.floor(Math.random() * REPLIES.length);

export async function sendMessage({ messages, playerName = 'Traveler', signal }) {
  await sleep(900 + Math.random() * 1100, signal);

  const last = [...messages].reverse().find((m) => m.role === 'user')?.text || '';
  const userCount = messages.filter((m) => m.role === 'user').length;
  const fill = (s) => s.replaceAll('{name}', playerName);

  if (userCount === 1 && /^(hi|hello|hey|yo|hiya|howdy)\b/i.test(last.trim())) {
    return { text: fill(GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)]) };
  }
  for (const k of KEYWORD_REPLIES) if (k.re.test(last)) return { text: fill(k.text) };

  cursor = (cursor + 1) % REPLIES.length;
  return { text: fill(REPLIES[cursor]) };
}
