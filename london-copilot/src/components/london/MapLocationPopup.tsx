'use client'

import { Star, Train, MapPin, Building2 } from 'lucide-react'
import type { MapPin as ContractPin } from '@contract/query.types'
import type { ParsedAnswer } from '@/components/london/AnswerCard'
import { pinKindColor } from '@/lib/api/adaptBackendResponse'
import { glassPanel } from '@/components/london/glassStyles'
import { LED_CREAM } from '@/components/london/londonTheme'
import { cn } from '@/lib/utils'

interface MapLocationPopupProps {
  answer: ParsedAnswer | null
  streaming?: boolean
  locationLabel?: string
  pinKind?: ContractPin['kind']
  highlighted?: boolean
}

function previewItems(answer: ParsedAnswer) {
  if (answer.type === 'housing') {
    return answer.areas.slice(0, 2).map(a => ({
      title: a.name,
      detail: a.avgRent,
    }))
  }
  if (answer.type === 'route') {
    return answer.options.slice(0, 2).map(o => ({
      title: `${o.mode} · ${o.duration}`,
      detail: o.cost,
    }))
  }
  return answer.slots.slice(0, 2).map(s => ({
    title: s.place,
    detail: `${s.time} · ${s.cost}`,
  }))
}

function kindIcon(kind?: ContractPin['kind']) {
  switch (kind) {
    case 'transit':
      return Train
    case 'poi':
      return Star
    case 'property':
      return Building2
    default:
      return MapPin
  }
}

function kindLabel(kind?: ContractPin['kind']) {
  switch (kind) {
    case 'transit':
      return 'Transit stop'
    case 'poi':
      return 'Point of interest'
    case 'property':
      return 'Area'
    case 'destination':
      return 'Destination'
    case 'origin':
      return 'Origin'
    default:
      return 'Location'
  }
}

export default function MapLocationPopup({
  answer,
  streaming,
  locationLabel,
  pinKind,
  highlighted = false,
}: MapLocationPopupProps) {
  const Icon = kindIcon(pinKind)
  const accent = pinKind ? pinKindColor(pinKind) : LED_CREAM

  return (
    <div
      className={cn(
        'pointer-events-none w-[min(268px,calc(100vw-2rem))] p-3.5 transition-all',
        glassPanel,
        highlighted && 'ring-1 ring-[rgba(253,251,212,0.22)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="size-3 shrink-0" style={{ color: accent }} />
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
              {kindLabel(pinKind)}
            </p>
          </div>
          <p className="mt-0.5 text-sm font-medium leading-snug text-white/95">
            {locationLabel ?? answer?.title ?? (streaming ? 'Looking up…' : 'Selected area')}
          </p>
        </div>
        {answer && !streaming && pinKind === 'property' ? (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-1.5 py-0.5 backdrop-blur-sm">
            <Star className="size-3 fill-[#fdfbd4] text-[#fdfbd4]" />
            <span className="text-[11px] font-medium text-white/90">4.8</span>
          </div>
        ) : null}
      </div>

      {answer?.summary ? (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/55">
          {answer.summary}
        </p>
      ) : streaming ? (
        <div className="mt-2 space-y-1.5">
          <div className="h-2 w-full animate-pulse rounded bg-white/10" />
          <div className="h-2 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
      ) : null}

      {answer && !streaming ? (
        <ul className="mt-2.5 space-y-1 border-t border-white/10 pt-2.5">
          {previewItems(answer).map(item => (
            <li key={item.title} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-white/75">{item.title}</span>
              <span className="shrink-0 text-white/40">{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
