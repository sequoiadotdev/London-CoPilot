'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from '@/components/ui/map'
import type { MapOrigin } from '@/components/london/useIpLocation'

const LABEL_PATTERNS = [
  'label',
  'place',
  'poi',
  'road-label',
  'waterway-label',
  'settlement',
  'country-label',
  'state-label',
]

function isLabelLayer(id: string) {
  return LABEL_PATTERNS.some((p) => id.toLowerCase().includes(p))
}

const VIEW = { bearing: -28, pitch: 54 }

function cityZoom(city: string) {
  return city.toLowerCase() === 'london' ? 14.2 : 12.8
}

interface PremiumMapEffectsProps {
  origin: MapOrigin
  locationResolved: boolean
  queryActive?: boolean
}

export default function PremiumMapEffects({
  origin,
  locationResolved,
  queryActive = false,
}: PremiumMapEffectsProps) {
  const { map, isLoaded } = useMap()
  const originRef = useRef(origin)
  const [driftEnabled, setDriftEnabled] = useState(false)
  originRef.current = origin

  useEffect(() => {
    if (!isLoaded || !map) return

    const style = map.getStyle()
    if (!style?.layers) return

    for (const layer of style.layers) {
      if (layer.type === 'symbol' && isLabelLayer(layer.id)) {
        try {
          map.setPaintProperty(layer.id, 'text-opacity', 0.35)
          map.setPaintProperty(layer.id, 'icon-opacity', 0.25)
        } catch {
          /* skip unsupported layers */
        }
      }

      if (layer.id.includes('waterway') && layer.type === 'line') {
        try {
          map.setPaintProperty(layer.id, 'line-opacity', 0.35)
        } catch {
          /* skip */
        }
      }

      if (layer.id.includes('water') && layer.type === 'fill') {
        try {
          map.setPaintProperty(layer.id, 'fill-color', '#0a1018')
        } catch {
          /* skip */
        }
      }
    }

    try {
      map.setLayoutProperty('building', 'visibility', 'none')
      map.setLayoutProperty('building-top', 'visibility', 'none')
    } catch {
      /* skip */
    }

    if (!map.getLayer('buildings-3d-premium')) {
      const beforeLayer = style.layers.find((l) => l.type === 'symbol')?.id

      map.addLayer(
        {
          id: 'buildings-3d-premium',
          source: 'carto',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
              0,
              '#141419',
              30,
              '#1a1a22',
              80,
              '#22222c',
              150,
              '#2a2a36',
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13,
              0,
              13.5,
              ['*', ['coalesce', ['get', 'render_height'], ['get', 'height'], 12], 0.85],
              16,
              ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
            ],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.92,
          },
        },
        beforeLayer,
      )
    }

    return () => {
      try {
        if (map.getLayer('buildings-3d-premium')) {
          map.removeLayer('buildings-3d-premium')
        }
        map.setLayoutProperty('building', 'visibility', 'visible')
        map.setLayoutProperty('building-top', 'visibility', 'visible')
      } catch {
        /* map may already be destroyed */
      }
    }
  }, [map, isLoaded])

  useEffect(() => {
    if (!isLoaded || !map || !locationResolved || queryActive) return

    setDriftEnabled(false)
    map.flyTo({
      center: [origin.lng, origin.lat],
      zoom: cityZoom(origin.city),
      bearing: VIEW.bearing,
      pitch: VIEW.pitch,
      duration: 2200,
      essential: true,
    })

    const timer = setTimeout(() => setDriftEnabled(true), 2400)
    return () => clearTimeout(timer)
  }, [map, isLoaded, locationResolved, origin.city, origin.lat, origin.lng, queryActive])

  useEffect(() => {
    if (!isLoaded || !map || !driftEnabled || queryActive) return

    let frame = 0
    const start = performance.now()

    const drift = (now: number) => {
      const { lng, lat, city } = originRef.current
      const elapsed = (now - start) / 1000
      const angle = elapsed * 0.08

      map.jumpTo({
        center: [
          lng + Math.sin(angle) * 0.007,
          lat + Math.cos(angle * 0.85) * 0.004,
        ],
        bearing: VIEW.bearing + Math.sin(angle * 0.6) * 6,
        pitch: VIEW.pitch + Math.sin(angle * 0.45) * 2,
        zoom: cityZoom(city),
      })

      frame = requestAnimationFrame(drift)
    }

    frame = requestAnimationFrame(drift)

    return () => cancelAnimationFrame(frame)
  }, [map, isLoaded, driftEnabled, queryActive])

  return null
}
