/**
 * London Copilot — POST /query API contract
 * Lock this file; frontend and backend both implement against it.
 */

// ─── Request ───────────────────────────────────────────────────────────────

export interface QueryLocation {
  lat: number;
  lng: number;
}

export interface QueryRequest {
  /** Free-text user query */
  query: string;
  /** User's current position (optional; improves routing & activity suggestions) */
  location?: QueryLocation;
}

// ─── Response envelope (same for every intent) ───────────────────────────────

export type Intent = "housing" | "routing" | "activity";

export type ResponseStatus = "complete" | "partial" | "error";

export type SourceStatus = "ok" | "error";

export interface DataSource {
  id: string;
  name: string;
  status: SourceStatus;
  /** Present when status === "error" */
  error?: string;
}

export interface QueryResponse {
  intent: Intent;
  status: ResponseStatus;
  /** Main answer shown to the user */
  summary: string;
  /** Intent-specific payload — see HousingData | RoutingData | ActivityData */
  data: HousingData | RoutingData | ActivityData;
  /** Credibility / "how we got this" UI */
  sources: DataSource[];
  /** Set only when status === "error" and nothing useful could be returned */
  error?: {
    code: string;
    message: string;
  };
}

// ─── Shared primitives ─────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapPin {
  lat: number;
  lng: number;
  label: string;
  /** Hint for icon styling */
  kind: "property" | "transit" | "poi" | "origin" | "destination";
}

// ─── Intent payloads ───────────────────────────────────────────────────────

export interface Score {
  label: string;
  value: number;
  /** e.g. 10 → display as "7.2/10" */
  outOf: number;
}

export interface HousingInsight {
  id: string;
  label: string;
  emoji: string;
  summary: string;
  score?: number | null;
  outOf?: number | null;
}

/** Raw numbers backing housing insights — optional until backend emits them */
export interface HousingFacts {
  crimeCount?: number | null;
  aqi?: number | null;
  pm25?: number | null;
  restaurantCount?: number;
  parkCount?: number;
  schoolCount?: number;
  constructionSites?: number;
  nearbyStations?: string[];
  sampleRestaurants?: string[];
  hiddenGems?: string[];
  stepFreeCount?: number;
  stationCount?: number;
}

export interface HousingData {
  type: "housing";
  address: string;
  coordinates: Coordinates;
  scores: Score[];
  pins: MapPin[];
  insights?: HousingInsight[];
  facts?: HousingFacts;
}

export interface RouteStep {
  instruction: string;
  mode: "walk" | "tube" | "bus" | "rail" | "cycle";
  durationMinutes: number;
  from?: string;
  to?: string;
  /** Per-leg [lat, lng] pairs following streets or track geometry */
  polyline?: [number, number][];
  /** Step start/end when polyline is absent (e.g. OSRM fallback) */
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  /** TfL line or service name, e.g. "Victoria line" */
  lineName?: string | null;
  /** Travel direction, e.g. "Walthamstow Central" */
  direction?: string | null;
  /** Bus route number when applicable */
  routeNumber?: string | null;
  /** Intermediate stops before alighting */
  stopCount?: number | null;
  /** Longer leg description from TfL */
  detailedInstruction?: string | null;
  /** ISO 8601 timestamp when this leg starts */
  departureTime?: string | null;
  /** ISO 8601 timestamp when this leg ends */
  arrivalTime?: string | null;
  /** Platform or stand hint when TfL provides one */
  departurePlatform?: string | null;
  /** Interchange guidance such as change duration or connection hint */
  interchangeHint?: string | null;
  /** TfL leg distance when available */
  distanceMeters?: number | null;
}

export interface RoutingData {
  type: "routing";
  origin: Coordinates & { label?: string };
  destination: Coordinates & { label?: string };
  durationMinutes: number;
  distanceMeters: number;
  /** Ordered [lat, lng] pairs — flip to [lng, lat] for mapcn/MapLibre via toLngLat() */
  polyline: [number, number][];
  steps: RouteStep[];
  preferencesApplied?: string[];
  rerouteNotice?: string | null;
  disruptions?: string[];
  /** ISO 8601 journey start time from TfL when available */
  startDateTime?: string | null;
  /** ISO 8601 journey arrival time from TfL when available */
  arrivalDateTime?: string | null;
}

export interface ActivityItem {
  name: string;
  startTime: string; // ISO 8601
  endTime: string;
  costGBP: number;
  category: string;
  coordinates?: Coordinates;
}

export interface ActivityContext {
  weather?: string | null;
  locationLabel?: string | null;
  budgetGBP?: number | null;
  tempC?: number | null;
}

export interface ActivityData {
  type: "activity";
  durationHours: number;
  items: ActivityItem[];
  totalCostGBP?: number;
  context?: ActivityContext;
}
