'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'

const INACTIVITY_MS = 12_000

interface UseMapInactivityOptions {
  map: MapLibreMap | null
  isLoaded: boolean
  enabled: boolean
  home: { lat: number; lng: number }
  onReset: () => void
}

/** Pause auto-orbit while the user pans; fly home after idle. */
export function useMapInactivity({
  map,
  isLoaded,
  enabled,
  home,
  onReset,
}: UseMapInactivityOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userActiveRef = useRef(false)
  const onResetRef = useRef(onReset)
  onResetRef.current = onReset

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleReset = () => {
    clearTimer()
    if (!enabled) return
    timerRef.current = setTimeout(() => {
      userActiveRef.current = false
      onResetRef.current()
      map?.flyTo({
        center: [home.lng, home.lat],
        zoom: 13.2,
        bearing: -28,
        pitch: 54,
        duration: 1600,
        essential: true,
      })
    }, INACTIVITY_MS)
  }

  useEffect(() => {
    if (!map || !isLoaded || !enabled) {
      clearTimer()
      return
    }

    const onInteract = () => {
      userActiveRef.current = true
      scheduleReset()
    }

    map.on('dragstart', onInteract)
    map.on('zoomstart', onInteract)
    map.on('rotatestart', onInteract)
    map.on('pitchstart', onInteract)

    return () => {
      clearTimer()
      map.off('dragstart', onInteract)
      map.off('zoomstart', onInteract)
      map.off('rotatestart', onInteract)
      map.off('pitchstart', onInteract)
    }
  }, [map, isLoaded, enabled, home.lat, home.lng])

  return { userActiveRef, scheduleReset, clearTimer }
}

export function useOrbitPaused(userActiveRef: RefObject<boolean>) {
  return () => userActiveRef.current
}
