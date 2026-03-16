# S03: Category & Aisle Organization — Research

**Date:** 2026-03-15

## Summary

This slice adds a `category` column to `grocery_items`, groups the grocery list by department with collapsible sections, and provides a category picker for manual reassignment. It's straightforward schema + frontend work following established codebase patterns. No new external APIs, no new Edge Functions, no unfamiliar technology.

The current grocery list in `groceries.tsx` (660 LOC) renders a flat ScrollView with TO GET / DONE sections. Items are `GroceryItem` objects with no `category` field yet — the column doesn't exist in the DB despite being mentioned in the DECISIONS.md taxonomy decision. The existing `SectionHeader` component already supports collapsible sections (expand/collapse with `LayoutAnimation`), which is directly reusable for department sections.

The main structural change: instead of a flat TO GET list, unchecked items get grouped by department (produce, dairy, meat, etc.), each department rendered as a collapsible section. Checked items stay in a single DONE section. The import-recipe insert path needs a minor update to include `category` when adding items. The `scan-receipt` path doesn't need changes — receipt items get `category: 'other'` by default since receipt OCR doesn't extract department info.

## Recommendation

1. **Migration first** — add `category TEXT DEFAULT 'other'` to `grocery_items`. Update TypeScript types.
2. **Shared taxonomy constant** — define the 10 departments in a `lib/constants/grocery-departments.ts` file shared between client code and (later) Edge Functions. Include display labels and Ionicon names for section headers.
3. **Grouped list UI** — refactor `groceries.tsx` to group unchecked items by `category`, render each department as a collapsible `SectionHeader` + card block. Skip empty departments.
4. **Long-press category picker** — long-press any item to reveal a compact category quick picker (bottom sheet or overlay with department pills). Tap a department to reassign. This works uniformly on all items regardless of source (manual, receipt, recipe). No changes to the existing edit modal needed — category assignment is its own gesture.
5. **Update insert paths** — recipe import already has a `source: 'recipe'` insert; add `category: 'other'` (or auto-categorize later via GROC-12 in S04). Manual quick-add defaults to `'other'`.

## Implementation Landscape

### Key Files

- `supabase/migrations/20260311000003_groceries.sql` — original schema. New migration adds `category TEXT DEFAULT 'other'` column to `grocery_items`.
- `lib/types/database.ts` — `GroceryItem` interface needs `category: string` field added (line ~exported after `assigned_to`).
- `app/(app)/(tabs)/groceries.tsx` — main screen (660 LOC). Currently splits items into `uncheckedItems` / `checkedItems` arrays. Needs a `useMemo` to group `uncheckedItems` by `category` into `Record<string, GroceryItem[]>`, then map over department order rendering each non-empty group as a collapsible section. The `doneExpanded` state pattern already shows how collapsible sections work.
- `components/groceries/SectionHeader.tsx` — already supports `collapsible`, `expanded`, `onToggle` props. Reusable as-is for department headers. May want to add an optional `icon` prop for department icons.
- `components/groceries/GroceryItemRow.tsx` — no structural changes needed. Optionally add a small category badge/indicator, but the section grouping already conveys category visually.
- `components/groceries/QuickAddInput.tsx` — no changes needed. New items default to `category: 'other'`.
- `app/(app)/groceries/import-recipe.tsx` — insert call at line ~182 needs `category: 'other'` added (or Gemini could suggest categories, but that's GROC-12 territory and can be deferred).
- `components/groceries/index.ts` — barrel export. Add any new component (e.g. `CategoryPicker`).

### New Files

- `lib/constants/grocery-departments.ts` — taxonomy constant: `{ id: string, label: string, icon: string }[]` with the 10 departments from DECISIONS.md (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other). Exported as ordered array and as `Record<string, DepartmentInfo>` for lookups.
- `supabase/migrations/20260316000014_add_category_column.sql` — `ALTER TABLE grocery_items ADD COLUMN category TEXT NOT NULL DEFAULT 'other'`.
- `components/groceries/CategoryPicker.tsx` — long-press triggered overlay/bottom sheet showing department pills (icon + label). Tap a department to reassign the item's category. Dismissable by tapping outside. Works identically on items from any source (manual, receipt, recipe).

### Build Order

1. **Migration + types** — add `category` column, update `GroceryItem` type. This unblocks everything else.
2. **Department taxonomy constant** — define the shared constant. Both the UI grouping and the category picker depend on it.
3. **Grouped list UI** — refactor `groceries.tsx` to group unchecked items by department with collapsible sections. This is the core deliverable (GROC-11).
4. **Long-press category picker** — build `CategoryPicker` overlay component, wire long-press on `GroceryItemRow` to show it (GROC-13). Persist category change optimistically + via Supabase update. Item moves to correct section immediately. Works on every item regardless of source.
5. **Update insert paths** — add `category` to the optimistic `GroceryItem` in `addItem` and the recipe import insert. Default `'other'` for both.

### Verification Approach

- **TypeScript compilation**: `npx tsc --noEmit` passes with the new `category` field on `GroceryItem`.
- **Migration**: `supabase db reset` or `supabase migration up` applies cleanly. Verify column exists with `\d grocery_items` in psql.
- **Visual verification in Expo Go**: grocery list shows items grouped by department sections. Adding an item puts it in "Other". Long-pressing an item shows category picker overlay — tapping a department reassigns the item and it moves to the correct section immediately. Empty department sections are hidden. Each department section is independently collapsible. DONE section remains a single flat collapsible section. Long-press works on items from all sources (manual, receipt, recipe).
- **Realtime**: adding an item on one device shows it in the correct category section on another device (category flows through realtime payload since it's a column on `grocery_items`).

## Constraints

- **Existing SectionHeader component** already handles collapsible state. The groceries screen just needs per-department expand/collapse state (a `Record<string, boolean>` or `Set<string>` for collapsed departments).
- **Edit modal is inline in `groceries.tsx`** (~40 LOC of Modal JSX). Category assignment is handled separately via long-press → overlay picker, keeping the edit modal focused on name + quantity.
- **Long-press must coexist with tap and swipe** — `GroceryItemRow` already uses tap (edit modal) and swipe-right (delete). Long-press is a distinct gesture that doesn't conflict, but the `onLongPress` prop on the existing `Pressable` wrapper handles this natively. No gesture handler refactoring needed.
- **CategoryPicker overlay positioning** — a simple `Modal` with transparent background + centered/bottom-positioned content works fine. No need for a proper bottom sheet library. The existing edit modal uses this exact pattern (Modal + transparent bg + Pressable dismiss).
- **`category` column must have a DEFAULT** — existing items have no category. `DEFAULT 'other'` ensures backward compat. The `NOT NULL` + default means no query changes needed for existing code paths.
- **The `addItem` optimistic object and the `insert` call both need `category`** — the optimistic GroceryItem already includes `source` and `assigned_to` fields, adding `category: 'other'` follows the same pattern.

## Common Pitfalls

- **Department order matters for UX** — departments should render in store-walk order (produce → dairy → meat → frozen → bakery → beverages → snacks → pantry → household → other), not alphabetical. The taxonomy constant defines this order; the grouping logic must iterate in constant order, not by JS object key order.
- **Collapsible state reset on data change** — if using `useState` for expanded departments, ensure realtime updates don't reset collapse state. The current `doneExpanded` state survives re-renders fine because it's independent of item data — same approach works for department states.
- **Empty sections must be hidden** — don't render a "Dairy (0)" section. Filter departments to only those with items before rendering.
