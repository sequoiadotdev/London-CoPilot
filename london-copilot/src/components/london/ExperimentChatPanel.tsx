'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { ParsedAnswer } from '@/components/london/AnswerCard'
import type { ChatEntry } from '@/components/london/chatTypes'
import TravelingInput from '@/components/london/TravelingInput'

export type { ChatEntry } from '@/components/london/chatTypes'

interface ExperimentChatPanelProps {
  entries: ChatEntry[]
  loading: boolean
  onSubmit: (query: string) => void
  visible?: boolean
}

function AssistantBubble({ entry }: { entry: ChatEntry }) {
  if (entry.streaming && !entry.answer) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/45">
        <span className="size-1.5 animate-pulse rounded-full bg-[#fdfbd4]/80" />
        Thinking…
      </div>
    )
  }

  if (entry.answer?.summary) {
    return (
      <p className="text-sm leading-relaxed text-white/70">{entry.answer.summary}</p>
    )
  }

  if (entry.answer?.parsed.summary) {
    return (
      <p className="text-sm leading-relaxed text-white/70">{entry.answer.parsed.summary}</p>
    )
  }

  return null
}

export default function ExperimentChatPanel({
  entries,
  loading,
  onSubmit,
  visible = true,
}: ExperimentChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  if (!visible) return null

  return (
    <motion.aside
      className="pointer-events-auto flex h-full w-[min(400px,38vw)] shrink-0 flex-col border-r border-white/8 bg-[rgba(6,6,9,0.94)] backdrop-blur-xl"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
    >
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl border border-[#fdfbd4]/20 bg-[#fdfbd4]/8">
            <span className="text-[11px] font-semibold tracking-tight text-[#fdfbd4]">LC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">London Copilot</p>
            <p className="text-[11px] text-white/40">Ask anything about London</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <p className="px-1 text-xs leading-relaxed text-white/35">
            Routes, neighbourhoods, places to go — ask in plain English.
          </p>
        ) : (
          <div className="space-y-5">
            {entries.map((entry, i) => (
              <div key={`${entry.query}-${i}`} className="space-y-2.5">
                <div className="flex justify-end">
                  <span className="max-w-[92%] rounded-2xl rounded-tr-md border border-white/8 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white/90">
                    {entry.query}
                  </span>
                </div>
                <div className="max-w-[95%] rounded-2xl rounded-tl-md border border-[#fdfbd4]/10 bg-[#fdfbd4]/[0.04] px-3.5 py-3">
                  <AssistantBubble entry={entry} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/8 p-4">
        <TravelingInput
          loading={loading}
          onSubmit={onSubmit}
          embedded
          clearOnSubmit
        />
      </div>
    </motion.aside>
  )
}
