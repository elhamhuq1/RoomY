// Edge Function: search-stores
// Finds nearby Kroger-family stores by zip code via the Kroger Locations API.
// Filters out Shell fuel stations. Re-authenticates on each call (no token caching).
// Phases for diagnostic localization: config, oauth, search.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface KrogerStore {
  locationId: string;
  name: string;
  chain: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Build a JSON response with CORS headers.
 */
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Obtain a Kroger OAuth2 access token via client credentials grant.
 * No scope needed for Locations API.
 */
async function getKrogerToken(): Promise<string> {
  const clientId = Deno.env.get("KROGER_CLIENT_ID");
  const clientSecret = Deno.env.get("KROGER_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("KROGER_CLIENT_ID or KROGER_CLIENT_SECRET not set");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(
    "https://api.kroger.com/v1/connect/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Kroger OAuth failed (${response.status}): ${body.substring(0, 200)}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", phase: "request" }, 405);
  }

  try {
    const body = await req.json();
    const { zipCode } = body;

    if (!zipCode || typeof zipCode !== "string" || zipCode.trim().length === 0) {
      return jsonResponse(
        { error: "zipCode is required", phase: "request" },
        400
      );
    }

    // --- Config check ---
    const clientId = Deno.env.get("KROGER_CLIENT_ID");
    const clientSecret = Deno.env.get("KROGER_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error(
        JSON.stringify({
          phase: "config",
          error: "Missing Kroger API credentials",
        })
      );
      return jsonResponse(
        { error: "Kroger API credentials not configured", phase: "config" },
        500
      );
    }

    // --- OAuth ---
    let token: string;
    try {
      token = await getKrogerToken();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ phase: "oauth", error: errMsg }));
      return jsonResponse(
        { error: "Failed to authenticate with Kroger", phase: "oauth" },
        502
      );
    }

    // --- Store search ---
    let storesData: Record<string, unknown>;
    try {
      const searchUrl = `https://api.kroger.com/v1/locations?filter.zipCode.near=${encodeURIComponent(zipCode.trim())}&filter.limit=10`;
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (searchResponse.status === 429) {
        console.error(
          JSON.stringify({ phase: "search", error: "Rate limited by Kroger" })
        );
        return jsonResponse(
          {
            error: "Kroger API rate limit reached. Please try again in a moment.",
            phase: "search",
          },
          429
        );
      }

      if (!searchResponse.ok) {
        const errBody = await searchResponse.text();
        console.error(
          JSON.stringify({
            phase: "search",
            error: errBody.substring(0, 200),
            status: searchResponse.status,
          })
        );
        return jsonResponse(
          { error: "Store search failed. Please try again.", phase: "search" },
          502
        );
      }

      storesData = await searchResponse.json();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ phase: "search", error: errMsg }));
      return jsonResponse(
        { error: "Store search failed. Please try again.", phase: "search" },
        502
      );
    }

    // --- Map and filter results ---
    // deno-lint-ignore no-explicit-any
    const rawStores: any[] = (storesData as any)?.data ?? [];

    const stores: KrogerStore[] = rawStores
      .filter(
        // deno-lint-ignore no-explicit-any
        (s: any) =>
          !String(s.chain ?? "")
            .toUpperCase()
            .includes("SHELL")
      )
      .map(
        // deno-lint-ignore no-explicit-any
        (s: any) => ({
          locationId: String(s.locationId ?? ""),
          name: String(s.name ?? ""),
          chain: String(s.chain ?? ""),
          address: {
            addressLine1: String(s.address?.addressLine1 ?? ""),
            city: String(s.address?.city ?? ""),
            state: String(s.address?.state ?? ""),
            zipCode: String(s.address?.zipCode ?? ""),
          },
        })
      );

    console.log(
      JSON.stringify({
        phase: "success",
        zipCode: zipCode.trim(),
        totalRaw: rawStores.length,
        returned: stores.length,
      })
    );

    return jsonResponse({ stores }, 200);
  } catch (error) {
    console.error(
      JSON.stringify({
        phase: "unknown",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return jsonResponse(
      { error: "An unexpected error occurred", phase: "unknown" },
      500
    );
  }
});
