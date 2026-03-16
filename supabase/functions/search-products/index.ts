// Edge Function: search-products
// Searches Kroger products by term at a specific store location.
// Returns products with price, size, aisle, and department mapped to app taxonomy.
// Re-authenticates on each call with scope=product.compact.
// Phases for diagnostic localization: config, oauth, search, mapping.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProductResult {
  productId: string;
  name: string;
  brand: string;
  price: number | null;
  promoPrice: number | null;
  size: string;
  aisle: string;
  department: string;
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
 * Map Kroger's title-case category strings to app department IDs.
 * Uses the first matching category; defaults to "other".
 */
function mapKrogerCategory(categories: string[]): string {
  const CATEGORY_MAP: Record<string, string> = {
    dairy: "dairy",
    produce: "produce",
    frozen: "frozen",
    bakery: "bakery",
    beverages: "beverages",
    snacks: "snacks",
    candy: "snacks",
    "cookies, snacks & candy": "snacks",
    meat: "meat",
    seafood: "meat",
    deli: "meat",
    "baking goods": "pantry",
    "canned & packaged": "pantry",
    "condiments & sauces": "pantry",
    "pasta, sauces, grain": "pantry",
    "cleaning products": "household",
    "paper & plastics": "household",
  };

  for (const cat of categories) {
    const key = String(cat).toLowerCase().trim();
    if (CATEGORY_MAP[key]) {
      return CATEGORY_MAP[key];
    }
  }

  return "other";
}

/**
 * Obtain a Kroger OAuth2 access token via client credentials grant.
 */
async function getKrogerToken(scope: string): Promise<string> {
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
      body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`,
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
    const { term, locationId } = body;

    if (!term || typeof term !== "string" || term.trim().length === 0) {
      return jsonResponse(
        { error: "term is required", phase: "request" },
        400
      );
    }

    if (
      !locationId ||
      typeof locationId !== "string" ||
      locationId.trim().length === 0
    ) {
      return jsonResponse(
        { error: "locationId is required", phase: "request" },
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

    // --- OAuth with product.compact scope ---
    let token: string;
    try {
      token = await getKrogerToken("product.compact");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ phase: "oauth", error: errMsg }));
      return jsonResponse(
        { error: "Failed to authenticate with Kroger", phase: "oauth" },
        502
      );
    }

    // --- Product search ---
    // deno-lint-ignore no-explicit-any
    let productsData: any;
    try {
      const searchUrl = `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term.trim())}&filter.locationId=${encodeURIComponent(locationId.trim())}&filter.limit=20`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (searchResponse.status === 429) {
        console.error(
          JSON.stringify({ phase: "search", error: "Rate limited by Kroger" })
        );
        return jsonResponse(
          {
            error:
              "Kroger API rate limit reached. Please try again in a moment.",
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
          {
            error: "Product search failed. Please try again.",
            phase: "search",
          },
          502
        );
      }

      productsData = await searchResponse.json();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ phase: "search", error: errMsg }));
      return jsonResponse(
        { error: "Product search failed. Please try again.", phase: "search" },
        502
      );
    }

    // --- Map results ---
    let products: ProductResult[];
    try {
      // deno-lint-ignore no-explicit-any
      const rawProducts: any[] = productsData?.data ?? [];

      products = rawProducts.map(
        // deno-lint-ignore no-explicit-any
        (p: any): ProductResult => {
          const firstItem = p.items?.[0];
          const price = firstItem?.price?.regular ?? null;
          const rawPromo = firstItem?.price?.promo ?? null;
          // Kroger returns 0 for no promo — treat as null
          const promoPrice =
            rawPromo && rawPromo > 0 ? rawPromo : null;
          const size = String(firstItem?.size ?? "");

          const aisleLocation = p.aisleLocations?.[0];
          const aisleDesc = aisleLocation?.description ?? "";
          const aisleNum = aisleLocation?.number ?? "";
          const aisle = aisleNum
            ? `${aisleDesc} ${aisleNum}`.trim()
            : String(aisleDesc).trim();

          const categories: string[] = Array.isArray(p.categories)
            ? p.categories
            : [];

          return {
            productId: String(p.productId ?? ""),
            name: String(p.description ?? ""),
            brand: String(p.brand ?? ""),
            price: typeof price === "number" ? price : null,
            promoPrice: typeof promoPrice === "number" ? promoPrice : null,
            size,
            aisle,
            department: mapKrogerCategory(categories),
          };
        }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ phase: "mapping", error: errMsg }));
      return jsonResponse(
        {
          error: "Failed to process product results. Please try again.",
          phase: "mapping",
        },
        500
      );
    }

    console.log(
      JSON.stringify({
        phase: "success",
        term: term.trim(),
        locationId: locationId.trim(),
        returned: products.length,
      })
    );

    return jsonResponse({ products }, 200);
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
