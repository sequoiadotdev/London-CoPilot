/** Official TfL line colours for route segments */
export const TFL_LINE_COLORS: Record<string, string> = {
  bakerloo: '#B36305',
  central: '#E32017',
  circle: '#FFD300',
  district: '#00782A',
  'hammersmith & city': '#F3A9BB',
  hammersmith: '#F3A9BB',
  jubilee: '#A0A5A9',
  metropolitan: '#9B0056',
  northern: '#FFFFFF',
  piccadilly: '#003688',
  victoria: '#0098D4',
  'waterloo & city': '#95CDBA',
  elizabeth: '#6950A1',
  dlr: '#00A4A7',
  overground: '#EE7C0E',
  tram: '#66BB00',
  rail: '#0019A8',
  national: '#0019A8',
}

const LINE_PATTERN =
  /\b(Bakerloo|Central|Circle|District|Hammersmith(?:\s*&\s*City)?|Jubilee|Metropolitan|Northern|Piccadilly|Victoria|Waterloo(?:\s*&\s*City)?|Elizabeth|DLR|Overground|Tramlink)\b/i

export function detectTubeLineColor(instruction: string): string {
  const match = instruction.match(LINE_PATTERN)
  if (!match?.[1]) return '#0098D4'
  const key = match[1].toLowerCase().replace(/\s+/g, ' ')
  if (key.includes('hammersmith')) return TFL_LINE_COLORS['hammersmith & city']!
  if (key.includes('waterloo')) return TFL_LINE_COLORS['waterloo & city']!
  return TFL_LINE_COLORS[key] ?? '#0098D4'
}

export const ROUTE_MODE_STYLE = {
  walk: {
    color: '#22D3EE',
    width: 5,
    opacity: 0.95,
    dashArray: [2, 2] as [number, number],
  },
  bus: {
    color: '#DC241F',
    width: 6,
    opacity: 1,
    dashArray: undefined as [number, number] | undefined,
  },
  tube: {
    color: '#0098D4',
    width: 6,
    opacity: 1,
    dashArray: undefined as [number, number] | undefined,
  },
  rail: {
    color: '#0019A8',
    width: 6,
    opacity: 1,
    dashArray: undefined as [number, number] | undefined,
  },
  cycle: {
    color: '#22C55E',
    width: 5,
    opacity: 0.9,
    dashArray: [1, 1] as [number, number],
  },
} as const

export function styleForStep(mode: string, instruction: string) {
  const m = mode.toLowerCase()
  if (m === 'walk') return ROUTE_MODE_STYLE.walk
  if (m === 'bus') return ROUTE_MODE_STYLE.bus
  if (m === 'rail') return ROUTE_MODE_STYLE.rail
  if (m === 'cycle') return ROUTE_MODE_STYLE.cycle
  if (m === 'tube') {
    return {
      ...ROUTE_MODE_STYLE.tube,
      color: detectTubeLineColor(instruction),
    }
  }
  return ROUTE_MODE_STYLE.walk
}
