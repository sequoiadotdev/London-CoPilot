'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { EnrichedAnswer, HousingInsight } from '@/lib/api/adaptBackendResponse'
import type { ItinerarySlot, RouteOption } from '@/components/london/AnswerCard'
import type { ChatEntry } from '@/components/london/chatTypes'
import type { PlaceFocus } from '@/components/london/placeFocus'
import RouteLegStepCard from '@/components/london/RouteLegStepCard'
import { buildPlaceFocusFromInsight, resolveInsightPin } from '@/components/london/placeFocus'
import GlassQueryInput from '@/components/london/GlassQueryInput'
import ScoreArcRing, { ScoreBar } from '@/components/london/ScoreArcRing'
import { SourceBadge, SourceLogo } from '@/components/london/SourceBadge'
import { ModeLogo } from '@/components/london/CompanyLogo'
import {
  glassBubbleAssistant,
  glassBubbleUser,
  glassCard,
  glassCardHover,
  glassHistoryItem,
  glassHistoryItemActive,
  glassLeftPanel,
  glassSectionLabel,
} from '@/components/london/glassStyles'
import { LED_CREAM, LED_BORDER_STRONG, LED_GLOW_STRONG } from '@/components/london/londonTheme'
import { INSIGHT_SOURCE, sourceMeta } from '@/components/london/sourceCatalog'
import { insightDetailLines, insightTheme, scoreColor } from '@/components/london/insightCatalog'
import type { HousingFacts } from '@contract/query.types'
import { cn } from '@/lib/utils'
import {
  Banknote,
  ChevronDown,
  Clock,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react'

export type { ChatEntry } from '@/components/london/chatTypes'

interface ExperimentGlassPanelProps {
  entries: ChatEntry[]
  activeEntryId: string | null
  activeAnswer: EnrichedAnswer | null
  loading: boolean
  error?: string | null
  locationLabel?: string
  onSubmit: (query: string) => void
  onSelectEntry: (id: string) => void
  onClearHistory: () => void
  onSelectPlace?: (place: PlaceFocus | null) => void
  selectedPlace?: PlaceFocus | null
  selectedRouteLeg?: number | null
  onSelectRouteLeg?: (index: number | null) => void
}

function formatHistoryTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function locationSubtitle(answer: EnrichedAnswer | null) {
  if (!answer?.location) return 'Area report'
  const { shortName, postcode } = answer.location
  if (postcode) return `${shortName} · ${postcode}`
  return shortName
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-1 py-0.5 text-left transition-colors hover:text-white/70"
      >
        <h2 className={glassSectionLabel}>
          {title}
          {count != null ? ` · ${count}` : ''}
        </h2>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-white/25 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-1.5 overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function InsightRow({
  insight,
  expanded,
  mapFocused,
  pins,
  facts,
  onToggleExpand,
  onSelectPlace,
  selectedPlace,
}: {
  insight: HousingInsight
  expanded: boolean
  mapFocused: boolean
  pins: EnrichedAnswer['pins']
  facts?: HousingFacts | null
  onToggleExpand: () => void
  onSelectPlace?: (place: PlaceFocus | null) => void
  selectedPlace?: PlaceFocus | null
}) {
  const sourceId = INSIGHT_SOURCE[insight.id] ?? 'openstreetmap'
  const meta = sourceMeta(sourceId)
  const theme = insightTheme(insight.id)
  const Icon = theme.icon
  const details = insightDetailLines(insight.id, facts)
  const scoreRatio =
    insight.score != null ? insight.score / (insight.outOf ?? 10) : null

  const handleFocus = () => {
    if (!onSelectPlace) return
    const place = buildPlaceFocusFromInsight(insight, pins, facts, resolveInsightPin)
    if (place) onSelectPlace(place)
  }

  return (
    <motion.div
      layout
      className={cn('overflow-hidden', glassCard, mapFocused && 'shadow-[0_0_24px_rgba(253,251,212,0.08)]')}
      style={{
        borderColor: mapFocused ? theme.accentBorder : undefined,
        borderLeftWidth: 3,
        borderLeftColor: theme.accent,
      }}
    >
      <div className="flex w-full gap-3 p-3">
        <button
          type="button"
          onClick={handleFocus}
          className={cn('flex min-w-0 flex-1 gap-3 text-left', glassCardHover)}
        >
          {insight.score != null ? (
            <ScoreArcRing
              score={insight.score}
              outOf={insight.outOf ?? 10}
              size={40}
              accentColor={scoreRatio != null ? scoreColor(scoreRatio) : theme.accent}
            />
          ) : (
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: theme.accentBorder,
                backgroundColor: theme.accentSoft,
                color: theme.accent,
              }}
            >
              <Icon className="size-4" strokeWidth={2.2} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 shrink-0" style={{ color: theme.accent }} strokeWidth={2.2} />
              <p className="text-sm font-medium text-white/88">{insight.label}</p>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/42">
              {insight.summary}
            </p>
            {insight.score != null ? (
              <ScoreBar
                score={insight.score}
                outOf={insight.outOf ?? 10}
                className="mt-2"
                accentColor={scoreRatio != null ? scoreColor(scoreRatio) : undefined}
              />
            ) : null}
          </div>
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex shrink-0 items-start pt-0.5 text-white/30 transition-colors hover:text-white/55"
          aria-label={expanded ? 'Collapse insight' : 'Expand insight'}
        >
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/[0.06] px-3 pb-3 pt-2.5">
              <p className="text-xs leading-relaxed text-white/55">{insight.summary}</p>
              {details.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {details.map(line => (
                    <li
                      key={line}
                      className="rounded-lg border px-2 py-1 text-[10px] text-white/55"
                      style={{
                        borderColor: theme.accentBorder,
                        backgroundColor: theme.accentSoft,
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/50 transition-colors hover:border-[rgba(253,251,212,0.14)] hover:text-white/75"
              >
                <SourceLogo sourceId={sourceId} size={16} />
                {meta.name}
                <ExternalLink className="size-2.5" />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function ItinerarySlotCard({
  slot,
  index,
  expanded,
  mapFocused,
  onToggle,
  onSelectPlace,
}: {
  slot: ItinerarySlot
  index: number
  expanded: boolean
  mapFocused: boolean
  onToggle: () => void
  onSelectPlace?: (place: PlaceFocus | null) => void
}) {
  const focusPlace = () => {
    onSelectPlace?.({
      lat: slot.coordinates.lat,
      lng: slot.coordinates.lng,
      label: slot.place,
      category: slot.description,
      summary: slot.description,
      kind: 'poi',
    })
  }

  return (
    <motion.div
      layout
      className={cn(
        glassCard,
        mapFocused && 'border-[rgba(253,251,212,0.22)] shadow-[0_0_20px_rgba(253,251,212,0.07)]',
      )}
    >
      <button
        type="button"
        onClick={() => {
          focusPlace()
          onToggle()
        }}
        className={cn('flex w-full gap-3 p-3 text-left', glassCardHover)}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
          style={{
            borderColor: LED_BORDER_STRONG,
            backgroundColor: LED_GLOW_STRONG,
            color: LED_CREAM,
          }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white/85">{slot.place}</p>
            <ChevronDown
              className={cn(
                'size-3.5 shrink-0 text-white/30 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </div>
          <p className="mt-1 text-xs text-white/40">
            {slot.time} · {slot.duration} · {slot.cost}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-[rgba(253,251,212,0.42)]">
            <ChevronDown
              className={cn('size-3 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Show less' : 'Read more'}
          </p>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/[0.06] px-3 pb-3 pt-2.5">
              <p className="text-xs leading-relaxed text-white/58">
                {slot.place} is a nearby {slot.description.toLowerCase()} option that fits this
                itinerary window. It gives you enough time to get there, enjoy the stop, and still
                keep the full plan within your budget.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-white/42">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
                  <Clock className="size-3" />
                  {slot.duration}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
                  <Banknote className="size-3" />
                  {slot.cost}
                </span>
              </div>
              <button
                type="button"
                onClick={focusPlace}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(253,251,212,0.12)] bg-[rgba(253,251,212,0.05)] px-2.5 py-1.5 text-[10px] text-[rgba(253,251,212,0.62)] transition-colors hover:border-[rgba(253,251,212,0.24)] hover:text-[rgba(253,251,212,0.82)]"
              >
                <ExternalLink className="size-3" />
                Show on map
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function RouteOptionCard({
  option,
  expanded,
  onToggle,
}: {
  option: RouteOption
  expanded: boolean
  onToggle: () => void
}) {
  const modeKey = option.mode.toLowerCase()

  return (
    <motion.div layout className={glassCard}>
      <button
        type="button"
        onClick={onToggle}
        className={cn('flex w-full gap-3 p-3 text-left', glassCardHover)}
      >
        <ModeLogo
          mode={modeKey.includes('bus') ? 'bus' : modeKey.includes('walk') ? 'walk' : 'tube'}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-white/85">
              {option.mode} · {option.duration}
            </p>
            <ChevronDown
              className={cn(
                'size-3.5 shrink-0 text-white/30 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </div>
          <p className="mt-1 text-xs text-white/40">{option.cost}</p>
          {!expanded ? (
            <p className="mt-1.5 line-clamp-1 text-[11px] text-white/32">
              {option.steps[0]}
              {option.steps.length > 1 ? ` · +${option.steps.length - 1} more` : ''}
            </p>
          ) : null}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06] px-3 pb-3 pt-2"
          >
            {option.steps.map((step, j) => (
              <li key={step} className="flex gap-2.5 py-1.5 text-xs leading-relaxed text-white/55">
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'rgba(253, 251, 212, 0.1)',
                    color: LED_CREAM,
                  }}
                >
                  {j + 1}
                </span>
                {step}
              </li>
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function SourcesSection({ answer }: { answer: EnrichedAnswer }) {
  const unique = [...new Map(answer.sources.map(s => [s.id, s])).values()]

  return (
    <div className="flex flex-wrap gap-2 pb-1">
      {unique.map(source => (
        <SourceBadge key={source.id} sourceId={source.id} size="md" />
      ))}
    </div>
  )
}

function AnswerDetails({
  answer,
  onSelectPlace,
  selectedPlace,
  selectedRouteLeg,
  onSelectRouteLeg,
}: {
  answer: EnrichedAnswer
  onSelectPlace?: (place: PlaceFocus | null) => void
  selectedPlace?: PlaceFocus | null
  selectedRouteLeg?: number | null
  onSelectRouteLeg?: (index: number | null) => void
}) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null)
  const [expandedRoute, setExpandedRoute] = useState<number | null>(0)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const isItinerary = answer.parsed.type === 'itinerary'

  useEffect(() => {
    setExpandedSlot(answer.parsed.type === 'itinerary' ? 0 : null)
    setSummaryExpanded(answer.parsed.type === 'itinerary')
  }, [answer])

  return (
    <>
      {answer.summary ? (
        <button
          type="button"
          onClick={() => setSummaryExpanded(v => !v)}
          className={cn('w-full p-3.5 text-left', glassBubbleAssistant, glassCardHover)}
        >
          <p
            className={cn(
              'text-sm leading-relaxed text-white/58',
              !summaryExpanded && !isItinerary && 'line-clamp-3',
            )}
          >
            {answer.summary}
          </p>
          {!isItinerary ? (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-[rgba(253,251,212,0.4)]">
              <ChevronDown
                className={cn('size-3 transition-transform', summaryExpanded && 'rotate-180')}
              />
              {summaryExpanded ? 'Show less' : 'Read more'}
            </p>
          ) : null}
        </button>
      ) : null}

      {answer.insights.length > 0 ? (
        <CollapsibleSection title="Neighbourhood scores" count={answer.insights.length}>
          {answer.insights.map(insight => (
            <InsightRow
              key={insight.id}
              insight={insight}
              expanded={expandedInsight === insight.id}
              mapFocused={selectedPlace?.insightId === insight.id}
              pins={answer.pins}
              facts={answer.rawFacts}
              onToggleExpand={() =>
                setExpandedInsight(cur => (cur === insight.id ? null : insight.id))
              }
              onSelectPlace={onSelectPlace}
              selectedPlace={selectedPlace}
            />
          ))}
        </CollapsibleSection>
      ) : null}

      {answer.parsed.type === 'itinerary' ? (
        <CollapsibleSection title="Itinerary" count={answer.parsed.slots.length}>
          {answer.parsed.slots.map((slot, i) => (
            <ItinerarySlotCard
              key={`${slot.place}-${i}`}
              slot={slot}
              index={i}
              expanded={expandedSlot === i}
              mapFocused={selectedPlace?.label === slot.place}
              onToggle={() => setExpandedSlot(cur => (cur === i ? null : i))}
              onSelectPlace={onSelectPlace}
            />
          ))}
          {answer.parsed.tip ? (
            <p className="px-1 text-[11px] text-white/32">{answer.parsed.tip}</p>
          ) : null}
        </CollapsibleSection>
      ) : null}

      {answer.parsed.type === 'route' ? (
        <>
          {answer.routing?.steps.length ? (
            <CollapsibleSection title="Journey legs" count={answer.routing.steps.length}>
              {answer.routing.preferencesApplied?.length ? (
                <div className="mb-3 flex flex-wrap gap-1.5 px-1">
                  {answer.routing.preferencesApplied.map(preference => (
                    <span
                      key={preference}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/55"
                    >
                      {preference}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="px-1 pb-2 text-[11px] text-white/35">
                Tap a leg to highlight it on the map and see line, direction, and stops.
              </p>
              <div className="space-y-2">
                {answer.routing.steps.map((step, i) => (
                  <RouteLegStepCard
                    key={`leg-${i}-${step.instruction.slice(0, 24)}`}
                    step={step}
                    index={i}
                    selected={selectedRouteLeg === i}
                    onSelect={() =>
                      onSelectRouteLeg?.(selectedRouteLeg === i ? null : i)
                    }
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection title="Route summary" count={answer.parsed.options.length} defaultOpen={false}>
            {answer.parsed.options.map((opt, i) => (
              <RouteOptionCard
                key={opt.mode}
                option={opt}
                expanded={expandedRoute === i}
                onToggle={() => setExpandedRoute(cur => (cur === i ? null : i))}
              />
            ))}
            {answer.parsed.tip ? (
              <p className="px-1 text-[11px] text-white/32">{answer.parsed.tip}</p>
            ) : null}
          </CollapsibleSection>
        </>
      ) : null}

      {answer.sources.length > 0 ? (
        <CollapsibleSection title="Sources" defaultOpen={false}>
          <SourcesSection answer={answer} />
        </CollapsibleSection>
      ) : null}
    </>
  )
}

function TurnBlock({
  entry,
  isActive,
  loading,
  error,
  onSelect,
  onSelectPlace,
  selectedPlace,
  selectedRouteLeg,
  onSelectRouteLeg,
}: {
  entry: ChatEntry
  isActive: boolean
  loading: boolean
  error?: string | null
  onSelect: () => void
  onSelectPlace?: (place: PlaceFocus | null) => void
  selectedPlace?: PlaceFocus | null
  selectedRouteLeg?: number | null
  onSelectRouteLeg?: (index: number | null) => void
}) {
  const showFull = isActive
  const isStreaming = entry.streaming && loading

  return (
    <article
      id={`turn-${entry.id}`}
      className={cn('scroll-mt-3 space-y-2.5', !isActive && 'opacity-75')}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'max-w-[92%] px-3 py-2 text-left text-sm text-white/82 transition-opacity',
            glassBubbleUser,
            !isActive && 'hover:opacity-100',
          )}
        >
          {entry.query}
        </button>
      </div>

      {isActive && error && !entry.answer ? (
        <div className={cn('p-3.5', glassCard)}>
          <p className="text-sm text-red-200/85">Could not load results</p>
          <p className="mt-1 text-xs text-red-200/55">{error}</p>
        </div>
      ) : null}

      {isStreaming && !entry.answer ? (
        <div className={cn('space-y-2 p-3.5', glassCard)}>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span
              className="size-1.5 animate-pulse rounded-full"
              style={{ backgroundColor: 'rgba(253, 251, 212, 0.75)' }}
            />
            Looking up…
          </div>
          <div className="h-2 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-2 w-4/5 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : null}

      {entry.answer ? (
        showFull ? (
          <AnswerDetails
            answer={entry.answer}
            onSelectPlace={onSelectPlace}
            selectedPlace={selectedPlace}
            selectedRouteLeg={selectedRouteLeg}
            onSelectRouteLeg={onSelectRouteLeg}
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className={cn('w-full p-3 text-left', glassBubbleAssistant, glassCardHover)}
          >
            <p className="line-clamp-3 text-xs leading-relaxed text-white/45">
              {entry.answer.summary ?? entry.answer.parsed?.title ?? 'View response'}
            </p>
            <p className="mt-2 text-[10px] text-[rgba(253,251,212,0.4)]">Tap to expand</p>
          </button>
        )
      ) : null}
    </article>
  )
}

export default function ExperimentGlassPanel({
  entries,
  activeEntryId,
  activeAnswer,
  loading,
  error,
  locationLabel,
  onSubmit,
  onSelectEntry,
  onClearHistory,
  onSelectPlace,
  selectedPlace = null,
  selectedRouteLeg = null,
  onSelectRouteLeg,
}: ExperimentGlassPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingScrollId = useRef<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const activeId = activeEntryId ?? entries.at(-1)?.id ?? null

  useEffect(() => {
    const latest = entries.at(-1)
    if (!latest || activeId !== latest.id) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries, activeId, loading])

  useLayoutEffect(() => {
    const id = pendingScrollId.current
    if (!id || id !== activeId) return
    pendingScrollId.current = null
    document.getElementById(`turn-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeId, entries])

  const scrollToEntry = (id: string) => {
    onSelectEntry(id)
    onSelectPlace?.(null)
    setHistoryOpen(false)
    pendingScrollId.current = id
    if (id === activeId) {
      requestAnimationFrame(() => {
        document.getElementById(`turn-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  return (
    <motion.aside
      className={cn(
        'pointer-events-auto absolute top-3 bottom-3 left-3 z-20 flex w-[min(400px,40vw)] flex-col overflow-hidden',
        glassLeftPanel,
      )}
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <header className="shrink-0 border-b border-white/[0.06] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-xl border backdrop-blur-md"
            style={{
              borderColor: 'rgba(253, 251, 212, 0.16)',
              backgroundColor: 'rgba(253, 251, 212, 0.06)',
            }}
          >
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: LED_CREAM }}>
              LC
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/88">
              {activeAnswer?.parsed.title ?? locationLabel ?? 'London'}
            </p>
            <p className="truncate text-[11px] text-white/30">
              {loading
                ? 'Looking up…'
                : selectedPlace?.label ?? locationSubtitle(activeAnswer)}
            </p>
          </div>
          {entries.length > 0 ? (
            <button
              type="button"
              onClick={() => setHistoryOpen(v => !v)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg border transition-colors',
                historyOpen
                  ? 'border-[rgba(253,251,212,0.18)] bg-[rgba(253,251,212,0.08)] text-[#fdfbd4]'
                  : 'border-white/[0.07] bg-[rgba(0,0,0,0.3)] text-white/45 hover:text-white/70',
              )}
              aria-label="Chat history"
              aria-expanded={historyOpen}
            >
              <Clock className="size-3.5" />
            </button>
          ) : null}
        </div>
      </header>

      <AnimatePresence>
        {historyOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-b border-white/[0.06] bg-[rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className={glassSectionLabel}>History · {entries.length}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-white/35 transition-colors hover:bg-white/[0.04] hover:text-red-300/80"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="flex size-6 items-center justify-center rounded-lg text-white/35 hover:bg-white/[0.04] hover:text-white/60"
                  aria-label="Close history"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
            <ul className="max-h-44 space-y-0.5 overflow-y-auto px-2 pb-2">
              {[...entries].reverse().map(entry => {
                const isActive = entry.id === activeId
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => scrollToEntry(entry.id)}
                      className={cn(
                        'w-full text-left',
                        isActive ? glassHistoryItemActive : glassHistoryItem,
                      )}
                    >
                      <p className="truncate text-xs text-white/75">{entry.query}</p>
                      <p className="mt-0.5 text-[10px] text-white/28">
                        {formatHistoryTime(entry.createdAt)}
                        {entry.answer?.parsed.title ? ` · ${entry.answer.parsed.title}` : ''}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {entries.length === 0 ? (
          <p className="px-1 text-xs leading-relaxed text-white/30">
            Your conversation will appear here.
          </p>
        ) : (
          entries.map(entry => (
            <TurnBlock
              key={entry.id}
              entry={entry}
              isActive={entry.id === activeId}
              loading={loading && entry.streaming}
              error={entry.id === activeId ? error : undefined}
              onSelect={() => scrollToEntry(entry.id)}
              onSelectPlace={onSelectPlace}
              selectedPlace={entry.id === activeId ? selectedPlace : null}
              selectedRouteLeg={entry.id === activeId ? selectedRouteLeg : null}
              onSelectRouteLeg={onSelectRouteLeg}
            />
          ))
        )}
      </div>

      <footer className="shrink-0 border-t border-white/[0.06] p-3">
        <GlassQueryInput loading={loading} onSubmit={onSubmit} />
      </footer>
    </motion.aside>
  )
}
