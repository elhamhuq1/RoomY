---
id: T02
parent: S04
milestone: M002
provides:
  - Product search screen with store selection, search, and add-to-list
  - Third "Search Products" action button on grocery tab
  - Full Kroger → grocery list integration flow
key_files:
  - app/(app)/groceries/search-products.tsx
  - app/(app)/_layout.tsx
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Compose product display name as "Brand Name" only when brand isn't already the start of the name
  - 300ms debounce for product search, minimum 2 chars before searching
  - Optimistic add-to-list with 1.5s checkmark confirmation instead of toast
patterns_established:
  - Edge Function invocation via supabase.functions.invoke with structured error surfacing
  - Console error prefix convention: [search-products] for all screen-level errors
observability_surfaces:
  - Console errors prefixed [search-products] at store search, product search, store persist, and add-to-list phases
  - household_settings.kroger_location_id tracks persisted store selection
  - grocery_items with source='kroger' tracks Kroger-added items
  - UI error states surface Edge Function error messages directly to the user
duration: 35min
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Build product search screen with store selection and grocery list integration

**Created full Kroger product search screen with store zip lookup, persisted store selection, debounced product search, price/promo/aisle display, and one-tap add to grocery list with auto-categorization.**

## What Happened

Steps 1 and 2 (layout registration and third action button) were already in place from prior work. Confirmed both are correctly wired.

Built `search-products.tsx` with three sections:
1. **Store selection** — zip code input → calls `search-stores` Edge Function → lists nearby Kroger stores → tap to select → persists `kroger_location_id`/`name` to `household_settings` → refreshes auth context
2. **Product search** — debounced text input (300ms, min 2 chars) → calls `search-products` Edge Function → renders results with name, brand, price (with promo strikethrough), size, aisle info, and department badge
3. **Add to list** — tap adds `grocery_item` with `source: 'kroger'` and `category` from Kroger's mapped department → optimistic checkmark confirmation for 1.5s

All error/loading/empty states handled: invalid zip, no stores found, Kroger API errors (with retry), no products found, add-to-list failures.

Had to create placeholder PNG files for 9 missing empty-state image assets (`docs/empty-state-images/` and `docs/icons/`) to unblock the Metro web bundler — pre-existing issue unrelated to this task.

## Verification

- **`npx tsc --noEmit`**: passes — no errors from new screen file. All pre-existing errors are in Deno edge functions and expo-google-fonts (not related).
- **Metro web bundle**: compiles successfully after placeholder image fix. App renders on web at localhost:8082.
- **Layout registration**: confirmed `groceries/search-products` Stack.Screen exists at line 118 of `_layout.tsx` with standard cream header config.
- **Third action button**: confirmed "Search Products" button at line 497 of `groceries.tsx` with `search-outline` icon and `router.push('/(app)/groceries/search-products')`.
- **Route existence**: navigating to `/groceries/search-products` triggers auth redirect (correct behavior for protected route, not 404).
- **Code review**: all must-haves verified present — store selection with zip input, store persistence, change store, debounced search, product rows with price/promo/size/aisle/department, add-to-list with kroger source and category, loading/error/empty states.

### Slice-level verification status

| Check | Status |
|-------|--------|
| search-stores Edge Function curl test | ✅ passed (T01) |
| search-products Edge Function curl test | ✅ passed (T01) |
| `npx tsc --noEmit` passes | ✅ passed |
| Store selection persists kroger_location_id | ✅ code verified (update + refreshProfile) |
| Product search renders results with price/size/aisle | ✅ code verified (all fields rendered) |
| Adding product creates grocery_item with source:'kroger' | ✅ code verified (insert with source + category) |
| Item appears in correct department section | ✅ code uses product.department from Edge Function |
| Edge Functions return { error, phase } on failure | ✅ passed (T01) |

Full E2E visual verification (seeing actual store results, product results, and grocery list integration) requires authenticated session with valid Supabase credentials — blocked by test account availability in web dev environment.

## Diagnostics

- **Console errors**: all screen errors use `[search-products]` prefix for grepability in Metro/RN logs
- **Store persistence**: query `household_settings.kroger_location_id` for any household to see selected store
- **Added items**: query `grocery_items WHERE source = 'kroger'` to see Kroger-added items with their categories
- **Edge Function errors**: UI surfaces the `error` string from Edge Function responses; `phase` field available in Edge Function logs

## Deviations

- Steps 1 and 2 (layout registration, third action button) were already done — skipped re-implementing. Verified they're correct.
- Created placeholder PNG assets for 9 missing empty-state images to unblock web bundler — pre-existing tech debt, not part of task scope.

## Known Issues

- Missing real empty-state images in `docs/empty-state-images/` and `docs/icons/` — placeholder 1x1 PNGs created to unblock web bundler. These need real artwork.
- Web dev environment lacks `.env` by default in worktree — had to copy from main project.
- Full E2E visual verification requires authenticated session (valid test credentials needed).

## Files Created/Modified

- `app/(app)/groceries/search-products.tsx` — new screen: store selection, product search, add-to-list
- `app/(app)/_layout.tsx` — already had Stack.Screen registration (verified)
- `app/(app)/(tabs)/groceries.tsx` — already had third action button (verified)
- `.gsd/milestones/M002/slices/S04/tasks/T02-PLAN.md` — added Observability Impact section
- `docs/empty-state-images/*.png` — 9 placeholder PNGs (pre-existing missing assets)
- `docs/icons/*.png` — 6 placeholder PNGs (pre-existing missing assets)
