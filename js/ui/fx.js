// Little particle bursts for satisfying interactions.

const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--glow)', '#ffffff'];

export function burst(x, y, { count = 9, spread = 46 } = {}) {
  if (document.documentElement.classList.contains('no-anim')) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'spark';
    el.style.left = `${x - 3}px`;
    el.style.top = `${y - 3}px`;
    el.style.background = COLORS[i % COLORS.length];
    document.body.append(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = spread * (0.6 + Math.random() * 0.7);
    const dx = Math.round(Math.cos(angle) * dist), dy = Math.round(Math.sin(angle) * dist) - 10;
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0 },
      ],
      { duration: 520 + Math.random() * 200, easing: 'steps(7, end)' },
    );
    anim.onfinish = () => el.remove();
  }
}

export function burstAt(el, opts) {
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, opts);
}
