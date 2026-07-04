"use client";

import type { RoutingData } from "@contract/query.types";
import { useEffect, useState } from "react";
import {
	buildRouteSegments,
	enrichRouteSegments,
	type RouteSegment,
} from "@/lib/map/routeSegments";

interface UseRouteSegmentsResult {
	segments: RouteSegment[];
	loading: boolean;
}

export function useRouteSegments(
	routing: RoutingData | null,
): UseRouteSegmentsResult {
	const [segments, setSegments] = useState<RouteSegment[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!routing) {
			setSegments([]);
			setLoading(false);
			return;
		}

		let cancelled = false;
		const sync = buildRouteSegments(routing);
		setSegments(sync);

		const needsEnrichment = routing.steps.some(
			(step) =>
				!step.polyline?.length &&
				(step.mode === "walk" ||
					step.mode === "cycle" ||
					step.mode === "bus"),
		);

		if (!needsEnrichment) {
			setLoading(false);
			return;
		}

		setLoading(true);
		void enrichRouteSegments(routing).then((enriched) => {
			if (!cancelled) {
				setSegments(enriched);
				setLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [routing]);

	return { segments, loading };
}
