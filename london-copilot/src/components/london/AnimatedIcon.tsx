'use client'

import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  delay?: number
}

export function AnimatedIcon({ icon: Icon, className, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.span
      className={cn('inline-flex shrink-0', className)}
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 18,
        delay,
      }}
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay }}
      >
        <Icon className="size-4" strokeWidth={2} />
      </motion.span>
    </motion.span>
  )
}

interface AnimatedPulseRingProps {
  className?: string
}

export function AnimatedPulseRing({ className }: AnimatedPulseRingProps) {
  return (
    <span className={cn('relative flex size-5 items-center justify-center', className)}>
      <motion.span
        className="absolute inset-0 rounded-full border border-[#fdfbd4]/70"
        animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' }}
      />
      <span className="size-2 rounded-full bg-[#fdfbd4] shadow-[0_0_12px_rgba(253,251,212,0.8)]" />
    </span>
  )
}
