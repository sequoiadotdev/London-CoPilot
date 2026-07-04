'use client'

import { useMemo } from 'react'
import type { RoutingData } from '@contract/query.types'
import { MapMarker, MarkerContent, MarkerLabel, MapRoute } from '@/components/ui/map'
import {
  findTubeLine,
  lineColorForId,
  lineIdForStep,
  stationsForStep,
  TUBE_LINES,
  type TubeLine,
} from '@/lib/map/tubeTopology'
import { parseRouteStepMeta } from '@/lib/map/routeStepMeta'

interface TubeNetworkLayersProps {
  routing: RoutingData
  selectedLegIndex?: number | null
}

export default function TubeNetworkLayers({
  routing,
  selectedLegIndex = null,
}: TubeNetworkLayersProps) {
  const selectedStep =
    selectedLegIndex != null && selectedLegIndex >= 0
      ? routing.steps[selectedLegIndex]
      : null

  const highlightedLineId = useMemo(() => {
    if (!selectedStep || (selectedStep.mode !== 'tube' && selectedStep.mode !== 'rail')) {
      return null
    }
    return lineIdForStep(selectedStep)
  }, [selectedStep])

  const selectedMeta = selectedStep ? parseRouteStepMeta(selectedStep) : null
  const selectedStations = selectedStep ? stationsForStep(selectedStep) : null

  const renderLine = (line: TubeLine, highlighted: boolean) => {
    if (line.coordinates.length < 2) return null
    const color = line.color || lineColorForId(line.id)
    return (
      <MapRoute
        key={`tube-net-${line.id}-${highlighted ? 'hi' : 'bg'}`}
        id={`tube-net-${line.id}-${highlighted ? 'hi' : 'bg'}`}
        coordinates={line.coordinates}
        color={color}
        width={highlighted ? 5 : 2}
        opacity={highlighted ? 0.85 : 0.14}
        interactive={false}
      />
    )
  }

  return (
    <>
      {TUBE_LINES.map(line => {
        const isHighlighted = highlightedLineId === line.id
        if (highlightedLineId && !isHighlighted) {
          return renderLine(line, false)
        }
        if (!highlightedLineId) {
          return renderLine(line, false)
        }
        return null
      })}

      {highlightedLineId
        ? (() => {
            const line = findTubeLine(highlightedLineId)
            return line ? renderLine(line, true) : null
          })()
        : null}

      {selectedStep && selectedMeta && (selectedStep.mode === 'tube' || selectedStep.mode === 'rail') ? (
        <>
          {selectedStations?.from ? (
            <MapMarker
              longitude={selectedStations.from.lng}
              latitude={selectedStations.from.lat}
            >
              <MarkerContent>
                <div
                  className="size-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedMeta.lineColor }}
                />
                <MarkerLabel position="top">{selectedStations.from.name}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ) : selectedStep.fromCoords ? (
            <MapMarker
              longitude={selectedStep.fromCoords.lng}
              latitude={selectedStep.fromCoords.lat}
            >
              <MarkerContent>
                <div
                  className="size-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedMeta.lineColor }}
                />
                <MarkerLabel position="top">{selectedStep.from ?? 'Board here'}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ) : null}

          {selectedStations?.to ? (
            <MapMarker
              longitude={selectedStations.to.lng}
              latitude={selectedStations.to.lat}
            >
              <MarkerContent>
                <div
                  className="size-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedMeta.lineColor }}
                />
                <MarkerLabel position="bottom">{selectedStations.to.name}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ) : selectedStep.toCoords ? (
            <MapMarker
              longitude={selectedStep.toCoords.lng}
              latitude={selectedStep.toCoords.lat}
            >
              <MarkerContent>
                <div
                  className="size-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedMeta.lineColor }}
                />
                <MarkerLabel position="bottom">{selectedStep.to ?? 'Alight here'}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ) : null}
        </>
      ) : null}
    </>
  )
}
