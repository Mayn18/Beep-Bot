# Beep-Bot

A cozy pixel-art chat companion that lives in a little game world. This is the **frontend only**: it runs on mock replies until it's connected to the backend.

## Run it

No build step and no dependencies. Serve the folder with any static server (ES modules need `http://`, not `file://`):

```bash
python3 -m http.server 8000     # or: npx serve .
# open http://localhost:8000
```

## What's in it

- **Six switchable worlds**: Daytime Meadow, Cozy Night, Rainy Evening, Sunset Dream, Enchanted Forest, Snowy Cabin. Each has its own painted background, palette, UI skin, and ambient animation (clouds, stars and shooting stars, rain on glass, fireflies, glowing mushrooms, snowfall, chimney smoke). Switching crossfades the world; the choice is saved in `localStorage`.
- **Chat**: RPG-style dialog boxes for Beep, speech bubbles for you, typewriter replies (click to skip), typing indicator, empty state with quest starters, a level bar that fills as you chat.
- **Journal**: saved conversations with search, rename (pencil or double-click), delete (two-step), and a slide-in drawer on mobile.
- **Settings**: your name, text size, pixel size, ambient effects, animations, typewriter, sound, export / clear / reset.
- **Shortcuts**: `Enter` send, `Shift+Enter` newline, `Ctrl/Cmd+K` new chat, `/` focus the composer.
- Responsive from phone to desktop, keyboard accessible, honors `prefers-reduced-motion`.

## Structure

```
index.html
css/        tokens.css (per-world palettes) · base.css · components.css
js/
  main.js           wires everything together
  themes.js         world registry
  api/chatApi.js    ← the only file to change to connect the backend
  state/            store.js (persisted state) · actions.js (everything the UI can do)
  scene/            pixel.js (drawing toolkit) · scenes.js (paintings) · ambient.js (animation) · sceneManager.js
  ui/               chat · journal · modals · icons · sprites · toast · fx · sound · dom
  data/mockData.js  sample conversations and canned replies
```

## Connecting the backend

Edit `js/api/chatApi.js`. The UI calls one function, `sendMessage({ conversationId, messages, playerName, signal })`, and expects `{ text }` back. The file has a ready-to-adapt `fetch` example and the full contract in its header. Errors thrown there show a friendly in-world message.

To add a world: add a block in `css/tokens.css`, a painter in `scene/scenes.js`, an ambient layer in `scene/ambient.js`, and an entry in `themes.js`.

## Notes

- Fonts (Pixelify Sans, Press Start 2P) load from Google Fonts; the app falls back to a system monospace font if offline. Self-host them if you'd rather not make that request.
- Backgrounds are drawn procedurally on canvas, so there are no image assets.
