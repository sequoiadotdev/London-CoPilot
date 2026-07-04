'use client'

import { ArrowUp } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { glassInputShell } from '@/components/london/glassStyles'
import { LED_CREAM } from '@/components/london/londonTheme'
import { cn } from '@/lib/utils'

const MIN_HEIGHT = 44
const MAX_HEIGHT = 120

interface GlassQueryInputProps {
  loading?: boolean
  placeholder?: string
  onSubmit: (query: string) => void
}

export default function GlassQueryInput({
  loading = false,
  placeholder = 'Ask a follow-up…',
  onSubmit,
}: GlassQueryInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const canSubmit = value.trim().length > 0 && !loading

  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    const textarea = textareaRef.current
    if (!mirror || !textarea) return

    mirror.textContent = value || ' '
    textarea.style.height = '0'
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, mirror.scrollHeight))
    textarea.style.height = `${next}px`
    textarea.style.overflowY = mirror.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className={cn('flex items-end gap-2 p-2', glassInputShell)}>
      <div className="relative min-w-0 flex-1">
        <div
          ref={mirrorRef}
          aria-hidden
          className="invisible absolute w-full whitespace-pre-wrap break-words px-2 py-2.5 text-sm leading-relaxed"
        />
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder={placeholder}
          disabled={loading}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Ask London Copilot"
          className={cn(
            'block w-full resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed text-white/90',
            'placeholder:text-white/28 focus:outline-none',
          )}
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        aria-label="Send"
        className={cn(
          'mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all',
          canSubmit
            ? 'border-[rgba(253,251,212,0.5)] text-[#040407] shadow-[0_0_20px_rgba(253,251,212,0.25)]'
            : 'border-white/[0.1] bg-[rgba(255,255,255,0.06)] text-white/40',
        )}
        style={
          canSubmit
            ? { backgroundColor: LED_CREAM }
            : undefined
        }
      >
        <ArrowUp className="size-[1.05rem]" strokeWidth={2.5} />
      </button>
    </div>
  )
}
