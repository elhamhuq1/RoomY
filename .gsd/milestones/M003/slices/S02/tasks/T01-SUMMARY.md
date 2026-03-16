---
id: T01
parent: S02
milestone: M003
provides:
  - SectionHeader available from @/components/ui for chores tab and any future consumer
  - ChoreRow renders effort badge for effort_points > 1
key_files:
  - components/ui/SectionHeader.tsx
  - components/ui/index.ts
  - components/groceries/index.ts
  - app/(app)/(tabs)/groceries.tsx
  - components/chores/ChoreRow.tsx
key_decisions:
  - Effort badge hidden for effort_points=1 (default value, no visual noise)
  - Effort badge uses amber-50/amber-700 color scheme to differentiate from frequency pill (brand colors) and overdue pill (amber-100)
patterns_established:
  - SectionHeader is the shared collapsible section component for any tab (groceries, chores, future)
observability_surfaces:
  - none
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Move SectionHeader to shared UI and add effort badge to ChoreRow

**Moved SectionHeader from groceries/ to ui/ and added ⚡×N effort badge to ChoreRow metadata pills**

## What Happened

SectionHeader component moved from `components/groceries/SectionHeader.tsx` to `components/ui/SectionHeader.tsx` with no code changes — the component was already self-contained. Export removed from `components/groceries/index.ts`, added to `components/ui/index.ts`. The groceries tab import updated to `@/components/ui`.

Added an effort badge pill to ChoreRow's metadata row, rendered between the frequency pill and the overdue/due-date indicator. Badge shows `⚡×{effort_points}` with amber-50 background and amber-700 text. Only renders when `effort_points > 1` since 1 is the default and doesn't need visual emphasis.

## Verification

- `npx tsc --noEmit` — zero new errors (only pre-existing Deno errors in supabase/functions/)
- `rg "SectionHeader" components/groceries/` — no results (file removed) ✓
- `rg "SectionHeader" components/ui/` — shows component file and barrel export ✓
- `rg "effort_points" components/chores/ChoreRow.tsx` — confirms effort badge conditional render ✓
- Groceries tab imports SectionHeader from `@/components/ui` ✓

### Slice-level verification (partial — T01 of 4):
- [x] `npx tsc --noEmit` — zero new TypeScript errors
- [ ] Visual in Expo Go — deferred to later tasks when room grouping exists

## Diagnostics

None — this task is a pure refactor (move) plus a display-only badge addition. No new API calls, state, or error paths.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `components/ui/SectionHeader.tsx` — moved from groceries, no code changes
- `components/ui/index.ts` — added SectionHeader export
- `components/groceries/index.ts` — removed SectionHeader export
- `app/(app)/(tabs)/groceries.tsx` — import path updated to @/components/ui
- `components/chores/ChoreRow.tsx` — added effort badge pill to metadata row
