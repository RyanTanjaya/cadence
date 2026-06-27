import confetti from 'canvas-confetti';

const COLORS = ['#FF6B6B', '#F4A261', '#E9C46A', '#2A9D8F', '#4D7CFE', '#7C5CFC'];

/** A tasteful two-burst celebration for closing every ring. */
export function celebrate() {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const defaults = {
    colors: COLORS,
    disableForReducedMotion: true,
    scalar: 0.95,
    ticks: 220,
  };

  confetti({ ...defaults, particleCount: 70, spread: 70, startVelocity: 42, origin: { x: 0.25, y: 0.4 } });
  confetti({ ...defaults, particleCount: 70, spread: 70, startVelocity: 42, origin: { x: 0.75, y: 0.4 } });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, spread: 100, startVelocity: 32, origin: { y: 0.3 } });
  }, 140);
}
