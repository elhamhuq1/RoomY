---
id: S01b
parent: M002
milestone: M002
provides:
  - assigned_to column on grocery_items for per-item member ownership
  - assign-items screen between scan-receipt and complete-trip
  - ownership-based split mode in complete-trip (three-tab: By Item / Even / Custom)
  - RPC accepts p_item_assignments and calculates splits from item ownership
  - "Scan Receipt" button moved to main groceries page
  - clean post-completion navigation (dismissAll + push trip-history)
  - receipt items inserted as grocery_items for trip history visibility
requires:
  - slice: S01
    provides: scan-receipt flow, complete_grocery_trip_with_receipt RPC, receipt capture + Gemini OCR
affects:
  - S02
key_files:
  - supabase/migrations/20260316000011_item_ownership.sql
  - supabase/migrations/20260316000012_fix_missing_columns.sql
  - supabase/migrations/20260316000013_fix_receipt_items_insert.sql
  - app/(app)/groceries/assign-items.tsx
  - app/(app)/groceries/complete-trip.tsx
  - app/(app)/groceries/scan-receipt.tsx
  - app/(app)/(tabs)/groceries.tsx
  - app/(app)/_layout.tsx
  - lib/types/database.ts
key_decisions:
  - Ownership splits added as p_item_assignments parameter to existing RPC (not a new function) — NULL default preserves backward compat
  - Unassigned items' cost = (total - assigned items' price sum) split evenly — supports partial assignment
  - RPC returns split_mode ('ownership' or 'even') for caller observability
  - By Item tab shown only when itemAssignments present — clean UI for non-receipt trips
  - Ownership shares pre-computed client-side for display; actual split math in server-side RPC (single source of truth)
  - Ownership mode shows read-only per-member totals — user already assigned on prior screen
  - dismissAll() + push(trip-history) pattern clears scan→assign→complete stack
patterns_established:
  - Tap-to-toggle member assignment per item (single tap, not dropdown)
  - Three-tab split mode toggle when ownership data present; two-tab otherwise
  - dismissAll() + push() for post-flow navigation that clears intermediate screens
  - JSONB array parameter pattern for item-level metadata (p_item_assignments matches p_item_prices)
observability_surfaces:
  - RPC split_mode return field ('ownership' or 'even')
  - assigned_to column queryable per-trip for ownership audit
  - idx_grocery_items_assigned_to index for per-user item history
  - Per-member running totals visible on assign-items screen before commit
drill_down_paths:
  - .gsd/milestones/M002/slices/S01b/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S01b/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S01b/tasks/T03-SUMMARY.md
duration: 1h25m
verification_result: passed
completed_at: 2026-03-15
---

# S01b: Receipt-Based Item Ownership & Smart Splitting

**Users can scan a receipt from the main groceries page, assign items to household members, and complete a trip with splits auto-calculated from item ownership — with even-split fallback for unassigned items.**

## What Happened

Three tasks built the ownership split pipeline end-to-end:

**T01 (Schema + RPC):** Added `assigned_to UUID` column to `grocery_items` with FK to `auth.users` and a partial index. Extended `complete_grocery_trip_with_receipt` RPC with `p_item_assignments JSONB` parameter. The RPC assigns items to users, sums each user's item prices for their share, splits unassigned-item cost evenly across all split members, and returns `split_mode` ('ownership' or 'even'). NULL default on the new parameter preserves full backward compatibility.

**T02 (Assign-Items Screen):** New `assign-items.tsx` sits between scan-receipt and complete-trip. Receives receipt items as route params, shows each item with a horizontal row of household member avatars as tap-to-toggle selectors. Running per-member totals and an "unassigned/shared" bucket display in a fixed bottom bar. Forwards assignments as JSON to complete-trip. Empty-state handles missing receipt data gracefully.

**T03 (Navigation + Integration):** Moved "Scan Receipt" button from complete-trip to the main groceries page. Rewired scan-receipt confirm to navigate to assign-items instead of complete-trip. Added three-tab split mode toggle (By Item / Even / Custom) to complete-trip — "By Item" tab only appears when ownership data arrives. Ownership mode renders read-only per-member shares. RPC called with `p_item_assignments` in ownership mode. Fixed double JSON.stringify on JSONB params, added two fixup migrations for missing columns and receipt-item insertion, and switched post-completion navigation to dismissAll() + push(trip-history) for a clean back-stack.

## Verification

