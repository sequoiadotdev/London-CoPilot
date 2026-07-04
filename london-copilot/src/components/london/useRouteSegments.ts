"use client";

import type { RoutingData } from "@contract/query.types";
import { useEffect, useState } from "react";
import {
	buildRouteSegments,
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

		const sync = buildRouteSegments(routing);
		setSegments(sync);
		setLoading(false);
	}, [routing]);

	return { segments, loading };
}
