# S03: Category & Aisle Organization

**Goal:** Grocery items have a `category` field; the list groups unchecked items by store department with collapsible sections; users can manually reassign any item's category via long-press.

**Demo:** Grocery list shows items organized under collapsible department headers (Produce, Dairy, Meat, Frozen, Bakery, Beverages, Snacks, Pantry, Household, Other). Adding an item places it in "Other". Long-pressing any item opens a category picker overlay — tapping a department moves the item into that section immediately. DONE section remains a single flat collapsible list.

## Must-Haves

- `category TEXT NOT NULL DEFAULT 'other'` column on `grocery_items` (GROC-10)
- Shared department taxonomy constant with ordered list, labels, and icons (GROC-12 infrastructure)
- Unchecked items grouped by department with collapsible section headers (GROC-11)
- Empty departments hidden — only departments with items render
- Long-press category picker overlay on any item regardless of source (GROC-13)
- Category change persists optimistically + via Supabase update
- `addItem` optimistic object and insert include `category: 'other'`
- Recipe import insert includes `category: 'other'`

## Proof Level

- This slice proves: integration (schema → grouped UI → manual reassignment end-to-end)
- Real runtime required: yes (Expo Go visual verification)
- Human/UAT required: yes (department grouping UX, category picker interaction)

## Verification

- `npx tsc --noEmit` passes with `category` field on `GroceryItem`
- `supabase migration up` or `supabase db reset` applies cleanly (category column exists)
- Visual in Expo Go: grocery list shows department sections, items grouped correctly, collapsible headers work, long-press shows picker, category change moves item to correct section

## Observability / Diagnostics

- Runtime signals: category change is a standard Supabase `.update()` — errors surface via existing error handling pattern
- Inspection surfaces: `grocery_items.category` column queryable directly; department grouping visible in UI
- Failure visibility: optimistic rollback on update failure (item snaps back to original section)
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `groceries.tsx` flat list UI, `GroceryItemRow` component, `SectionHeader` component, `GroceryItem` type, recipe import insert path
- New wiring introduced in this slice: department taxonomy constant (consumed by S04), `category` column on `grocery_items` (written by S04 Kroger search), grouped list rendering
- What remains before the milestone is truly usable end-to-end: S04 (Kroger product search with auto-categorization)

## Tasks

- [ ] **T01: Add category column, type, and department taxonomy** `est:30m`
  - Why: Everything else depends on the schema column, the TypeScript type, and the shared taxonomy constant. Gets the data layer right first.
  - Files: `supabase/migrations/20260316000014_add_category_column.sql`, `lib/types/database.ts`, `lib/constants/grocery-departments.ts`
  - Do: Create migration adding `category TEXT NOT NULL DEFAULT 'other'` to `grocery_items`. Add `category: string` to `GroceryItem` interface and the `Insert`/`Update` types. Create `lib/constants/grocery-departments.ts` exporting an ordered array of `{ id, label, icon }` for the 10 departments (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other) and a `Record<string, DepartmentInfo>` lookup map. Add `category: 'other'` to the optimistic `GroceryItem` in `addItem` in `groceries.tsx` and to the recipe import insert in `import-recipe.tsx`.
  - Verify: `npx tsc --noEmit` passes. Migration file exists and is valid SQL.
  - Done when: `GroceryItem` includes `category`, taxonomy constant is importable, all insert paths include `category`.

- [ ] **T02: Group grocery list by department with collapsible sections** `est:1h`
  - Why: Core deliverable — transforms the flat "TO GET" list into department-grouped sections for efficient in-store shopping (GROC-11).
  - Files: `app/(app)/(tabs)/groceries.tsx`, `components/groceries/SectionHeader.tsx`
  - Do: Import the department taxonomy. Add `collapsedDepts` state (`Set<string>`). Replace flat `uncheckedItems` rendering with a `useMemo` that groups items by `category` into `Record<string, GroceryItem[]>`. Iterate departments in taxonomy order, skip empty ones, render each as a collapsible `SectionHeader` (with department icon) + `Card` containing `GroceryItemRow` list. Optionally add an `icon` prop to `SectionHeader` for department icons. Keep DONE section unchanged as a single flat collapsible list. Ensure collapsible state survives realtime updates.
  - Verify: `npx tsc --noEmit` passes. Visual in Expo Go: items grouped by department, sections collapse/expand independently, empty departments hidden, DONE section unchanged.
  - Done when: Unchecked items render in department groups with collapsible headers in store-walk order.

- [ ] **T03: Long-press category picker for manual reassignment** `est:45m`
  - Why: Users need to reassign any item's category regardless of source — manual, receipt, or recipe (GROC-13). Long-press is a distinct gesture that doesn't conflict with existing tap (edit) and swipe (delete).
  - Files: `components/groceries/CategoryPicker.tsx`, `components/groceries/GroceryItemRow.tsx`, `components/groceries/index.ts`, `app/(app)/(tabs)/groceries.tsx`
  - Do: Create `CategoryPicker` component — a `Modal` with transparent background showing department pills (icon + label) in a grid/list. Accepts `visible`, `currentCategory`, `onSelect`, `onDismiss` props. Add `onLongPress` prop to `GroceryItemRow` and wire it to the outer `Pressable`. In `groceries.tsx`, add state for the long-pressed item, show `CategoryPicker` on long-press, handle selection by optimistically updating the item's category in local state + calling `supabase.from('grocery_items').update({ category })`. Item moves to the correct department section immediately. Export `CategoryPicker` from barrel.
  - Verify: `npx tsc --noEmit` passes. Visual in Expo Go: long-press any item → picker appears → tap department → item moves to new section → picker dismisses. Works on manual, recipe, and receipt items.
  - Done when: Long-press on any grocery item opens category picker; selecting a department persists the change and the item appears in the correct section.

## Files Likely Touched

- `supabase/migrations/20260316000014_add_category_column.sql`
- `lib/types/database.ts`
- `lib/constants/grocery-departments.ts`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/groceries/import-recipe.tsx`
- `components/groceries/SectionHeader.tsx`
- `components/groceries/GroceryItemRow.tsx`
- `components/groceries/CategoryPicker.tsx`
- `components/groceries/index.ts`
