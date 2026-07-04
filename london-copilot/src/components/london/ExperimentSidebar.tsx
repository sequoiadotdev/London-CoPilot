'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { ParsedAnswer } from '@/components/london/AnswerCard'
import type { ChatEntry } from '@/components/london/chatTypes'
import TravelingInput from '@/components/london/TravelingInput'
import {
  glassBubbleAssistant,
  glassBubbleUser,
  glassPanel,
  glassShell,
} from '@/components/london/glassStyles'
import { Building2, Clock, Lightbulb, MapPin, Train } from 'lucide-react'
import { cn } from '@/lib/utils'

export type { ChatEntry } from '@/components/london/chatTypes'

interface ExperimentSidebarProps {
  entries: ChatEntry[]
  answer: ParsedAnswer | null
  loading: boolean
  error?: string | null
  locationLabel?: string
  onSubmit: (query: string) => void
}

function DetailCard({
  title,
  detail,
  icon: Icon,
}: {
  title: string
  detail: string
  icon: typeof MapPin
}) {
  return (
    <div className={cn('flex items-start gap-3 p-3', glassPanel)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-sm">
        <Icon className="size-3.5 text-white/50" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/45">{detail}</p>
      </div>
    </div>
  )
}

function AssistantMessage({ entry }: { entry: ChatEntry }) {
  if (entry.streaming && !entry.answer) {
    return (
      <div className={cn('px-3.5 py-3', glassBubbleAssistant)}>
        <p className="text-xs text-white/45">London Copilot is thinking…</p>
      </div>
    )
  }

  if (entry.answer?.summary) {
    return (
      <div className={cn('px-3.5 py-3', glassBubbleAssistant)}>
        <p className="text-sm leading-relaxed text-white/70">{entry.answer.summary}</p>
      </div>
    )
  }

  if (entry.answer?.parsed.summary) {
    return (
      <div className={cn('px-3.5 py-3', glassBubbleAssistant)}>
        <p className="text-sm leading-relaxed text-white/70">{entry.answer.parsed.summary}</p>
      </div>
    )
  }

  return null
}

function LocationDetails({
  answer,
  streaming,
  error,
  locationLabel,
}: {
  answer: ParsedAnswer | null
  streaming?: boolean
  error?: string | null
  locationLabel?: string
}) {
  if (!answer && !streaming && !error) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-sm font-medium text-white/80">Details</h2>
        <span className="text-[11px] text-white/35">{locationLabel ?? 'London'}</span>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200/90 backdrop-blur-md">
          {error}
        </div>
      ) : null}

      {streaming && !answer ? (
        <div className="grid gap-2">
          <div className={cn('h-20 animate-pulse', glassPanel)} />
          <div className={cn('h-20 animate-pulse', glassPanel)} />
        </div>
      ) : null}

      {answer?.type === 'housing' ? (
        <div className="grid gap-2">
          {answer.areas.slice(0, 4).map(area => (
            <DetailCard
              key={area.name}
              icon={Building2}
              title={area.name}
              detail={`${area.avgRent} · transport ${area.transportScore}/10`}
            />
          ))}
        </div>
      ) : null}

      {answer?.type === 'route' ? (
        <div className="grid gap-2">
          {answer.options.slice(0, 4).map((option, i) => (
            <DetailCard
              key={`${option.mode}-${i}`}
              icon={Train}
              title={`${option.emoji} ${option.mode}`}
              detail={`${option.duration} · ${option.cost}`}
            />
          ))}
        </div>
      ) : null}

      {answer?.type === 'itinerary' ? (
        <div className="grid gap-2">
          {answer.slots.slice(0, 5).map((slot, i) => (
            <DetailCard
              key={`${slot.place}-${i}`}
              icon={Clock}
              title={slot.place}
              detail={`${slot.time} · ${slot.duration} · ${slot.cost}`}
            />
          ))}
        </div>
      ) : null}

      {answer?.tip ? (
        <div className={cn('flex gap-2.5 p-3', glassPanel)}>
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#fdfbd4]/80" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Tip
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">{answer.tip}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default function ExperimentSidebar({
  entries,
  answer,
  loading,
  error,
  locationLabel,
  onSubmit,
}: ExperimentSidebarProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, answer])

  return (
    <motion.aside
      className={cn('flex h-full w-[min(380px,36vw)] shrink-0 flex-col border-r', glassShell)}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <header className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex size-9 items-center justify-center rounded-lg', glassPanel)}>
            <span className="text-xs font-semibold text-white/85">LC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/95">London Copilot</p>
            <p className="text-xs text-white/40">Your guide to the city</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {entries.length > 0 ? (
            <section className="space-y-4">
              {entries.map((entry, i) => (
                <div key={`${entry.query}-${i}`} className="space-y-2">
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        'max-w-[92%] px-3 py-2 text-sm text-white/90',
                        glassBubbleUser,
                      )}
                    >
                      {entry.query}
                    </span>
                  </div>
                  <AssistantMessage entry={entry} />
                </div>
              ))}
            </section>
          ) : null}

          <LocationDetails
            answer={answer}
            streaming={loading}
            error={error}
            locationLabel={locationLabel}
          />
        </div>
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-white/10 p-4">
        <TravelingInput
          loading={loading}
          onSubmit={onSubmit}
          embedded
          clearOnSubmit
          showSuggestions={false}
        />
      </footer>
    </motion.aside>
  )
}
