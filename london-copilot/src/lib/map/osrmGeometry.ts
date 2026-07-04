import type { LngLat } from '@/lib/map/adapters'

export type OsrmProfile = 'foot' | 'driving' | 'bike'

export async function fetchOsrmGeometry(
  from: LngLat,
  to: LngLat,
  profile: OsrmProfile = 'foot',
): Promise<LngLat[]> {
  const params = new URLSearchParams({
    fromLng: String(from[0]),
    fromLat: String(from[1]),
    toLng: String(to[0]),
    toLat: String(to[1]),
    profile,
  })

  try {
    const res = await fetch(`/api/route/geometry?${params.toString()}`)
    if (!res.ok) return [from, to]

    const data = (await res.json()) as { coordinates?: LngLat[] }
    const coords = data.coordinates
    return coords && coords.length >= 2 ? coords : [from, to]
  } catch {
    return [from, to]
  }
}
