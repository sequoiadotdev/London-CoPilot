import type { QueryRequest } from '@contract/query.types'
import { env } from '@/env'

export const maxDuration = 60

function backendUrl() {
  return env.BACKEND_URL ?? env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5220'
}

export async function POST(req: Request) {
  let body: QueryRequest

  try {
    body = (await req.json()) as QueryRequest
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.query?.trim()) {
    return Response.json({ error: 'query is required' }, { status: 400 })
  }

  try {
    const res = await fetch(`${backendUrl()}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await res.text()
    if (!res.ok) {
      return Response.json(
        { error: `Backend error (${res.status})`, detail: text.slice(0, 200) },
        { status: res.status },
      )
    }

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not reach the London Copilot backend'
    return Response.json(
      {
        error: message,
        hint: 'Start the backend: cd Backend/Backend && dotnet run',
      },
      { status: 503 },
    )
  }
}
