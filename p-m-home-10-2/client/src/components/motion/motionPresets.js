/**
 * Reusable Framer Motion variants.
 * Respects prefers-reduced-motion: reduce animations when user prefers reduced motion.
 */

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const pageTransition = {
  initial: (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ? {}
    : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ? {}
    : { opacity: 0, y: -4 },
  transition: { duration: (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 0 : 0.2, ease: 'easeOut' },
};

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const cardHover = {
  rest: { scale: 1, boxShadow: 'var(--shadow)' },
  hover: reduced() ? {} : { scale: 1.02, transition: { duration: 0.2 } },
  tap: reduced() ? {} : { scale: 0.99 },
};

export const listStagger = {
  animate: (useReduced = reduced()) =>
    useReduced
      ? {}
      : {
          transition: {
            staggerChildren: 0.05,
            staggerDirection: 1,
          },
        },
};

export const listItem = {
  initial: reduced() ? {} : { opacity: 0, y: 6 },
  animate: reduced() ? {} : { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

export const modalBackdrop = {
  initial: reduced() ? {} : { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: reduced() ? 0 : 0.15 },
};

export const modalPanel = {
  initial: reduced() ? {} : { opacity: 0, scale: 0.96 },
  animate: reduced() ? {} : { opacity: 1, scale: 1 },
  exit: reduced() ? {} : { opacity: 0, scale: 0.98 },
  transition: { duration: reduced() ? 0 : 0.2, ease: 'easeOut' },
};

export const buttonTap = {
  scale: reduced() ? 1 : 0.98,
  transition: { duration: 0.1 },
};
