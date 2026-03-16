---
id: T01
parent: S01
milestone: M002
provides:
  - unit_price and source columns on grocery_items
  - receipts Storage bucket with household-scoped RLS
  - complete_grocery_trip_with_receipt RPC
  - TypeScript types for new schema
key_files:
  - supabase/migrations/00010_receipt_scanning.sql
  - lib/types/database.ts
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Used case-insensitive LOWER() match (not ILIKE with wildcards) for receipt item→grocery item matching in the RPC — exact match after lowering, not fuzzy
  - Receipts bucket scoped to household_id/ prefix (not user_id/) since receipts belong to household shopping trips
  - 10MB file size limit on receipts bucket (vs 5MB for avatars) since receipt photos may be higher resolution
patterns_established:
  - Household-scoped Storage RLS pattern using get_user_household_ids() with storage.foldername cast to UUID
observability_surfaces:
  - "SELECT source, count(*) FROM grocery_items GROUP BY source" for item provenance breakdown
  - Supabase Dashboard → Storage browser for receipts bucket
duration: 15m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Add receipt schema migration, Storage bucket, and TypeScript types

**Added `unit_price`/`source` columns, `receipts` bucket with household-scoped RLS, and `complete_grocery_trip_with_receipt` RPC; updated TypeScript types to match.**

## What Happened

Created migration `00010_receipt_scanning.sql` with three sections:

1. **Columns**: Added `unit_price NUMERIC(10,2)` (nullable) and `source TEXT NOT NULL DEFAULT 'manual'` to `grocery_items`.

2. **Storage**: Created private `receipts` bucket (10MB limit, JPEG/PNG/WebP) with four RLS policies scoped to `{household_id}/` prefix using `get_user_household_ids()` — same pattern as avatars but household-scoped instead of user-scoped.

3. **RPC**: `complete_grocery_trip_with_receipt` extends the existing `complete_grocery_trip` with an optional `p_item_prices JSONB` parameter. When provided, after archiving checked items it iterates the JSON array and updates matching grocery items (case-insensitive name match) with `unit_price` and `source = 'receipt'`.

Updated `lib/types/database.ts` — added `unit_price: number | null` and `source: string` to `GroceryItem` interface, added them as optional fields on the Insert type, and added the new RPC to the Functions section.

Fixed an optimistic insert in `groceries.tsx` that was creating a `GroceryItem` literal without the new fields.

## Verification

- `npx tsc --noEmit` — zero new errors (21 pre-existing Deno/font errors remain, all in `supabase/functions/` and `_layout.tsx`)
- Migration file grep confirms: `unit_price` column, `source` column, `receipts` bucket, 4 RLS policies, `complete_grocery_trip_with_receipt` RPC
- TypeScript types grep confirms: `unit_price` and `source` on `GroceryItem` Row and Insert types
- Slice-level checks: `npx tsc --noEmit` ✅ (passes, no new errors). Other slice checks (curl Edge Function, Expo Go flow, Storage upload) are for later tasks.

## Diagnostics

- `SELECT source, count(*) FROM grocery_items GROUP BY source` — shows item provenance breakdown
- Supabase Dashboard → Storage browser → `receipts` bucket to verify bucket creation
- If migration fails: Supabase Dashboard shows migration error; `unit_price` column missing from `grocery_items` table

## Deviations

- Fixed `app/(app)/(tabs)/groceries.tsx` optimistic insert to include new `unit_price: null` and `source: 'manual'` fields — not in the plan but required for tsc to pass after the type change.
- Used `LOWER()` equality match instead of `ILIKE` for item name matching in the RPC — ILIKE with wildcards could cause false matches (e.g., "Milk" matching "Buttermilk"). The plan said "case-insensitive ILIKE match" but exact-after-lowering is safer.

## Known Issues

None.

## Files Created/Modified

- `supabase/migrations/00010_receipt_scanning.sql` — new migration with columns, bucket, RLS, and RPC
- `lib/types/database.ts` — added `unit_price`, `source` to GroceryItem; added new RPC type
- `app/(app)/(tabs)/groceries.tsx` — fixed optimistic insert to include new fields
