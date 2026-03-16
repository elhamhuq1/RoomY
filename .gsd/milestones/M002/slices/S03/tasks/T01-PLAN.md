---
estimated_steps: 6
estimated_files: 5
---

# T01: Add category column, type, and department taxonomy

**Slice:** S03 — Category & Aisle Organization
**Milestone:** M002

## Description

Creates the data foundation for department-based grocery organization: a `category` column on `grocery_items`, the updated TypeScript type, a shared department taxonomy constant, and updated insert paths so all new items include `category`.

## Steps

1. Create `supabase/migrations/20260316000014_add_category_column.sql` with `ALTER TABLE grocery_items ADD COLUMN category TEXT NOT NULL DEFAULT 'other'`
2. Add `category: string` field to the `GroceryItem` interface in `lib/types/database.ts` (after `source`). Also add `category` to the `Insert` type's optional fields (it has a DB default) and ensure `Update` type covers it via `Partial<Omit<GroceryItem, "id">>` (already does)
3. Create `lib/constants/grocery-departments.ts`:
   - Export `DepartmentInfo` type: `{ id: string; label: string; icon: string }`
   - Export `DEPARTMENTS: DepartmentInfo[]` — ordered array in store-walk order: produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other
   - Export `DEPARTMENT_MAP: Record<string, DepartmentInfo>` — lookup by id
   - Icons (Ionicons): produce→leaf, dairy→water, meat→flame, frozen→snow, bakery→pizza, beverages→cafe, snacks→fast-food, pantry→cube, household→home, other→grid
4. In `app/(app)/(tabs)/groceries.tsx`, update the optimistic `GroceryItem` object in `addItem` (~line 206) to include `category: 'other'`
5. In `app/(app)/groceries/import-recipe.tsx`, add `category: 'other'` to the `.insert()` call (~line 182) alongside the existing `source: 'recipe'`
6. Run `npx tsc --noEmit` to verify all types align

## Must-Haves

- [ ] Migration file adds `category TEXT NOT NULL DEFAULT 'other'` to `grocery_items`
- [ ] `GroceryItem` interface includes `category: string`
- [ ] Department taxonomy constant exports ordered array and lookup map
- [ ] `addItem` optimistic object includes `category: 'other'`
- [ ] Recipe import insert includes `category: 'other'`

## Verification

- `npx tsc --noEmit` passes with zero errors
- Migration file is valid SQL (parseable, correct table name)
- `lib/constants/grocery-departments.ts` exports `DEPARTMENTS` (10 items) and `DEPARTMENT_MAP`
- Grep confirms `category` appears in both insert paths

## Inputs

- `lib/types/database.ts` — current `GroceryItem` interface (lines 69-82), no `category` field yet
- `app/(app)/(tabs)/groceries.tsx` — `addItem` callback at ~line 200, optimistic object at ~line 206
- `app/(app)/groceries/import-recipe.tsx` — insert call at ~line 182 with `source: 'recipe'`
- `supabase/migrations/` — existing migrations end at `20260316000013_fix_receipt_items_insert.sql`
- DECISIONS.md records: "Fixed department taxonomy (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other)"

## Expected Output

- `supabase/migrations/20260316000014_add_category_column.sql` — new migration file
- `lib/types/database.ts` — `GroceryItem` interface with `category: string` field
- `lib/constants/grocery-departments.ts` — new file with taxonomy constant
- `app/(app)/(tabs)/groceries.tsx` — `addItem` optimistic object includes `category: 'other'`
- `app/(app)/groceries/import-recipe.tsx` — insert includes `category: 'other'`

## Observability Impact

- **Schema change:** `grocery_items.category` column is directly queryable via `SELECT DISTINCT category FROM grocery_items` — useful for verifying migration applied and data distribution.
- **Index:** `idx_grocery_items_category` on `(household_id, category)` supports efficient grouped queries; `EXPLAIN` will show index usage.
- **Inspection surface:** `DEPARTMENT_MAP` and `DEPARTMENTS` exports can be imported in any diagnostic context to validate taxonomy completeness.
- **Failure state:** If migration fails to apply, `category` column will be absent — downstream `tsc` and runtime queries will fail explicitly with column-not-found errors (not silent).
