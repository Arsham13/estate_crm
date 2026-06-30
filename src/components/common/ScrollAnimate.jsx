// ScrollAnimate — انیمیشن ظاهرشدن با اسکرول بر اساس framer-motion
// جایگزین سیستم قدیمی data-animate + IntersectionObserver
import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const VARIANTS = {
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  'fade-up': { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  'fade-down': { hidden: { opacity: 0, y: -24 }, visible: { opacity: 1, y: 0 } },
  'fade-right': { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  'fade-left': { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } },
  'zoom-in': { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
}

export default function ScrollAnimate({
  type = 'fade-up', delay = 0, className = '', children, style, once = true, ...rest
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: 0.12, margin: '0px 0px -40px 0px' })
  const variant = VARIANTS[type] || VARIANTS['fade-up']
  const delaySec = Math.max(0, Math.min(delay, 600)) / 1000
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'}
      variants={variant} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: delaySec }}
      className={className} style={style} {...rest}>{children}</motion.div>
  )
}
