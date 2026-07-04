# London Copilot Workspace

Dedicated workspace for **London Copilot**: the AI operating system for living in London.

Use this folder for project notes, demo planning, frontend direction, API contract ideas, and anything we want to keep separate before the main GitHub project structure is pulled in.

Your main contribution area is the frontend. Backend/API work should be treated as notes or suggestions here unless we explicitly decide otherwise.

## Product Shape

- One search box
- One map
- One AI answer surface
- Three core modes:
  - Should I live here?
  - Plan my journey
  - What should I do?

## Frontend Priorities

1. Build a memorable first screen that feels like a real London assistant, not a generic dashboard.
2. Make the search box the primary interaction.
3. Pair conversational answers with map-based evidence.
4. Show agent activity as a polished orchestration layer, not raw logs.
5. Keep demo flows tight enough for a 2-minute pitch.

## Initial Demo Flows

### Should I rent this flat?

Input example:

```text
123 High Street, Hackney
```

Expected UI:

- Address report
- Map with nearby signals
- Area summary
- Scores for transport, safety, green space, air quality, food, schools, accessibility, planning, property, hidden gems
- Natural-language recommendation

### Get me home

Expected UI:

- Live route card
- Step-free/disruption/safety/pollution toggles
- Simulated incident state, such as a lift failure
- Rerouted journey view

### I have £20 and three hours tonight

Expected UI:

- Itinerary cards
- Budget and travel-time summary
- Weather-aware suggestions
- Map pins for events/food/transport
