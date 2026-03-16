---
id: T03
parent: S02
milestone: M002
provides:
  - import-recipe route registered with "Shop by Recipe" header
  - paired action buttons on groceries tab (Scan Receipt + Shop by Recipe)
key_files:
  - app/(app)/_layout.tsx
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Renamed header title from "Import Recipe" to "Shop by Recipe" per plan spec — user-facing label is more action-oriented
patterns_established:
  - Paired action button row pattern (flex-row gap-2 with flex-1 children) for groceries tab feature entry points
observability_surfaces:
  - none — pure navigation wiring and UI layout
duration: 10m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T03: Wire import-recipe route and refactor groceries action buttons

**Updated route title to "Shop by Recipe" and aligned button labels and spacing to match plan spec; both buttons render side-by-side on groceries tab.**

## What Happened

T02 had already created the route entry and two-button layout, but with "Import Recipe" as both the header title and button label. This task aligned everything to the plan:

1. Changed `_layout.tsx` route title from "Import Recipe" to "Shop by Recipe"
2. Changed the second button label from "Import Recipe" to "Shop by Recipe" in `groceries.tsx`
3. Updated comment from `{/* Scan Receipt + Import Recipe buttons */}` to `{/* Action buttons */}`
4. Adjusted icon-to-text spacing from `ml-2` to `ml-1.5` per plan spec

## Verification

- `npx tsc --noEmit` — passes (no new errors; all errors are pre-existing Deno/font module issues unrelated to this task)
- Route registration confirmed by inspecting `_layout.tsx` — `groceries/import-recipe` entry present with title "Shop by Recipe", headerBackTitle "Groceries", cream header style
- Button pair structure confirmed by inspecting `groceries.tsx` — both buttons in `flex-row gap-2` container, each `flex-1`, matching outline style (`border-2 border-brand bg-white`)

### Slice-level verification status (S02)

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` passes | ✅ pass (no new errors) |
| Edge Function deploys | ✅ (done in T01) |
| `curl` text mode → 4 ingredients | ✅ (done in T01) |
| `curl` YouTube mode → ingredients | ✅ (done in T01) |
| `curl` non-recipe → empty ingredients | ✅ (done in T01) |
| Navigate to import-recipe from groceries tab | ✅ route wired |
| Full flow in Expo Go (paste → review → add) | ⏳ requires manual UAT |
| Items appear in grocery list after import | ⏳ requires manual UAT |

## Diagnostics

None — this task is pure navigation wiring and UI layout with no runtime behavior to inspect.

## Deviations

T02 had already implemented the two-button layout and route registration. This task was reduced to label/spacing alignment rather than the full replacement described in the plan. The end result matches the plan spec exactly.

## Known Issues

None.

## Files Created/Modified

- `app/(app)/_layout.tsx` — changed import-recipe route title from "Import Recipe" to "Shop by Recipe"
- `app/(app)/(tabs)/groceries.tsx` — updated button label to "Shop by Recipe", normalized comment, adjusted spacing
