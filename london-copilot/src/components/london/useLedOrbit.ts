'use client'

import { useEffect, useRef } from 'react'

const ORBIT_PERIOD = 8.5
const WAITING_PERIOD = 14
const orbitSpeed = 360 / ORBIT_PERIOD
const waitingSpeed = 360 / WAITING_PERIOD

export type LedMode = 'orbit' | 'ring' | 'waiting'

export function useLedOrbit(focused: boolean, waiting = false) {
  const boxRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(0)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    let last = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      if (waiting || !focused) {
        const speed = waiting ? waitingSpeed : orbitSpeed
        angleRef.current = (angleRef.current + speed * dt) % 360
        el.style.setProperty('--angle', `${angleRef.current}deg`)
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [focused, waiting])

  const mode: LedMode = waiting ? 'waiting' : focused ? 'ring' : 'orbit'

  return { boxRef, mode }
}
