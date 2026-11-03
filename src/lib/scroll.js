// The two things every scroll-driven scene on the main page needs to know.

export const prefersStill = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Report how far `el` has been scrolled, 0..1. Returns a cleanup.
 *
 *   'pin'  — a tall track with a sticky stage: 0 as its top reaches the top of
 *            the screen, 1 as its bottom reaches the bottom.
 *   'pass' — an ordinary block: 0 as it enters at the foot of the screen, 1 as
 *            it leaves past the top.
 */
export function trackScroll(el, mode, report) {
  const read = () => {
    const { top, height } = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (mode === 'pin') {
      const span = height - vh;
      report(span > 0 ? clamp01(-top / span) : 0);
    } else {
      report(clamp01((vh - top) / (vh + height)));
    }
  };
  read();
  window.addEventListener('scroll', read, { passive: true });
  window.addEventListener('resize', read);
  return () => {
    window.removeEventListener('scroll', read);
    window.removeEventListener('resize', read);
  };
}
