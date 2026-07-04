import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
} from 'ai'
import { env } from '@/env'
import { buildMockAnswer, extractLastUserText } from '@/lib/ai/mockAnswer'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are London Copilot — an expert AI assistant for living in, navigating, and exploring London.

You help users with three types of queries, and you MUST format your answer as valid JSON inside a \`\`\`json code block.

## Response Schema

For HOUSING queries (rent, buy, neighbourhoods, property):
\`\`\`json
{
  "type": "housing",
  "title": "string",
  "summary": "string (2-3 sentences)",
  "areas": [
    {
      "name": "string (London area name)",
      "avgRent": "string (e.g. £1,800/mo for 1-bed)",
      "vibe": "string (1 sentence describing the neighbourhood)",
      "pros": ["string", "string", "string"],
      "transportScore": "number (1-10)",
      "coordinates": { "lng": number, "lat": number }
    }
  ],
  "tip": "string (a practical insider tip)"
}
\`\`\`

For ROUTE / DIRECTIONS queries (getting from A to B, transport options):
\`\`\`json
{
  "type": "route",
  "title": "string",
  "summary": "string (2-3 sentences)",
  "focus": {
    "name": "string (primary destination or landmark name)",
    "lng": number,
    "lat": number
  },
  "options": [
    {
      "mode": "string (e.g. Tube, Bus, Walking, Overground)",
      "duration": "string (e.g. 22 min)",
      "cost": "string (e.g. £2.80 with Oyster)",
      "steps": ["string", "string", "string"],
      "emoji": "string (single transport emoji)"
    }
  ],
  "tip": "string"
}
\`\`\`

For ITINERARY / THINGS TO DO queries (what to do, visit, eat, explore):
\`\`\`json
{
  "type": "itinerary",
  "title": "string",
  "summary": "string (2-3 sentences)",
  "slots": [
    {
      "time": "string (e.g. Morning, 10:00 AM)",
      "place": "string",
      "description": "string (1-2 sentences)",
      "coordinates": { "lng": number, "lat": number },
      "duration": "string (e.g. 1.5 hours)",
      "cost": "string (e.g. Free, £15)"
    }
  ],
  "tip": "string"
}
\`\`\`

Rules:
- Always return ONLY the JSON block. No prose before or after.
- Use real London coordinates (WGS84 decimal degrees).
- Coordinates for landmarks must be accurate to within ~100m.
- Keep responses practical, opinionated, and specific to London.
- If a query doesn't clearly fit housing/route/itinerary, default to itinerary.`

async function generateAnswer(messages: UIMessage[], query: string): Promise<{ text: string; source: 'gemini' | 'openai' | 'mock' }> {
  const modelMessages = await convertToModelMessages(messages)

  if (env.GEMINI_API_KEY) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })
      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        instructions: SYSTEM_PROMPT,
        messages: modelMessages,
      })
      if (text.trim()) return { text, source: 'gemini' }
    } catch (error) {
      console.error('[chat/gemini] Gemini request failed:', error)
    }
  }

  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('placeholder')) {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o'),
        instructions: SYSTEM_PROMPT,
        messages: modelMessages,
      })
      if (text.trim()) return { text, source: 'openai' }
    } catch (error) {
      console.error('[chat/gemini] OpenAI fallback failed:', error)
    }
  }

  return { text: buildMockAnswer(query), source: 'mock' }
}

function streamTextAnswer(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const id = 'answer-text'
        writer.write({ type: 'start' })
        writer.write({ type: 'text-start', id })

        const chunkSize = 24
        for (let i = 0; i < text.length; i += chunkSize) {
          writer.write({
            type: 'text-delta',
            id,
            delta: text.slice(i, i + chunkSize),
          })
          await new Promise(resolve => setTimeout(resolve, 12))
        }

        writer.write({ type: 'text-end', id })
        writer.write({ type: 'finish' })
      },
    }),
  })
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const query = extractLastUserText(messages)

  try {
    const { text } = await generateAnswer(messages, query)
    return streamTextAnswer(text)
  } catch (error) {
    console.error('[chat/gemini] Unexpected failure:', error)
    return streamTextAnswer(buildMockAnswer(query))
  }
}
