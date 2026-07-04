import { type NextRequest, NextResponse } from "next/server";

const LONDON_VIEWBOX = "-0.5103,51.2868,0.3340,51.6919";

interface NominatimResult {
	display_name?: string;
	lat?: string;
	lon?: string;
	importance?: number;
	address?: {
		postcode?: string;
		road?: string;
		house_number?: string;
		suburb?: string;
		city?: string;
		town?: string;
		village?: string;
		borough?: string;
	};
}

function shortLabel(result: NominatimResult) {
	const address = result.address;
	if (!address)
		return (
			result.display_name?.split(",").slice(0, 2).join(", ") ?? "London address"
		);

	const street = [address.house_number, address.road].filter(Boolean).join(" ");
	const area =
		address.suburb ??
		address.borough ??
		address.city ??
		address.town ??
		address.village;
	return (
		[street, area, address.postcode].filter(Boolean).join(", ") ||
		result.display_name ||
		"London address"
	);
}

export async function GET(request: NextRequest) {
	const query = request.nextUrl.searchParams.get("q")?.trim();

	if (!query || query.length < 3) {
		return NextResponse.json({ error: "q is required" }, { status: 400 });
	}

	try {
		const url = new URL("https://nominatim.openstreetmap.org/search");
		url.searchParams.set("q", query);
		url.searchParams.set("format", "jsonv2");
		url.searchParams.set("addressdetails", "1");
		url.searchParams.set("limit", "5");
		url.searchParams.set("countrycodes", "gb");
		url.searchParams.set("viewbox", LONDON_VIEWBOX);
		url.searchParams.set("bounded", "1");

		const res = await fetch(url, {
			headers: {
				"User-Agent": "london-copilot/1.0 (hackathon prototype)",
				"Accept-Language": "en-GB,en;q=0.9",
			},
			next: { revalidate: 60 * 60 * 24 },
		});

		if (!res.ok) {
			return NextResponse.json(
				{ error: "Geocoder unavailable" },
				{ status: 502 },
			);
		}

		const results = (await res.json()) as NominatimResult[];
		const best = results
			.map((result) => ({
				result,
				lat: Number(result.lat),
				lng: Number(result.lon),
			}))
			.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
			.sort(
				(a, b) => (b.result.importance ?? 0) - (a.result.importance ?? 0),
			)[0];

		if (!best) {
			return NextResponse.json(
				{ error: "No London address match found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			label: shortLabel(best.result),
			fullAddress: best.result.display_name ?? shortLabel(best.result),
			postcode: best.result.address?.postcode ?? null,
			lat: best.lat,
			lng: best.lng,
		});
	} catch {
		return NextResponse.json(
			{ error: "Could not geocode address" },
			{ status: 503 },
		);
	}
}
