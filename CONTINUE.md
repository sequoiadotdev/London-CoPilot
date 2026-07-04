# London Copilot — Continuation Guide

Handoff doc for picking up development. Covers what exists, how to run it, and what still needs doing.

## Quick start

```bash
# Terminal 1 — backend (.NET, port 5220)
cd Backend/Backend
dotnet run

# Terminal 2 — frontend (Next.js, port 3001)
cd london-copilot
cp .env.example .env.local   # set BACKEND_URL=http://localhost:5220
npm install
npm run dev -- --port 3001
```

Open **http://localhost:3001/experiment** — this is the main UI in active development.

If the dev server breaks after a build, clear the cache:

```bash
cd london-copilot && rm -rf .next && npm run dev -- --port 3001
```

### Environment

| Location | Keys |
|----------|------|
| `london-copilot/.env.local` | `BACKEND_URL`, optional `LOGO_DEV_PUBLISHABLE_KEY` (`pk_…`) |
| `Backend/Backend/appsettings.Development.local.json` | `TFL_API_KEY`, `FOURSQUARE_API_KEY`, `GEMINI_API_KEY` |

Without TfL keys the backend falls back to mock routing/housing responses in `MockResponses.cs`.

---

## What’s built

### Experiment UI (`/experiment`)

- Dark glass chat panel with localStorage history (v2)
- Full-screen mapcn map (Carto dark basemap)
- Three query modes via backend intent: **housing**, **routing**, **activity**
- Housing: insight cards, scores, clickable map pins, Foursquare place popups
- Routing: multi-colour legs on map (walk = aqua dotted + animated dash, bus = red, tube = TfL line colour)
- Clickable leg icons + map popup (`RouteLegPopup`) with line name, direction, stops, from/to
- Glass panel **Journey legs** list synced with map selection (`selectedRouteLeg`)
- Per-leg geometry: TfL leg polylines (backend) + OSRM fallback for walk/bus (`/api/route/geometry`)

### Backend

- `QueryOrchestrator` — intent detection, geocoding, multi-source fetch
- Services: TfL (journey + disruptions), weather, crime, air quality, OSM, places, LLM summary
- `TflService.PlanJourneyAsync` — extracts per-leg `polyline`, `lineName`, `direction`, `stopCount`, station coords
- Contract: `contract/query.types.ts` ↔ `Backend/Models/QueryContract.cs`

### Key frontend files

| Area | Files |
|------|-------|
| Page | `london-copilot/src/app/experiment/page.tsx` |
| Map | `ExperimentMapBackground.tsx`, `QueryMapEffects.tsx`, `RoutingMapEffects.tsx`, `RouteMapLayers.tsx` |
| Route logic | `lib/map/routeSegments.ts`, `routeStepMeta.ts`, `tflLineColors.ts`, `osrmGeometry.ts` |
| Route UI | `RouteLegPopup.tsx`, `RouteLegStepCard.tsx` |
| Adapter | `lib/api/adaptBackendResponse.ts` (`EnrichedAnswer.routing`) |
| Glass panel | `ExperimentGlassPanel.tsx` |

---

## Priority backlog

### 1. Routing — make it feel “real” (highest impact)

- [x] **Fly to selected leg** — when a leg is clicked (map or panel), `fitBounds` to that segment’s coordinates, not just the whole journey
- [ ] **Multiple route options** — TfL returns several journeys; backend currently takes `[0]` only. Expose alternatives and add the OSRM-style picker UI on map/glass panel
- [x] **Departure times** — add `departureTime` / `arrivalTime` per leg from TfL; show in popup and leg cards (“Board at 18:42”)
- [x] **Platform & interchange hints** — TfL leg has `departurePlatform`, `interchange`; surface in `RouteLegPopup`
- [ ] **Bus route detail** — ensure `routeNumber` and headsign parse reliably; show bus stop names for board/alight
- [x] **Tube track geometry** — when TfL omits `path.lineString`, tube/rail legs fall back to OSM/Overpass route geometry before using a straight station-to-station line
- [ ] **Northern line visibility** — white line on dark map needs a dark outline or halo on `MapRoute`

### 2. Routing — preferences & demo flow (“Get me home”)

- [ ] **Preference toggles in UI** — step-free, avoid disruptions, safest walk; send to backend (orchestrator already accepts preferences in places)
- [ ] **Reroute demo** — wire `MockResponses.RoutingRerouted` or live disruption trigger; show `rerouteNotice` prominently and animate route swap
- [x] **Distance fix** — `TflService` uses `duration * 150` for `DistanceMeters`; use actual journey distance from TfL if available

