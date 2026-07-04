'use client'

import { useEffect, useRef } from 'react'
import { useMap, MapMarker, MarkerContent, MapPopup } from '@/components/ui/map'
import type { MapPin as ContractPin } from '@contract/query.types'
import { pinKindColor } from '@/lib/api/adaptBackendResponse'
import PlaceDetailPopup from '@/components/london/PlaceDetailPopup'
import type { PlaceFocus } from '@/components/london/placeFocus'
import { buildPlaceFocusFromPin } from '@/components/london/placeFocus'
import { useMapInactivity } from '@/components/london/useMapInactivity'
import { cn } from '@/lib/utils'
import {
  Building2,
  MapPin,
  Star,
  TrainFront,
} from 'lucide-react'

const VIEW = { bearing: -28, pitch: 56, zoom: 14.6 }
const ORBIT_DEG_PER_SEC = 8

interface QueryMapEffectsProps {
  focus: PlaceFocus | null
  queryActive: boolean
  pins?: ContractPin[]
  home: { lat: number; lng: number }
  onSelectPlace: (place: PlaceFocus | null) => void
  onUserIdle?: () => void
}

function PinIcon({ kind, highlighted }: { kind: ContractPin['kind']; highlighted: boolean }) {
  const color = pinKindColor(kind)
  const Icon =
    kind === 'transit' ? TrainFront : kind === 'poi' ? Star : kind === 'property' ? Building2 : MapPin

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2 border-white/80 shadow-lg transition-transform',
        highlighted ? 'size-9 scale-110' : 'size-7 hover:scale-105',
        'cursor-pointer',
      )}
      style={{
        backgroundColor: color,
        boxShadow: highlighted ? `0 0 20px ${color}66` : `0 0 10px ${color}44`,
      }}
    >
      <Icon className={highlighted ? 'size-4 text-black/80' : 'size-3 text-black/75'} strokeWidth={2.5} />
    </div>
  )
}

async function enrichPlaceReviews(place: PlaceFocus): Promise<PlaceFocus> {
  try {
    const res = await fetch(
      `/api/place?name=${encodeURIComponent(place.label)}&lat=${place.lat}&lng=${place.lng}`,
    )
    if (!res.ok) return place
    const data = (await res.json()) as {
      name?: string
      category?: string
      rating?: number
      reviewCount?: number
      reviews?: Array<{ text: string; rating?: number; author?: string }>
    } | null
    if (!data) return place

    const fsqReviews =
      data.reviews?.map(r => ({
        text: r.text,
        rating: r.rating != null ? Math.min(5, r.rating / 2) : undefined,
        author: r.author ?? 'Visitor',
      })) ?? []

    return {
      ...place,
      label: data.name ?? place.label,
      category: data.category ?? place.category,
      rating: data.rating != null ? Math.min(5, data.rating / 2) : place.rating,
      reviewCount: data.reviewCount ?? place.reviewCount,
      reviews: fsqReviews.length > 0 ? fsqReviews : place.reviews,
    }
  } catch {
    return place
  }
}

export default function QueryMapEffects({
  focus,
  queryActive,
  pins = [],
  home,
  onSelectPlace,
  onUserIdle,
}: QueryMapEffectsProps) {
  const { map, isLoaded } = useMap()
  const focusRef = useRef(focus)
  focusRef.current = focus
  const orbitFrameRef = useRef(0)

  const { userActiveRef, clearTimer } = useMapInactivity({
    map,
    isLoaded,
    enabled: queryActive && !!focus,
    home,
    onReset: () => {
      onUserIdle?.()
      onSelectPlace(null)
    },
  })

  useEffect(() => {
    if (!focus || !queryActive) return
    let cancelled = false
    enrichPlaceReviews(focus).then(enriched => {
      if (!cancelled && enriched.reviews !== focus.reviews) {
        onSelectPlace(enriched)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.lat, focus?.lng, focus?.label, focus?.insightId, queryActive])

  useEffect(() => {
    if (!isLoaded || !map || !queryActive || !focus) return

    map.flyTo({
      center: [focus.lng, focus.lat],
      zoom: VIEW.zoom,
      bearing: VIEW.bearing,
      pitch: VIEW.pitch,
      duration: 1400,
      essential: true,
    })

    let frame = 0
    const start = performance.now()

    const orbit = (now: number) => {
      if (userActiveRef.current) {
        frame = requestAnimationFrame(orbit)
        return
      }

      const current = focusRef.current
      if (!current) return

      const elapsed = (now - start) / 1000
      map.jumpTo({
        center: [current.lng, current.lat],
        bearing: VIEW.bearing + elapsed * ORBIT_DEG_PER_SEC,
        pitch: VIEW.pitch + Math.sin(elapsed * 0.35) * 2,
        zoom: VIEW.zoom,
      })

      frame = requestAnimationFrame(orbit)
    }

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(orbit)
    }, 1400)

    orbitFrameRef.current = frame

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [map, isLoaded, queryActive, focus?.lng, focus?.lat, focus?.label, focus?.insightId, userActiveRef, clearTimer])

  if (!queryActive || !focus) return null

  const visiblePins = pins.length > 0 ? pins : [{ lat: focus.lat, lng: focus.lng, label: focus.label, kind: 'property' as const }]

  return (
    <>
      {visiblePins.map((pin, i) => {
        const highlighted = pin.label === focus.label || (pin.lat === focus.lat && pin.lng === focus.lng)

        return (
          <MapMarker
            key={`${pin.lng}-${pin.lat}-${pin.label}-${i}`}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="center"
            onClick={() => {
              clearTimer()
              userActiveRef.current = true
              onSelectPlace(buildPlaceFocusFromPin(pin))
            }}
          >
            <MarkerContent className="pointer-events-auto">
              <PinIcon kind={pin.kind} highlighted={highlighted} />
            </MarkerContent>
          </MapMarker>
        )
      })}

      <MapPopup
        longitude={focus.lng}
        latitude={focus.lat}
        offset={[0, -28]}
        className="!border-0 !bg-transparent !p-0 !shadow-none"
        closeButton={false}
      >
        <PlaceDetailPopup place={focus} />
      </MapPopup>
    </>
  )
}
