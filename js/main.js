// Beep-Bot frontend entry point: wires the store, scene, and views together.

import { createStore } from './state/store.js';
import { createActions } from './state/actions.js';
import { SceneManager } from './scene/sceneManager.js';
import { createChat } from './ui/chat.js';
import { createJournal } from './ui/journal.js';
import { openWorldPicker, openSettings } from './ui/modals.js';
import { hydrateIcons, setIcon } from './ui/icons.js';
import { hydrateSprites } from './ui/sprites.js';
import { setSoundEnabled } from './ui/sound.js';
import { getTheme } from './themes.js';
import { $ } from './ui/dom.js';

const store = createStore();
const actions = createActions(store);
const root = document.documentElement;

hydrateIcons();
hydrateSprites();
setIcon($('#decor-chat'), 'sparkle', 3);

/* The world (canvas background) */
const scene = new SceneManager($('#scene'));

/* Place a little decoration above the journal as well */
const decorJournal = document.createElement('span');
decorJournal.className = 'decor decor--journal';
decorJournal.setAttribute('aria-hidden', 'true');
setIcon(decorJournal, 'heart', 3);
$('#journal').append(decorJournal);

function applyTheme(first = false) {
  const t = getTheme(store.state.theme);
  if (!first) {
    root.classList.add('theming');
    clearTimeout(applyTheme.timer);
    applyTheme.timer = setTimeout(() => root.classList.remove('theming'), 1100);
  }
  root.dataset.theme = t.id;
  $('#meta-theme-color')?.setAttribute('content', t.chrome);
  $('#world-name').textContent = t.name;
  setIcon($('#world-icon'), t.icon, 3);
  scene.setTheme(t.id, { instant: first });
}

function applySettings() {
  const s = store.state.settings;
  root.dataset.text = s.textSize;
  root.classList.toggle('no-anim', !s.animations);
  setSoundEnabled(s.sound);
  scene.setAmbient(s.ambient);
  scene.setPixelSize(s.pixelSize);
}

scene.ambientOn = store.state.settings.ambient;
scene.sizeKey = store.state.settings.pixelSize;
applyTheme(true);
applySettings();

createChat({ store, actions });
createJournal({ store, actions });

store.subscribe((state, changed) => {
  if (changed.has('theme')) applyTheme();
  if (changed.has('settings')) applySettings();
});

$('#btn-world').addEventListener('click', () => openWorldPicker({ store, actions }));
$('#btn-settings').addEventListener('click', () => openSettings({ store, actions }));

/* Keyboard shortcuts: Ctrl/Cmd+K → new chat, "/" → focus the composer */
document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); actions.newChat(); $('#composer-input').focus(); }
  else if (e.key === '/' && !typing && !document.querySelector('.modal')) { e.preventDefault(); $('#composer-input').focus(); }
});

// First meaningful paint is done: allow entrance animations from now on.
requestAnimationFrame(() => root.classList.add('ready'));
