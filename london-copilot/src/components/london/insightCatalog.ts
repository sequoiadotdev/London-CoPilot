import type { LucideIcon } from 'lucide-react'
import {
  Accessibility,
  HardHat,
  GraduationCap,
  Shield,
  Sparkles,
  TrainFront,
  Trees,
  TrendingUp,
  UtensilsCrossed,
  Wind,
} from 'lucide-react'
import type { HousingFacts } from '@contract/query.types'

export interface InsightTheme {
  icon: LucideIcon
  accent: string
  accentSoft: string
  accentBorder: string
}

export const INSIGHT_THEME: Record<string, InsightTheme> = {
  tfl: {
    icon: TrainFront,
    accent: '#4DA3FF',
    accentSoft: 'rgba(77, 163, 255, 0.12)',
    accentBorder: 'rgba(77, 163, 255, 0.35)',
  },
  crime: {
    icon: Shield,
    accent: '#F87171',
    accentSoft: 'rgba(248, 113, 113, 0.12)',
    accentBorder: 'rgba(248, 113, 113, 0.35)',
  },
  'green-space': {
    icon: Trees,
    accent: '#4ADE80',
    accentSoft: 'rgba(74, 222, 128, 0.12)',
    accentBorder: 'rgba(74, 222, 128, 0.35)',
  },
  'air-quality': {
    icon: Wind,
    accent: '#FBBF24',
    accentSoft: 'rgba(251, 191, 36, 0.12)',
    accentBorder: 'rgba(251, 191, 36, 0.35)',
  },
  restaurants: {
    icon: UtensilsCrossed,
    accent: '#FB7185',
    accentSoft: 'rgba(251, 113, 133, 0.12)',
    accentBorder: 'rgba(251, 113, 133, 0.35)',
  },
  schools: {
    icon: GraduationCap,
    accent: '#A78BFA',
    accentSoft: 'rgba(167, 139, 250, 0.12)',
    accentBorder: 'rgba(167, 139, 250, 0.35)',
  },
  accessibility: {
    icon: Accessibility,
    accent: '#60A5FA',
    accentSoft: 'rgba(96, 165, 250, 0.12)',
    accentBorder: 'rgba(96, 165, 250, 0.35)',
  },
  planning: {
    icon: HardHat,
    accent: '#A8A29E',
    accentSoft: 'rgba(168, 162, 158, 0.12)',
    accentBorder: 'rgba(168, 162, 158, 0.35)',
  },
  'property-prices': {
    icon: TrendingUp,
    accent: '#34D399',
    accentSoft: 'rgba(52, 211, 153, 0.12)',
    accentBorder: 'rgba(34, 211, 153, 0.35)',
  },
  'hidden-gems': {
    icon: Sparkles,
    accent: '#FDE047',
    accentSoft: 'rgba(253, 224, 71, 0.12)',
    accentBorder: 'rgba(253, 224, 71, 0.35)',
  },
}

export function insightTheme(id: string): InsightTheme {
  return (
    INSIGHT_THEME[id] ?? {
      icon: Sparkles,
      accent: '#fdfbd4',
      accentSoft: 'rgba(253, 251, 212, 0.1)',
      accentBorder: 'rgba(253, 251, 212, 0.25)',
    }
  )
}

/** Human-readable detail lines for expanded insight cards */
export function insightDetailLines(
  insightId: string,
  facts: HousingFacts | null | undefined,
): string[] {
  if (!facts) return []

  switch (insightId) {
    case 'tfl':
      return facts.nearbyStations?.length
        ? facts.nearbyStations.map(s => `Near ${s}`)
        : []
    case 'crime':
      return facts.crimeCount != null ? [`${facts.crimeCount} incidents in the last 12 months (1km)`] : []
    case 'green-space':
      return facts.parkCount != null && facts.parkCount > 0
        ? [`${facts.parkCount} park${facts.parkCount === 1 ? '' : 's'} within 1km`]
        : []
    case 'air-quality':
      return [
        facts.aqi != null ? `AQI ${Math.round(facts.aqi)}` : null,
        facts.pm25 != null ? `PM2.5 ${facts.pm25.toFixed(1)} µg/m³` : null,
      ].filter((x): x is string => x != null)
    case 'restaurants':
      return facts.sampleRestaurants?.length
        ? facts.sampleRestaurants.map(name => name)
        : facts.restaurantCount != null && facts.restaurantCount > 0
          ? [`${facts.restaurantCount} places within 800m`]
          : []
    case 'schools':
      return facts.schoolCount != null && facts.schoolCount > 0
        ? [`${facts.schoolCount} school${facts.schoolCount === 1 ? '' : 's'} within 1.5km`]
        : []
    case 'accessibility':
      return facts.stepFreeCount != null && facts.stationCount != null
        ? [`${facts.stepFreeCount} of ${facts.stationCount} nearby stops step-free`]
        : []
    case 'planning':
      return facts.constructionSites != null && facts.constructionSites > 0
        ? [`${facts.constructionSites} active site${facts.constructionSites === 1 ? '' : 's'} within 500m`]
        : []
    case 'hidden-gems':
      return facts.hiddenGems ?? []
    default:
      return []
  }
}

export function scoreColor(ratio: number): string {
  if (ratio >= 0.75) return '#fdfbd4'
  if (ratio >= 0.5) return 'rgba(253, 251, 212, 0.75)'
  if (ratio >= 0.35) return '#FBBF24'
  return '#F87171'
}
