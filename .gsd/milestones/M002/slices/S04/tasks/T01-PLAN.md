---
estimated_steps: 8
estimated_files: 4
---

# T01: Deploy Kroger Edge Functions and store settings migration

**Slice:** S04 — Kroger Product Search
**Milestone:** M002

## Description

Create two Supabase Edge Functions that proxy the Kroger API — `search-stores` for finding nearby Kroger-family stores by zip code, and `search-products` for searching products at a specific store with price, size, aisle, and department mapping. Also create the migration adding Kroger store columns to `household_settings` and update the TypeScript types.

Both Edge Functions use Kroger OAuth2 client credentials (POST to `https://api.kroger.com/v1/connect/oauth2/token` with base64-encoded `CLIENT_ID:CLIENT_SECRET`). Re-auth on each call per DECISIONS.md. Products API requires `scope=product.compact`. Secrets: `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET`.

## Steps

1. Create `supabase/functions/search-stores/index.ts`:
   - CORS_HEADERS and jsonResponse helper (same pattern as import-recipe)
   - `getKrogerToken()` — POST to `https://api.kroger.com/v1/connect/oauth2/token` with `grant_type=client_credentials`, base64 auth header via `btoa(CLIENT_ID + ':' + CLIENT_SECRET)`, no scope needed for Locations
   - Handler: parse `{ zipCode }` from request body, validate zipCode present
   - Call `https://api.kroger.com/v1/locations?filter.zipCode.near=${zipCode}&filter.limit=10` with bearer token
   - Filter out Shell fuel stations (`chain` field contains "SHELL")
   - Return `{ stores: [{ locationId, name, chain, address: { addressLine1, city, state, zipCode } }] }`
   - Error handling with `phase` field: "config" (missing secrets), "oauth" (token failure), "search" (API failure)
   - Handle 429 from Kroger with user-friendly message

2. Create `supabase/functions/search-products/index.ts`:
   - Same CORS/jsonResponse pattern
   - `getKrogerToken(scope: string)` — same as stores but with `scope=product.compact`
   - `mapKrogerCategory(categories: string[]): string` — maps Kroger's title-case category strings to app department IDs:
     - "Dairy" → "dairy", "Produce" → "produce", "Frozen" → "frozen", "Bakery" → "bakery", "Beverages" → "beverages", "Snacks" / "Candy" / "Cookies, Snacks & Candy" → "snacks", "Meat" / "Seafood" → "meat", "Baking Goods" / "Canned & Packaged" / "Condiments & Sauces" / "Pasta, Sauces, Grain" → "pantry", "Cleaning Products" / "Paper & Plastics" → "household", "Deli" → "meat"
     - Default: "other"
     - Case-insensitive comparison (lowercase both sides)
   - Handler: parse `{ term, locationId }` from request body, validate both present
   - Call `https://api.kroger.com/v1/products?filter.term=${term}&filter.locationId=${locationId}&filter.limit=20` with bearer token
   - Map each product: extract `productId`, `description` (name), `brand`, `items[0].price.regular` (price), `items[0].price.promo` (promoPrice, may be 0/null), `items[0].size` (size), `aisleLocations[0]?.description` and `aisleLocations[0]?.number` (aisle info, may be empty), `categories` → `mapKrogerCategory(categories)` (department)
   - Return `{ products: [{ productId, name, brand, price, promoPrice, size, aisle, department }] }`
   - Error handling with `phase`: "config", "oauth", "search", "mapping"

3. Create `supabase/migrations/20260316000015_kroger_store_settings.sql`:
   - `ALTER TABLE household_settings ADD COLUMN kroger_location_id TEXT DEFAULT NULL;`
   - `ALTER TABLE household_settings ADD COLUMN kroger_location_name TEXT DEFAULT NULL;`

4. Update `lib/types/database.ts`:
   - Add `kroger_location_id: string | null;` and `kroger_location_name: string | null;` to `HouseholdSettings` interface
   - Add both as optional fields in the `Insert` type (with `?`)
   - Both already covered by `Update: Partial<Omit<HouseholdSettings, "household_id">>` — no change needed there

5. Run `npx tsc --noEmit` to verify types compile

## Must-Haves

- [ ] `search-stores` returns stores filtered by zip with Shell stations excluded
- [ ] `search-products` returns products with price, size, aisle, and mapped department
- [ ] Kroger OAuth2 client credentials flow works (re-auth per call, base64 auth)
- [ ] `search-products` scope includes `product.compact`
- [ ] Category mapping normalizes Kroger title-case categories to app department IDs
- [ ] Both functions handle missing secrets, auth failures, API errors, and 429 with structured `phase` field
- [ ] Migration adds nullable Kroger columns to `household_settings`
- [ ] TypeScript types updated and `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes with new HouseholdSettings fields
- After deploying, `curl` test against `search-stores` with `{ "zipCode": "45140" }` returns stores (no Shell)
- After deploying, `curl` test against `search-products` with `{ "term": "milk", "locationId": "01400413" }` returns products with mapped departments
- Edge Functions return `{ error, phase }` on failure scenarios

## Observability Impact

- Signals added: structured `console.error(JSON.stringify({ phase, error }))` in both Edge Functions for each failure point (config, oauth, search, mapping)
- How a future agent inspects this: Supabase Edge Function logs show phase-tagged errors; curl against endpoints returns `{ error, phase }` with appropriate HTTP status
- Failure state exposed: phase field identifies exactly where in the pipeline the failure occurred

## Inputs

- `supabase/functions/import-recipe/index.ts` — CORS_HEADERS, jsonResponse helper, Deno.serve pattern, phase-based error handling pattern
- `lib/constants/grocery-departments.ts` — Department taxonomy IDs (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other) for category mapping target
- `lib/types/database.ts` — existing `HouseholdSettings` interface at line 32
- Kroger API docs: OAuth at `api.kroger.com/v1/connect/oauth2/token`, Products at `api.kroger.com/v1/products`, Locations at `api.kroger.com/v1/locations`

## Expected Output

- `supabase/functions/search-stores/index.ts` — complete Edge Function for Kroger store lookup
- `supabase/functions/search-products/index.ts` — complete Edge Function for Kroger product search with category mapping
- `supabase/migrations/20260316000015_kroger_store_settings.sql` — migration adding 2 nullable columns
- `lib/types/database.ts` — HouseholdSettings extended with Kroger fields
