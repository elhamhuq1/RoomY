# S04: Kroger Product Search — Research

**Date:** 2026-03-15

## Summary

This slice adds Kroger product search to the grocery tab — two new Edge Functions (`search-stores` and `search-products`), a store selection flow, a product search UI accessible from the grocery list, and auto-categorization from Kroger's taxonomy. The existing codebase provides clear patterns for all pieces: Edge Function structure from `scan-receipt`/`import-recipe`, Stack screen registration from `_layout.tsx`, department taxonomy from `lib/constants/grocery-departments.ts`, and optimistic item insertion from `groceries.tsx`.

The Kroger Public API is confirmed working and self-serve (developer-ce.kroger.com). Auth is OAuth2 client credentials — `POST https://api.kroger.com/v1/connect/oauth2/token` with base64-encoded `CLIENT_ID:CLIENT_SECRET`, returns bearer token with 1800s (30min) expiry. Products API returns `description`, `brand`, `categories[]`, `aisleLocations[]`, and `items[].price.regular/promo`, `items[].size`. Locations API returns `locationId`, `chain`, `name`, `address` by zip code. Per the DECISIONS.md entry, re-auth each Edge Function call is preferred over token caching.

The main design question is where to persist the selected store. `household_settings` is the natural home — add `kroger_location_id` and `kroger_location_name` columns. This is a household-level setting (all roommates shop at the same store), consistent with the existing settings table pattern. Store selection is a one-time setup step surfaced inline when the user first opens product search, with a "Change Store" option in the UI header.

## Recommendation

Build in this order:

1. **Edge Functions first** — `search-stores` and `search-products`. These are independently testable via curl. `search-stores` is simple (zip → locations). `search-products` requires OAuth + proxied search + result simplification + category mapping. Deploy and verify before building UI.
2. **Migration + types second** — Add `kroger_location_id TEXT` and `kroger_location_name TEXT` to `household_settings`. Update TypeScript types.
3. **Store selection UI third** — Zip code input → nearby stores list → tap to select → persist to `household_settings`. Could be a modal or inline section on the product search screen.
4. **Product search UI last** — Search input with debounced query → results list with price/size/aisle → tap to add as grocery item with auto-assigned category and `source = 'kroger'`.

The product search screen should be a new Stack screen (`groceries/search-products`) with a third action button on the grocery list alongside "Scan Receipt" and "Shop by Recipe". Alternatively, it could replace or augment the existing QuickAddInput — but a separate screen is cleaner for the search + results + add flow.

## Implementation Landscape

### Key Files

**New files to create:**
- `supabase/functions/search-stores/index.ts` — Edge Function: receives `zipCode`, gets Kroger OAuth token, calls Locations API, returns simplified store list `{ stores: [{ locationId, name, chain, address }] }`. Filters out Shell fuel stations.
- `supabase/functions/search-products/index.ts` — Edge Function: receives `term` and `locationId`, gets Kroger OAuth token, calls Products API, maps Kroger categories to app departments, returns `{ products: [{ productId, name, brand, price, promoPrice, size, aisle, department }] }`.
- `app/(app)/groceries/search-products.tsx` — Product search screen with store selection header, search input, results list, add-to-list action.
- `supabase/migrations/XXXXXX_kroger_store_settings.sql` — Adds `kroger_location_id TEXT` and `kroger_location_name TEXT` to `household_settings`.

**Files to modify:**
- `lib/types/database.ts` — Add `kroger_location_id` and `kroger_location_name` to `HouseholdSettings` interface and its Insert/Update types.
- `app/(app)/_layout.tsx` — Register `groceries/search-products` Stack screen with standard cream header.
- `app/(app)/(tabs)/groceries.tsx` — Add third action button "Search Products" (or "Kroger Search") alongside existing Scan Receipt and Shop by Recipe buttons. When adding a Kroger product, insert a `grocery_item` with `source: 'kroger'` and `category` from the mapped department.
- `components/groceries/index.ts` — Barrel export any new shared components (e.g., `StoreSelector`, `ProductResultRow`).

**Files to reference (patterns only):**
- `supabase/functions/scan-receipt/index.ts` — CORS headers, error handling pattern with `phase` field, structured JSON responses.
- `supabase/functions/import-recipe/index.ts` — `jsonResponse` helper for DRY response construction, `CORS_HEADERS` pattern.
- `lib/constants/grocery-departments.ts` — `DEPARTMENTS` array and `DEPARTMENT_MAP` for category mapping. Kroger `categories[0]` (e.g., "Dairy", "Snacks") maps to these department IDs.
- `components/groceries/GroceryItemRow.tsx` — Shows category badge with icon. Kroger-added items will display correctly in department-grouped list since they get `category` assigned.

### Kroger Category → App Department Mapping

Kroger's `categories[]` field returns strings like "Dairy", "Snacks", "Frozen", "Beverages", "Bakery", etc. These map directly to the app's department taxonomy IDs. A mapping function in the Edge Function should normalize Kroger categories to the 10 department IDs:

```
"Dairy" → "dairy"
"Snacks" → "snacks"  
"Frozen" → "frozen"
"Beverages" → "beverages"
"Bakery" → "bakery"
"Produce" → "produce"
"Meat" / "Seafood" → "meat"
"Baking Goods" / "Canned & Packaged" / "Condiments & Sauces" / "Pasta, Sauces, Grain" → "pantry"
"Cleaning Products" / "Paper & Plastics" → "household"
"Candy" / "Cookies, Snacks & Candy" → "snacks"
"Deli" → "meat" (or "other")
default → "other"
```

