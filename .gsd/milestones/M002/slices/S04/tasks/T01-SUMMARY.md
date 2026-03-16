---
id: T01
parent: S04
milestone: M002
provides:
  - search-stores Edge Function for Kroger store lookup by zip code
  - search-products Edge Function for Kroger product search with category mapping
  - kroger_location_id and kroger_location_name columns on household_settings
  - HouseholdSettings TypeScript type extended with Kroger fields
key_files:
  - supabase/functions/search-stores/index.ts
  - supabase/functions/search-products/index.ts
  - supabase/migrations/20260316000015_kroger_store_settings.sql
  - lib/types/database.ts
key_decisions:
  - none (all Kroger integration decisions made during planning)
patterns_established:
  - Kroger OAuth2 client credentials pattern with btoa(CLIENT_ID:CLIENT_SECRET) and per-call re-auth
  - mapKrogerCategory function normalizing title-case Kroger categories to app department IDs
observability_surfaces:
  - Both Edge Functions log structured JSON { phase, error } on failure via console.error
  - HTTP responses include { error, phase } with appropriate status codes (400/429/500/502)
  - Success responses log { phase: "success", ... } with result counts
duration: 30min
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Deploy Kroger Edge Functions and store settings migration

**Created search-stores and search-products Edge Functions with Kroger OAuth2, deployed to Supabase, and applied migration adding kroger_location_id/name to household_settings.**

## What Happened

Built two Supabase Edge Functions following the import-recipe CORS/jsonResponse/phase-error pattern:

1. **search-stores** — accepts `{ zipCode }`, authenticates with Kroger client credentials (no scope), calls Locations API with `filter.zipCode.near`, filters out Shell fuel stations, returns simplified store objects with locationId/name/chain/address.

2. **search-products** — accepts `{ term, locationId }`, authenticates with `scope=product.compact`, calls Products API with `filter.term` and `filter.locationId`, maps each product through `mapKrogerCategory()` which normalizes Kroger's title-case category strings (Dairy, Produce, Frozen, etc.) to app department IDs. Returns products with productId, name, brand, price, promoPrice, size, aisle, and department.

Created migration adding two nullable TEXT columns (`kroger_location_id`, `kroger_location_name`) to `household_settings`. Updated `HouseholdSettings` interface and its Insert type in `database.ts`.

Set `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` as Supabase secrets. Deployed both functions and applied migration.

## Verification

- **`npx tsc --noEmit`**: Passes — only pre-existing Deno namespace errors in `supabase/functions/` and `@expo-google-fonts` import error (both present before this task). No new type errors.
- **search-stores curl**: `POST { "zipCode": "45140" }` → returned 10 Kroger stores in Ohio, no Shell stations. Response shape: `{ stores: [{ locationId, name, chain, address }] }`.
- **search-products curl**: `POST { "term": "milk", "locationId": "01400413" }` → returned 20 milk products with prices ($1.69–$7.29), sizes (1 pt to 1 gal), aisle info ("DAIRY 100"), all mapped to department "dairy".
- **Error responses**: Missing `zipCode` → `{ error: "zipCode is required", phase: "request" }` (400). Missing `term` → same pattern. Missing `locationId` → same pattern.

### Slice-level verification (partial — T01 is intermediate):
- ✅ `search-stores` Edge Function returns stores with locationId, name, chain, address, no Shell stations
- ✅ `search-products` Edge Function returns products with name, brand, price, size, aisle, department (mapped to app taxonomy)
- ✅ `npx tsc --noEmit` passes with new HouseholdSettings fields
- ✅ Edge Functions return `{ error, phase }` with appropriate HTTP status on failure
- ⬜ Store selection persists kroger_location_id (T02 — UI)
- ⬜ Product search renders results with price, size, aisle info (T02 — UI)
- ⬜ Adding a product creates grocery_item with source: 'kroger' and correct category (T02 — UI)
- ⬜ Item appears in correct department section (T02 — UI)

## Diagnostics

- **Edge Function logs**: `console.error(JSON.stringify({ phase, error }))` at each failure point (config, oauth, search, mapping)
- **HTTP error responses**: Always include `{ error: string, phase: string }` with status 400/429/500/502
- **Success logging**: `{ phase: "success", zipCode/term, totalRaw/returned }` on successful calls
- **Inspect deployed functions**: `npx supabase functions list` shows both as ACTIVE
- **Inspect migration**: `ALTER TABLE household_settings` added `kroger_location_id TEXT` and `kroger_location_name TEXT`

## Deviations

- First deploy of `search-stores` didn't appear in functions list despite success message. Re-deployed and it appeared. Likely a Supabase propagation delay.

## Known Issues

- Some Kroger products return `price: null` — this is a Kroger API behavior for items without current pricing at the queried location. T02 UI should handle null prices gracefully.
- `promoPrice` appears rarely in results (one case where promoPrice equaled regular price at $1.99). May need UI consideration.

## Files Created/Modified

- `supabase/functions/search-stores/index.ts` — new Edge Function for Kroger store lookup by zip code
- `supabase/functions/search-products/index.ts` — new Edge Function for Kroger product search with category mapping
- `supabase/migrations/20260316000015_kroger_store_settings.sql` — migration adding kroger_location_id and kroger_location_name to household_settings
- `lib/types/database.ts` — added kroger_location_id and kroger_location_name to HouseholdSettings interface and Insert type
- `.gsd/milestones/M002/slices/S04/S04-PLAN.md` — added failure-path verification step per pre-flight fix
