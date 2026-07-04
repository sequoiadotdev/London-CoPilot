'use client'

import { motion } from 'motion/react'
import type { ParsedAnswer } from '@/components/london/AnswerCard'
import {
  Building2,
  Clock,
  Lightbulb,
  MapPin,
  Star,
  Train,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/london/AnimatedIcon'

interface ExperimentLocationPanelProps {
  answer: ParsedAnswer | null
  streaming?: boolean
  error?: string | null
  locationLabel?: string
  visible?: boolean
}

function ResultRow({
  icon,
  title,
  detail,
  delay,
}: {
  icon: typeof MapPin
  title: string
  detail?: string
  delay: number
}) {
  return (
    <motion.li
      className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay }}
    >
      <AnimatedIcon icon={icon} className="mt-0.5 text-[#fdfbd4]" delay={delay} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/95">{title}</p>
        {detail ? <p className="mt-0.5 text-xs leading-relaxed text-white/50">{detail}</p> : null}
      </div>
    </motion.li>
  )
}

function StreamingSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="h-3 w-full animate-pulse rounded bg-white/8" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-white/8" />
      <div className="h-16 animate-pulse rounded-xl bg-white/5" />
    </div>
  )
}

export default function ExperimentLocationPanel({
  answer,
  streaming,
  error,
  locationLabel,
  visible = true,
}: ExperimentLocationPanelProps) {
  if (!visible) return null

  const typeIcon =
    answer?.type === 'housing' ? Building2 : answer?.type === 'route' ? Train : MapPin

  return (
    <motion.aside
      className="pointer-events-auto flex h-full w-[min(360px,34vw)] shrink-0 flex-col border-l border-white/8 bg-[rgba(6,6,9,0.94)] backdrop-blur-xl"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
    >
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#fdfbd4]/60">
          <MapPin className="size-3" />
          Location
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-white">
          {locationLabel ?? 'London'}
        </h2>
        {answer?.title ? (
          <p className="mt-1 text-sm text-white/55">{answer.title}</p>
        ) : streaming ? (
          <p className="mt-1 text-sm text-white/40">Finding the best spots…</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error ? (
          <p className="text-sm leading-relaxed text-red-300/90">{error}</p>
        ) : null}

        {!error && answer?.summary ? (
          <motion.p
            className="text-sm leading-relaxed text-white/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {answer.summary}
          </motion.p>
        ) : null}

        {!error && streaming && !answer ? <StreamingSkeleton /> : null}

        {!error && answer?.type === 'housing' ? (
          <ul className="mt-4 space-y-2">
            {answer.areas.slice(0, 4).map((area, i) => (
              <ResultRow
                key={area.name}
                icon={Building2}
                title={area.name}
                detail={`${area.avgRent} · transport ${area.transportScore}/10`}
                delay={0.08 + i * 0.06}
              />
            ))}
          </ul>
        ) : null}

        {!error && answer?.type === 'route' ? (
          <ul className="mt-4 space-y-2">
            {answer.options.slice(0, 4).map((option, i) => (
              <ResultRow
                key={`${option.mode}-${i}`}
                icon={Train}
                title={`${option.emoji} ${option.mode}`}
                detail={`${option.duration} · ${option.cost}`}
                delay={0.08 + i * 0.06}
              />
            ))}
          </ul>
        ) : null}

        {!error && answer?.type === 'itinerary' ? (
          <ul className="mt-4 space-y-2">
            {answer.slots.slice(0, 5).map((slot, i) => (
              <ResultRow
                key={`${slot.place}-${i}`}
                icon={Clock}
                title={slot.place}
                detail={`${slot.time} · ${slot.duration} · ${slot.cost}`}
                delay={0.08 + i * 0.06}
              />
            ))}
          </ul>
        ) : null}

        {!error && answer && !streaming ? (
          <motion.div
            className="mt-4 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Star className="size-3.5 text-[#fdfbd4]" />
            <div>
              <p className="text-xs font-medium text-white/80">Copilot pick</p>
              <p className="text-[11px] text-white/45">Based on your question</p>
            </div>
          </motion.div>
        ) : null}

        {!error && answer?.tip ? (
          <motion.div
            className="mt-4 flex gap-2.5 rounded-xl border border-[#fdfbd4]/12 bg-[#fdfbd4]/5 px-3 py-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <AnimatedIcon icon={Lightbulb} className="mt-0.5 shrink-0 text-[#fdfbd4]" delay={0.24} />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#fdfbd4]/70">
                Insider tip
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{answer.tip}</p>
            </div>
          </motion.div>
        ) : null}
      </div>

      <div className="border-t border-white/8 px-5 py-3">
        <div className="flex items-center gap-2">
          <AnimatedIcon icon={typeIcon} className="text-[#fdfbd4]" delay={0} />
          <p className="text-[11px] text-white/35">Map focused on this area</p>
        </div>
      </div>
    </motion.aside>
  )
}
