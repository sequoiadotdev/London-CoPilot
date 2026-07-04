'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import AnswerCard, { type ParsedAnswer } from './AnswerCard'
import SearchBox from './SearchBox'
import DevPanel, { DevToggleButton } from './DevPanel'

interface SidebarEntry {
  query: string
  answer: ParsedAnswer | null
  streaming: boolean
  raw: string
}

interface SidebarProps {
  entries: SidebarEntry[]
  onSubmit: (query: string) => void
  loading: boolean
}

function StreamingPlaceholder() {
  return (
    <article className="rounded-[18px] border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Thinking
        </span>
      </div>
      <div className="p-5 space-y-3">
        {[100, 82, 65].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-surface-2 animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </article>
  )
}

export default function Sidebar({ entries, onSubmit, loading }: SidebarProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
          <span className="text-accent text-xs font-bold tracking-tight">LC</span>
        </div>
        <span className="font-semibold text-sm tracking-tight flex-1">London Copilot</span>
        <DevToggleButton active={devMode} onClick={() => setDevMode(d => !d)} />
      </div>

      {/* Results feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
        {entries.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
              Ask about housing, routes, or what to do in London
            </p>
          </div>
        )}

        {entries.map((entry, i) => (
          <div key={i} className="space-y-2">
            {/* User bubble */}
            <div className="flex justify-end">
              <span className="rounded-2xl rounded-tr-sm bg-surface-2 px-3 py-2 text-sm text-foreground max-w-[88%]">
                {entry.query}
              </span>
            </div>

            {/* Answer or placeholder */}
            {entry.streaming && !entry.answer ? (
              <StreamingPlaceholder />
            ) : entry.answer ? (
              <AnswerCard answer={entry.answer} streaming={entry.streaming} />
            ) : null}

            {/* Dev panel (per entry, gated) */}
            {devMode && (entry.answer || entry.streaming) && (
              <DevPanel raw={entry.raw} answer={entry.answer} streaming={entry.streaming} />
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Compact search input */}
      <div className={cn(
        'shrink-0 px-4 py-3 border-t border-border',
        entries.length === 0 && 'hidden'
      )}>
        <SearchBox onSubmit={onSubmit} loading={loading} compact />
      </div>
    </aside>
  )
}
