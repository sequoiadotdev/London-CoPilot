import type {
	Coordinates,
	RouteStep,
	RoutingData,
} from "@contract/query.types";
import { type LngLat, polylineToLngLat, toLngLat } from "@/lib/map/adapters";
import { fetchOsrmGeometry, type OsrmProfile } from "@/lib/map/osrmGeometry";
import {
	parseRouteStepMeta,
	type RouteStepMeta,
} from "@/lib/map/routeStepMeta";
import { styleForStep } from "@/lib/map/tflLineColors";

export interface RouteSegment {
	stepIndex: number;
	step: RouteStep;
	meta: RouteStepMeta;
	coordinates: LngLat[];
	mode: RouteStep["mode"];
	instruction: string;
	color: string;
	width: number;
	opacity: number;
	dashArray?: [number, number];
	/** Start of leg for mode icon placement */
	iconPosition: LngLat;
}

function stepHasPolyline(step: RouteStep): boolean {
	return !!step.polyline && step.polyline.length >= 2;
}

function coordsForStepPolyline(step: RouteStep): LngLat[] | null {
	if (!stepHasPolyline(step)) return null;
	return polylineToLngLat(step.polyline!);
}

function osrmProfileForMode(mode: RouteStep["mode"]): OsrmProfile {
	if (mode === "walk") return "foot";
	if (mode === "cycle") return "bike";
	return "driving";
}

function shouldUseOsrm(mode: RouteStep["mode"]): boolean {
	return mode === "walk" || mode === "cycle" || mode === "bus";
}

const MAX_ENRICHED_DISTANCE_MULTIPLIER = 3.5;
const MAX_ENRICHED_SEGMENT_METERS = 40_000;

function distanceMeters(a: LngLat, b: LngLat): number {
	const radius = 6_371_000;
	const toRad = (value: number) => (value * Math.PI) / 180;
	const dLat = toRad(b[1] - a[1]);
	const dLng = toRad(b[0] - a[0]);
	const lat1 = toRad(a[1]);
	const lat2 = toRad(b[1]);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * radius * Math.asin(Math.sqrt(h));
}

function pathDistanceMeters(coords: LngLat[]): number {
	let total = 0;
	for (let i = 1; i < coords.length; i++) {
		total += distanceMeters(coords[i - 1]!, coords[i]!);
	}
	return total;
}

function saneEnrichedGeometry(coords: LngLat[], from: LngLat, to: LngLat): boolean {
	if (coords.length < 2) return false;

	const direct = Math.max(1, distanceMeters(from, to));
	const path = pathDistanceMeters(coords);
	if (path > MAX_ENRICHED_SEGMENT_METERS) return false;
	if (path > direct * MAX_ENRICHED_DISTANCE_MULTIPLIER) return false;

	const first = coords[0]!;
	const last = coords[coords.length - 1]!;
	return distanceMeters(first, from) <= Math.max(350, direct * 0.2) &&
		distanceMeters(last, to) <= Math.max(350, direct * 0.2);
}

/** Legacy proportional split — last resort when no step geometry exists */
export function splitPolylineBySteps(
	polyline: RoutingData["polyline"],
	steps: RouteStep[],
): LngLat[][] {
	const coords = polylineToLngLat(polyline);
	if (coords.length < 2 || steps.length === 0)
		return coords.length >= 2 ? [coords] : [];

	const totalMins = steps.reduce(
		(sum, s) => sum + Math.max(1, s.durationMinutes),
		0,
	);
	const segments: LngLat[][] = [];
	let idx = 0;

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i]!;
		const isLast = i === steps.length - 1;
		const share = Math.max(1, step.durationMinutes) / totalMins;
		const remaining = coords.length - idx;
		const pointCount = isLast
			? remaining
			: Math.max(2, Math.round(share * (coords.length - 1)));

		const end = Math.min(coords.length, idx + pointCount);
		if (end - idx >= 2) {
			segments.push(coords.slice(idx, end));
			idx = end - 1;
		}
	}

	if (segments.length === 0 && coords.length >= 2) {
		segments.push(coords);
	}

	return segments;
}

