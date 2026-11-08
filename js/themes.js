// The registry of worlds. Colors for the UI live in css/tokens.css (keyed by id);
// the pixel paintings live in js/scene/scenes.js (also keyed by id).

export const THEMES = [
  {
    id: 'meadow', name: 'Daytime Meadow', icon: 'sun', chrome: '#8fd3ff',
    tagline: 'Soft clouds, clover, and a very good breeze.',
    flavor: 'The clover is soft and the sky is wide open.',
    swatches: ['#a2ddfa', '#93df80', '#ff8fab', '#fffaf0'],
  },
  {
    id: 'night', name: 'Cozy Night', icon: 'moon', chrome: '#1a1650',
    tagline: 'Big moon, small cabin, warm lights on.',
    flavor: 'The stars are out. Stay up a little longer.',
    swatches: ['#14174e', '#7d509f', '#ffd36e', '#262152'],
  },
  {
    id: 'rain', name: 'Rainy Evening', icon: 'rain', chrome: '#4b5185',
    tagline: 'A window seat, a candle, and rain on the glass.',
    flavor: 'Rain on the window, tea within reach.',
    swatches: ['#474d82', '#434f94', '#ffbb70', '#e2e5f7'],
  },
  {
    id: 'sunset', name: 'Sunset Dream', icon: 'sunset', chrome: '#ff8f6b',
    tagline: 'Peach skies melting into a quiet sea.',
    flavor: 'The tide is calm and the sky is still glowing.',
    swatches: ['#7b3f98', '#d65a8c', '#ff8f6b', '#fff1e8'],
  },
  {
    id: 'forest', name: 'Enchanted Forest', icon: 'mushroom', chrome: '#0d2f2c',
    tagline: 'Fireflies, glowing mushrooms, old green trees.',
    flavor: 'Something in the ferns is glowing. Friendly, probably.',
    swatches: ['#0f4036', '#8dfcc4', '#ff9fd6', '#173c35'],
  },
  {
    id: 'snow', name: 'Snowy Cabin', icon: 'snow', chrome: '#6b7fb8',
    tagline: 'Fresh snow, string lights, smoke from the chimney.',
    flavor: 'Snow is falling and the kettle is on.',
    swatches: ['#4a5f9f', '#f4f7ff', '#b9544f', '#ffd27a'],
  },
];

export const DEFAULT_THEME = 'meadow';
export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
