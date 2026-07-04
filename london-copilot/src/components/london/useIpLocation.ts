'use client'

import { useEffect, useState } from 'react'

export type MapOrigin = {
  lng: number
  lat: number
  city: string
}

const LONDON: MapOrigin = { lng: -0.123, lat: 51.515, city: 'London' }

export function useIpLocation() {
  const [origin, setOrigin] = useState<MapOrigin>(LONDON)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    fetch('/api/location')
      .then((r) => r.json())
      .then((data: MapOrigin) => setOrigin(data))
      .catch(() => setOrigin(LONDON))
      .finally(() => setResolved(true))
  }, [])

  return { origin, resolved }
}
