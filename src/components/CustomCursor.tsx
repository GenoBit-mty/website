import { useEffect, useState } from 'react'
import { m, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovered, setHovered] = useState(false)

  const pointerX = useMotionValue(-100)
  const pointerY = useMotionValue(-100)

  const ringX = useSpring(pointerX, { stiffness: 500, damping: 30, mass: 0.55 })
  const ringY = useSpring(pointerY, { stiffness: 500, damping: 30, mass: 0.55 })

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    setEnabled(media.matches)
    const handleMedia = (event: MediaQueryListEvent) => setEnabled(event.matches)
    media.addEventListener('change', handleMedia)
    return () => media.removeEventListener('change', handleMedia)
  }, [])

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      pointerX.set(event.clientX)
      pointerY.set(event.clientY)
    }

    const handleEnter = () => {
      document.body.classList.add('cursor-on')
    }

    const handleLeave = () => {
      document.body.classList.remove('cursor-on')
      pointerX.set(-100)
      pointerY.set(-100)
    }

    const selectors = 'a,button,[data-cursor-hover],input,textarea,select,[role="button"]'

    const onHoverStart = () => setHovered(true)
    const onHoverEnd = () => setHovered(false)

    const nodes = document.querySelectorAll<HTMLElement>(selectors)
    nodes.forEach((node) => {
      node.addEventListener('mouseenter', onHoverStart)
      node.addEventListener('mouseleave', onHoverEnd)
    })

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseenter', handleEnter)
    window.addEventListener('mouseleave', handleLeave)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseenter', handleEnter)
      window.removeEventListener('mouseleave', handleLeave)
      nodes.forEach((node) => {
        node.removeEventListener('mouseenter', onHoverStart)
        node.removeEventListener('mouseleave', onHoverEnd)
      })
      document.body.classList.remove('cursor-on')
    }
  }, [pointerX, pointerY])

  if (!enabled) return null

  return (
    <>
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed -ml-1 -mt-1 z-[1001] hidden h-2 w-2 rounded-full bg-[var(--gb-primary)] will-change-transform md:block motion-reduce:hidden print:hidden"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: hovered ? 0 : 1, opacity: hovered ? 0 : 1 }}
        transition={{ duration: 0.18 }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed -ml-[21px] -mt-[21px] z-[1000] hidden h-[42px] w-[42px] rounded-full border border-[rgba(48,219,235,0.9)] shadow-[0_0_22px_rgba(48,219,235,0.22)] will-change-transform md:block motion-reduce:hidden print:hidden"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: hovered ? 1 : 0.2, opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}
