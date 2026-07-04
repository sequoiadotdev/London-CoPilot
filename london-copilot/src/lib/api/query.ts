import type { QueryRequest, QueryResponse } from '@contract/query.types'

export async function postQuery(body: QueryRequest): Promise<QueryResponse> {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const err = (await res.json()) as { error?: string; hint?: string }
      detail = [err.error, err.hint].filter(Boolean).join(' — ') || detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  return res.json() as Promise<QueryResponse>
}
