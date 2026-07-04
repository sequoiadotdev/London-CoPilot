import { type NextRequest, NextResponse } from 'next/server'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'
const VALID_PROFILES = new Set(['foot', 'driving', 'bike'])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fromLng = Number(searchParams.get('fromLng'))
  const fromLat = Number(searchParams.get('fromLat'))
  const toLng = Number(searchParams.get('toLng'))
  const toLat = Number(searchParams.get('toLat'))
  const profile = searchParams.get('profile') ?? 'foot'

  if (
    !Number.isFinite(fromLng) ||
    !Number.isFinite(fromLat) ||
    !Number.isFinite(toLng) ||
    !Number.isFinite(toLat)
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  if (!VALID_PROFILES.has(profile)) {
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
  }

  const url =
    `${OSRM_BASE}/${profile}/${fromLng},${fromLat};${toLng},${toLat}` +
    '?overview=full&geometries=geojson&steps=false'

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'london-copilot/1.0' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Routing service unavailable' }, { status: 502 })
    }

    const data = (await res.json()) as {
      code?: string
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>
    }

    const coords = data.routes?.[0]?.geometry?.coordinates
    if (!coords || coords.length < 2) {
      return NextResponse.json(
        { coordinates: [[fromLng, fromLat], [toLng, toLat]] as [number, number][] },
      )
    }

    return NextResponse.json({ coordinates: coords })
  } catch {
    return NextResponse.json(
      { coordinates: [[fromLng, fromLat], [toLng, toLat]] as [number, number][] },
      { status: 200 },
    )
  }
}
