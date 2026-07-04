import { env } from '@/env'

function backendUrl() {
  return env.BACKEND_URL ?? env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5220'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: 'name, lat, lng required' }, { status: 400 })
  }

  try {
    const url = `${backendUrl()}/place/details?name=${encodeURIComponent(name)}&lat=${lat}&lng=${lng}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) {
      return Response.json(null, { status: 200 })
    }
    return Response.json(await res.json())
  } catch {
    return Response.json(null, { status: 200 })
  }
}
