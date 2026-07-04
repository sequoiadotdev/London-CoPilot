import type { RouteStep } from '@contract/query.types'
import { TFL_LINE_COLORS } from '@/lib/map/tflLineColors'
import tubeLinesData from '@/data/tube/lines.json'
import tubeStationsData from '@/data/tube/stations.json'

export interface TubeLine {
  id: string
  name: string
  color: string
  /** [lng, lat][] */
  coordinates: [number, number][]
}

export interface TubeStation {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  zone: string | null
}

export const TUBE_LINES = tubeLinesData as TubeLine[]
export const TUBE_STATIONS = tubeStationsData as TubeStation[]

const LINE_ALIASES: Record<string, string> = {
  victoria: 'victoria',
  bakerloo: 'bakerloo',
  central: 'central',
  circle: 'circle',
  district: 'district',
  jubilee: 'jubilee',
  metropolitan: 'metropolitan',
  northern: 'northern',
  piccadilly: 'piccadilly',
  elizabeth: 'elizabeth',
  'elizabeth line': 'elizabeth',
  dlr: 'dlr',
  overground: 'overground',
  'london overground': 'overground',
  'hammersmith & city': 'hammersmith & city',
  hammersmith: 'hammersmith & city',
  'waterloo & city': 'waterloo & city',
  tramlink: 'tramlink',
}

export function normalizeLineId(name: string | null | undefined): string | null {
  if (!name) return null
  const key = name
    .toLowerCase()
    .replace(/\s+line$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  return LINE_ALIASES[key] ?? key
}

export function lineColorForId(lineId: string): string {
  return TFL_LINE_COLORS[lineId] ?? '#888888'
}

export function findTubeLine(lineName: string | null | undefined): TubeLine | null {
  const id = normalizeLineId(lineName)
  if (!id) return null
  return (
    TUBE_LINES.find(
      l => normalizeLineId(l.name) === id || normalizeLineId(l.id) === id || l.id === id,
    ) ?? null
  )
}

function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bst\.?\s+/g, 'st ')
    .replace(/['']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findTubeStation(name: string | null | undefined): TubeStation | null {
  if (!name) return null
  const target = normalizeStationName(name)
  return (
    TUBE_STATIONS.find(s => normalizeStationName(s.name) === target) ??
    TUBE_STATIONS.find(
      s =>
        normalizeStationName(s.name).includes(target) ||
        target.includes(normalizeStationName(s.name)),
    ) ??
    null
  )
}

export function lineIdForStep(step: RouteStep): string | null {
  return normalizeLineId(step.lineName ?? step.instruction)
}

export function stationsForStep(step: RouteStep): {
  from: TubeStation | null
  to: TubeStation | null
} {
  return {
    from: findTubeStation(step.from),
    to: findTubeStation(step.to),
  }
}
