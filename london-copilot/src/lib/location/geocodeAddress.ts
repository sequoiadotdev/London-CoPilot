export interface ResolvedAddress {
	label: string;
	fullAddress: string;
	postcode: string | null;
	lat: number;
	lng: number;
}

const POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
const STREET_RE = /\b\d{1,5}\s+[a-z][a-z\s.'-]{2,}\b/i;
const HOUSING_RE =
	/\b(live|rent|flat|house|property|neighbourhood|neighborhood|area|move|moving)\b/i;
const ROUTE_RE =
	/\b(route|journey|get me|directions|from .+ to|take me|go to)\b/i;

export function shouldResolveAddress(query: string) {
	const q = query.trim();
	if (q.length < 5 || ROUTE_RE.test(q)) return false;
	return POSTCODE_RE.test(q) || STREET_RE.test(q) || HOUSING_RE.test(q);
}

export function housingQueryForAddress(
	query: string,
	address: ResolvedAddress,
) {
	if (HOUSING_RE.test(query)) return query;
	return `Should I live here? ${address.label}`;
}

export async function geocodeAddress(
	query: string,
): Promise<ResolvedAddress | null> {
	if (!shouldResolveAddress(query)) return null;

	const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
	if (!res.ok) return null;

	const data = (await res.json()) as Partial<ResolvedAddress>;
	if (
		typeof data.label !== "string" ||
		typeof data.fullAddress !== "string" ||
		typeof data.lat !== "number" ||
		typeof data.lng !== "number"
	) {
		return null;
	}

	return {
		label: data.label,
		fullAddress: data.fullAddress,
		postcode: typeof data.postcode === "string" ? data.postcode : null,
		lat: data.lat,
		lng: data.lng,
	};
}
