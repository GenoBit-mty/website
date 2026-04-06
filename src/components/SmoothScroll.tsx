import { useEffect } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProps {
  children: React.ReactNode
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.85,
    })

    let animationFrame = 0

    function raf(time: number) {
      lenis.raf(time)
      animationFrame = requestAnimationFrame(raf)
    }

    animationFrame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animationFrame)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
