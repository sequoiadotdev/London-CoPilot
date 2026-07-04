"use client";

import type { RoutingData } from "@contract/query.types";
import { useEffect } from "react";
import RouteMapLayers from "@/components/london/RouteMapLayers";
import { useRouteSegments } from "@/components/london/useRouteSegments";
import { useMap } from "@/components/ui/map";
import type { LngLat } from "@/lib/map/adapters";
import { polylineToLngLat } from "@/lib/map/adapters";
import { allSegmentCoordinates } from "@/lib/map/routeSegments";

interface RoutingMapEffectsProps {
	routing: RoutingData | null;
	active: boolean;
	selectedSegmentIndex?: number | null;
	onSelectSegment?: (index: number | null) => void;
}

function fitCoordinates(
	map: NonNullable<ReturnType<typeof useMap>["map"]>,
	coords: LngLat[],
	options?: { duration?: number; maxZoom?: number; leftPadding?: number },
) {
	if (coords.length < 2) return false;

	const lngs = coords.map((c) => c[0]);
	const lats = coords.map((c) => c[1]);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);

	map.fitBounds(
		[
			[minLng, minLat],
			[maxLng, maxLat],
		],
		{
			padding: {
				top: 96,
				bottom: 96,
				left: options?.leftPadding ?? 420,
				right: 96,
			},
			duration: options?.duration ?? 1100,
			maxZoom: options?.maxZoom ?? 16.5,
			essential: true,
		},
	);

	return true;
}

export default function RoutingMapEffects({
	routing,
	active,
	selectedSegmentIndex = null,
	onSelectSegment,
}: RoutingMapEffectsProps) {
	const { map, isLoaded } = useMap();
	const { segments } = useRouteSegments(routing);

	useEffect(() => {
		if (
			!isLoaded ||
			!map ||
			!active ||
			!routing ||
			selectedSegmentIndex != null
		)
			return;

		const segmentCoords = allSegmentCoordinates(segments);
		const coords =
			segmentCoords.length >= 2
				? segmentCoords
				: polylineToLngLat(routing.polyline);
		if (coords.length < 2) {
			map.flyTo({
				center: [routing.origin.lng, routing.origin.lat],
				zoom: 13,
				duration: 1200,
				essential: true,
			});
			return;
		}

		fitCoordinates(map, coords, {
			duration: 1400,
			maxZoom: 15,
			leftPadding: 420,
		});
	}, [map, isLoaded, active, routing, segments, selectedSegmentIndex]);

	useEffect(() => {
		if (!isLoaded || !map || !active || selectedSegmentIndex == null) return;

		const selectedSegment =
			segments.find((segment) => segment.stepIndex === selectedSegmentIndex) ??
			segments[selectedSegmentIndex];
		if (!selectedSegment) return;

		fitCoordinates(map, selectedSegment.coordinates, {
			duration: 900,
			maxZoom: selectedSegment.mode === "walk" ? 17 : 15.8,
			leftPadding: 440,
		});
	}, [map, isLoaded, active, segments, selectedSegmentIndex]);

	useEffect(() => {
		if (!isLoaded || !map || !active || !onSelectSegment) return;

		const handleMapClick = (event: { point: unknown }) => {
			const routeLayerIds = segments
				.map((segment) => `route-layer-route-seg-${segment.stepIndex}`)
				.filter((layerId) => !!map.getLayer(layerId));

			if (routeLayerIds.length > 0) {
				const hits = map.queryRenderedFeatures(
					event.point as Parameters<typeof map.queryRenderedFeatures>[0],
					{
						layers: routeLayerIds,
					},
				);
				if (hits.length > 0) return;
			}

			onSelectSegment(null);
		};

		map.on("click", handleMapClick);
		return () => {
			map.off("click", handleMapClick);
		};
	}, [map, isLoaded, active, segments, onSelectSegment]);

	if (!active || !routing) return null;

	return (
		<>
			<RouteMapLayers
				onSelectSegment={onSelectSegment}
				routing={routing}
				segments={segments}
				selectedIndex={selectedSegmentIndex}
			/>
		</>
	);
}
