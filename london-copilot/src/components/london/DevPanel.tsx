'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FlaskConical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParsedAnswer } from './AnswerCard'

interface DevPanelProps {
  raw: string
  answer: ParsedAnswer | null
  streaming: boolean
}

function CollapseBlock({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function JsonBlock({ raw }: { raw: string }) {
  // Try to pretty-print just the JSON portion
  let display = raw
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```/)
    if (match?.[1]) {
      display = JSON.stringify(JSON.parse(match[1].trim()), null, 2)
    }
  } catch {}

  return (
    <pre className="bg-background rounded-lg border border-border p-3 text-[10px] leading-relaxed text-muted-foreground overflow-auto max-h-64 font-mono whitespace-pre-wrap break-all">
      {display || '(streaming…)'}
    </pre>
  )
}

// Simulated source timing badges — in production wire from API response
const SOURCES = [
  { name: 'openai/gpt-4o', ms: null },
]

export function DevToggleButton({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? 'Disable dev mode' : 'Enable dev mode'}
      className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
        active
          ? 'bg-accent/15 text-accent border border-accent/30'
          : 'text-muted-foreground/40 hover:text-muted-foreground border border-transparent'
      )}
    >
      <FlaskConical className="w-3.5 h-3.5" />
    </button>
  )
}

export default function DevPanel({ raw, answer, streaming }: DevPanelProps) {
  return (
    <div className="mt-2 rounded-[16px] border border-accent/20 bg-background/70 backdrop-blur-sm p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FlaskConical className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-semibold text-accent tracking-wide uppercase">Dev Mode</span>
        {streaming && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            streaming
          </span>
        )}
      </div>

      {/* Source badges */}
      <div className="flex flex-wrap gap-1.5">
        {SOURCES.map(s => (
          <span
            key={s.name}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            {s.name}
            {s.ms !== null && <span className="text-muted-foreground/60 ml-0.5">{s.ms}ms</span>}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', answer ? 'bg-green-500/70' : 'bg-yellow-500/70')} />
          parse: {answer ? `ok (${answer.type})` : streaming ? 'pending' : 'failed'}
        </span>
      </div>

      {/* Raw response */}
      <CollapseBlock label="Raw response">
        <JsonBlock raw={raw} />
      </CollapseBlock>

      {/* Parsed structure */}
      {answer && (
        <CollapseBlock label={`Parsed answer (${answer.type})`}>
          <pre className="bg-background rounded-lg border border-border p-3 text-[10px] leading-relaxed text-muted-foreground overflow-auto max-h-48 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(answer, null, 2)}
          </pre>
        </CollapseBlock>
      )}
    </div>
  )
}
