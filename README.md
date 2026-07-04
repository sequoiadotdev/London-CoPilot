# London Copilot

The AI operating system for living in London.

London Copilot is a hackathon MVP built around one prompt box and one map. It answers everyday London questions across three flows:

- Should I live here? Neighbourhood reports using transport, safety, air quality, amenities, green space, schools, accessibility, planning, and property context.
- Plan my journey. Live TfL-powered route planning with rail-first routing, station lookup, accessibility preferences, disruptions, and map route geometry.
- What should I do? Short itinerary planning based on time, budget, weather, location, and nearby places.

## Demo Prompts

Try these once the frontend and backend are running:

```text
Should I rent 123 High Street, Hackney?
```

```text
Take me to Romford by train
```

```text
I have 3 hours and GBP 20, recommend me what to do
```

```text
Can you get me to a train station in Dagenham?
```

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn-style components, MapLibre/Mapbox GL, Motion
- Backend: ASP.NET Core Web API on .NET 10
- Shared contract: TypeScript API types in `contract/query.types.ts`
- Data sources: TfL Unified API, OpenStreetMap/Nominatim, Overpass, Postcodes.io, Police.uk, Open-Meteo, optional Foursquare Places, optional Gemini

## Repository Structure

```text
.
|-- Backend/                 # ASP.NET Core API
|   `-- Backend/
|-- contract/                # Shared query/response contract and examples
|-- london-copilot/          # Next.js frontend
|-- workspace/               # Design notes and local experiment files
`-- CONTINUE.md              # Implementation notes and backlog
```

## Prerequisites

- Node.js 20+
- npm
- .NET SDK 10
- TfL API key for live journey planning
- Optional: Gemini API key for AI summaries
- Optional: Foursquare API key for richer activity/place data

## Environment Setup

Do not commit real API keys. Use local ignored files only.

Frontend:

```bash
cd london-copilot
cp .env.example .env.local
```

Set local values in `london-copilot/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5220
BACKEND_URL=http://localhost:5220
GEMINI_API_KEY=your-local-gemini-key
```

Backend:

```bash
cd Backend/Backend
touch appsettings.Development.local.json
```

Use JSON in `Backend/Backend/appsettings.Development.local.json`:

```json
{
  "TFL_API_KEY": "your-local-tfl-key",
  "GEMINI_API_KEY": "your-local-gemini-key",
  "GEMINI_MODEL": "gemini-2.5-flash",
  "FOURSQUARE_API_KEY": "your-local-foursquare-key"
}
```

`appsettings.Development.local.json`, `.env.local`, build outputs, and dependency folders are gitignored.

## Running Locally

Start the backend:

```bash
cd Backend/Backend
dotnet run --urls http://localhost:5220
```

Start the frontend in another terminal:

```bash
cd london-copilot
npm install
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open:

```text
http://localhost:3001
```

## Checks

Backend:

```bash
cd Backend
dotnet build Backend.sln
```

Frontend:

```bash
cd london-copilot
npm run typecheck
```

Optional formatting/linting:

```bash
cd london-copilot
npm run check
```

## API

The backend exposes:

```text
POST http://localhost:5220/query
```

Example:

```bash
curl -X POST http://localhost:5220/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Take me to Romford by train",
    "location": { "lat": 51.5308, "lng": -0.1238 }
  }'
```

The response shape is documented in `contract/query.types.ts`.

## Security Notes

- No real credentials should be committed to this repository.
- Keep API keys in `.env.local`, environment variables, or `appsettings.Development.local.json`.
- Before pushing, check for secrets with:

```bash
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  "(AIza|GEMINI_API_KEY|TFL_API_KEY|FOURSQUARE_API_KEY|secret|token)" .
```

- Placeholder values in `.env.example` and empty values in `appsettings.json` are intentional.

## Current Status

This is a polished MVP/demo rather than a production transport planner. Some flows use live APIs, while fallback/demo data is used when optional providers are unavailable.
