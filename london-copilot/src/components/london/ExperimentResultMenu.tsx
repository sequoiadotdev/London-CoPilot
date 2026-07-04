'use client'

import { motion } from 'motion/react'
import {
  Banknote,
  Building2,
  Clock,
  Lightbulb,
  MapPin,
  Train,
} from 'lucide-react'
import type { ParsedAnswer } from '@/components/london/AnswerCard'
import { AnimatedIcon } from '@/components/london/AnimatedIcon'
import { LED_CREAM } from '@/components/london/londonTheme'

interface ExperimentResultMenuProps {
  answer: ParsedAnswer | null
  streaming?: boolean
  error?: string | null
  locationLabel?: string
}

function StreamingDots() {
  return (
    <span className="inline-flex gap-1 pl-1 align-middle">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-[#fdfbd4]/80"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
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
      className="flex gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
    >
      <AnimatedIcon icon={icon} className="mt-0.5 text-[#fdfbd4]" delay={delay} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/95">{title}</p>
        {detail ? <p className="mt-0.5 text-xs leading-relaxed text-white/55">{detail}</p> : null}
      </div>
    </motion.li>
  )
}

export default function ExperimentResultMenu({
  answer,
  streaming,
  error,
  locationLabel,
}: ExperimentResultMenuProps) {
  const typeIcon =
    answer?.type === 'housing' ? Building2 : answer?.type === 'route' ? Train : MapPin

  return (
    <motion.div
      className="pointer-events-auto w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,12,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
    >
      <div
        className="border-b border-white/8 px-4 py-3"
        style={{ boxShadow: `inset 0 -1px 0 rgba(253,251,212,0.08)` }}
      >
        <div className="flex items-start gap-3">
          <AnimatedIcon icon={typeIcon} className="mt-0.5 text-[#fdfbd4]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#fdfbd4]/70">
              {locationLabel ?? 'London'}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-snug text-white">
              {error
                ? 'Could not reach AI'
                : answer?.title ?? (streaming ? 'Thinking' : 'No response')}
              {streaming && !answer && !error ? <StreamingDots /> : null}
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {error ? (
          <p className="text-sm leading-relaxed text-red-300/90">{error}</p>
        ) : null}

        {answer?.summary ? (
          <motion.p
            className="text-sm leading-relaxed text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            {answer.summary}
          </motion.p>
        ) : streaming ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-white/8" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/8" />
          </div>
        ) : null}

        {answer?.type === 'housing' ? (
          <ul className="space-y-2">
            {answer.areas.slice(0, 3).map((area, i) => (
              <ResultRow
                key={area.name}
                icon={Building2}
                title={area.name}
                detail={`${area.avgRent} · ${area.vibe}`}
                delay={0.12 + i * 0.08}
              />
            ))}
          </ul>
        ) : null}

        {answer?.type === 'route' ? (
          <ul className="space-y-2">
            {answer.options.slice(0, 3).map((option, i) => (
              <ResultRow
                key={`${option.mode}-${i}`}
                icon={Train}
                title={`${option.emoji} ${option.mode} · ${option.duration}`}
                detail={`${option.cost} · ${option.steps[0] ?? ''}`}
                delay={0.12 + i * 0.08}
              />
            ))}
          </ul>
        ) : null}

        {answer?.type === 'itinerary' ? (
          <ul className="space-y-2">
            {answer.slots.slice(0, 4).map((slot, i) => (
              <ResultRow
                key={`${slot.place}-${i}`}
                icon={Clock}
                title={`${slot.time} · ${slot.place}`}
                detail={`${slot.duration} · ${slot.cost}`}
                delay={0.12 + i * 0.08}
              />
            ))}
          </ul>
        ) : null}

        {answer?.tip ? (
          <motion.div
            className="flex gap-2.5 rounded-xl border border-[#fdfbd4]/15 bg-[#fdfbd4]/6 px-3 py-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <AnimatedIcon icon={Lightbulb} className="mt-0.5 text-[#fdfbd4]" delay={0.28} />
            <p className="text-xs leading-relaxed text-white/65">{answer.tip}</p>
          </motion.div>
        ) : null}

        {answer && !streaming ? (
          <motion.div
            className="flex items-center gap-2 text-[11px] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Banknote className="size-3" style={{ color: LED_CREAM }} />
            <span>Powered by Gemini · map locked to this area</span>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}
