'use client'

import { useState } from 'react'
import { MapPin as MapPinIcon, Train, Clock, Banknote, Lightbulb, Footprints, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HousingArea {
  name: string
  avgRent: string
  vibe: string
  pros: string[]
  transportScore: number
  walkabilityScore?: number
  safetyScore?: number
  coordinates: { lng: number; lat: number }
}

export interface RouteOption {
  mode: string
  duration: string
  cost: string
  steps: string[]
  emoji: string
}

export interface ItinerarySlot {
  time: string
  place: string
  description: string
  coordinates: { lng: number; lat: number }
  duration: string
  cost: string
}

export type ParsedAnswer =
  | { type: 'housing'; title: string; summary: string; areas: HousingArea[]; tip: string }
  | {
      type: 'route'
      title: string
      summary: string
      focus?: { name: string; lng: number; lat: number }
      options: RouteOption[]
      tip: string
    }
  | { type: 'itinerary'; title: string; summary: string; slots: ItinerarySlot[]; tip: string }

interface AnswerCardProps {
  answer: ParsedAnswer
  streaming?: boolean
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Tip({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-[14px] border border-accent/20 bg-accent/5 p-3.5">
      <Lightbulb className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

// Small coloured score badge — icon + number/10
function ScoreBadge({
  icon: Icon,
  label,
  score,
  color = 'text-accent',
}: {
  icon: React.ElementType
  label: string
  score: number
  color?: string
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px]">
      <Icon className={cn('w-3 h-3 shrink-0', color)} />
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', color)}>{score}<span className="text-muted-foreground/50 font-normal">/10</span></span>
    </div>
  )
}

// ─── Housing ─────────────────────────────────────────────────────────────────

function HousingCard({ data }: { data: Extract<ParsedAnswer, { type: 'housing' }> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>

      <div className="space-y-3">
        {data.areas.map((area, i) => (
          <div key={i} className="rounded-[16px] border border-border bg-surface-1 p-4 space-y-3">
            {/* Name + price */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{area.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{area.vibe}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-accent whitespace-nowrap">
                {area.avgRent}
              </span>
            </div>

            {/* Score badges row */}
            <div className="flex flex-wrap gap-1.5">
              <ScoreBadge icon={Train} label="Transport" score={area.transportScore} color="text-accent" />
              {area.walkabilityScore != null && (
                <ScoreBadge icon={Footprints} label="Walk" score={area.walkabilityScore} color="text-blue-400" />
              )}
              {area.safetyScore != null && (
                <ScoreBadge icon={ShieldCheck} label="Safety" score={area.safetyScore} color="text-green-400" />
              )}
            </div>

            {/* Pro tags */}
            <div className="flex flex-wrap gap-1.5">
              {area.pros.map((pro, j) => (
                <span
                  key={j}
                  className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] text-foreground"
                >
                  {pro}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Tip text={data.tip} />
    </div>
  )
}

// ─── Route ───────────────────────────────────────────────────────────────────

function RouteCard({ data }: { data: Extract<ParsedAnswer, { type: 'route' }> }) {
  const [disrupted, setDisrupted] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>

      <div className="space-y-3">
        {data.options.map((opt, i) => (
          <div key={i} className="rounded-[16px] border border-border bg-surface-1 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none" aria-hidden="true">{opt.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{opt.mode}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {disrupted && i === 0
                    ? <span className="line-through mr-1 opacity-50">{opt.duration}</span>
                    : opt.duration}
                  {disrupted && i === 0 && <span className="text-orange-400 font-semibold">+12 min</span>}
                </span>
                <span className="flex items-center gap-1 text-xs text-accent font-semibold">
                  <Banknote className="w-3 h-3" />
                  {opt.cost}
                </span>
              </div>
            </div>

            <ol className="space-y-1.5">
              {opt.steps.map((step, j) => (
                <li key={j} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-medium text-foreground mt-0.5">
                    {j + 1}
                  </span>
                  {disrupted && i === 0 && j === 0
                    ? <span className="text-orange-400/80">TfL reports delays — allow extra time</span>
                    : step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* Simulate disruption button */}
      <button
        type="button"
        onClick={() => setDisrupted(d => !d)}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all',
          disrupted
            ? 'border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15'
            : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground hover:border-border/60'
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        {disrupted ? 'Clear disruption' : 'Simulate disruption'}
      </button>

      <Tip text={data.tip} />
    </div>
  )
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

function ItineraryCard({ data }: { data: Extract<ParsedAnswer, { type: 'itinerary' }> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>

      {/* Horizontal scroll of activity cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`.itinerary-scroll::-webkit-scrollbar { display: none; }`}</style>
        {data.slots.map((slot, i) => (
          <div
            key={i}
            className="shrink-0 w-44 rounded-[16px] border border-border bg-surface-1 p-3.5 space-y-2 flex flex-col"
          >
            {/* Number + time */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                {i + 1}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium truncate">{slot.time}</span>
            </div>

            {/* Place */}
            <div className="flex items-start gap-1.5">
              <MapPinIcon className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{slot.place}</span>
            </div>

            {/* Description */}
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 flex-1">
              {slot.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {slot.duration}
              </span>
              <span className="text-border text-[10px]">·</span>
              <span className="text-[10px] text-accent font-medium">{slot.cost}</span>
            </div>
          </div>
        ))}
      </div>

      <Tip text={data.tip} />
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AnswerCard({ answer, streaming = false }: AnswerCardProps) {
  const badge = answer.type === 'housing' ? 'Housing' : answer.type === 'route' ? 'Route' : 'Activity'

  return (
    <article className="rounded-[18px] border border-border bg-card text-card-foreground overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm text-balance leading-snug">{answer.title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {streaming && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Thinking
            </span>
          )}
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {badge}
          </span>
        </div>
      </div>
      <div className="p-4">
        {answer.type === 'housing' && <HousingCard data={answer} />}
        {answer.type === 'route' && <RouteCard data={answer} />}
        {answer.type === 'itinerary' && <ItineraryCard data={answer} />}
      </div>
    </article>
  )
}
