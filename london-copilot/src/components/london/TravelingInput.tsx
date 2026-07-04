'use client'

import { ArrowUp } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './TravelingInput.module.css'
import { useLedOrbit } from './useLedOrbit'
import { LONDON_COPILOT_PREFIX, useTypingPrompt } from './useTypingPrompt'

const SINGLE_LINE_HEIGHT = 44
const MAX_INPUT_HEIGHT = 168

interface TravelingInputProps {
  className?: string
  loading?: boolean
  embedded?: boolean
  clearOnSubmit?: boolean
  showSuggestions?: boolean
  onSubmit?: (query: string) => void
}

export default function TravelingInput({
  className,
  loading = false,
  embedded = false,
  clearOnSubmit = false,
  showSuggestions = true,
  onSubmit,
}: TravelingInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { boxRef, mode } = useLedOrbit(focused, loading)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const typingActive = showSuggestions && !focused && value.length === 0 && !loading
  const typedPrompt = useTypingPrompt(undefined, typingActive)
  const showTypewriter = typingActive
  const placeholderLine = `${LONDON_COPILOT_PREFIX}${typedPrompt}`
  const canSubmit = value.trim().length > 0 && !loading

  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    const textarea = textareaRef.current
    if (!mirror || !textarea) return

    if (!value) {
      textarea.style.height = `${SINGLE_LINE_HEIGHT}px`
      textarea.style.overflowY = 'hidden'
      setExpanded(false)
      return
    }

    mirror.textContent = value.endsWith('\n') ? `${value}\u00a0` : value
    textarea.style.height = `${SINGLE_LINE_HEIGHT}px`
    const contentHeight = Math.max(SINGLE_LINE_HEIGHT, mirror.scrollHeight)
    const nextHeight = Math.min(MAX_INPUT_HEIGHT, contentHeight)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = contentHeight > MAX_INPUT_HEIGHT ? 'auto' : 'hidden'
    setExpanded(nextHeight > SINGLE_LINE_HEIGHT + 4)
  }, [value, embedded])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    if (clearOnSubmit) setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault()
      submit()
    }
  }

  const formClasses = [
    styles.formControl,
    embedded ? styles.formControlEmbedded : '',
    focused ? styles.formControlFocused : '',
    mode === 'ring' ? styles.formControlRing : '',
    mode === 'waiting' ? styles.formControlWaiting : '',
    expanded ? styles.formControlExpanded : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={formClasses}>
      <div ref={boxRef} className={`${styles.inputBox}${expanded ? ` ${styles.inputBoxExpanded}` : ''}`}>
        <div className={styles.inputAura} aria-hidden="true" />
        <div className={styles.borderBase} aria-hidden="true" />
        <div
          className={`${styles.borderTrack} ${mode === 'waiting' ? styles.borderWaiting : styles.borderTravelers}`}
          aria-hidden="true"
        />
        <div className={styles.borderRing} aria-hidden="true" />
        <div className={styles.inputShell}>
          <div className={styles.inputArea}>
            <div ref={mirrorRef} className={`${styles.measureMirror} ${styles.fieldPad}`} aria-hidden="true" />
            {showTypewriter ? (
              <div className={`${styles.typewriter} ${styles.fieldPad}`} aria-hidden="true">
                <span className={styles.typewriterInner}>
                  <span className={styles.typewriterText}>{placeholderLine}</span>
                  <span className={styles.cursor} />
                </span>
              </div>
            ) : null}
            <textarea
              ref={textareaRef}
              className={`${styles.input} ${styles.fieldPad}${showTypewriter ? ` ${styles.inputGhost}` : ''}`}
              value={value}
              rows={1}
              placeholder={showSuggestions ? undefined : 'Ask a follow-up…'}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label="Ask London Copilot"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
          </div>
          <button
            type="button"
            className={`${styles.submit}${canSubmit ? ` ${styles.submitActive}` : ''}`}
            onClick={submit}
            disabled={!canSubmit}
            aria-label="Send question"
          >
            <ArrowUp className={styles.submitIcon} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
