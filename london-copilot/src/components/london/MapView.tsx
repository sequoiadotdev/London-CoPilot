'use client'

import { useEffect } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapRoute,
  useMap,
} from '@/components/ui/map'

export interface MapPin {
  lng: number
  lat: number
  label: string
  color?: string
}

interface MapViewProps {
  pins?: MapPin[]
  center?: [number, number]
  zoom?: number
  /** When false (hero state), dims all text/label layers so the map reads as atmosphere */
  activeQuery?: boolean
  /** Optional GeoJSON route line coordinates */
  routeCoordinates?: [number, number][]
}

const LONDON_CENTER: [number, number] = [-0.1276, 51.5074]

// Carto dark-matter style — streets + labels, suitable for city/location context
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Label layer id patterns to dim in hero (inactive) state
const LABEL_PATTERNS = [
  'label', 'place', 'poi', 'road-label', 'waterway-label', 'airport-label',
  'settlement', 'country-label', 'state-label', 'natural-point-label',
]
function isLabelLayer(id: string) {
  return LABEL_PATTERNS.some(p => id.toLowerCase().includes(p))
}
function dimLabels(map: ReturnType<typeof useMap>['map'], dim: boolean) {
  if (!map) return
  const opacity = dim ? 0.15 : 0.85
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (!isLabelLayer(layer.id)) continue
    if (layer.type === 'symbol') {
      try { map.setPaintProperty(layer.id, 'text-opacity', opacity) } catch { /* skip */ }
      try { map.setPaintProperty(layer.id, 'icon-opacity', opacity) } catch { /* skip */ }
    }
  }
}

// ─── MapEffects ──────────────────────────────────────────────────────────────
// Child that uses useMap() to access the MapLibre instance for imperative ops.
interface MapEffectsProps {
  pins: MapPin[]
  activeQuery: boolean
  center?: [number, number]
  zoom?: number
}

function MapEffects({ pins, activeQuery, center, zoom }: MapEffectsProps) {
  const { map, isLoaded } = useMap()

  // Dim/restore labels whenever style loads or activeQuery toggles
  useEffect(() => {
    if (!isLoaded || !map) return
    dimLabels(map, !activeQuery)
  }, [map, isLoaded, activeQuery])

  // Fly to pins or center whenever pin list changes
  useEffect(() => {
    if (!isLoaded || !map) return

    if (pins.length === 0) {
      if (center) {
        map.flyTo({ center, zoom: zoom ?? 11, duration: 1000 })
      }
      return
    }

    if (pins.length === 1) {
      const pin = pins[0]
      if (!pin) return
      map.flyTo({ center: [pin.lng, pin.lat], zoom: 14, duration: 1000 })
      return
    }

    // Multiple pins — fit bounds
    const lngs = pins.map(p => p.lng)
    const lats = pins.map(p => p.lat)
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, maxZoom: 14, duration: 1000 },
    )
  }, [map, isLoaded, pins, center, zoom])

  return null
}

// ─── MapView ─────────────────────────────────────────────────────────────────
export default function MapView({
  pins = [],
  center,
  zoom = 11,
  activeQuery = false,
  routeCoordinates,
}: MapViewProps) {
  return (
    <div className="size-full" role="img" aria-label="London map">
      <Map
        center={center ?? LONDON_CENTER}
        zoom={zoom}
        theme="dark"
        styles={{ dark: DARK_STYLE, light: DARK_STYLE }}
        className="size-full"
        renderWorldCopies={false}
      >
        <MapControls position="bottom-right" showZoom showCompass={false} />

        {/* Imperative effects: label dimming + fly-to */}
        <MapEffects
          pins={pins}
          activeQuery={activeQuery}
          center={center}
          zoom={zoom}
        />

        {/* Route line (shown when a route answer is active) */}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <MapRoute
            coordinates={routeCoordinates}
            color="#7eb8e5"
            width={3}
            opacity={0.85}
            interactive={false}
          />
        )}

        {/* Pin markers */}
        {pins.map((pin, i) => (
          <MapMarker
            key={`${pin.lng}-${pin.lat}-${i}`}
            longitude={pin.lng}
            latitude={pin.lat}
          >
            <MarkerContent>
              <div
                className="size-3 rounded-full border-2 border-white/90 shadow-lg cursor-pointer"
                style={{
                  background: pin.color ?? '#e5c97e',
                  boxShadow: `0 0 0 4px ${pin.color ?? '#e5c97e'}33`,
                }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <span className="font-medium">{i + 1}. {pin.label}</span>
            </MarkerTooltip>
          </MapMarker>
        ))}
      </Map>
    </div>
  )
}
