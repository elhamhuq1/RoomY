---
id: T01
parent: S01b
milestone: M002
provides:
  - assigned_to column on grocery_items for item ownership tracking
  - updated complete_grocery_trip_with_receipt RPC with ownership-based split calculation
  - TypeScript types updated for assigned_to field and new RPC signature
key_files:
  - supabase/migrations/00011_item_ownership.sql
  - lib/types/database.ts
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Ownership splits computed inside the existing RPC (not a new function) — additive parameter p_item_assignments keeps backward compat
  - Unassigned items' cost (total_amount minus assigned items' price sum) splits evenly across all split members
  - RPC returns split_mode ('ownership' or 'even') so callers know which path was used
patterns_established:
  - JSONB array parameter pattern for item-level metadata (p_item_assignments matches p_item_prices pattern)
  - Fallback-to-even-split when no ownership data has prices — graceful degradation, never errors
observability_surfaces:
  - RPC split_mode return field indicates which split algorithm ran
  - assigned_to column queryable per-trip for ownership audit
  - idx_grocery_items_assigned_to index for per-user item history
duration: 20m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Add assigned_to column and update RPC for ownership-based splits

**Added `assigned_to` column to `grocery_items` and updated `complete_grocery_trip_with_receipt` RPC to calculate ownership-based splits from item assignments.**

## What Happened

Created migration `00011_item_ownership.sql` that:
1. Adds nullable `assigned_to UUID REFERENCES auth.users` column to `grocery_items`
2. Adds a partial index on `assigned_to` for efficient per-user queries
3. Replaces the `complete_grocery_trip_with_receipt` function with an updated version that accepts `p_item_assignments JSONB` (array of `{ name, assigned_to }`)

The RPC split logic works in two modes:
- **Ownership mode**: When assignments exist and assigned items have `unit_price`, sums each user's item prices for their share. Remainder (unassigned items / items without prices) splits evenly across all split members.
- **Even mode** (fallback): When no assignments provided, or assigned items have no prices, splits `total_amount` evenly — identical to previous behavior.

Updated `GroceryItem` interface and Database types to include `assigned_to` field and the new `p_item_assignments` RPC parameter. Fixed one optimistic-add object in `groceries.tsx` that needed the new field.

## Verification

- `npx tsc --noEmit` passes (no new errors; pre-existing Deno edge function and font module errors remain unchanged)
- Migration SQL reviewed for syntactic correctness: ALTER TABLE, CREATE INDEX, CREATE OR REPLACE FUNCTION all valid
- RPC backward compatibility: `p_item_assignments` defaults to NULL, existing callers unaffected
- Fallback path: when `v_assigned_total = 0`, even-split branch executes (no divide-by-zero risk)

## Diagnostics

- Query item ownership for a trip: `SELECT name, assigned_to, unit_price FROM grocery_items WHERE trip_id = '<id>'`
- RPC response includes `split_mode` field — check whether `'ownership'` or `'even'` was applied
- FK constraint on `assigned_to` prevents assignment to non-existent users (transaction rolls back cleanly)

## Deviations

None.

## Known Issues

- Pre-existing: `npx tsc --noEmit` reports errors in `supabase/functions/` (Deno types) and `@expo-google-fonts/nunito` (missing module declaration). These are not related to this task.

## Files Created/Modified

- `supabase/migrations/00011_item_ownership.sql` — new migration: assigned_to column, index, updated RPC
- `lib/types/database.ts` — added assigned_to to GroceryItem, updated RPC Args/Returns
- `app/(app)/(tabs)/groceries.tsx` — added assigned_to: null to optimistic GroceryItem creation
- `.gsd/milestones/M002/slices/S01b/S01b-PLAN.md` — added Observability/Diagnostics and Failure-Path sections, marked T01 done
