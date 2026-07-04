import { type NextRequest, NextResponse } from "next/server";

type LngLat = [number, number];

interface OverpassWay {
	type: "way";
	id: number;
	geometry?: Array<{ lat: number; lon: number }>;
}

interface GraphEdge {
	to: string;
	weight: number;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RAILWAY_PATTERN = "subway|rail|light_rail";
const ROUTE_PATTERN = "subway|train|light_rail";
const TFL_NETWORK_PATTERN =
	"London Underground|Elizabeth line|Docklands Light Railway|London Overground|Transport for London";
const MAX_GRAPH_WAYS = 900;
const SNAP_TOLERANCE_METERS = 18;
const MAX_SNAP_NODES = 4_000;

function toRad(value: number) {
	return (value * Math.PI) / 180;
}

function distanceMeters(a: LngLat, b: LngLat) {
	const radius = 6_371_000;
	const dLat = toRad(b[1] - a[1]);
	const dLng = toRad(b[0] - a[0]);
	const lat1 = toRad(a[1]);
	const lat2 = toRad(b[1]);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * radius * Math.asin(Math.sqrt(h));
}

function coordKey(coord: LngLat) {
	return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
}

function safeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineQuery(lineName: string | null) {
	if (!lineName) return null;
	const normalized = lineName
		.replace(/\s+line$/i, "")
		.replace(/^london\s+/i, "")
		.trim();
	return normalized ? safeRegex(normalized) : null;
}

function bboxFor(from: LngLat, to: LngLat) {
	const legDistance = distanceMeters(from, to);
	const margin = Math.min(
		0.08,
		Math.max(0.025, (legDistance / 111_000) * 0.35),
	);
	const south = Math.min(from[1], to[1]) - margin;
	const west = Math.min(from[0], to[0]) - margin;
	const north = Math.max(from[1], to[1]) + margin;
	const east = Math.max(from[0], to[0]) + margin;
	return `${south},${west},${north},${east}`;
}

function buildRelationQuery(from: LngLat, to: LngLat, lineName: string | null) {
	const line = lineQuery(lineName);
	if (!line) return null;
	const bbox = bboxFor(from, to);

	return `
    [out:json][timeout:14];
    (
      rel["type"="route"]["route"~"${ROUTE_PATTERN}"]["network"~"${TFL_NETWORK_PATTERN}",i]["name"~"(^|[^A-Za-z])${line}( line)?([^A-Za-z]|$)",i](${bbox});
      rel["type"="route"]["route"~"${ROUTE_PATTERN}"]["network"~"${TFL_NETWORK_PATTERN}",i]["ref"~"^${line}$",i](${bbox});
    );
    way(r);
    out geom;
  `;
}

function buildRailwayQuery(from: LngLat, to: LngLat) {
	const bbox = bboxFor(from, to);

	return `
    [out:json][timeout:14];
    way["railway"~"${RAILWAY_PATTERN}"](${bbox});
    out geom;
  `;
}

async function fetchWays(query: string): Promise<OverpassWay[]> {
	const res = await fetch(OVERPASS_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			"User-Agent": "london-copilot/1.0",
		},
		body: new URLSearchParams({ data: query }),
		cache: "no-store",
	});

	if (!res.ok) return [];

	const data = (await res.json()) as { elements?: OverpassWay[] };
	return (
		data.elements
			?.filter((element): element is OverpassWay => element.type === "way")
			.filter((way) => (way.geometry?.length ?? 0) >= 2)
			.slice(0, MAX_GRAPH_WAYS) ?? []
	);
}

