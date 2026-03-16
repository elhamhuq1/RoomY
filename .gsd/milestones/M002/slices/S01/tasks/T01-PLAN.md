---
estimated_steps: 5
estimated_files: 2
---

# T01: Add receipt schema migration, Storage bucket, and TypeScript types

**Slice:** S01 — Receipt Scanning
**Milestone:** M002

## Description

Create the database migration that adds `unit_price` and `source` columns to `grocery_items`, creates the `receipts` Storage bucket with RLS policies, and adds a new `complete_grocery_trip_with_receipt` RPC that stores per-item prices during trip completion. Update TypeScript types to match the new schema.

## Steps

1. Create `supabase/migrations/00010_receipt_scanning.sql`:
   - `ALTER TABLE grocery_items ADD COLUMN unit_price NUMERIC(10,2)` (nullable — existing items don't have prices)
   - `ALTER TABLE grocery_items ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'` (values: 'manual', 'receipt', 'recipe', 'kroger' — future slices use the latter two)
   - Create `receipts` Storage bucket: `INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)`
   - Add RLS policies on `storage.objects` for the `receipts` bucket: household members can upload (INSERT where bucket_id='receipts'), authenticated users can read their household's receipts (SELECT). Follow the exact pattern from `00009_create_avatars_bucket.sql` but scope paths to `{household_id}/` prefix.
   - Create `complete_grocery_trip_with_receipt` RPC: same signature as `complete_grocery_trip` plus `p_item_prices JSONB DEFAULT NULL`. When `p_item_prices` is provided (array of `{"name": string, "quantity": int, "price": number}`), after archiving checked items to the trip, iterate the JSON array and UPDATE each matching `grocery_items` row (matched by `trip_id = v_trip_id`) setting `unit_price` from the JSON and `source = 'receipt'`. If item names don't match exactly, do a case-insensitive ILIKE match. Items without a price match keep `unit_price` NULL. The rest of the RPC logic (expense creation, splits) is identical to the existing `complete_grocery_trip`.

2. Update `lib/types/database.ts`:
   - Add `unit_price: number | null` and `source: string` to the `GroceryItem` interface
   - Update the `Insert` type to include optional `unit_price?: number | null` and `source?: string`
   - Update the `Update` type (already `Partial`, should auto-include)

## Must-Haves

- [ ] `unit_price` column is nullable NUMERIC(10,2) on `grocery_items`
- [ ] `source` column has DEFAULT 'manual' and is NOT NULL
- [ ] `receipts` Storage bucket created with RLS policies
- [ ] `complete_grocery_trip_with_receipt` RPC accepts `p_item_prices JSONB` and stores unit prices on archived items
- [ ] TypeScript `GroceryItem` type includes `unit_price` and `source`
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` exits 0
- Migration file contains `unit_price`, `source` column definitions, `receipts` bucket, RLS policies, and new RPC
- Grep `GroceryItem` in types file shows `unit_price` and `source` fields

## Observability Impact

- Signals added/changed: New `source` column enables future querying of item provenance (manual vs receipt vs recipe vs kroger)
- How a future agent inspects this: `SELECT source, count(*) FROM grocery_items GROUP BY source` in Supabase SQL editor
- Failure state exposed: If migration fails to apply, Supabase dashboard shows migration error; subsequent tasks fail on missing columns

## Inputs

- `supabase/migrations/00009_create_avatars_bucket.sql` — Storage bucket + RLS policy pattern to follow
- `supabase/migrations/00003_groceries.sql` — existing `grocery_items` schema and `complete_grocery_trip` RPC to extend
- `lib/types/database.ts` — existing TypeScript types for `GroceryItem` and table operation types

## Expected Output

- `supabase/migrations/00010_receipt_scanning.sql` — complete migration with columns, bucket, RLS, and RPC
- `lib/types/database.ts` — updated with `unit_price` and `source` on `GroceryItem` and operation types
