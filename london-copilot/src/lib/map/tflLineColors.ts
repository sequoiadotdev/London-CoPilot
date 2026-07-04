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
  'elizabeth line': '#6950A1',
  dlr: '#00A4A7',
  overground: '#EE7C0E',
  'london overground': '#EE7C0E',
  tram: '#66BB00',
  tramlink: '#66BB00',
  rail: '#0019A8',
  national: '#0019A8',
  'national rail': '#0019A8',
  thameslink: '#E9438C',
  'greater anglia': '#D70428',
  'c2c': '#B0008E',
  'southeastern': '#00AFE8',
  'south western railway': '#24398A',
  'southern': '#8CC63F',
  'great northern': '#662483',
  'gatwick express': '#E1251B',
  'london north eastern railway': '#B5007A',
  lner: '#B5007A',
  avanti: '#004354',
  'avanti west coast': '#004354',
  chiltern: '#00A3E0',
  'chiltern railways': '#00A3E0',
  'great western railway': '#0B2D27',
  gwr: '#0B2D27',
}

const LINE_PATTERN =
  /\b(Bakerloo|Central|Circle|District|Hammersmith(?:\s*&\s*City)?|Jubilee|Metropolitan|Northern|Piccadilly|Victoria|Waterloo(?:\s*&\s*City)?|Elizabeth(?:\s+line)?|DLR|(?:London\s+)?Overground|Tramlink|Thameslink|Greater\s+Anglia|c2c|Southeastern|South\s+Western\s+Railway|Southern|Great\s+Northern|Gatwick\s+Express|LNER|London\s+North\s+Eastern\s+Railway|Avanti(?:\s+West\s+Coast)?|Chiltern(?:\s+Railways)?|GWR|Great\s+Western\s+Railway)\b/i

export function normalizeLineName(value: string | null | undefined): string | null {
  if (!value) return null
  const key = value
    .toLowerCase()
    .replace(/\s+line$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (key.includes('hammersmith')) return 'hammersmith & city'
  if (key.includes('waterloo')) return 'waterloo & city'
  if (key.includes('elizabeth')) return 'elizabeth'
  if (key.includes('overground')) return 'london overground'
  if (key.includes('docklands') || key === 'dlr') return 'dlr'
  if (key.includes('tram')) return 'tramlink'
  if (key.includes('greater anglia')) return 'greater anglia'
  if (key.includes('thameslink')) return 'thameslink'
  if (key.includes('south western')) return 'south western railway'
  if (key.includes('southeastern')) return 'southeastern'
  if (key === 'c2c') return 'c2c'
  if (key.includes('great northern')) return 'great northern'
  if (key.includes('gatwick express')) return 'gatwick express'
  if (key.includes('lner') || key.includes('north eastern')) return 'lner'
  if (key.includes('avanti')) return 'avanti west coast'
  if (key.includes('chiltern')) return 'chiltern railways'
  if (key === 'gwr' || key.includes('great western')) return 'gwr'
  if (key.includes('national rail')) return 'national rail'

  return key
}

export function colorForLineName(value: string | null | undefined, fallback = '#0098D4'): string {
  const key = normalizeLineName(value)
  return key ? TFL_LINE_COLORS[key] ?? fallback : fallback
}

export function detectTubeLineColor(instruction: string): string {
  const match = instruction.match(LINE_PATTERN)
  if (!match?.[1]) return '#0098D4'
  return colorForLineName(match[1], '#0098D4')
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

export function styleForStep(mode: string, instruction: string, lineName?: string | null) {
  const m = mode.toLowerCase()
  if (m === 'walk') return ROUTE_MODE_STYLE.walk
  if (m === 'bus') return ROUTE_MODE_STYLE.bus
  if (m === 'rail') {
    return {
      ...ROUTE_MODE_STYLE.rail,
      color: colorForLineName(lineName ?? instruction, ROUTE_MODE_STYLE.rail.color),
    }
  }
  if (m === 'cycle') return ROUTE_MODE_STYLE.cycle
  if (m === 'tube') {
    return {
      ...ROUTE_MODE_STYLE.tube,
      color: colorForLineName(lineName, detectTubeLineColor(instruction)),
    }
  }
  return ROUTE_MODE_STYLE.walk
}
