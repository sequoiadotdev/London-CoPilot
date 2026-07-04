import type { Coordinates, MapPin, RoutingData } from "@contract/query.types";

/** MapLibre / mapcn use [lng, lat] — API contract uses { lat, lng } */
export type LngLat = [lng: number, lat: number];

export function toLngLat({ lat, lng }: Coordinates): LngLat {
	return [lng, lat];
}

export function polylineToLngLat(
	polyline: RoutingData["polyline"],
): LngLat[] {
	return polyline.map(([lat, lng]) => [lng, lat]);
}

export function pinsToLngLat(pins: MapPin[]): Array<MapPin & { lngLat: LngLat }> {
	return pins.map((pin) => ({ ...pin, lngLat: [pin.lng, pin.lat] }));
}
