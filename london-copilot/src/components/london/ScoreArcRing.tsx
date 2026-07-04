'use client'

import { LED_CREAM } from '@/components/london/londonTheme'
import { cn } from '@/lib/utils'

interface ScoreArcRingProps {
  score: number
  outOf?: number
  size?: number
  strokeWidth?: number
  className?: string
  /** 0–1, animates ring fill on mount */
  animate?: boolean
  accentColor?: string
}

function scoreColorInternal(ratio: number, override?: string) {
  if (override) return override
  if (ratio >= 0.75) return LED_CREAM
  if (ratio >= 0.5) return 'rgba(253, 251, 212, 0.72)'
  if (ratio >= 0.35) return 'rgba(251, 191, 36, 0.85)'
  return 'rgba(248, 113, 113, 0.85)'
}

export default function ScoreArcRing({
  score,
  outOf = 10,
  size = 44,
  strokeWidth = 3.5,
  className,
  animate = true,
  accentColor,
}: ScoreArcRingProps) {
  const ratio = Math.min(1, Math.max(0, score / outOf))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const dash = ratio * circumference
  const color = scoreColorInternal(ratio, accentColor)

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      aria-label={`Score ${score} out of ${outOf}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference - dash : circumference - dash}
          style={
            animate
              ? {
                  transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                }
              : undefined
          }
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums"
        style={{ color }}
      >
        {Number.isInteger(score) ? score : score.toFixed(1)}
      </span>
    </div>
  )
}

interface ScoreBarProps {
  score: number
  outOf?: number
  className?: string
  accentColor?: string
}

export function ScoreBar({ score, outOf = 10, className, accentColor }: ScoreBarProps) {
  const ratio = Math.min(1, Math.max(0, score / outOf))
  const color = scoreColorInternal(ratio, accentColor)

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
    </div>
  )
}
