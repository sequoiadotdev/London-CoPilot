import type { RouteStep } from "@contract/query.types";
import type { LngLat } from "@/lib/map/adapters";

export async function fetchRailGeometry(
	from: LngLat,
	to: LngLat,
	step: RouteStep,
): Promise<LngLat[]> {
	const params = new URLSearchParams({
		fromLng: String(from[0]),
		fromLat: String(from[1]),
		toLng: String(to[0]),
		toLat: String(to[1]),
	});

	if (step.lineName) params.set("lineName", step.lineName);

	try {
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 2500);
		const res = await fetch(`/api/route/rail-geometry?${params.toString()}`, {
			signal: controller.signal,
		});
		window.clearTimeout(timeout);
		if (!res.ok) return [from, to];

		const data = (await res.json()) as { coordinates?: LngLat[] };
		const coords = data.coordinates;
		return coords && coords.length >= 2 ? coords : [from, to];
	} catch {
		return [from, to];
	}
}
