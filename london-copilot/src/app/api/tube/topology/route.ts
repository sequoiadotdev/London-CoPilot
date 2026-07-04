import { NextResponse } from 'next/server'
import tubeLines from '@/data/tube/lines.json'
import tubeStations from '@/data/tube/stations.json'

/** Serves cached TfL tube topology (OSM-derived, via oobrien/vis). */
export async function GET() {
  return NextResponse.json(
    {
      source: 'oobrien/vis tubecreature/data (OpenStreetMap ODbL)',
      lines: tubeLines,
      stations: tubeStations,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  )
}
