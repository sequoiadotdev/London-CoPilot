'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Rent under £1,800 East London',
  'Brixton to Canary Wharf route',
  'Sunday plan in Notting Hill',
  'Best areas for young professionals',
]

interface SearchBoxProps {
  onSubmit: (query: string) => void
  loading: boolean
  compact?: boolean
}

export default function SearchBox({ onSubmit, loading, compact = false }: SearchBoxProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }

  const hasText = value.trim().length > 0

  return (
    <div className={cn('w-full', compact ? 'max-w-2xl' : 'max-w-lg')}>
      {!compact && (
        <>
          {/* Focused vignette — grounded specifically behind the content block */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1]"
            style={{
              width: 'calc(100% + 320px)',
              height: 'calc(100% + 280px)',
              background:
                'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.28) 45%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          {/* Branding — compact height */}
          <div className="mb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                <span className="text-accent text-xs font-bold tracking-tight">LC</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                London Copilot
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Housing, routes, and everything London.
            </p>
          </div>
        </>
      )}

      {/* Search input */}
      <div className="relative rounded-[18px] border border-border bg-card shadow-lg shadow-black/30 overflow-hidden focus-within:border-border/70 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask anything about London…"
          rows={1}
          disabled={loading}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
          aria-label="Search query"
          style={{ minHeight: '56px' }}
        />
        <div className="absolute bottom-2.5 right-3 flex items-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasText || loading}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
              hasText && !loading
                ? 'bg-accent text-accent-foreground hover:bg-accent/85 shadow-sm shadow-accent/30'
                : 'bg-surface-2 text-muted-foreground/40 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Suggestion pills — fixed 2x2 grid */}
      {!compact && (
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s)
                textareaRef.current?.focus()
              }}
              className="rounded-full border border-border/60 bg-surface-1 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-surface-2 transition-colors text-center truncate"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
