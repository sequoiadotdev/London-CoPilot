/** Provider metadata for source badges and insight attribution */
export interface SourceMeta {
  id: string
  name: string
  url: string
  domain: string
}

export const SOURCE_CATALOG: Record<string, SourceMeta> = {
  tfl: {
    id: 'tfl',
    name: 'Transport for London',
    url: 'https://tfl.gov.uk',
    domain: 'tfl.gov.uk',
  },
  'police-uk': {
    id: 'police-uk',
    name: 'Police.uk',
    url: 'https://data.police.uk',
    domain: 'data.police.uk',
  },
  nominatim: {
    id: 'nominatim',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    domain: 'openstreetmap.org',
  },
  openstreetmap: {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    domain: 'openstreetmap.org',
  },
  'open-meteo-aq': {
    id: 'open-meteo-aq',
    name: 'Open-Meteo',
    url: 'https://open-meteo.com',
    domain: 'open-meteo.com',
  },
  foursquare: {
    id: 'foursquare',
    name: 'Foursquare',
    url: 'https://foursquare.com',
    domain: 'foursquare.com',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://ai.google.dev',
    domain: 'google.com',
  },
  'postcodes-io': {
    id: 'postcodes-io',
    name: 'Postcodes.io',
    url: 'https://postcodes.io',
    domain: 'postcodes.io',
  },
}

export const INSIGHT_SOURCE: Record<string, string> = {
  tfl: 'tfl',
  crime: 'police-uk',
  'green-space': 'openstreetmap',
  'air-quality': 'open-meteo-aq',
  restaurants: 'foursquare',
  schools: 'openstreetmap',
  accessibility: 'tfl',
  planning: 'openstreetmap',
  'property-prices': 'postcodes-io',
  'hidden-gems': 'foursquare',
}

export function sourceMeta(id: string): SourceMeta {
  return (
    SOURCE_CATALOG[id] ?? {
      id,
      name: id,
      url: '#',
      domain: `${id}.com`,
    }
  )
}

export function sourceDomain(id: string): string {
  return sourceMeta(id).domain
}