### 3. Map & interaction polish

- [ ] **Marching-ants tuning** — walk dash animation exists on `MapRoute` (`animatedDash`); verify performance with multiple walk legs and tune speed
- [ ] **Marker hit targets** — confirm leg icons are easy to tap on mobile (`pointer-events-auto`, adequate size)
- [x] **Close popup on map click** — deselect leg when clicking empty map
- [ ] **End-of-leg markers** — optional station dot + label at tube/bus alight points when leg selected

### 4. Housing & activity modes

- [ ] **Activity itinerary on map** — pins + timeline similar to routing (currently partial via `QueryMapEffects`)
- [ ] **Insight → map focus** — already works; ensure all insight categories have pins from backend
- [ ] **Postcode / vague queries** — geocoding + GPS fallback was fixed; add regression tests for “recommend coffee near me”

### 5. Data & API hardening

- [ ] **Self-hosted OSRM** — public `router.project.osrm.org` is dev-only; add config URL and rate limiting
- [ ] **Chat history v3** — bump `STORAGE_VERSION` in `useChatHistory.ts` so old entries without `routing` don’t show broken maps (or migrate stored answers)
- [ ] **Foursquare reviews** — needs `FOURSQUARE_API_KEY` in backend; `/api/place` proxy exists
- [ ] **Real logos** — optional `LOGO_DEV_PUBLISHABLE_KEY` (`pk_`); secret `sk_` keys must not go client-side

### 6. Product / pitch readiness

- [ ] **Replace generic T3 README** — `london-copilot/README.md` is still the create-t3-app boilerplate
- [ ] **Promote `/experiment` or merge into home** — main `/` may still be placeholder
- [ ] **2-minute demo script** — three flows from `workspace/README.md`: flat report, get me home, £20 tonight
- [ ] **No “live data dashboard” aesthetic** — user preference: avoid raw API dumps, live badges everywhere; keep polished cards

### 7. Repo hygiene

- [ ] **Commit untracked work** — large set of new files (services, experiment components) still uncommitted per last git status
- [ ] **OpenAPI package warning** — `Microsoft.OpenApi` 2.0.0 NU1903 on backend build
- [ ] **CI** — add typecheck + `dotnet build` on PR

---

## Suggested next session (2–3 hours)

1. Implement **fly-to selected leg** in `RoutingMapEffects.tsx` when `selectedRouteIndex` changes.
2. Extend **RouteStep** + TfL parser with **departure/arrival ISO times** and show them in `RouteLegPopup`.
3. Add **journey preference toggles** above the query input on routing queries (or a small chip row in the glass panel).
4. Fetch **second TfL journey** as an alternative and render a simple “Route A / Route B” switcher.

---

## Architecture sketch

```
User query
    → postQuery (frontend)
    → /api/query (Next proxy)
    → QueryOrchestrator (backend)
        → IntentDetector
        → GeocodingService / GPS fallback
        → TflService | PlacesService | WeatherService | …
        → LlmSummaryService
    → adaptBackendResponse → EnrichedAnswer
    → ExperimentGlassPanel (text) + ExperimentMapBackground (map)

Routing map path:
    EnrichedAnswer.routing
    → useRouteSegments (OSRM enrich if needed)
    → RouteMapLayers (MapRoute + icons + popup)
    ↔ selectedRouteLeg state in experiment/page.tsx
```

---

## Reference

- Product shape & demo flows: [`workspace/README.md`](workspace/README.md)
- Design notes: [`workspace/notes/design-notes.md`](workspace/notes/design-notes.md)
- API contract: [`contract/query.types.ts`](contract/query.types.ts)
- Mock routing data: [`Backend/Backend/MockResponses.cs`](Backend/Backend/MockResponses.cs)

---

## Known issues

| Issue | Workaround |
|-------|------------|
| Port 5220 in use | `lsof -ti:5220 \| xargs kill -9` then `dotnet run` |
| `.next` corruption | `rm -rf .next` and restart dev server |
| Cached chats missing route geometry | Re-run routing query or bump chat storage version |
| TfL keys missing | Uses mock responses; geometry is approximate |
| OSRM public server slow/blocked | Per-leg falls back to straight line between endpoints |

---

*Last updated: July 2026 — after route geometry, clickable leg details, and animated walk segments.*
