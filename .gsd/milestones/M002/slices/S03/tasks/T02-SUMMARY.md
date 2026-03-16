---
id: T02
parent: S03
milestone: M002
provides:
  - Department-grouped collapsible sections replacing flat TO GET list
  - SectionHeader icon prop for department visual identity
  - collapsedDepts state for independent per-section collapse/expand
  - groupedItems useMemo for category-based grouping
key_files:
  - app/(app)/(tabs)/groceries.tsx
  - components/groceries/SectionHeader.tsx
key_decisions:
  - All department sections start expanded (collapsed set initially empty) — users see full item distribution on load
patterns_established:
  - Department iteration via DEPARTMENTS array order — all downstream rendering should follow same pattern for consistency
observability_surfaces:
  - none
duration: 10m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Group grocery list by department with collapsible sections

**Replaced flat TO GET list with department-grouped collapsible sections in store-walk order, with icon-labeled headers.**

## What Happened

Two files changed:

1. **SectionHeader** — Added optional `icon` prop. When provided, renders an Ionicon (14px, neutral-secondary) before the label text inside a flex-row container. Existing usage (DONE section) is unaffected since `icon` is optional.

2. **groceries.tsx** — Three additions:
   - Imported `DEPARTMENTS` from the taxonomy constant (T01).
   - Added `collapsedDepts` state (`Set<string>`) and `groupedItems` memo that buckets `uncheckedItems` by `item.category || 'other'`.
   - Replaced the flat "TO GET" `SectionHeader` + single Card block with a `DEPARTMENTS.map()` loop: for each department with items, renders a collapsible `SectionHeader` (icon + label + count) and an expandable Card with `GroceryItemRow` entries. Empty departments are skipped (early `return null`). DONE section is completely untouched.

Collapse state is independent per department and survives realtime updates (it's a `Set<string>` not derived from item data).

## Verification

- `npx tsc --noEmit` — zero new errors (pre-existing Deno/font errors only)
- Code review: DONE section rendering unchanged, same `SectionHeader` props as before
- `DEPARTMENTS.map()` iterates in store-walk order; `groupedItems[dept.id]` check skips empty departments

### Slice-level verification status (T02 of 3):
- ✅ `npx tsc --noEmit` passes
- ⏳ `supabase migration up` / `supabase db reset` — T01 migration, not re-verified here
- ⏳ Visual in Expo Go — department sections, collapsible headers, grouping correctness (requires device)
- ⏳ Diagnostic failure-path check — T03 will implement optimistic rollback for category changes

## Diagnostics

- Department grouping is derived from `item.category` field — inspect by checking Supabase `grocery_items.category` values
- If items appear in wrong section, check `item.category || 'other'` fallback in `groupedItems` memo

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `components/groceries/SectionHeader.tsx` — added optional `icon` prop with Ionicon rendering
- `app/(app)/(tabs)/groceries.tsx` — replaced flat TO GET list with department-grouped collapsible sections
