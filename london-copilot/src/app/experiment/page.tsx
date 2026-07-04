'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import TravelingInput from '@/components/london/TravelingInput'
import ExperimentGlassPanel from '@/components/london/ExperimentGlassPanel'
import { useChatHistory } from '@/components/london/useChatHistory'
import { useIpLocation } from '@/components/london/useIpLocation'
import type { PlaceFocus } from '@/components/london/placeFocus'
import { buildPlaceFocusFromPin } from '@/components/london/placeFocus'
import { adaptBackendResponse, extractParsed } from '@/lib/api/adaptBackendResponse'
import { postQuery } from '@/lib/api/query'
import { extractFocus } from '@/lib/ai/parseAnswer'
import { LED_BG_SOFT } from '@/components/london/londonTheme'

const ExperimentMapBackground = dynamic(
  () => import('@/components/london/ExperimentMapBackground'),
  { ssr: false },
)

const ASCIIText = dynamic(() => import('@/components/london/ASCIIText'), {
  ssr: false,
})

const PROJECT_TITLE = 'London Copilot'

const TITLE_ASCII_SETTINGS = {
  textFontSize: 200,
  planeBaseHeight: 10,
  asciiFontSize: 8,
}

export default function ExperimentPage() {
  const [loading, setLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceFocus | null>(null)
  const [selectedRouteLeg, setSelectedRouteLeg] = useState<number | null>(null)
  const { origin } = useIpLocation()

  const {
    entries,
    activeEntryId,
    activeAnswer,
    hydrated,
    hasHistory,
    appendEntry,
    completeEntry,
    failEntry,
    selectEntry,
    clearHistory,
  } = useChatHistory()

  const hasQueried = hasHistory || loading

  const parsed = useMemo(() => extractParsed(activeAnswer), [activeAnswer])
  const defaultFocus = useMemo(() => extractFocus(parsed), [parsed])
  const routingData = activeAnswer?.routing ?? null
  const isRouting = activeAnswer?.intent === 'routing' && !!routingData

  useEffect(() => {
    setSelectedPlace(null)
    setSelectedRouteLeg(null)
  }, [activeEntryId])

  const queryFocus = useMemo<PlaceFocus | null>(() => {
    if (isRouting) return null
    if (selectedPlace) return selectedPlace
    if (defaultFocus) {
      return buildPlaceFocusFromPin({
        lat: defaultFocus.lat,
        lng: defaultFocus.lng,
        label: defaultFocus.label,
        kind: 'property',
      })
    }
    if (hasQueried && (loading || chatError)) {
      return {
        lat: origin.lat,
        lng: origin.lng,
        label: origin.city,
        category: 'Your location',
        kind: 'property',
      }
    }
    return null
  }, [isRouting, selectedPlace, defaultFocus, hasQueried, loading, chatError, origin.city, origin.lat, origin.lng])

  const handleSubmit = useCallback(
    async (query: string) => {
      setChatError(null)
      setLoading(true)
      setSelectedPlace(null)
      setSelectedRouteLeg(null)
      const entryId = appendEntry(query)

      try {
        const response = await postQuery({
          query,
          location: { lat: origin.lat, lng: origin.lng },
        })
        const enriched = adaptBackendResponse(response)
        completeEntry(entryId, enriched)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not reach the London Copilot backend.'
        setChatError(message)
        failEntry(entryId)
      } finally {
        setLoading(false)
      }
    },
    [appendEntry, completeEntry, failEntry, origin.lat, origin.lng],
  )

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setChatError(null)
    setSelectedPlace(null)
  }, [clearHistory])

  if (!hydrated) {
    return <div className="h-screen w-full" style={{ backgroundColor: LED_BG_SOFT }} />
  }

  if (!hasQueried) {
    return (
      <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: LED_BG_SOFT }}>
        <div className="absolute inset-0" aria-hidden="true">
          <ExperimentMapBackground />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_0%,rgba(0,0,0,0.45)_100%)]"
          aria-hidden="true"
        />
        <main className="relative z-10 flex h-full flex-col items-center justify-center gap-2 p-4">
          <div className="relative h-52 w-full max-w-4xl shrink-0 px-2">
            <ASCIIText
              text={PROJECT_TITLE}
              textColor="#ffffff"
              enableWaves
              waveStrength={0.32}
              {...TITLE_ASCII_SETTINGS}
            />
          </div>
          <TravelingInput loading={loading} onSubmit={handleSubmit} showSuggestions />
        </main>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: LED_BG_SOFT }}>
      <ExperimentMapBackground
        queryActive={!!queryFocus || isRouting}
        queryFocus={queryFocus}
        routing={routingData}
        selectedRouteLeg={selectedRouteLeg}
        onSelectRouteLeg={setSelectedRouteLeg}
        pins={activeAnswer?.pins ?? []}
        onSelectPlace={setSelectedPlace}
        onUserIdle={() => setSelectedPlace(null)}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_0%_50%,rgba(0,0,0,0.55)_0%,transparent_55%)]"
        aria-hidden="true"
      />
      <ExperimentGlassPanel
        entries={entries}
        activeEntryId={activeEntryId}
        activeAnswer={activeAnswer}
        loading={loading}
        error={chatError}
        locationLabel={queryFocus?.label}
        onSubmit={handleSubmit}
        onSelectEntry={selectEntry}
        onClearHistory={handleClearHistory}
        onSelectPlace={setSelectedPlace}
        selectedPlace={selectedPlace}
        selectedRouteLeg={selectedRouteLeg}
        onSelectRouteLeg={setSelectedRouteLeg}
      />
    </div>
  )
}
