'use client'

import { Map } from '@/components/ui/map'
import PremiumMapEffects from '@/components/london/PremiumMapEffects'
import QueryMapEffects from '@/components/london/QueryMapEffects'
import RoutingMapEffects from '@/components/london/RoutingMapEffects'
import { useIpLocation } from '@/components/london/useIpLocation'
import type { MapPin, RoutingData } from '@contract/query.types'
import type { PlaceFocus } from '@/components/london/placeFocus'

const DARK_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

interface ExperimentMapBackgroundProps {
  queryFocus?: PlaceFocus | null
  queryActive?: boolean
  routing?: RoutingData | null
  selectedRouteLeg?: number | null
  onSelectRouteLeg?: (index: number | null) => void
  pins?: MapPin[]
  onSelectPlace?: (place: PlaceFocus | null) => void
  onUserIdle?: () => void
}

export default function ExperimentMapBackground({
  queryFocus = null,
  queryActive = false,
  routing = null,
  selectedRouteLeg = null,
  onSelectRouteLeg,
  pins = [],
  onSelectPlace,
  onUserIdle,
}: ExperimentMapBackgroundProps) {
  const { origin, resolved } = useIpLocation()
  const routingActive = queryActive && !!routing

  return (
    <Map
      center={[origin.lng, origin.lat]}
      zoom={12.8}
      pitch={54}
      bearing={-28}
      theme="dark"
      styles={{ dark: DARK_STYLE, light: DARK_STYLE }}
      className="size-full"
      renderWorldCopies={false}
      dragPan
      scrollZoom
      dragRotate
      touchZoomRotate
      attributionControl={{ compact: true }}
    >
      <PremiumMapEffects
        origin={origin}
        locationResolved={resolved}
        queryActive={queryActive}
      />
      <RoutingMapEffects
        routing={routing}
        active={routingActive}
        selectedSegmentIndex={selectedRouteLeg}
        onSelectSegment={onSelectRouteLeg}
      />
      <QueryMapEffects
        focus={routingActive ? null : queryFocus}
        queryActive={queryActive && !routingActive}
        pins={pins}
        home={origin}
        onSelectPlace={onSelectPlace ?? (() => {})}
        onUserIdle={onUserIdle}
      />
    </Map>
  )
}
