# S04: Kroger Product Search

**Goal:** Users can search Kroger products by name with a selected nearby store, see real results with price, size, and aisle, and add a product to the grocery list with its category auto-assigned from Kroger's taxonomy.
**Demo:** User taps "Search Products" on the grocery tab → enters zip code → selects a Kroger store → searches "milk" → sees results with price/size/aisle → taps one → item appears in the grocery list under the correct department section with `source: 'kroger'` and auto-assigned `category`.

## Must-Haves

- Two Edge Functions: `search-stores` (zip → Kroger store list) and `search-products` (term + locationId → product results with mapped department)
- Kroger OAuth2 client credentials flow (re-auth per call)
- Kroger category → app department mapping in `search-products` Edge Function
- Migration adding `kroger_location_id` and `kroger_location_name` to `household_settings`
- Product search Stack screen with store selection and search results
- Third action button on grocery list ("Search Products")
- Adding a Kroger product inserts a `grocery_item` with `source: 'kroger'` and correct `category`
- Shell fuel stations filtered from store results

## Proof Level

- This slice proves: integration (Kroger API → Edge Function → client UI → grocery list insert)
- Real runtime required: yes (deployed Edge Functions, Kroger API credentials)
- Human/UAT required: yes (real product search with accurate price/aisle verification)

## Verification

- `search-stores` Edge Function: `curl` with `{ "zipCode": "45140" }` → response has stores with `locationId`, `name`, `chain`, `address`, no Shell stations
- `search-products` Edge Function: `curl` with `{ "term": "milk", "locationId": "01400413" }` → response has products with `name`, `brand`, `price`, `size`, `aisle`, `department` (mapped to app taxonomy)
- `npx tsc --noEmit` passes with new `HouseholdSettings` fields and all new UI code
- Store selection persists `kroger_location_id` to `household_settings`
- Product search renders results with price, size, aisle info
- Adding a product creates a `grocery_item` with `source: 'kroger'` and `category` matching the mapped department
- Item appears in the correct department section in the grocery list
- Edge Functions return `{ error, phase }` with appropriate HTTP status on failure (missing body fields → 400, missing secrets → 500, auth failure → 502, rate limit → 429)

## Observability / Diagnostics

- Runtime signals: Edge Functions log `{ phase, error }` structured JSON on failure (auth, search, mapping phases)
- Inspection surfaces: `household_settings.kroger_location_id` for persisted store; `grocery_items` with `source = 'kroger'` for added products
- Failure visibility: Edge Function responses include `phase` field identifying where failure occurred (oauth, search, mapping); 429 from Kroger returns user-friendly rate limit message
- Redaction constraints: `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` never logged; only token acquisition success/failure logged

## Integration Closure

- Upstream surfaces consumed: `lib/constants/grocery-departments.ts` (DEPARTMENTS/DEPARTMENT_MAP), `category` column on `grocery_items` (from S03), department-grouped list UI in `groceries.tsx` (from S03), Edge Function patterns from `import-recipe` and `scan-receipt`
- New wiring introduced in this slice: `search-products` Stack screen registered in `_layout.tsx`, third action button in `groceries.tsx`, `household_settings` extended with Kroger store columns
- What remains before the milestone is truly usable end-to-end: nothing — S04 is the final slice

## Tasks

- [x] **T01: Deploy Kroger Edge Functions and store settings migration** `est:1.5h`
  - Why: Proves Kroger API integration works end-to-end — OAuth flow, store lookup, product search with category mapping. Also adds the `household_settings` columns needed for store persistence. This retires the "Kroger API availability" milestone risk.
  - Files: `supabase/functions/search-stores/index.ts`, `supabase/functions/search-products/index.ts`, `supabase/migrations/20260316000015_kroger_store_settings.sql`, `lib/types/database.ts`
  - Do: Create `search-stores` Edge Function (receives `zipCode`, Kroger OAuth with `btoa(CLIENT_ID:CLIENT_SECRET)`, calls Locations API, filters Shell stations, returns simplified store list). Create `search-products` Edge Function (receives `term` + `locationId`, Kroger OAuth with `scope=product.compact`, calls Products API, maps Kroger categories to app departments using title-case normalization, returns products with `name`, `brand`, `price`, `promoPrice`, `size`, `aisle`, `department`). Both use `CORS_HEADERS` and `jsonResponse` pattern from `import-recipe`. Both handle 429 and auth errors with `phase` field. Create migration adding `kroger_location_id TEXT DEFAULT NULL` and `kroger_location_name TEXT DEFAULT NULL` to `household_settings`. Update `HouseholdSettings` interface and Insert/Update types in `database.ts`.
  - Verify: `npx tsc --noEmit` passes. Deploy functions and test with curl against real Kroger API: stores endpoint returns non-Shell stores, products endpoint returns results with mapped departments.
  - Done when: Both Edge Functions deployed and returning correct structured data. Migration applied. TypeScript types updated and compiling.

- [x] **T02: Build product search screen with store selection and grocery list integration** `est:1.5h`
  - Why: Delivers the full user-facing feature — store selection, product search, results display, and add-to-list with auto-categorization. Wires everything together: new screen, layout registration, action button on grocery tab.
  - Files: `app/(app)/groceries/search-products.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/groceries.tsx`
  - Do: Create `search-products.tsx` Stack screen with: (1) store selection section — if no `kroger_location_id` in household settings, show zip code input + store list picker; if store selected, show store name with "Change" button; (2) search input with debounced query (300ms); (3) results list showing product name, brand, price (with promo price if available), size, and aisle; (4) tap-to-add inserts `grocery_item` with `source: 'kroger'`, `category` from product's `department` field. Store selection updates `household_settings.kroger_location_id` and `kroger_location_name`. Register screen in `_layout.tsx` with standard cream header. Add third "Search Products" action button in `groceries.tsx` alongside Scan Receipt and Shop by Recipe. Handle loading/error states, empty results, and no-store-selected state.
  - Verify: `npx tsc --noEmit` passes. Visual verification: new button appears on grocery tab, tapping navigates to search screen, store selection works, search returns results, adding a product creates item in correct department section.
  - Done when: Full flow works — select store → search products → see results with price/size/aisle → add to list → item appears in correct department section with `source: 'kroger'`.

## Files Likely Touched

- `supabase/functions/search-stores/index.ts` (new)
- `supabase/functions/search-products/index.ts` (new)
- `supabase/migrations/20260316000015_kroger_store_settings.sql` (new)
- `lib/types/database.ts` (modify)
- `app/(app)/groceries/search-products.tsx` (new)
- `app/(app)/_layout.tsx` (modify)
- `app/(app)/(tabs)/groceries.tsx` (modify)
