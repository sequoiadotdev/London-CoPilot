/**
 * Builds simplified tube line + station JSON from O.O'Brien's OSM-derived TfL GeoJSON.
 * Source: https://github.com/oobrien/vis (tubecreature/data) — OpenStreetMap ODbL
 * Run: node scripts/build-tube-topology.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'src/data/tube')
const LINES_URL =
  'https://raw.githubusercontent.com/oobrien/vis/master/tubecreature/data/tfl_lines.json'
const STATIONS_URL =
  'https://raw.githubusercontent.com/oobrien/vis/master/tubecreature/data/tfl_stations.json'

const LINE_COLORS = {
  Bakerloo: '#B36305',
  Central: '#E32017',
  Circle: '#FFD300',
  District: '#00782A',
  'Hammersmith & City': '#F3A9BB',
  Jubilee: '#A0A5A9',
  Metropolitan: '#9B0056',
  Northern: '#E8E8E8',
  Piccadilly: '#003688',
  Victoria: '#0098D4',
  'Waterloo & City': '#95CDBA',
  Elizabeth: '#6950A1',
  'Elizabeth line': '#6950A1',
  DLR: '#00A4A7',
  'London Overground': '#EE7C0E',
  Tramlink: '#66BB00',
}

const KEEP_LINES = new Set(Object.keys(LINE_COLORS))

function lineKey(name) {
  return name
    .toLowerCase()
    .replace(/\s+line$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function downsample(coords, maxPoints = 120) {
  if (coords.length <= maxPoints) return coords
  const step = Math.ceil(coords.length / maxPoints)
  const out = []
  for (let i = 0; i < coords.length; i += step) out.push(coords[i])
  const last = coords[coords.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

async function main() {
  console.log('Fetching TfL line geometry…')
  const linesRes = await fetch(LINES_URL)
  const stationsRes = await fetch(STATIONS_URL)
  if (!linesRes.ok || !stationsRes.ok) throw new Error('Failed to fetch topology source')

  const linesFc = await linesRes.json()
  const stationsFc = await stationsRes.json()

  /** @type {Map<string, { id: string, name: string, color: string, coordinates: number[][] }>} */
  const byLine = new Map()

  for (const feature of linesFc.features ?? []) {
    const lineInfo = feature.properties?.lines?.[0]
    const name = lineInfo?.name
    if (!name || !KEEP_LINES.has(name)) continue

    const coords = feature.geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) continue

    const id = lineKey(name)
    const existing = byLine.get(id)
    if (existing) {
      existing.coordinates.push(...coords)
    } else {
      byLine.set(id, {
        id,
        name,
        color: LINE_COLORS[name] ?? '#888888',
        coordinates: [...coords],
      })
    }
  }

  const tubeLines = [...byLine.values()].map(line => ({
    ...line,
    coordinates: downsample(line.coordinates),
  }))

  const tubeStations = (stationsFc.features ?? [])
    .map(f => {
      const props = f.properties ?? {}
      const coords = f.geometry?.coordinates
      if (!props.name || !Array.isArray(coords) || coords.length < 2) return null
      const lines = (props.lines ?? [])
        .map(l => l.name)
        .filter(n => KEEP_LINES.has(n))
      if (lines.length === 0) return null
      return {
        id: props.id ?? props.name,
        name: props.name,
        lng: coords[0],
        lat: coords[1],
        lines: [...new Set(lines)],
        zone: props.zone ?? null,
      }
    })
    .filter(Boolean)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'lines.json'), JSON.stringify(tubeLines))
  writeFileSync(join(OUT_DIR, 'stations.json'), JSON.stringify(tubeStations))
  console.log(`Wrote ${tubeLines.length} lines, ${tubeStations.length} stations`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
