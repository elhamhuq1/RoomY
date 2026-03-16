# S04: Smart "My Day" View & Visual Urgency Indicators — Research

**Date:** 2026-03-16

## Summary

This slice delivers two requirements: CHORE-06 (My Day view) and CHORE-07 (visual urgency indicators). Both are straightforward UI work using established patterns already in the codebase. No schema changes, no new RPCs, no new backend work. The My Day screen is a filtered, user-scoped view of existing chore data (due today + overdue, sorted by urgency). The urgency indicators replace the current text-based "Overdue" / "Xd overdue" amber pills in ChoreRow with green/yellow/red color coding based on due date proximity.

The chores tab (1028 LOC) is already room-grouped with SectionHeader, ChoreRow renders effort badges, and all action handlers (complete, claim, swap, dispute, delete) are working. The My Day screen reuses ChoreRow and the same action patterns — it's essentially a filtered, flattened view of the existing chores tab, scoped to the current user.

## Recommendation

**Two tasks:**

1. **Urgency color system + ChoreRow update** — Add a `getUrgencyLevel` helper (returns `'green' | 'yellow' | 'red'`) and update ChoreRow to use color-coded left border + due date pill instead of the current amber-only overdue styling. This is a self-contained change to `components/chores/ChoreRow.tsx` and affects both the main chores tab and My Day screen (since My Day renders ChoreRow). Do this first so My Day inherits the styling.

2. **My Day screen** — New file `app/(app)/chores/my-day.tsx`. Fetches chores where `current_assignee = user.id` and `next_due_at <= end of today OR overdue`. Sorts overdue first (oldest first), then due today. Renders ChoreRow for each with the same action handlers from the chores tab. Entry point: new header button on the chores tab (sun/today icon). Stack.Screen registration in `app/(app)/_layout.tsx`.

## Implementation Landscape

### Key Files

- `components/chores/ChoreRow.tsx` — Currently uses `bg-amber-50/50` for overdue rows and amber pills for "Xd overdue" text. Change to: left border color + due pill background based on urgency level. The `overdueDays` prop already carries the signal; add a new `getUrgencyLevel(nextDueAt: string)` function that returns the urgency tier. Thresholds (from DECISIONS.md): green (2+ days), yellow (today/tomorrow), red (overdue).

- `app/(app)/chores/my-day.tsx` — **New file**. Screen showing personalized daily tasks. Data flow: fetch chores for household → filter to `current_assignee = user.id` where `next_due_at <= endOfToday` or overdue → sort by urgency (overdue oldest-first, then due-today). Renders a ScrollView of ChoreRow components. Needs the same action handlers as chores tab (complete, claim, dispute, delete) — extract or duplicate the minimal set. Uses `useCachedFetch` + `useFocusEffect` like the chores tab.

- `app/(app)/(tabs)/_layout.tsx` — Add a "My Day" header button (sun icon, `sunny-outline`) to the chores tab `headerRight`, next to the existing info/swap/dashboard/settings buttons.

- `app/(app)/_layout.tsx` — Add `Stack.Screen` entry for `chores/my-day` with title "My Day", matching existing chore screen pattern.

- `lib/theme/colors.ts` — Already has `semantic.warning` (#F59E0B) and `semantic.error` (#EF4444) and `brand.DEFAULT` (#2D6A4F, used as green). These map directly to the urgency tiers: green → `brand.DEFAULT`, yellow → `semantic.warning`, red → `semantic.error`.

- `lib/types/database.ts` — No changes needed. Chore type already has `next_due_at`, `current_assignee`, `room_id`, `effort_points`.

- `lib/constants/chore-rooms.ts` — Used by My Day to display room labels/icons next to chore entries for context.

### Build Order

1. **Urgency color helper + ChoreRow visual update** — Self-contained in `ChoreRow.tsx`. Add `getUrgencyLevel` function, replace amber-only styling with urgency-based colors. This is the riskiest piece (visual regression on existing chores tab) and must be verified first. Also the dependency for My Day looking correct.

2. **My Day screen + navigation wiring** — New screen file, Stack.Screen registration, header button. This is pure additive — no risk of breaking existing screens. The screen is a simpler version of the chores tab (no room grouping, no template system, no collapse state — just a flat list of the user's due/overdue chores).

### Verification Approach

- `npx tsc --noEmit` — zero new TS errors after each task
- Visual verification in Expo Go:
  - ChoreRow shows green left border + green pill for chores due in 2+ days
  - ChoreRow shows yellow left border + yellow pill for chores due today/tomorrow
  - ChoreRow shows red left border + red pill for overdue chores
  - Disputed chores retain their red-50 bg + red border styling (takes precedence)
  - My Day screen accessible via header button on chores tab
  - My Day shows only current user's chores that are due today or overdue
  - My Day sorts overdue chores first (oldest first), then due-today
  - My Day shows friendly empty state when nothing is due
  - Complete/claim/dispute/delete actions work from My Day screen

## Constraints

- ChoreRow is shared between the main chores tab and My Day — urgency styling changes affect both
- Disputed state styling (red bg + red border) should take visual precedence over urgency coloring to avoid confusion
- The `overdueDays` prop on ChoreRow is computed by the parent — urgency helper should use `next_due_at` directly for cleaner encapsulation
- No cap on My Day items (per DECISIONS.md) — show all due/overdue chores

## Common Pitfalls

- **Urgency colors clashing with disputed styling** — disputed chores currently use `bg-red-50 border-l-4 border-red-300`. The urgency system also uses a left border. Solution: disputed styling takes precedence (it already does via the if/else chain in ChoreRow); urgency coloring only applies to non-disputed rows.
- **Date comparison timezone issues** — `next_due_at` is stored as ISO timestamp. "Due today" comparison should use the start/end of the local day, not UTC. Use `new Date()` with `setHours(23,59,59,999)` for end-of-today check in My Day filter.
- **My Day action handlers duplicating chores tab logic** — The chores tab has ~150 LOC of action handlers (complete, claim, dispute, delete, swap). My Day needs the same handlers. Options: (a) extract to a shared hook, (b) duplicate the minimal set. Given the scope, a shared hook (`useChoreActions`) is cleaner and avoids drift.