function resolveStepEndpoints(
	data: RoutingData,
	splitPolylines: LngLat[][],
): Array<{ from: LngLat; to: LngLat }> {
	return data.steps.map((step, i) => {
		if (step.fromCoords && step.toCoords) {
			return { from: toLngLat(step.fromCoords), to: toLngLat(step.toCoords) };
		}

		const seg = splitPolylines[i];
		if (seg && seg.length >= 2) {
			return { from: seg[0]!, to: seg[seg.length - 1]! };
		}

		if (i === 0) {
			const last = data.steps.length - 1;
			const end =
				data.steps[last]?.toCoords ??
				({
					lat: data.destination.lat,
					lng: data.destination.lng,
				} satisfies Coordinates);
			return {
				from: toLngLat(data.origin),
				to: toLngLat(end),
			};
		}

		if (i === data.steps.length - 1) {
			const start =
				data.steps[0]?.fromCoords ??
				({ lat: data.origin.lat, lng: data.origin.lng } satisfies Coordinates);
			return {
				from: toLngLat(start),
				to: toLngLat(data.destination),
			};
		}

		const prev = splitPolylines[i - 1];
		const next = splitPolylines[i + 1];
		if (prev?.length && next?.length) {
			return { from: prev[prev.length - 1]!, to: next[0]! };
		}

		return {
			from: toLngLat(data.origin),
			to: toLngLat(data.destination),
		};
	});
}

function segmentFromCoords(
	step: RouteStep,
	stepIndex: number,
	coords: LngLat[],
): RouteSegment | null {
	if (coords.length < 2) return null;
	const style = styleForStep(step.mode, step.instruction, step.lineName);
	const meta = parseRouteStepMeta(step);
	return {
		stepIndex,
		step,
		meta,
		coordinates: coords,
		mode: step.mode,
		instruction: step.instruction,
		color: meta.lineColor || style.color,
		width: style.width,
		opacity: style.opacity,
		dashArray: style.dashArray,
		iconPosition: coords[0]!,
	};
}

/** Synchronous build — uses per-step polylines when present */
export function buildRouteSegments(data: RoutingData): RouteSegment[] {
	const split = splitPolylineBySteps(data.polyline, data.steps);
	const allHavePolylines = data.steps.every(stepHasPolyline);

	if (allHavePolylines) {
		return data.steps
			.map((step, i) =>
				segmentFromCoords(step, i, coordsForStepPolyline(step)!),
			)
			.filter((s): s is RouteSegment => s !== null);
	}

	const endpoints = resolveStepEndpoints(data, split);

	return data.steps
		.map((step, i) => {
			const fromPolyline = coordsForStepPolyline(step);
			if (fromPolyline) return segmentFromCoords(step, i, fromPolyline);

			const ep = endpoints[i]!;
			return segmentFromCoords(step, i, [ep.from, ep.to]);
		})
		.filter((s): s is RouteSegment => s !== null);
}

/** Async enrichment — OSRM for walk/bus/cycle legs missing geometry */
export async function enrichRouteSegments(
	data: RoutingData,
): Promise<RouteSegment[]> {
	const split = splitPolylineBySteps(data.polyline, data.steps);
	const endpoints = resolveStepEndpoints(data, split);
	const segments = await Promise.all(data.steps.map(async (step, i) => {
		let coords = coordsForStepPolyline(step);

		if (!coords) {
			const ep = endpoints[i]!;
			if (shouldUseOsrm(step.mode)) {
				const enriched = await fetchOsrmGeometry(
					ep.from,
					ep.to,
					osrmProfileForMode(step.mode),
				);
				coords = saneEnrichedGeometry(enriched, ep.from, ep.to)
					? enriched
					: [ep.from, ep.to];
			} else {
				coords = [ep.from, ep.to];
			}
		}

		return segmentFromCoords(step, i, coords);
	}));

	return segments.filter((s): s is RouteSegment => s !== null);
}

export function allSegmentCoordinates(segments: RouteSegment[]): LngLat[] {
	return segments.flatMap((s) => s.coordinates);
}
