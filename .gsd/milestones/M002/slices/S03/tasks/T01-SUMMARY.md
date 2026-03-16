---
id: T01
parent: S03
milestone: M002
provides:
  - category column on grocery_items (TEXT NOT NULL DEFAULT 'other')
  - category field on GroceryItem TypeScript interface and Insert/Update types
  - DEPARTMENTS ordered taxonomy array and DEPARTMENT_MAP lookup
  - category: 'other' in both manual-add and recipe-import insert paths
key_files:
  - supabase/migrations/20260316000014_add_category_column.sql
  - lib/types/database.ts
  - lib/constants/grocery-departments.ts
  - app/(app)/(tabs)/groceries.tsx
  - app/(app)/groceries/import-recipe.tsx
key_decisions:
  - Added composite index (household_id, category) to support efficient grouped queries in T02
patterns_established:
  - Department taxonomy as a typed constant array + derived lookup map — downstream consumers import DEPARTMENTS for ordering and DEPARTMENT_MAP for O(1) lookups
observability_surfaces:
  - grocery_items.category column queryable directly (SELECT DISTINCT category FROM grocery_items)
  - idx_grocery_items_category index verifiable via EXPLAIN
duration: 12m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Add category column, type, and department taxonomy

**Added `category` column to `grocery_items`, updated TypeScript types, created 10-department taxonomy constant, and wired `category: 'other'` into both insert paths.**

## What Happened

Created the data foundation for department-based grocery organization across 5 files:

1. **Migration** — `ALTER TABLE grocery_items ADD COLUMN category TEXT NOT NULL DEFAULT 'other'` with a composite index on `(household_id, category)` for efficient grouped queries.
2. **TypeScript types** — Added `category: string` to `GroceryItem` interface. Added `category` to the `Insert` type's `Omit` list and re-added as optional (has DB default). `Update` type already covers it via `Partial<Omit<GroceryItem, "id">>`.
3. **Department taxonomy** — Created `lib/constants/grocery-departments.ts` exporting `DEPARTMENTS` (10-item ordered array in store-walk order) and `DEPARTMENT_MAP` (Record lookup by id). Each entry has `id`, `label`, and `icon` (Ionicons name).
4. **Insert paths** — Added `category: 'other'` to the optimistic `GroceryItem` object in `addItem` (groceries.tsx) and to the Supabase `.insert()` call in recipe import (import-recipe.tsx).

## Verification

- `npx tsc --noEmit` — zero new errors (pre-existing Deno edge function and font module errors only)
- `DEPARTMENTS` exports 10 items; `DEPARTMENT_MAP` has all 10 keys (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other)
- `rg category` confirms field present in both insert paths (groceries.tsx:215, import-recipe.tsx:188)
- Migration file is valid SQL with correct table name

### Slice-level verification status (T01 of 3):
- ✅ `npx tsc --noEmit` passes with `category` field on `GroceryItem`
- ⏳ `supabase migration up` / `supabase db reset` — not run locally (migration file valid, will verify when applied)
- ⏳ Visual in Expo Go — T02/T03 will add the grouped UI; no visual change from T01 alone
- ⏳ Diagnostic failure-path check — T03 will implement optimistic rollback

## Diagnostics

- `SELECT DISTINCT category FROM grocery_items` — verify column exists and default applied to existing rows
- `EXPLAIN SELECT * FROM grocery_items WHERE household_id = '...' ORDER BY category` — verify index usage
- `import { DEPARTMENTS, DEPARTMENT_MAP } from '@/lib/constants/grocery-departments'` — verify taxonomy importable

## Deviations

- Added `idx_grocery_items_category` composite index on `(household_id, category)` — not in the plan but needed for T02's grouped queries to perform well.

## Known Issues

None.

## Files Created/Modified

- `supabase/migrations/20260316000014_add_category_column.sql` — new migration adding category column and composite index
- `lib/types/database.ts` — added `category: string` to GroceryItem interface and Insert type
- `lib/constants/grocery-departments.ts` — new file with department taxonomy constant (10 departments)
- `app/(app)/(tabs)/groceries.tsx` — added `category: 'other'` to optimistic GroceryItem in addItem
- `app/(app)/groceries/import-recipe.tsx` — added `category: 'other'` to recipe import insert call
