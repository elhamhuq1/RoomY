# S04: Kroger Product Search — UAT

**Milestone:** M002
**Written:** 2026-03-16

## UAT Type

- UAT mode: mixed (artifact-driven for code verification, live-runtime for Edge Function and UI tests)
- Why this mode is sufficient: Edge Functions were tested with real Kroger API via curl. UI flow requires authenticated session for full E2E — code review confirms wiring, live test confirms behavior.

## Preconditions

- App running via Expo Go or `npx expo start` (web or device)
- User authenticated and in a household
- Supabase Edge Functions deployed: `search-stores` and `search-products` both ACTIVE
- `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` set as Supabase secrets
- S03 department-grouped grocery list working (items display in collapsible department sections)

## Smoke Test

Tap "Search Products" on the grocery tab → zip code input appears → enter "45140" → Kroger stores appear → tap one → search input appears → type "milk" → product results with prices appear.

## Test Cases

### 1. Store Search by Zip Code

1. Navigate to grocery tab
2. Tap "Search Products" action button
3. Enter zip code "45140" in the zip input
4. Tap search or submit
5. **Expected:** List of Kroger-family stores appears (Kroger, Fred Meyer, etc.), no Shell fuel stations. Each store shows name and address.

### 2. Store Selection and Persistence

1. From the store list (Test 1), tap a store
2. Note the selected store name displayed on screen
3. Navigate back to grocery tab
4. Tap "Search Products" again
5. **Expected:** Previously selected store is shown (not the zip code input). Store name matches what was selected. "Change" button is visible.

### 3. Product Search with Results

1. With a store selected, type "milk" in the search input
2. Wait for results (debounce ~300ms)
3. **Expected:** Product results appear showing:
   - Product name and brand
   - Price (dollar amount)
   - Size (e.g., "1 gal", "1 pt")
   - Aisle info (e.g., "DAIRY 100")
   - Department badge (e.g., "dairy")

### 4. Add Kroger Product to Grocery List

1. From search results (Test 3), tap a milk product to add it
2. Observe checkmark confirmation (1.5s)
3. Navigate back to grocery tab
4. Scroll to the "Dairy" department section
5. **Expected:** The added milk product appears in the Dairy section. Item has the product name. Item was added with `source: 'kroger'` (visible in Supabase if checking directly).

### 5. Category Auto-Assignment from Kroger Taxonomy

1. Search for "bananas" and add a result
2. Navigate back to grocery list
3. **Expected:** Bananas appear in the "Produce" section (not "Other"), confirming Kroger's "Produce" category mapped to app's "produce" department.

### 6. Change Store

1. On the search screen with a store already selected, tap "Change" button
2. **Expected:** Zip code input reappears for new store search
3. Enter a different zip code (e.g., "90210")
4. Select a different store
5. **Expected:** New store name shown. Search results now reflect the new store's inventory and pricing.

## Edge Cases

### Empty Search Results

1. With a store selected, search for "xyzzyplugh" (nonsense term)
2. **Expected:** "No products found" message displayed. No crash.

### Invalid Zip Code

1. Enter "00000" or "abc" as zip code
2. **Expected:** Either no stores found message or validation error. No crash.

### Null Price Products

1. Search for various terms until finding a product with no price
2. **Expected:** Product displays "Price N/A" or equivalent. Row doesn't crash or show "$undefined".

### Minimum Search Length

1. Type a single character in search input
2. **Expected:** No search fires (2-char minimum). No results, no error.

### Rapid Typing (Debounce)

1. Type "chocolate chip cookies" quickly
2. **Expected:** Only one search fires after typing stops (debounce prevents per-keystroke calls). Results match the full query.

### Adding Same Product Twice

1. Add the same product from search results twice
2. **Expected:** Two separate grocery items created (or handled gracefully — no crash, no duplicate error).

## Failure Signals

- "Search Products" button missing from grocery tab → layout registration broken
- Tapping "Search Products" shows 404 or blank screen → route not registered in _layout.tsx
- Zip code search returns nothing for known-good codes → search-stores Edge Function down or Kroger credentials invalid
- Product search returns nothing for "milk" at a known Kroger → search-products Edge Function down or OAuth failing
- Added product appears in "Other" section instead of correct department → mapKrogerCategory mapping broken
- Added product missing from grocery list entirely → insert failed silently, check console for [search-products] errors
- Store selection lost on re-entry → household_settings update failing

## Requirements Proved By This UAT

- GROC-14 — Tests 1-3 prove product search flow from grocery tab through results
- GROC-15 — Test 3 proves results display name, brand, price, size, aisle
- GROC-16 — Tests 4-5 prove auto-categorization from Kroger taxonomy to app departments
- GROC-17 — Tests 1-2, 6 prove store selection by zip with persistence and change capability

## Not Proven By This UAT

- Kroger API rate limit handling (429) — would require sustained load to trigger
- Kroger API downtime behavior — requires actual Kroger outage
- Realtime sync of Kroger-added items to other household members — requires multi-device test
- Long-term Kroger OAuth credential validity — requires time

## Notes for Tester

- Use real US zip codes near Kroger stores (45140 in Ohio is reliable). West coast zips may return Fred Meyer stores (Kroger subsidiary — expected).
- Some products genuinely have null prices in Kroger's API — this is not a bug.
- PromoPrice display (strikethrough original, show promo) is rare — if you see it, verify it looks right but don't expect to find one easily.
- The "Search Products" button is the third action alongside "Scan Receipt" and "Shop by Recipe" — look for the row of three buttons.
- If Edge Functions fail, check Supabase dashboard → Edge Functions → Logs for structured `{ phase, error }` output.
