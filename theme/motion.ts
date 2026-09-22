/**
 * Shared animation tokens. Keep durations short: the app is used for quick
 * operations, so motion should confirm an action, never delay it.
 */
export const motion = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 320,
  },
  /** Delay between items of a staggered list entrance. */
  stagger: 40,
  /** Only the first N list items animate in; the rest appear instantly. */
  staggerMaxItems: 8,
  spring: {
    /** Indicators and selections (tab bar pill, chips). */
    snappy: { damping: 20, stiffness: 240, mass: 0.8 },
    /** Press feedback on cards and buttons. */
    press: { damping: 18, stiffness: 320, mass: 0.6 },
  },
  pressScale: 0.98,
} as const;
