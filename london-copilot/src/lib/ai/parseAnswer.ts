import type { ParsedAnswer } from '@/components/london/AnswerCard'

export function parseAnswer(raw: string): ParsedAnswer | null {
  if (!raw.trim()) return null

  try {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/)
    const candidate = fenced?.[1]?.trim() ?? raw.trim()

    const jsonStart = candidate.indexOf('{')
    const jsonEnd = candidate.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return null

    const parsed = JSON.parse(candidate.slice(jsonStart, jsonEnd + 1))
    if (!parsed.type || !['housing', 'route', 'itinerary'].includes(parsed.type)) return null
    return parsed as ParsedAnswer
  } catch {
    return null
  }
}

export interface MapFocus {
  lng: number
  lat: number
  label: string
}

export interface MapPin {
  lng: number
  lat: number
  label: string
  color: string
}

export function extractFocus(answer: ParsedAnswer | null): MapFocus | null {
  if (!answer) return null

  if (answer.type === 'housing' && answer.areas[0]) {
    const area = answer.areas[0]
    return { lng: area.coordinates.lng, lat: area.coordinates.lat, label: area.name }
  }

  if (answer.type === 'itinerary' && answer.slots[0]) {
    const slot = answer.slots[0]
    return { lng: slot.coordinates.lng, lat: slot.coordinates.lat, label: slot.place }
  }

  if (answer.type === 'route' && answer.focus) {
    return {
      lng: answer.focus.lng,
      lat: answer.focus.lat,
      label: answer.focus.name,
    }
  }

  return null
}

export function extractPins(answer: ParsedAnswer | null): MapPin[] {
  if (!answer) return []

  if (answer.type === 'housing') {
    return answer.areas.map(area => ({
      lng: area.coordinates.lng,
      lat: area.coordinates.lat,
      label: area.name,
      color: '#fdfbd4',
    }))
  }

  if (answer.type === 'itinerary') {
    return answer.slots.map(slot => ({
      lng: slot.coordinates.lng,
      lat: slot.coordinates.lat,
      label: slot.place,
      color: '#fdfbd4',
    }))
  }

  if (answer.type === 'route' && answer.focus) {
    return [{
      lng: answer.focus.lng,
      lat: answer.focus.lat,
      label: answer.focus.name,
      color: '#fdfbd4',
    }]
  }

  return []
}
