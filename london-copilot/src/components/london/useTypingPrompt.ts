'use client'

import { useEffect, useState } from 'react'

const TYPE_MS = 36
const DELETE_MS = 22
const HOLD_MS = 3400

/** Typed after the fixed "London Copilot, " prefix */
export const LONDON_COPILOT_PROMPTS = [
  'recommend my usual cycling path to work',
  'find me a flat near the Overground under £1,800',
  'what should I do near Shoreditch tonight?',
  'is Hackney worth renting in this year?',
  'plan a step-free route to Camden Town',
  'compare commuting from Peckham vs Brixton',
  'where do young professionals live near the City?',
  'suggest the safest walk home after midnight',
] as const

export const LONDON_COPILOT_PREFIX = 'London Copilot, '

export function useTypingPrompt(
  prompts: readonly string[] = LONDON_COPILOT_PROMPTS,
  active = true,
) {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!active || prompts.length === 0) return

    const current = prompts[index] ?? ''
    let timer: ReturnType<typeof setTimeout>

    if (!deleting && text === current) {
      timer = setTimeout(() => setDeleting(true), HOLD_MS)
    } else if (deleting && text.length === 0) {
      setDeleting(false)
      setIndex(i => (i + 1) % prompts.length)
    } else {
      timer = setTimeout(() => {
        setText(
          deleting
            ? current.slice(0, text.length - 1)
            : current.slice(0, text.length + 1),
        )
      }, deleting ? DELETE_MS : TYPE_MS)
    }

    return () => clearTimeout(timer)
  }, [active, deleting, index, prompts, text])

  return text
}