function buildGraph(ways: OverpassWay[]) {
	const graph = new Map<string, GraphEdge[]>();
	const coords = new Map<string, LngLat>();

	const addEdge = (from: LngLat, to: LngLat) => {
		const fromKey = coordKey(from);
		const toKey = coordKey(to);
		coords.set(fromKey, from);
		coords.set(toKey, to);
		const weight = distanceMeters(from, to);
		graph.set(fromKey, [...(graph.get(fromKey) ?? []), { to: toKey, weight }]);
		graph.set(toKey, [...(graph.get(toKey) ?? []), { to: fromKey, weight }]);
	};

	for (const way of ways) {
		const geometry = way.geometry ?? [];
		for (let i = 1; i < geometry.length; i++) {
			const prev = geometry[i - 1];
			const next = geometry[i];
			if (!prev || !next) continue;
			addEdge([prev.lon, prev.lat], [next.lon, next.lat]);
		}
	}

	const nodeEntries = [...coords.entries()];
	if (nodeEntries.length <= MAX_SNAP_NODES) {
		for (let i = 0; i < nodeEntries.length; i++) {
			const fromEntry = nodeEntries[i];
			if (!fromEntry) continue;
			const [fromKey, fromCoord] = fromEntry;
			for (let j = i + 1; j < nodeEntries.length; j++) {
				const toEntry = nodeEntries[j];
				if (!toEntry) continue;
				const [toKey, toCoord] = toEntry;
				const weight = distanceMeters(fromCoord, toCoord);
				if (weight > 0 && weight <= SNAP_TOLERANCE_METERS) {
					graph.set(fromKey, [
						...(graph.get(fromKey) ?? []),
						{ to: toKey, weight },
					]);
					graph.set(toKey, [
						...(graph.get(toKey) ?? []),
						{ to: fromKey, weight },
					]);
				}
			}
		}
	}

	return { graph, coords };
}

function nearestNode(target: LngLat, coords: Map<string, LngLat>) {
	let bestKey: string | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const [key, coord] of coords) {
		const distance = distanceMeters(target, coord);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestKey = key;
		}
	}

	return bestKey;
}

function shortestPath(
	ways: OverpassWay[],
	from: LngLat,
	to: LngLat,
): LngLat[] | null {
	const { graph, coords } = buildGraph(ways);
	const start = nearestNode(from, coords);
	const end = nearestNode(to, coords);
	if (!start || !end) return null;

	const distances = new Map<string, number>([[start, 0]]);
	const previous = new Map<string, string>();
	const queue = new Set<string>(graph.keys());

	while (queue.size > 0) {
		let current: string | null = null;
		let currentDistance = Number.POSITIVE_INFINITY;

		for (const key of queue) {
			const distance = distances.get(key) ?? Number.POSITIVE_INFINITY;
			if (distance < currentDistance) {
				current = key;
				currentDistance = distance;
			}
		}

		if (!current || currentDistance === Number.POSITIVE_INFINITY) break;
		queue.delete(current);
		if (current === end) break;

		for (const edge of graph.get(current) ?? []) {
			if (!queue.has(edge.to)) continue;
			const candidate = currentDistance + edge.weight;
			if (candidate < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
				distances.set(edge.to, candidate);
				previous.set(edge.to, current);
			}
		}
	}

	if (start !== end && !previous.has(end)) return null;

	const pathKeys = [end];
	while (pathKeys[0] !== start) {
		const current = pathKeys[0];
		if (!current) return null;
		const next = previous.get(current);
		if (!next) return null;
		pathKeys.unshift(next);
	}

	const path = pathKeys
		.map((key) => coords.get(key))
		.filter((coord): coord is LngLat => !!coord);

	return path.length >= 2 ? [from, ...path, to] : null;
}

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const fromLng = Number(searchParams.get("fromLng"));
	const fromLat = Number(searchParams.get("fromLat"));
	const toLng = Number(searchParams.get("toLng"));
	const toLat = Number(searchParams.get("toLat"));
	const lineName = searchParams.get("lineName");

	if (
		!Number.isFinite(fromLng) ||
		!Number.isFinite(fromLat) ||
		!Number.isFinite(toLng) ||
		!Number.isFinite(toLat)
	) {
		return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
	}

	const from: LngLat = [fromLng, fromLat];
	const to: LngLat = [toLng, toLat];

	try {
		const relationQuery = buildRelationQuery(from, to, lineName);
		const relationWays = relationQuery ? await fetchWays(relationQuery) : [];
		const relationPath = shortestPath(relationWays, from, to);
		if (relationPath)
			return NextResponse.json({
				coordinates: relationPath,
				source: "osm-line",
			});

		const railwayWays = await fetchWays(buildRailwayQuery(from, to));
		const railwayPath = shortestPath(railwayWays, from, to);
		if (railwayPath)
			return NextResponse.json({
				coordinates: railwayPath,
				source: "osm-railway",
			});

		return NextResponse.json({ coordinates: [from, to], source: "fallback" });
	} catch {
		return NextResponse.json({ coordinates: [from, to], source: "fallback" });
	}
}
