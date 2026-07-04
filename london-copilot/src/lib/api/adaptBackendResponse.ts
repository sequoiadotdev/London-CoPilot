import type {
  ActivityData,
  DataSource,
  HousingData,
  HousingFacts,
  HousingInsight,
  MapPin,
  QueryResponse,
  RoutingData,
  Score,
} from '@contract/query.types'
import type { ParsedAnswer, ItinerarySlot } from '@/components/london/AnswerCard'
import type { MapFocus } from '@/lib/ai/parseAnswer'

export type { HousingInsight }

export interface LocationHeader {
  address: string
  shortName: string
  postcode: string | null
  lat: number
  lng: number
}

export interface StatCell {
  label: string
  value: string
  sub?: string
  score?: number
  outOf?: number
}

export interface WeatherAqStrip {
  aqi?: number | null
  pm25?: number | null
  aqScore?: number | null
  aqSummary?: string
  weather?: string | null
  tempC?: number | null
}

export interface CrimeSummary {
  crimeCount?: number | null
  safetyScore?: number | null
  summary: string
}

export interface TransportStatus {
  stations: Array<{ label: string; lat: number; lng: number }>
  disruptions: string[]
  rerouteNotice?: string | null
  durationMinutes?: number
  distanceMeters?: number
  distanceKm?: string
  preferences?: string[]
  stepFreeNote?: string
  stepBreakdown?: Array<{ mode: string; minutes: number; instruction: string }>
}

export interface NearbyPlace {
  label: string
  kind: MapPin['kind'] | 'food' | 'activity'
  lat: number
  lng: number
  category?: string
  cost?: string
}

export interface SourceConfidence {
  total: number
  ok: number
  errors: number
  partial: boolean
  failedSources: string[]
}

export interface EnrichedAnswer {
  parsed: ParsedAnswer
  intent: QueryResponse['intent']
  status: QueryResponse['status']
  summary: string
  sources: DataSource[]
  scores: Score[]
  insights: HousingInsight[]
  pins: MapPin[]
  location: LocationHeader | null
  stats: StatCell[]
  weatherAq: WeatherAqStrip | null
  crime: CrimeSummary | null
  transport: TransportStatus | null
  nearbyPlaces: NearbyPlace[]
  confidence: SourceConfidence
  rawFacts: HousingFacts | null
  routing: RoutingData | null
}

const MODE_EMOJI: Record<string, string> = {
  walk: '🚶',
  tube: '🚇',
  bus: '🚌',
  rail: '🚆',
  cycle: '🚲',
}

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return iso
  }
}

