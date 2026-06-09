export const fadeUpItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export const fadeUp = {
  initial: fadeUpItem.initial,
  animate: fadeUpItem.animate,
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
}
