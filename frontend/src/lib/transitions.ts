import { useReducedMotion } from 'motion/react';

export { useReducedMotion };

/** Duration constants (milliseconds, mapped to --duration-* CSS tokens) */
const DURATION = {
  instant: 100,     // --duration-instant
  fast: 150,        // --duration-fast
  normal: 200,      // --duration-normal
  slow: 300,        // --duration-slow
} as const;

/** Easing functions (mapped to --ease-* CSS tokens) */
const EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',     // --ease-standard
  enter: 'cubic-bezier(0, 0, 0.2, 1)',          // --ease-enter
  exit: 'cubic-bezier(0.4, 0, 1, 1)',           // --ease-exit
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // --ease-spring
} as const;

// Primary page navigation (200ms standard ease)
export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.normal, ease: EASING.standard },
};

// Dialog/modal (150ms exit ease for snappy close)
export const modalEnter = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: DURATION.fast, ease: EASING.exit },
};

// Bottom sheet slide from mobile footer (300ms slow ease for drawer feel)
export const bottomSheetEnter = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
  transition: { duration: DURATION.slow, ease: EASING.exit },
};

// List stagger sequencing (50ms offset)
export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.05 } },
};

// Fade + slide for list items and expandable sections (200ms)
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.normal },
};

// Slide in from right (chart expansion, sidebar close animations)
export const slideInRight = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 32 },
  transition: { duration: DURATION.normal, ease: EASING.standard },
};

// Slide in from left (menu open, drawer animations)
export const slideInLeft = {
  initial: { opacity: 0, x: -32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
  transition: { duration: DURATION.normal, ease: EASING.standard },
};

// Scale in for popovers and FAB elements (200ms standard)
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: DURATION.normal, ease: EASING.standard },
};

// Spring bounce for confirmations and success states (spring ease)
export const springBounce = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: DURATION.normal, ease: EASING.spring },
};

// Simple fade in/out for overlays and backdrops
export const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.normal },
};

// List item stagger-ready preset for transaction history rows
export const listItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: DURATION.normal, ease: EASING.standard },
};
