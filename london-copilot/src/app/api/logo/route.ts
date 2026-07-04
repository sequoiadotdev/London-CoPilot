import { env } from '@/env'

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

/** High-quality public favicon API — no API key required */
function faviconV2Url(domain: string, size = 128) {
  const siteUrl = `https://${domain}`
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(siteUrl)}&size=${size}`
}

function logoDevUrl(domain: string, publishableKey: string) {
  return `https://img.logo.dev/${domain}?token=${publishableKey}&size=128&format=png&retina=true`
}

async function proxyImage(url: string) {
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null

  const body = await res.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}

export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get('domain')?.trim().toLowerCase()

  if (!domain || !DOMAIN_RE.test(domain)) {
    return Response.json({ error: 'Invalid domain' }, { status: 400 })
  }

  const publishableKey = env.LOGO_DEV_PUBLISHABLE_KEY
  if (publishableKey?.startsWith('pk_')) {
    try {
      const proxied = await proxyImage(logoDevUrl(domain, publishableKey))
      if (proxied) return proxied
    } catch {
      // fall through to favicon v2
    }
  }

  try {
    const proxied = await proxyImage(faviconV2Url(domain))
    if (proxied) return proxied
  } catch {
    // fall through
  }

  return Response.redirect(faviconV2Url(domain), 302)
}
