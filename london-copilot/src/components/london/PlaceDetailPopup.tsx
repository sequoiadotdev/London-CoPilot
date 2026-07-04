'use client'

import { Star } from 'lucide-react'
import { insightTheme } from '@/components/london/insightCatalog'
import type { PlaceFocus } from '@/components/london/placeFocus'
import { sentimentLabel } from '@/components/london/placeFocus'
import { glassPanel } from '@/components/london/glassStyles'
import { LED_CREAM } from '@/components/london/londonTheme'
import { cn } from '@/lib/utils'

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5

  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half)
        return (
          <Star
            key={i}
            className={cn('shrink-0', filled ? 'fill-current' : 'fill-none opacity-30')}
            style={{
              width: size,
              height: size,
              color: filled ? LED_CREAM : 'rgba(255,255,255,0.35)',
            }}
            strokeWidth={1.5}
          />
        )
      })}
    </div>
  )
}

interface PlaceDetailPopupProps {
  place: PlaceFocus
  loading?: boolean
}

export default function PlaceDetailPopup({ place, loading }: PlaceDetailPopupProps) {
  const theme = place.insightId ? insightTheme(place.insightId) : null
  const Icon = theme?.icon
  const accent = place.accent ?? theme?.accent ?? LED_CREAM
  const rating = place.rating ?? (place.score != null ? (place.score / (place.outOf ?? 10)) * 5 : null)
  const sentiment =
    place.score != null ? sentimentLabel(place.score, place.outOf ?? 10) : null

  return (
    <div
      className={cn(
        'pointer-events-auto w-[min(300px,calc(100vw-2.5rem))] overflow-hidden',
        glassPanel,
      )}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: theme?.accentBorder,
                backgroundColor: theme?.accentSoft,
                color: accent,
              }}
            >
              <Icon className="size-4" strokeWidth={2.2} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {place.category ?? 'Location'}
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-white/95">{place.label}</p>
            {rating != null ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StarRating value={rating} />
                <span className="text-xs font-medium tabular-nums text-white/75">
                  {rating.toFixed(1)}
                </span>
                {place.reviewCount != null ? (
                  <span className="text-[10px] text-white/35">
                    · {place.reviewCount} {place.reviewCount === 1 ? 'note' : 'notes'}
                  </span>
                ) : null}
              </div>
            ) : null}
            {sentiment ? (
              <p className="mt-1 text-[10px] text-white/45">{sentiment}</p>
            ) : null}
          </div>
        </div>

        {place.summary ? (
          <p className="mt-2.5 text-xs leading-relaxed text-white/55">{place.summary}</p>
        ) : null}

        {place.detailLines && place.detailLines.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {place.detailLines.map(line => (
              <li
                key={line}
                className="rounded-md border px-2 py-0.5 text-[10px] text-white/50"
                style={{
                  borderColor: theme?.accentBorder ?? 'rgba(255,255,255,0.08)',
                  backgroundColor: theme?.accentSoft ?? 'rgba(255,255,255,0.04)',
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {(place.reviews?.length ?? 0) > 0 ? (
        <div className="max-h-36 space-y-2 overflow-y-auto border-t border-white/[0.06] bg-black/20 px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            What people say
          </p>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-2 w-full animate-pulse rounded bg-white/10" />
              <div className="h-2 w-4/5 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            place.reviews!.map((review, i) => (
              <blockquote
                key={`${review.text.slice(0, 24)}-${i}`}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
              >
                {review.rating != null ? (
                  <StarRating value={review.rating} size={10} />
                ) : null}
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{review.text}</p>
                {review.author ? (
                  <footer className="mt-1 text-[9px] text-white/28">— {review.author}</footer>
                ) : null}
              </blockquote>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
