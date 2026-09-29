import type { TargetAndTransition, Variants } from 'framer-motion'

/**
 * Shared motion vocabulary so every card, panel and list animates with the
 * same timing signature across the app.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.22, ease: EASE_OUT } },
}

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const swapVariants: Variants = {
  enter: { opacity: 0, y: 18, scale: 0.97 },
  center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: -14, scale: 0.97, transition: { duration: 0.22, ease: EASE_OUT } },
}

export const panelVariants: Variants = {
  hidden: { opacity: 0, x: 44 },
  show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE_OUT } },
  exit: { opacity: 0, x: 44, transition: { duration: 0.26, ease: EASE_OUT } },
}

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_OUT } },
}

export const whileHover: TargetAndTransition = { y: -3 }
