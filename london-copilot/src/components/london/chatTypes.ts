import type { EnrichedAnswer } from '@/lib/api/adaptBackendResponse'

export interface ChatEntry {
  id: string
  query: string
  answer: EnrichedAnswer | null
  streaming: boolean
  createdAt: number
}

export interface ChatHistoryState {
  entries: ChatEntry[]
  activeEntryId: string | null
}

export function createChatEntry(query: string): ChatEntry {
  return {
    id: crypto.randomUUID(),
    query,
    answer: null,
    streaming: true,
    createdAt: Date.now(),
  }
}