- `npx tsc --noEmit` passes (only pre-existing Deno/font errors, unchanged)
- Full Expo Go flow verified: groceries tab → Scan Receipt → scan → review → assign items → complete trip with ownership splits → trip history shows items with prices
- "Scan Receipt" button visible on groceries tab, removed from complete-trip
- Even-split still works for non-receipt trips (regression verified)
- Navigation: scan→assign→complete→trip-history; back from trip-history returns to groceries tab (no re-entry to intermediate screens)
- RPC returns `split_mode: 'ownership'` when items assigned, `'even'` when no assignments
- Empty receiptItems on assign-items screen shows empty state with "Go Back" (no crash)
- FK constraint on `assigned_to` prevents assignment to non-existent users
- RPC with NULL/empty `p_item_assignments` falls back to even split (backward compat)

## Requirements Advanced

- GROC-05 — Per-item prices now include ownership data: `assigned_to` tracks who each item belongs to, visible in trip history queries

## Requirements Validated

- None newly validated (S01b extends S01's receipt flow but doesn't fully validate new requirements on its own — ownership splitting is an enhancement within GROC-05's scope)

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

- Removed receipt summary card and ownership summary card from complete-trip per user feedback — simpler UI than planned
- Fixed double JSON.stringify on JSONB RPC params (was causing "cannot extract elements from a scalar" error at runtime)
- Two fixup migrations added during UAT: `20260316000012` for missing `unit_price`/`source` columns that were never pushed to remote, `20260316000013` for RPC not inserting receipt items as `grocery_items` (scanned items weren't becoming rows in trip history)
- All migration files renamed from `000XX` to timestamp format for Supabase CLI compatibility
- Post-completion navigation changed from `router.back()` to `dismissAll() + push(trip-history)` to clear intermediate screens

## Known Limitations

- Item assignment is by name string, not by a stable item ID — if two receipt items have the same name, assignment applies to the first match
- No persistence of assignments before trip completion — if the app crashes between assign-items and complete-trip, assignments are lost (route params only)
- Ownership mode shows per-member totals but doesn't break down which specific items are assigned to whom on the complete-trip screen (that detail is on the assign-items screen)

## Follow-ups

- None — all planned functionality shipped

## Files Created/Modified

- `supabase/migrations/20260316000011_item_ownership.sql` — assigned_to column, partial index, updated RPC with ownership split logic
- `supabase/migrations/20260316000012_fix_missing_columns.sql` — adds missing unit_price/source columns from unpushed migration
- `supabase/migrations/20260316000013_fix_receipt_items_insert.sql` — fixes RPC to insert receipt items as grocery_items for trip history
- `app/(app)/groceries/assign-items.tsx` — new screen: per-item member assignment with running totals
- `app/(app)/groceries/complete-trip.tsx` — ownership split mode, three-tab toggle, RPC integration, cleaned UI, fixed navigation
- `app/(app)/groceries/scan-receipt.tsx` — confirm now navigates to assign-items
- `app/(app)/(tabs)/groceries.tsx` — added "Scan Receipt" button, assigned_to in optimistic add
- `app/(app)/_layout.tsx` — registered assign-items route
- `lib/types/database.ts` — added assigned_to to GroceryItem, updated RPC signature

## Forward Intelligence

### What the next slice should know
- The `complete_grocery_trip_with_receipt` RPC is the single entry point for receipt-based trips. It now handles three concerns: item price storage, item ownership assignment, and split calculation. Any new split logic should extend this RPC, not create a parallel one.
- The Gemini REST API pattern (endpoint, auth header, markdown fence stripping) established in S01's scan-receipt Edge Function is the template for S02's recipe import function.
- Migration files are now in timestamp format (`20260316000NNN_*.sql`). The original `000XX` format was renamed for Supabase CLI compatibility.

### What's fragile
- Item-to-assignment matching uses `LOWER(name) = LOWER(assignment.name)` — any name normalization differences between scan-receipt output and the RPC's matching logic will cause silent assignment failures (items fall through to even-split instead of erroring)
- Route param serialization: JSONB params must be passed as objects to the RPC, not JSON.stringify'd strings. T03 fixed a double-serialization bug — if new route params are added, watch for this pattern

### Authoritative diagnostics
- `SELECT name, assigned_to, unit_price FROM grocery_items WHERE trip_id = '<id>'` — ground truth for what the RPC actually stored
- RPC response `split_mode` field — confirms which algorithm ran without re-querying

### What assumptions changed
- Original plan assumed scan-receipt button stays on complete-trip with a second copy on main page — it was fully moved to main page only (cleaner UX)
- Original plan included receipt/ownership summary cards on complete-trip — removed per user feedback for simpler UI
- Migration 00010 (from S01) was assumed to be applied on remote — it wasn't, requiring fixup migration 00012
