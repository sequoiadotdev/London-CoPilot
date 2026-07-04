'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import dynamic from 'next/dynamic'
import SearchBox from '@/components/london/SearchBox'
import Sidebar from '@/components/london/Sidebar'
import type { HousingArea, ItinerarySlot, ParsedAnswer } from '@/components/london/AnswerCard'
import type { MapPin } from '@/components/london/MapView'

const MapView = dynamic(() => import('@/components/london/MapView'), { ssr: false })

interface Entry {
  query: string
  answer: ParsedAnswer | null
  streaming: boolean
  raw: string
}

function extractPins(answer: ParsedAnswer | null): MapPin[] {
  if (!answer) return []
  if (answer.type === 'housing') {
    return answer.areas.map((a: HousingArea) => ({
      lng: a.coordinates.lng,
      lat: a.coordinates.lat,
      label: a.name,
      color: '#e5c97e',
    }))
  }
  if (answer.type === 'itinerary') {
    return answer.slots.map((s: ItinerarySlot) => ({
      lng: s.coordinates.lng,
      lat: s.coordinates.lat,
      label: s.place,
      color: '#7eb8e5',
    }))
  }
  return []
}

function parseAnswer(raw: string): ParsedAnswer | null {
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```/)
    if (!match) return null
    const json = match[1]
    if (!json) return null
    const parsed = JSON.parse(json.trim())
    if (!parsed.type || !['housing', 'route', 'itinerary'].includes(parsed.type)) return null
    return parsed as ParsedAnswer
  } catch {
    return null
  }
}

export default function Page() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const loading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (messages.length === 0) return
    const newEntries: Entry[] = []

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (!msg || msg.role !== 'user') continue

      const query = msg.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('')

      const assistantMsg = messages[i + 1]
      if (!assistantMsg || assistantMsg.role !== 'assistant') {
        newEntries.push({ query, answer: null, streaming: loading, raw: '' })
        continue
      }

      const raw = assistantMsg.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('')

      const answer = parseAnswer(raw)
      const isStreaming = i === messages.length - 2 && loading
      newEntries.push({ query, answer, streaming: isStreaming, raw })
    }

    setEntries(newEntries)
  }, [messages, loading])

  const handleSubmit = useCallback((query: string) => {
    setHasSearched(true)
    sendMessage({ text: query })
  }, [sendMessage])

  const pins = useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]
      if (!entry) continue
      const p = extractPins(entry.answer)
      if (p.length > 0) return p
    }
    return []
  }, [entries])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Full-screen map background */}
      <div className="absolute inset-0" aria-hidden="true">
        <MapView pins={pins} activeQuery={hasSearched} />
      </div>

      {/* Centered hero — shown before first search */}
      {!hasSearched && (
        <main className="relative z-10 flex flex-1 items-center justify-center p-4">
          <SearchBox onSubmit={handleSubmit} loading={loading} />
        </main>
      )}

      {/* Slide-in sidebar — shown after first search */}
      {hasSearched && (
        <div className="relative z-10 w-full sm:w-[380px] lg:w-[420px] h-full bg-card/90 backdrop-blur-xl border-r border-border flex flex-col shadow-2xl shadow-black/40">
          <Sidebar entries={entries} onSubmit={handleSubmit} loading={loading} />
        </div>
      )}
    </div>
  )
}
