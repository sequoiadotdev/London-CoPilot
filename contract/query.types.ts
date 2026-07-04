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

export interface HousingData {
  type: "housing";
  address: string;
  coordinates: Coordinates;
  scores: Score[];
  pins: MapPin[];
}

export interface RouteStep {
  instruction: string;
  mode: "walk" | "tube" | "bus" | "rail" | "cycle";
  durationMinutes: number;
  from?: string;
  to?: string;
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
}

export interface ActivityItem {
  name: string;
  startTime: string; // ISO 8601
  endTime: string;
  costGBP: number;
  category: string;
  coordinates?: Coordinates;
}

export interface ActivityData {
  type: "activity";
  durationHours: number;
  items: ActivityItem[];
}
