---
estimated_steps: 5
estimated_files: 2
---

# T02: Group grocery list by department with collapsible sections

**Slice:** S03 — Category & Aisle Organization
**Milestone:** M002

## Description

Transforms the flat "TO GET" section in `groceries.tsx` into department-grouped collapsible sections. Unchecked items are grouped by their `category` field and rendered under department headers in store-walk order. Empty departments are hidden. The DONE section remains unchanged as a single flat collapsible list.

## Steps

1. Optionally add an `icon` prop to `SectionHeader` in `components/groceries/SectionHeader.tsx` — render an Ionicon before the label text when provided. This gives department headers visual identity. Keep it optional so existing usage (DONE section) is unaffected.
2. In `groceries.tsx`, import `DEPARTMENTS` from `@/lib/constants/grocery-departments`. Add a `collapsedDepts` state — a `Set<string>` tracking which departments are collapsed (start all expanded). Create a `useMemo` that groups `uncheckedItems` by `category`:
   ```ts
   const groupedItems = useMemo(() => {
     const groups: Record<string, GroceryItem[]> = {};
     for (const item of uncheckedItems) {
       const cat = item.category || 'other';
       (groups[cat] ??= []).push(item);
     }
     return groups;
   }, [uncheckedItems]);
   ```
3. Replace the flat `uncheckedItems` rendering block (the `SectionHeader label="TO GET"` + map) with a loop over `DEPARTMENTS`: for each department, if `groupedItems[dept.id]` has items, render a `SectionHeader` with `label={dept.label}`, `icon={dept.icon}`, `count={items.length}`, `collapsible={true}`, `expanded={!collapsedDepts.has(dept.id)}`, and `onToggle` that toggles the department in `collapsedDepts`. When expanded, render the department's items in a `Card` with `GroceryItemRow` entries (same pattern as the current flat list). Use `LayoutAnimation` via the existing `SectionHeader` toggle handler.
4. Keep the DONE section exactly as-is — it already works correctly as a single collapsible section for checked items.
5. Ensure the `uncheckedItems` computation still includes the same filter/sort logic. The grouping is a layer on top, not a replacement. Verify `collapsedDepts` state survives realtime data updates (it's independent of item data, same as `doneExpanded`).

## Must-Haves

- [ ] Unchecked items grouped by department in store-walk order (produce → dairy → … → other)
- [ ] Each department rendered as collapsible section with icon, label, and item count
- [ ] Empty departments not rendered
- [ ] Department collapse/expand state independent per section
- [ ] DONE section unchanged
- [ ] No regression in existing tap-to-edit, swipe-to-delete, or quantity stepper behavior

## Verification

- `npx tsc --noEmit` passes
- Visual in Expo Go: items appear under correct department headers. Tapping a department header collapses/expands it. Only departments with items are visible. "Other" section shows for manually added items (no category assigned). DONE section unchanged at bottom.

## Inputs

- `lib/constants/grocery-departments.ts` — `DEPARTMENTS` ordered array and `DEPARTMENT_MAP` lookup (from T01)
- `lib/types/database.ts` — `GroceryItem` now includes `category: string` (from T01)
- `app/(app)/(tabs)/groceries.tsx` — current flat list rendering with `uncheckedItems` array at ~line 380, rendered at ~line 460
- `components/groceries/SectionHeader.tsx` — supports `collapsible`, `expanded`, `onToggle` props. Currently has no `icon` prop.

## Expected Output

- `components/groceries/SectionHeader.tsx` — optional `icon` prop added, rendered as Ionicon before label
- `app/(app)/(tabs)/groceries.tsx` — unchecked items render in department-grouped collapsible sections instead of flat "TO GET" list
