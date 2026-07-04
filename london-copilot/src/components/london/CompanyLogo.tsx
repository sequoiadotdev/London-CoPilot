'use client'

import { Footprints, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { sourceMeta } from '@/components/london/sourceCatalog'

const LOGO_SHELL =
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1a1a22]'

/** Proxied via /api/logo — favicon v2 with optional Logo.dev (pk_ key) */
export function companyLogoUrl(domain: string): string {
  return `/api/logo?domain=${encodeURIComponent(domain)}`
}

/** Direct public favicon URL — client-side retry if proxy fails */
export function faviconV2DirectUrl(domain: string): string {
  const siteUrl = `https://${domain}`
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(siteUrl)}&size=128`
}

function duckDuckGoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

function googleS2FaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

const RETRY_URLS = [
  companyLogoUrl,
  faviconV2DirectUrl,
  duckDuckGoIconUrl,
  googleS2FaviconUrl,
] as const

function LogoPlaceholder({ name, size }: { name: string; size: number }) {
  const tiny = Math.max(12, Math.round(size * 0.55))
  return (
    <span
      className={cn(LOGO_SHELL, 'opacity-60')}
      style={{ width: size, height: size }}
      title={name}
      aria-label={name}
    >
      <Globe className="text-white/30" style={{ width: tiny, height: tiny }} />
    </span>
  )
}

function RemoteLogo({
  domain,
  name,
  size,
}: {
  domain: string
  name: string
  size: number
}) {
  const [attempt, setAttempt] = useState(0)
  const padding = Math.max(2, Math.round(size * 0.18))
  const imgSize = size - padding * 2

  const src = useMemo(() => {
    const resolver = RETRY_URLS[attempt]
    return resolver ? resolver(domain) : null
  }, [domain, attempt])

  if (!src) {
    return <LogoPlaceholder name={name} size={size} />
  }

  return (
    <span
      className={LOGO_SHELL}
      style={{ width: size, height: size, padding }}
      title={name}
    >
      <img
        src={src}
        alt={`${name} logo`}
        width={imgSize}
        height={imgSize}
        className="size-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setAttempt(n => n + 1)}
      />
    </span>
  )
}

export function CompanyLogo({
  sourceId,
  size = 28,
  className,
}: {
  sourceId: string
  size?: number
  className?: string
}) {
  const meta = sourceMeta(sourceId)

  return (
    <span className={cn('inline-flex', className)}>
      <RemoteLogo domain={meta.domain} name={meta.name} size={size} />
    </span>
  )
}

const MODE_DOMAIN: Record<string, string> = {
  tube: 'tfl.gov.uk',
  bus: 'tfl.gov.uk',
  overground: 'tfl.gov.uk',
  rail: 'nationalrail.co.uk',
  train: 'nationalrail.co.uk',
}

export function ModeLogo({
  mode,
  size = 28,
  className,
}: {
  mode: string
  size?: number
  className?: string
}) {
  const key = mode.toLowerCase()

  if (key === 'walk' || key.includes('walk')) {
    return (
      <span
        className={cn(LOGO_SHELL, className)}
        style={{ width: size, height: size }}
        title="Walking"
        aria-label="Walking"
      >
        <Footprints className="text-[#fdfbd4]" style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    )
  }

  const domain = MODE_DOMAIN[key] ?? 'tfl.gov.uk'
  const name = key === 'rail' || key === 'train' ? 'National Rail' : 'Transport for London'

  return (
    <span className={cn('inline-flex', className)}>
      <RemoteLogo domain={domain} name={name} size={size} />
    </span>
  )
}
