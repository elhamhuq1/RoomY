---
id: T01
parent: S04
milestone: M003
provides:
  - Three-tier urgency color system (green/yellow/red) in ChoreRow
  - Urgency-colored left borders and due-date pills on all non-disputed chore rows
key_files:
  - components/chores/ChoreRow.tsx
key_decisions:
  - None new (urgency thresholds already in DECISIONS.md)
patterns_established:
  - getUrgencyLevel pure helper deriving urgency from next_due_at (reusable by My Day sorting in T02)
  - URGENCY_COLORS mapping using theme color tokens for consistent urgency styling
observability_surfaces:
  - Visual: left border color (green=#2D6A4F, yellow=#F59E0B, red=#EF4444) on each ChoreRow
  - Visual: due-date pill bg/text color matches urgency level
  - Inspect: urgency and urgencyStyle locals in ChoreRow via React DevTools
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Add urgency color system and update ChoreRow visual styling

**Replaced amber-only overdue styling with three-tier green/yellow/red urgency coloring on ChoreRow borders and due-date pills.**

## What Happened

Added `getUrgencyLevel(nextDueAt)` helper and `URGENCY_COLORS` mapping above the component. Updated row styling: non-disputed rows always get a `border-l-4` with inline `borderLeftColor` set from the urgency level. Replaced the overdue if/else in the metadata row with a single urgency-colored pill that renders for all rows. Disputed rows retain their existing `bg-red-50 border-l-4 border-red-300` styling via the first-condition guard.

## Verification

- `npx tsc --noEmit` — zero new TS errors (only pre-existing Deno/Edge Function errors)
- Code review: `isDisputed` is first condition in if/else chain, disputed styling always wins
- Code review: frequency pill and effort badge (`⚡×N`) are untouched
- Code review: `getUrgencyLevel` returns `'red'` for `diffDays < 0`, `'yellow'` for `<= 1`, `'green'` for `2+`

### Slice-level verification (T01 — intermediate task):
- ✅ `npx tsc --noEmit` — passes (pre-existing Deno errors only)
- ⏳ Visual in Expo Go: ChoreRow shows green/yellow/red left border + pill coloring — requires running app
- ⏳ Visual in Expo Go: Disputed chores retain red-50 bg + red border — requires running app
- ⏳ Visual in Expo Go: Sun icon in chores header navigates to My Day — T02
- ⏳ Visual in Expo Go: My Day shows only current user's chores — T02
- ⏳ Visual in Expo Go: My Day empty state — T02
- ⏳ Visual in Expo Go: Complete/claim/delete actions work from My Day — T02

## Diagnostics

- Urgency is derived at render time from `chore.next_due_at` — no persisted state to inspect
- If urgency colors look wrong, check the raw `next_due_at` value in Supabase
- If `next_due_at` is invalid/missing, `getUrgencyLevel` silently defaults to `'green'` (NaN falls through all comparisons)

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `components/chores/ChoreRow.tsx` — added `getUrgencyLevel` helper, `URGENCY_COLORS` mapping, urgency-based left border + due-date pill coloring
