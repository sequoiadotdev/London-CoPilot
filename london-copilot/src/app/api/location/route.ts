import { type NextRequest, NextResponse } from 'next/server'

const LONDON_FALLBACK = { lng: -0.123, lat: 51.515, city: 'London' }

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip =
      forwarded?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      ''

    const isLocal =
      !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')

    const url = isLocal
      ? 'https://ipapi.co/json/'
      : `https://ipapi.co/${ip}/json/`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'london-copilot/1.0' },
      next: { revalidate: 86_400 },
    })

    if (!res.ok) {
      return NextResponse.json(LONDON_FALLBACK)
    }

    const data = (await res.json()) as {
      latitude?: number
      longitude?: number
      city?: string
    }

    if (data.latitude == null || data.longitude == null) {
      return NextResponse.json(LONDON_FALLBACK)
    }

    return NextResponse.json({
      lng: data.longitude,
      lat: data.latitude,
      city: data.city ?? 'Unknown',
    })
  } catch {
    return NextResponse.json(LONDON_FALLBACK)
  }
}