function durationMinutes(start: string, end: string) {
  try {
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`
  } catch {
    return ''
  }
}

function extractPostcode(address: string): string | null {
  const match = address.match(UK_POSTCODE)
  return match?.[1]?.toUpperCase().replace(/\s+/, ' ') ?? null
}

function shortAddress(address: string) {
  return address.split(',')[0]?.trim() || address
}

function findInsight(insights: HousingInsight[], id: string) {
  return insights.find(i => i.id === id)
}

function parseAqiFromText(text: string): { aqi?: number; pm25?: number } {
  const aqiMatch = text.match(/index\s+(\d+(?:\.\d+)?)/i)
  const pmMatch = text.match(/PM2\.5[:\s]+([\d.]+)/i)
  return {
    aqi: aqiMatch ? Number(aqiMatch[1]) : undefined,
    pm25: pmMatch ? Number(pmMatch[1]) : undefined,
  }
}

function buildConfidence(sources: DataSource[], status: QueryResponse['status']): SourceConfidence {
  const ok = sources.filter(s => s.status === 'ok').length
  const errors = sources.filter(s => s.status === 'error').length
  return {
    total: sources.length,
    ok,
    errors,
    partial: status === 'partial' || errors > 0,
    failedSources: sources.filter(s => s.status === 'error').map(s => s.name),
  }
}

function buildLocationHeader(address: string, lat: number, lng: number): LocationHeader {
  return {
    address,
    shortName: shortAddress(address),
    postcode: extractPostcode(address),
    lat,
    lng,
  }
}

function buildStatsGrid(scores: Score[], facts: HousingFacts | null): StatCell[] {
  const cells: StatCell[] = scores.map(s => ({
    label: s.label,
    value: `${s.value}/${s.outOf}`,
    score: s.value,
    outOf: s.outOf,
  }))

  if (facts?.crimeCount != null) {
    cells.push({
      label: 'Crimes (12 mo)',
      value: String(facts.crimeCount),
      sub: 'within 1km',
    })
  }
  if (facts?.restaurantCount != null && facts.restaurantCount > 0) {
    cells.push({
      label: 'Food nearby',
      value: String(facts.restaurantCount),
      sub: 'within 800m',
    })
  }
  if (facts?.parkCount != null && facts.parkCount > 0) {
    cells.push({ label: 'Parks', value: String(facts.parkCount), sub: 'within 1km' })
  }
  if (facts?.schoolCount != null && facts.schoolCount > 0) {
    cells.push({ label: 'Schools', value: String(facts.schoolCount), sub: 'within 1.5km' })
  }
  if (facts?.constructionSites != null && facts.constructionSites > 0) {
    cells.push({
      label: 'Construction',
      value: String(facts.constructionSites),
      sub: 'within 500m',
    })
  }
  if (facts?.stepFreeCount != null && facts.stationCount != null && facts.stationCount > 0) {
    const score = Math.round((facts.stepFreeCount / facts.stationCount) * 10)
    cells.push({
      label: 'Accessibility',
      value: `${score}/10`,
      sub: `${facts.stepFreeCount}/${facts.stationCount} nearby stops step-free`,
      score,
      outOf: 10,
    })
  }

  return cells
}

function accessibilityScore(facts: HousingFacts | null, scores: Score[]): number | null {
  const fromScore = scores.find(s => /access/i.test(s.label))?.value
  if (fromScore != null) return fromScore

  if (facts?.stepFreeCount == null || facts.stationCount == null || facts.stationCount <= 0) {
    return null
  }

  return Math.max(1, Math.min(10, Math.round((facts.stepFreeCount / facts.stationCount) * 10)))
}

function withAccessibilityInsight(
  insights: HousingInsight[],
  facts: HousingFacts | null,
  scores: Score[],
): HousingInsight[] {
  const score = accessibilityScore(facts, scores)
  if (score == null) return insights

  const summary =
    facts?.stepFreeCount != null && facts.stationCount != null
      ? `${facts.stepFreeCount} of ${facts.stationCount} nearby stations or stops are step-free. Good for wheelchair users, buggies, luggage, and avoiding stairs.`
      : 'Nearby transport has accessibility information available.'

  const existing = insights.find(insight => insight.id === 'accessibility')
  if (existing) {
    return insights.map(insight =>
      insight.id === 'accessibility'
        ? { ...insight, score: insight.score ?? score, outOf: insight.outOf ?? 10, summary: insight.summary || summary }
        : insight,
    )
  }

  return [
    ...insights,
    {
      id: 'accessibility',
      label: 'Accessibility',
      emoji: '♿',
      summary,
      score,
      outOf: 10,
    },
  ]
}

function buildWeatherAq(
  insights: HousingInsight[],
  facts: HousingFacts | null,
  scores: Score[],
): WeatherAqStrip | null {
  const aqInsight = findInsight(insights, 'air-quality')
  const parsed = aqInsight ? parseAqiFromText(aqInsight.summary) : {}
  const aqScore = scores.find(s => s.label.toLowerCase().includes('air'))?.value ?? aqInsight?.score

  const aqi = facts?.aqi ?? parsed.aqi ?? null
  const pm25 = facts?.pm25 ?? parsed.pm25 ?? null

  if (!aqInsight && aqi == null && pm25 == null) return null

  return {
    aqi,
    pm25,
    aqScore: aqScore ?? null,
    aqSummary: aqInsight?.summary,
  }
}

function buildCrime(insights: HousingInsight[], facts: HousingFacts | null, scores: Score[]): CrimeSummary | null {
  const crimeInsight = findInsight(insights, 'crime')
  if (!crimeInsight && facts?.crimeCount == null) return null

  const safetyScore =
    scores.find(s => s.label.toLowerCase().includes('safety'))?.value ?? crimeInsight?.score ?? null

  return {
    crimeCount: facts?.crimeCount ?? null,
    safetyScore,
    summary: crimeInsight?.summary ?? 'Crime data unavailable for this area.',
  }
}

function buildTransportFromPins(pins: MapPin[], facts: HousingFacts | null): TransportStatus | null {
  const stations = pins.filter(p => p.kind === 'transit')
  if (stations.length === 0 && !facts?.nearbyStations?.length) return null

  const fromPins = stations.map(s => ({ label: s.label, lat: s.lat, lng: s.lng }))
  const fromFacts =
    facts?.nearbyStations?.map(label => ({
      label,
      lat: 0,
      lng: 0,
    })) ?? []

  const merged = fromPins.length > 0 ? fromPins : fromFacts
  if (merged.length === 0) return null

  return {
    stations: merged,
    disruptions: [],
    stepFreeNote:
      facts?.stepFreeCount != null && facts.stationCount != null
        ? `${facts.stepFreeCount}/${facts.stationCount} step-free`
        : undefined,
  }
}

function buildRoutingTransport(data: RoutingData): TransportStatus {
  return {
    stations: [],
    disruptions: data.disruptions ?? [],
    rerouteNotice: data.rerouteNotice,
    durationMinutes: data.durationMinutes,
    distanceMeters: data.distanceMeters,
    distanceKm: (data.distanceMeters / 1000).toFixed(1),
    preferences: data.preferencesApplied,
    stepBreakdown: data.steps.map(s => ({
      mode: s.mode,
      minutes: s.durationMinutes,
      instruction: s.instruction,
    })),
  }
}

function buildNearbyPlaces(
  pins: MapPin[],
  facts: HousingFacts | null,
  insights: HousingInsight[],
): NearbyPlace[] {
  const places: NearbyPlace[] = []

  for (const pin of pins) {
    if (pin.kind === 'property') continue
    places.push({
      label: pin.label,
      kind: pin.kind,
      lat: pin.lat,
      lng: pin.lng,
    })
  }

  for (const name of facts?.sampleRestaurants ?? []) {
    if (places.some(p => p.label === name)) continue
    places.push({ label: name, kind: 'food', lat: 0, lng: 0, category: 'Restaurant' })
  }

  for (const gem of facts?.hiddenGems ?? []) {
    if (places.some(p => p.label === gem)) continue
    places.push({ label: gem, kind: 'poi', lat: 0, lng: 0, category: 'Hidden gem' })
  }

  const restaurantInsight = findInsight(insights, 'restaurants')
  if (restaurantInsight && facts?.restaurantCount) {
    places.unshift({
      label: `${facts.restaurantCount} restaurants & cafés`,
      kind: 'food',
      lat: 0,
      lng: 0,
      category: restaurantInsight.summary.split('.')[0],
    })
  }

  return places.slice(0, 12)
}

function buildActivityPlaces(data: ActivityData): NearbyPlace[] {
  return data.items.map(item => ({
    label: item.name,
    kind: 'activity' as const,
    lat: item.coordinates?.lat ?? 0,
    lng: item.coordinates?.lng ?? 0,
    category: item.category,
    cost: item.costGBP > 0 ? `£${item.costGBP.toFixed(2)}` : 'Free',
  }))
}

function housingParsed(summary: string, data: HousingData): ParsedAnswer {
  const transport = data.scores.find(s => s.label.toLowerCase().includes('transport'))?.value ?? 7
  const shortName = shortAddress(data.address)

  return {
    type: 'housing',
    title: shortName,
    summary,
    areas: [
      {
        name: shortName,
        avgRent: 'Check Rightmove / Zoopla for local asking prices',
        vibe: summary,
        pros: data.scores.slice(0, 4).map(s => `${s.label}: ${s.value}/${s.outOf}`),
        transportScore: transport,
        coordinates: { lng: data.coordinates.lng, lat: data.coordinates.lat },
      },
    ],
    tip: data.scores.length
      ? data.scores.map(s => `${s.label} ${s.value}/${s.outOf}`).join(' · ')
      : 'Check gov.uk and TfL for the latest local data.',
  }
}

function routingParsed(summary: string, data: RoutingData): ParsedAnswer {
  const destLabel = data.destination.label ?? 'Destination'
  const primaryMode = [...new Set(data.steps.map(s => s.mode))].find(m => m !== 'walk') ?? 'tube'

  return {
    type: 'route',
    title: `${data.origin.label ?? 'Start'} → ${destLabel}`,
    summary,
    focus: { name: destLabel, lng: data.destination.lng, lat: data.destination.lat },
    options: [
      {
        mode: primaryMode.charAt(0).toUpperCase() + primaryMode.slice(1),
        duration: `${data.durationMinutes} min`,
        cost: 'Pay with Oyster or contactless',
        steps: data.steps.map(s => s.instruction),
        emoji: '',
      },
    ],
    tip: data.rerouteNotice ?? 'Route planned with live TfL data where available.',
  }
}

function activityParsed(summary: string, data: ActivityData): ParsedAnswer {
  const total = data.totalCostGBP ?? data.items.reduce((n, i) => n + i.costGBP, 0)
  return {
    type: 'itinerary',
    title: `${data.durationHours}h plan`,
    summary,
    slots: data.items.map(item => ({
      time: formatTime(item.startTime),
      place: item.name,
      description: item.category,
      coordinates: item.coordinates
        ? { lng: item.coordinates.lng, lat: item.coordinates.lat }
        : { lng: -0.1276, lat: 51.5074 },
      duration: durationMinutes(item.startTime, item.endTime),
      cost: item.costGBP > 0 ? `£${item.costGBP.toFixed(2)}` : 'Free',
    })),
    tip: data.items.length ? `About £${total.toFixed(0)} total` : '',
  }
}

function enrichHousing(response: QueryResponse, data: HousingData): EnrichedAnswer {
  const { intent, status, summary, sources } = response
  const facts = data.facts ?? null
  const scores = data.scores ?? []
  const insights = withAccessibilityInsight(data.insights ?? [], facts, scores)
  const pins = data.pins ?? []

  let transport = buildTransportFromPins(pins, facts)
  const tflDisruptions = sources
    .filter(s => s.id.includes('tfl') && s.status === 'error')
    .map(s => s.error ?? `${s.name} unavailable`)

  if (transport && tflDisruptions.length > 0) {
    transport = { ...transport, disruptions: tflDisruptions }
  }

  return {
    parsed: housingParsed(summary, data),
    intent,
    status,
    summary,
    sources,
    scores,
    insights,
    pins,
    location: buildLocationHeader(data.address, data.coordinates.lat, data.coordinates.lng),
    stats: buildStatsGrid(scores, facts),
    weatherAq: buildWeatherAq(insights, facts, scores),
    crime: buildCrime(insights, facts, scores),
    transport,
    nearbyPlaces: buildNearbyPlaces(pins, facts, insights),
    confidence: buildConfidence(sources, status),
    rawFacts: facts,
    routing: null,
  }
}

function enrichRouting(response: QueryResponse, data: RoutingData): EnrichedAnswer {
  const { intent, status, summary, sources } = response

  return {
    parsed: routingParsed(summary, data),
    intent,
    status,
    summary,
    sources,
    scores: [],
    insights: [],
    pins: [
      { lat: data.origin.lat, lng: data.origin.lng, label: data.origin.label ?? 'Origin', kind: 'origin' },
      {
        lat: data.destination.lat,
        lng: data.destination.lng,
        label: data.destination.label ?? 'Destination',
        kind: 'destination',
      },
    ],
    location: buildLocationHeader(
      `${data.origin.label ?? 'Start'} → ${data.destination.label ?? 'End'}`,
      data.origin.lat,
      data.origin.lng,
    ),
    stats: [
      { label: 'Duration', value: `${data.durationMinutes} min` },
      { label: 'Distance', value: `${(data.distanceMeters / 1000).toFixed(1)} km` },
      { label: 'Steps', value: String(data.steps.length) },
    ],
    weatherAq: null,
    crime: null,
    transport: buildRoutingTransport(data),
    nearbyPlaces: [],
    confidence: buildConfidence(sources, status),
    rawFacts: null,
    routing: data,
  }
}

function enrichActivity(response: QueryResponse, data: ActivityData): EnrichedAnswer {
  const { intent, status, summary, sources } = response
  const total = data.totalCostGBP ?? data.items.reduce((n, i) => n + i.costGBP, 0)
  const ctx = data.context

  return {
    parsed: activityParsed(summary, data),
    intent,
    status,
    summary,
    sources,
    scores: [],
    insights: [],
    pins: data.items
      .filter(i => i.coordinates)
      .map(i => ({
        lat: i.coordinates!.lat,
        lng: i.coordinates!.lng,
        label: i.name,
        kind: 'poi' as const,
      })),
    location: ctx?.locationLabel
      ? buildLocationHeader(ctx.locationLabel, data.items[0]?.coordinates?.lat ?? 51.5074, data.items[0]?.coordinates?.lng ?? -0.1276)
      : null,
    stats: [
      { label: 'Duration', value: `${data.durationHours}h` },
      { label: 'Budget', value: ctx?.budgetGBP != null ? `£${ctx.budgetGBP}` : '—' },
      { label: 'Total cost', value: `£${total.toFixed(0)}` },
      { label: 'Stops', value: String(data.items.length) },
    ],
    weatherAq: ctx?.weather
      ? {
          weather: ctx.weather,
          tempC: ctx.tempC ?? null,
        }
      : null,
    crime: null,
    transport: null,
    nearbyPlaces: buildActivityPlaces(data),
    confidence: buildConfidence(sources, status),
    rawFacts: null,
    routing: null,
  }
}

export function adaptBackendResponse(response: QueryResponse): EnrichedAnswer {
  const { data } = response

  if (data.type === 'housing' || response.intent === 'housing') {
    return enrichHousing(response, data as HousingData)
  }

  if (data.type === 'routing' || response.intent === 'routing') {
    return enrichRouting(response, data as RoutingData)
  }

  return enrichActivity(response, data as ActivityData)
}

export function pinKindColor(kind: MapPin['kind'] | string): string {
  switch (kind) {
    case 'transit':
      return '#7dd3fc'
    case 'poi':
      return '#86efac'
    case 'origin':
      return '#fdfbd4'
    case 'destination':
      return '#fbbf24'
    case 'property':
    default:
      return '#fdfbd4'
  }
}

export function extractParsed(answer: EnrichedAnswer | null) {
  return answer?.parsed ?? null
}

const INSIGHT_PIN_KIND: Record<string, MapPin['kind'] | 'transit-first' | 'poi-first'> = {
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

export function resolveInsightFocus(insightId: string, pins: MapPin[]): MapFocus | null {
  const hint = INSIGHT_PIN_KIND[insightId]
  if (!hint || pins.length === 0) return null

  let pin: MapPin | undefined
  if (hint === 'transit-first') pin = pins.find(p => p.kind === 'transit')
  else if (hint === 'poi-first') pin = pins.find(p => p.kind === 'poi')
  else pin = pins.find(p => p.kind === hint)

  pin ??= pins[0]
  if (!pin) return null

  return { lat: pin.lat, lng: pin.lng, label: pin.label }
}

export function resolveSlotFocus(slot: ItinerarySlot): MapFocus {
  return {
    lat: slot.coordinates.lat,
    lng: slot.coordinates.lng,
    label: slot.place,
  }
}
