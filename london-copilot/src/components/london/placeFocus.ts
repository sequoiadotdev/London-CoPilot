import type { HousingFacts, HousingInsight, MapPin } from '@contract/query.types'
import { insightDetailLines, insightTheme } from '@/components/london/insightCatalog'

export interface PlaceReview {
  text: string
  rating?: number
  author?: string
}

export interface PlaceFocus {
  lat: number
  lng: number
  label: string
  insightId?: string
  category?: string
  kind?: MapPin['kind']
  score?: number | null
  outOf?: number
  summary?: string
  detailLines?: string[]
  /** 0–5 stars */
  rating?: number | null
  reviewCount?: number | null
  reviews?: PlaceReview[]
  accent?: string
}

export function scoreToStars(score: number, outOf = 10): number {
  return Math.round((score / outOf) * 5 * 2) / 2
}

export function sentimentLabel(score: number, outOf = 10): string {
  const ratio = score / outOf
  if (ratio >= 0.75) return 'Generally positive'
  if (ratio >= 0.5) return 'Mixed reviews'
  return 'Some concerns noted'
}

/** Insight-driven popup when user taps a neighbourhood score row */
export function buildPlaceFocusFromInsight(
  insight: HousingInsight,
  pins: MapPin[],
  facts: HousingFacts | null | undefined,
  resolvePin: (id: string, pins: MapPin[]) => MapPin | null,
): PlaceFocus | null {
  const pin = resolvePin(insight.id, pins)
  if (!pin) return null

  const theme = insightTheme(insight.id)
  const details = insightDetailLines(insight.id, facts)
  const score = insight.score ?? undefined

  const reviews: PlaceReview[] = []
  if (insight.summary) {
    const sentences = insight.summary.split(/(?<=[.!])\s+/).filter(s => s.length > 12)
    sentences.slice(0, 3).forEach((text, i) => {
      reviews.push({
        text: text.trim(),
        rating: score != null ? scoreToStars(score, insight.outOf ?? 10) : undefined,
        author: i === 0 ? 'Area summary' : 'Local data',
      })
    })
  }

  return {
    lat: pin.lat,
    lng: pin.lng,
    label: insight.label,
    insightId: insight.id,
    category: insight.label,
    kind: pin.kind,
    score: insight.score,
    outOf: insight.outOf ?? 10,
    summary: insight.summary,
    detailLines: details,
    rating: score != null ? scoreToStars(score, insight.outOf ?? 10) : null,
    reviewCount: reviews.length > 0 ? reviews.length : null,
    reviews,
    accent: theme.accent,
  }
}

export function buildPlaceFocusFromPin(pin: MapPin): PlaceFocus {
  return {
    lat: pin.lat,
    lng: pin.lng,
    label: pin.label,
    kind: pin.kind,
    category:
      pin.kind === 'transit'
        ? 'Transit'
        : pin.kind === 'poi'
          ? 'Place'
          : pin.kind === 'property'
            ? 'Area'
            : 'Location',
  }
}

export function resolveInsightPin(insightId: string, pins: MapPin[]): MapPin | null {
  const hint: Record<string, MapPin['kind'] | 'transit-first' | 'poi-first'> = {
    tfl: 'transit-first',
    accessibility: 'transit-first',
    crime: 'property',
    'green-space': 'poi-first',
    restaurants: 'poi-first',
    schools: 'property',
    'air-quality': 'property',
    planning: 'poi-first',
    'property-prices': 'property',
    'hidden-gems': 'poi-first',
  }

  const h = hint[insightId]
  if (!h || pins.length === 0) return pins[0] ?? null

  if (h === 'transit-first') return pins.find(p => p.kind === 'transit') ?? pins[0] ?? null
  if (h === 'poi-first') return pins.find(p => p.kind === 'poi') ?? pins[0] ?? null
  return pins.find(p => p.kind === h) ?? pins[0] ?? null
}
