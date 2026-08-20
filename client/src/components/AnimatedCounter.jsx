import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

/**
 * Animates a number counting up from 0 to `value` once it scrolls into view.
 * Accepts values like "10K+", "500+", "99%" — parses the leading number,
 * animates that, then re-appends whatever suffix followed it.
 */
export default function AnimatedCounter({ value, duration = 1.5, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState('0')

  const match = String(value).match(/^([\d,.]+)(.*)$/)
  const numericPart = match ? parseFloat(match[1].replace(/,/g, '')) : 0
  const suffix = match ? match[2] : ''

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })

  useEffect(() => {
    if (isInView) motionValue.set(numericPart)
  }, [isInView, numericPart, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplay(Math.round(latest).toLocaleString())
    })
    return unsubscribe
  }, [springValue])

  return (
    <span ref={ref} className={className}>
      {display}{suffix}
    </span>
  )
}
