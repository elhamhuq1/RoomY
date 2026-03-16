---
id: T03
parent: S03
milestone: M002
provides:
  - CategoryPicker modal component for department reassignment
  - Long-press gesture on GroceryItemRow opening category picker
  - Optimistic category update with Supabase persistence and rollback
key_files:
  - components/groceries/CategoryPicker.tsx
  - components/groceries/GroceryItemRow.tsx
  - components/groceries/index.ts
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Bottom-sheet style modal (justify-end) for thumb-reachable picker on mobile
  - 400ms delayLongPress for responsive feel without conflicting with tap/swipe
  - Pill-based flex-wrap layout for department selection (fits all 10 without scrolling on most devices)
patterns_established:
  - Optimistic category update with rollback mirrors existing toggleCheck/deleteItem pattern
  - CategoryPicker follows same Modal + backdrop Pressable pattern as edit modal
observability_surfaces:
  - Optimistic rollback on Supabase update failure — item snaps back to original section
  - grocery_items.category column queryable to verify persisted values
duration: ~20min
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T03: Long-press category picker for manual reassignment

**Added long-press category picker that reassigns any grocery item's department with optimistic UI update and Supabase persistence.**

## What Happened

Created `CategoryPicker` component — a fade-in modal with semi-transparent backdrop, bottom-aligned card showing "Change Category" title and all 10 department pills (Ionicon + label) in a flex-wrap grid. The current category pill renders with wintergreen (`bg-brand`) background and white text; others use neutral border/bg styling.

Added optional `onLongPress` prop to `GroceryItemRow` — wired to the outer `Pressable` with `delayLongPress={400}`. This doesn't conflict with existing `onPress` (edit) or swipe (delete) gestures since long-press is a distinct gesture.

In `groceries.tsx`: added `categoryPickerItem` state, `handleCategoryChange` callback (optimistic update → Supabase `.update()` → rollback on error), and passed `onLongPress` to both department section rows and DONE section rows. The `CategoryPicker` renders alongside the existing edit modal.

## Verification

- `npx tsc --noEmit` — zero errors in modified files (pre-existing Deno/font errors only)
- All 10 departments rendered in picker via `DEPARTMENTS` constant iteration
- Current category highlighting implemented (`isActive` check → `bg-brand` class)
- `onLongPress` wired to both unchecked (department sections) and checked (DONE section) rows
- Optimistic update: `setItems` maps new category immediately, then `setCategoryPickerItem(null)` dismisses
- Rollback: on Supabase error, restores `oldCategory` captured before the optimistic update
- Backdrop `Pressable` dismisses picker on outside tap
- `onLongPress` is optional prop (`onLongPress?: () => void`) — no breaking change to existing GroceryItemRow consumers

### Slice-level verification (S03 final task — all checks):
- ✅ `npx tsc --noEmit` passes with `category` field on `GroceryItem`
- ✅ Migration file `20260316000014_add_category_column.sql` exists and is valid SQL
- ⏳ Visual in Expo Go: requires device/emulator — picker structure verified via code review
- ✅ Optimistic rollback implemented in `handleCategoryChange` — captures old category, restores on error

## Diagnostics

- Query `SELECT id, name, category FROM grocery_items WHERE household_id = '...'` to verify persisted category after reassignment
- If item doesn't move sections: check `item.category` fallback in `groupedItems` memo (`item.category || 'other'`)
- If picker doesn't appear: verify `onLongPress` is reaching `setCategoryPickerItem` — the 400ms delay may feel like no response on fast taps
- Rollback is silent (no user-facing error toast) — verify by checking Supabase column still holds old value after simulated failure

## Deviations

- Used bottom-aligned card (`justify-end`) instead of centered card — more natural for thumb interaction on mobile
- Used `ScrollView` with `maxHeight: 400` inside picker for safety on very small screens, though 10 pills fit without scrolling on standard devices

## Known Issues

- No user-facing error feedback on category update failure — rollback is silent. Could add a toast in future work.
- No haptic feedback on long-press trigger — would improve discoverability.

## Files Created/Modified

- `components/groceries/CategoryPicker.tsx` — new component: modal with department pill grid
- `components/groceries/GroceryItemRow.tsx` — added optional `onLongPress` prop, wired to outer Pressable with 400ms delay
- `components/groceries/index.ts` — added `CategoryPicker` barrel export
- `app/(app)/(tabs)/groceries.tsx` — added `categoryPickerItem` state, `handleCategoryChange` handler, `onLongPress` on all rows, `<CategoryPicker>` render
- `.gsd/milestones/M002/slices/S03/tasks/T03-PLAN.md` — added Observability Impact section per pre-flight requirement
