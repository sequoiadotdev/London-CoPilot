'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EnrichedAnswer } from '@/lib/api/adaptBackendResponse'
import { type ChatEntry, type ChatHistoryState, createChatEntry } from '@/components/london/chatTypes'

const STORAGE_KEY = 'london-copilot-chat-history'
const STORAGE_VERSION = 2
const MAX_ENTRIES = 30

function normalizeAnswer(answer: EnrichedAnswer | null | undefined): EnrichedAnswer | null {
  if (!answer || typeof answer !== 'object') return null

  const parsed: EnrichedAnswer['parsed'] =
    answer.parsed && typeof answer.parsed === 'object' && 'type' in answer.parsed
      ? answer.parsed
      : {
          type: 'housing',
          title: answer.summary?.slice(0, 48) ?? 'London',
          summary: answer.summary ?? '',
          areas: [],
          tip: '',
        }

  return {
    ...answer,
    parsed,
    summary: answer.summary ?? '',
    insights: Array.isArray(answer.insights) ? answer.insights : [],
    sources: Array.isArray(answer.sources) ? answer.sources : [],
    pins: Array.isArray(answer.pins) ? answer.pins : [],
  }
}

function normalizeEntry(entry: ChatEntry): ChatEntry {
  return {
    ...entry,
    streaming: false,
    answer: normalizeAnswer(entry.answer),
  }
}

function loadHistory(): ChatHistoryState {
  if (typeof window === 'undefined') {
    return { entries: [], activeEntryId: null }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { entries: [], activeEntryId: null }

    const parsed = JSON.parse(raw) as ChatHistoryState & { version?: number }
    if (parsed.version !== STORAGE_VERSION) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      return { entries: [], activeEntryId: null }
    }

    if (!Array.isArray(parsed.entries)) {
      return { entries: [], activeEntryId: null }
    }

    const entries = parsed.entries
      .filter(
        (e): e is ChatEntry =>
          typeof e?.id === 'string' &&
          typeof e?.query === 'string' &&
          typeof e?.createdAt === 'number',
      )
      .map(normalizeEntry)
      .slice(-MAX_ENTRIES)

    const activeEntryId =
      parsed.activeEntryId && entries.some(e => e.id === parsed.activeEntryId)
        ? parsed.activeEntryId
        : (entries.at(-1)?.id ?? null)

    return { entries, activeEntryId }
  } catch {
    return { entries: [], activeEntryId: null }
  }
}

function saveHistory(state: ChatHistoryState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...state }),
    )
  } catch {
    /* quota or private mode */
  }
}

export function useChatHistory() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadHistory()
    setEntries(loaded.entries)
    setActiveEntryId(loaded.activeEntryId)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveHistory({ entries, activeEntryId })
  }, [entries, activeEntryId, hydrated])

  const appendEntry = useCallback((query: string) => {
    const entry = createChatEntry(query)
    setEntries(prev => [...prev, entry].slice(-MAX_ENTRIES))
    setActiveEntryId(entry.id)
    return entry.id
  }, [])

  const completeEntry = useCallback((id: string, answer: EnrichedAnswer) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, answer, streaming: false } : e)),
    )
  }, [])

  const failEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, streaming: false } : e)),
    )
  }, [])

  const selectEntry = useCallback((id: string) => {
    setActiveEntryId(id)
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
    setActiveEntryId(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const activeEntry = entries.find(e => e.id === activeEntryId) ?? entries.at(-1) ?? null
  const activeAnswer = activeEntry?.answer ?? null

  return {
    entries,
    activeEntryId: activeEntry?.id ?? null,
    activeEntry,
    activeAnswer,
    hydrated,
    hasHistory: entries.length > 0,
    appendEntry,
    completeEntry,
    failEntry,
    selectEntry,
    clearHistory,
  }
}