This mapping lives in the `search-products` Edge Function so the client receives a pre-mapped `department` field.

### Build Order

1. **Edge Functions** — Prove Kroger API integration works end-to-end. `search-stores` first (simpler — no category mapping), then `search-products`. Verify with curl. This retires the "Kroger API availability" risk from the milestone.
2. **Migration + Types** — Add store columns to `household_settings`. Small, no-risk.
3. **Client UI** — Screen registration → store selection → product search → add-to-list. The UI depends on both Edge Functions working and the store settings column existing.

### Verification Approach

- **Edge Functions (curl):**
  - `search-stores`: POST with `{ "zipCode": "45140" }` → response contains Kroger stores near Cincinnati with `locationId`, `name`, `chain`, `address`
  - `search-products`: POST with `{ "term": "milk", "locationId": "01400413" }` → response contains products with `name`, `brand`, `price`, `size`, `aisle`, `department`
- **TypeScript:** `npx tsc --noEmit` passes with new `HouseholdSettings` fields
- **Store selection:** User enters zip, sees nearby stores, taps one, `household_settings.kroger_location_id` is updated
- **Product search:** User searches "milk", sees results with price/size/aisle, taps to add, item appears in grocery list under correct department section with `source: 'kroger'` and correct `category`
- **Category mapping:** Kroger product with `categories: ["Dairy"]` appears in Dairy section; product with `categories: ["Frozen"]` appears in Frozen section

## Constraints

- **Kroger API credentials required** — `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` must be set as Edge Function secrets. User registers at developer-ce.kroger.com (self-serve, but takes a few minutes for app approval).
- **OAuth re-auth per call** — Per DECISIONS.md, re-auth each call rather than caching tokens. Adds ~200ms but avoids complexity in stateless Edge Functions.
- **Deno runtime** — Edge Functions use `fetch` only, no Node packages. Base64 encoding for auth header via `btoa()` (available in Deno).
- **Existing schema is additive** — New columns on `household_settings` must have defaults or be nullable. Use `TEXT DEFAULT NULL`.
- **Products API requires `locationId` for pricing** — Without a location, prices aren't returned. Store selection must happen before product search is useful.
- **Design system** — wintergreen (#2D6A4F) brand color, cream (#F5F0EB) background, transparent-outline cards, consistent with existing grocery screens.

## Common Pitfalls

- **Kroger OAuth scope** — The token request requires `scope=product.compact` for Products API access. Missing scope returns auth errors on product search. Locations API doesn't require a scope beyond the default.
- **Shell stations in Locations results** — Locations API returns Shell fuel stations alongside grocery stores. Filter by `chain !== 'SHELL COMPANY'` in the `search-stores` Edge Function.
- **`aisleLocations` can be empty** — Not all products have aisle data. Handle gracefully with "Aisle N/A" or similar. The `aisleLocations` array may have entries like `{ "bayNumber": "017", "description": "Baking Ingredients", "number": "7", "numberOfFacings": "1", "side": "L", "shelfNumber": "2", "shelfPositionInBay": "4" }` or may be empty.
- **Kroger category strings are title-case** — "Dairy", "Snacks", not "dairy", "snacks". The mapping function must normalize case.
- **Products without prices** — If `locationId` is missing from the request, items won't have price data. The Edge Function should validate `locationId` is provided.
- **Rate limiting** — Kroger doesn't document explicit rate limits for the public tier, but standard REST best practices apply. Edge Functions should handle 429 responses.
- **`items[]` array may have multiple entries** — A product can have multiple items (different sizes). Use `items[0]` for the primary item's price and size.

## Open Risks

- **Kroger API credential approval timing** — Self-serve registration is immediate, but app creation and API key generation may take minutes to hours. If credentials aren't available, the slice can't be integration-tested against live APIs. The Edge Functions can still be built and deployed, with verification deferred until credentials are active.
- **Kroger regional coverage** — Kroger-family stores are concentrated in Midwest, South, and West Coast. Users in New England or areas without Kroger stores will get no results from the Locations API. The UI should show a clear "No nearby stores found" message.
- **Kroger API deprecation/changes** — Kroger moved from developer.kroger.com to developer-ce.kroger.com. API endpoints (`api.kroger.com`) remain the same but docs/portal URL shifted. Monitor for breaking changes.

## Sources

- Kroger Products API returns `description`, `brand`, `categories[]`, `aisleLocations[]`, `items[].price.regular/promo`, `items[].size` (source: [Product Search docs](https://developer-ce.kroger.com/documentation/api-products/public/products/product-search))
- Kroger auth: OAuth2 client credentials with base64-encoded `CLIENT_ID:CLIENT_SECRET`, `expires_in: 1800`, scope `product.compact` (source: [Service to Service Auth](https://developer-ce.kroger.com/documentation/public/security/service-to-service))
- Locations API: `filter.zipCode.near` returns up to 10 locations in 10-mile radius, each with `locationId`, `chain`, `name`, `address`, `departments` (source: [Location Search docs](https://developer-ce.kroger.com/documentation/api-products/public/locations/location-search))
- Shell fuel stations appear in location results as `chain: "SHELL COMPANY"` — must be filtered out (source: [Location Search docs](https://developer-ce.kroger.com/documentation/api-products/public/locations/location-search))
