import type { RouteStep } from '@contract/query.types'
import { detectTubeLineColor, ROUTE_MODE_STYLE } from '@/lib/map/tflLineColors'

const LINE_NAME_PATTERN =
  /\b((?:Elizabeth|Victoria|Bakerloo|Central|Circle|District|Jubilee|Metropolitan|Northern|Piccadilly|Hammersmith(?:\s*&\s*City)?|Waterloo(?:\s*&\s*City)?|DLR|Overground|Tramlink)(?:\s+line)?)\b/i

const DIRECTION_PATTERN = /(?:towards?|to)\s+([^—–\-,\n]+)/i
const STOPS_PATTERN = /(\d+)\s+stops?/i
const BUS_NUMBER_PATTERN = /\b(?:bus|route)\s+(\d+[A-Z]?)\b/i

export interface RouteStepMeta {
  lineName: string | null
  direction: string | null
  stopCount: number | null
  routeNumber: string | null
  lineColor: string
  shortLabel: string
  title: string
  subtitle: string | null
}

function detectLineName(instruction: string): string | null {
  const match = instruction.match(LINE_NAME_PATTERN)
  return match?.[1] ?? null
}

function detectDirection(instruction: string): string | null {
  const match = instruction.match(DIRECTION_PATTERN)
  return match?.[1]?.trim() ?? null
}

function detectStopCount(instruction: string): number | null {
  const match = instruction.match(STOPS_PATTERN)
  return match?.[1] ? Number.parseInt(match[1], 10) : null
}

function detectBusNumber(instruction: string): string | null {
  const match = instruction.match(BUS_NUMBER_PATTERN)
  return match?.[1] ?? null
}

function modeColor(mode: RouteStep['mode'], instruction: string, lineName: string | null): string {
  if (mode === 'walk') return ROUTE_MODE_STYLE.walk.color
  if (mode === 'bus') return ROUTE_MODE_STYLE.bus.color
  if (mode === 'cycle') return ROUTE_MODE_STYLE.cycle.color
  if (mode === 'rail') return ROUTE_MODE_STYLE.rail.color
  return detectTubeLineColor(lineName ?? instruction)
}

export function parseRouteStepMeta(step: RouteStep): RouteStepMeta {
  const lineName = step.lineName ?? detectLineName(step.instruction)
  const direction = step.direction ?? detectDirection(step.instruction)
  const stopCount = step.stopCount ?? detectStopCount(step.instruction)
  const routeNumber = step.routeNumber ?? detectBusNumber(step.instruction)
  const lineColor = modeColor(step.mode, step.instruction, lineName)

  let shortLabel: string
  let title: string

  switch (step.mode) {
    case 'walk':
      shortLabel = `Walk · ${step.durationMinutes}m`
      title = 'Walking'
      break
    case 'bus':
      shortLabel = routeNumber ? `Bus ${routeNumber}` : 'Bus'
      title = routeNumber ? `Bus ${routeNumber}` : 'Bus'
      break
    case 'cycle':
      shortLabel = `Cycle · ${step.durationMinutes}m`
      title = 'Cycling'
      break
    case 'rail':
      shortLabel = lineName ?? 'Rail'
      title = lineName ?? 'National Rail'
      break
    case 'tube':
    default:
      shortLabel = lineName?.replace(/\s+line$/i, '') ?? 'Tube'
      title = lineName ?? 'Tube'
      break
  }

  const subtitleParts: string[] = []
  if (direction) subtitleParts.push(`towards ${direction}`)
  if (stopCount != null) subtitleParts.push(`${stopCount} stop${stopCount === 1 ? '' : 's'}`)
  subtitleParts.push(`${step.durationMinutes} min`)

  return {
    lineName,
    direction,
    stopCount,
    routeNumber,
    lineColor,
    shortLabel,
    title,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : null,
  }
}
