import { cn } from '@/lib/utils'
import { CompanyLogo } from '@/components/london/CompanyLogo'
import { sourceMeta } from '@/components/london/sourceCatalog'
import { ExternalLink } from 'lucide-react'

interface SourceBadgeProps {
  sourceId: string
  size?: 'sm' | 'md'
  clickable?: boolean
  className?: string
}

export function SourceBadge({
  sourceId,
  size = 'sm',
  clickable = true,
  className,
}: SourceBadgeProps) {
  const meta = sourceMeta(sourceId)
  const logoSize = size === 'sm' ? 24 : 30

  const inner = (
    <>
      <CompanyLogo sourceId={sourceId} size={logoSize} />
      <span className="min-w-0 truncate text-[11px] text-white/65">{meta.name}</span>
      {clickable && meta.url !== '#' ? (
        <ExternalLink className="size-2.5 shrink-0 text-white/25" />
      ) : null}
    </>
  )

  const shell = cn(
    'group inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[rgba(0,0,0,0.35)] px-2 py-1.5 backdrop-blur-md',
    clickable &&
      'transition-all hover:border-[rgba(253,251,212,0.14)] hover:bg-[rgba(253,251,212,0.05)] active:scale-[0.98]',
    className,
  )

  if (clickable && meta.url !== '#') {
    return (
      <a
        href={meta.url}
        target="_blank"
        rel="noopener noreferrer"
        className={shell}
        title={`Open ${meta.name}`}
      >
        {inner}
      </a>
    )
  }

  return (
    <span className={shell} title={meta.name}>
      {inner}
    </span>
  )
}

export function SourceLogo({
  sourceId,
  className,
  size = 28,
}: {
  sourceId: string
  className?: string
  size?: number
}) {
  return <CompanyLogo sourceId={sourceId} size={size} className={className} />
}
