---
id: T03
parent: S01b
milestone: M002
provides:
  - "Scan Receipt" button on main groceries page (moved from complete-trip)
  - scan-receipt → assign-items → complete-trip navigation flow
  - Ownership-based split mode in complete-trip with pre-computed per-member shares
  - RPC called with p_item_assignments for ownership splits
  - Post-completion navigation to trip-history with clean back-stack
  - Receipt items inserted as grocery_items for trip history visibility
key_files:
  - app/(app)/(tabs)/groceries.tsx
  - app/(app)/groceries/scan-receipt.tsx
  - app/(app)/groceries/complete-trip.tsx
  - supabase/migrations/20260316000012_fix_missing_columns.sql
  - supabase/migrations/20260316000013_fix_receipt_items_insert.sql
key_decisions:
  - "By Item" split mode tab appears only when itemAssignments are present — keeps UI clean for non-receipt trips
  - Ownership shares pre-computed client-side for display, but actual split math done server-side in RPC — single source of truth
  - Ownership mode shows read-only per-member totals (no checkboxes) — user already made assignment decisions on prior screen
  - After completing trip, dismissAll() + push to trip-history — clears scan→assign→complete stack so back goes to groceries tab
  - RPC inserts scanned receipt items as grocery_items directly when they don't match existing list items — ensures trip history shows all items
patterns_established:
  - Three-tab split mode toggle (By Item / Even / Custom) when ownership data available; two-tab (Even / Custom) otherwise
  - dismissAll() + push() pattern for post-flow navigation that clears intermediate screens
observability_surfaces:
  - RPC split_mode return field ('ownership' or 'even') logged per trip
duration: 45m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T03: Rewire navigation and update complete-trip for ownership splits

**Moved "Scan Receipt" to main groceries page, wired scan→assign→complete flow, added ownership-based split mode, and fixed post-completion navigation and trip history item display.**

## What Happened

Three app files changed plus two fixup migrations applied during UAT:

1. **scan-receipt.tsx**: Changed confirm navigation from `complete-trip` to `assign-items`.

2. **groceries.tsx**: Added "Scan Receipt" button below the quick-add input.

3. **complete-trip.tsx**: Major update:
   - Removed "Scan Receipt" button (now lives on main page)
   - Removed receipt summary card and ownership summary card (cleaner UI per user feedback)
   - Added `itemAssignments` route param parsing — auto-sets split mode to 'ownership' when assignments arrive
   - Added `ownershipShares` useMemo for per-member totals from assignments + receipt prices
   - Three-tab split mode toggle ("By Item" / "Even" / "Custom") shown when assignments present
   - Ownership mode renders read-only per-member shares
   - Submit calls RPC with `p_item_assignments` in ownership mode
   - Fixed double-serialization bug: JSONB params passed as objects not JSON.stringify'd
   - Post-completion navigates to trip-history via dismissAll() + push — clean back-stack

4. **Migration 00012**: Applied missing `unit_price` and `source` columns from migration 00010 that were never pushed to remote. Fixed migration history sync (renamed 000XX files to timestamp format, repaired remote migration table).

5. **Migration 00013**: Fixed RPC to insert scanned receipt items as `grocery_items` when they don't already exist on the grocery list. Without this, trip history showed 0 items for receipt-scanned trips.

## Verification

- ✅ `npx tsc --noEmit` passes (only pre-existing Deno/font errors)
- ✅ Full Expo Go flow: groceries tab → Scan Receipt → scan → review → assign items → complete trip → trip history shows items with prices
- ✅ "Scan Receipt" on groceries tab, removed from complete-trip
- ✅ Navigation: scan→assign→complete→trip-history; back from trip-history goes to groceries tab
- ✅ Even-split still works for non-receipt trips
- ✅ Ownership splits calculated correctly from item assignments
- ✅ Trip history shows correct item count and individual items with prices

## Diagnostics

- RPC response `split_mode` field indicates which split algorithm ran
- `SELECT name, assigned_to, unit_price FROM grocery_items WHERE trip_id = '<id>'` to audit trip items
- Navigation stack inspectable via Expo Router devtools

## Deviations

- Removed receipt summary card and ownership summary card from complete-trip per user feedback (simpler UI)
- Fixed double JSON.stringify on JSONB RPC params (was causing "cannot extract elements from a scalar" error)
- Fixed missing unit_price/source columns on remote DB (migration 00010 was never pushed)
- Fixed RPC to insert receipt items as grocery_items (scanned items weren't becoming rows)
- Changed post-completion navigation from router.back() to dismissAll() + push(trip-history) to clear intermediate screens
- Renamed all migration files from 000XX to timestamp format for supabase CLI compatibility

## Known Issues

None.

## Files Created/Modified

- `app/(app)/groceries/scan-receipt.tsx` — changed confirm navigation to assign-items
- `app/(app)/(tabs)/groceries.tsx` — added "Scan Receipt" button
- `app/(app)/groceries/complete-trip.tsx` — ownership splits, cleaned UI, fixed serialization, fixed navigation
- `supabase/migrations/20260316000012_fix_missing_columns.sql` — adds missing unit_price/source columns
- `supabase/migrations/20260316000013_fix_receipt_items_insert.sql` — fixes RPC to insert receipt items for trip history
