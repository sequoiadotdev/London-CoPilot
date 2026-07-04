import type { QueryRequest, QueryResponse } from "@contract/query.types";

import { env } from "~/env";

export async function postQuery(body: QueryRequest): Promise<QueryResponse> {
	const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/query`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		throw new Error(`POST /query failed: ${res.status}`);
	}

	return res.json() as Promise<QueryResponse>;
}
