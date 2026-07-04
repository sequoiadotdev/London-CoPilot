# Frontend Design Notes

## Design Direction

London Copilot should feel like a calm civic command center: useful, smart, and grounded in the city. Avoid a generic SaaS landing page. The first screen should be the actual product experience.

## Layout Concept

- Top: compact brand bar with mode controls.
- Center-left: large conversational search/command input.
- Left panel: AI answer, agent progress, and explainable cards.
- Right/full background: London map with pins, route lines, and area overlays.
- Bottom/side drawer: evidence snippets and data-source cards.

## Visual Tone

- Use a modern city palette with high contrast and practical density.
- Avoid making everything blue, purple, beige, or gradient-heavy.
- Use clear iconography for transport, safety, air, green space, events, and accessibility.
- Keep cards tight and useful; no marketing hero fluff.

## Suggested Main Screens

1. Home command screen
2. Area report screen
3. Journey planner screen
4. Tonight itinerary screen

## Components To Build First

- `CommandBox`
- `ModeTabs`
- `MapCanvas`
- `AgentActivity`
- `AreaScoreGrid`
- `InsightCard`
- `RouteTimeline`
- `ItineraryCard`
- `DataSourceBadge`

## Frontend-Only Mock Data

Until backend APIs are ready, keep representative mock data in the frontend. Mark it clearly as mock data and keep it easy to replace with real API responses.

