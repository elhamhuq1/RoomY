---
phase: 07-home-screen
plan: 04
subsystem: ui
tags: [react-native, date-fns, supabase-rpc, useMemo, recurring-projection]

# Dependency graph
requires:
  - phase: 07-home-screen
    provides: "Home screen sections (BalanceSummaryCard, WeeklyTimeline, CalendarSection) and calendar-utils"
provides:
  - "WeeklyTimeline shows recurring chore projections instead of single next_due_at"
  - "Balance card computes correct net via .reduce() summing all RPC pairwise rows"
  - "Balance buttons hidden when settled (user override)"
  - "Pull-to-refresh preserves selected date context"
affects: [08-expense-screen, 09-grocery-chore-screens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "projectChoreDates reuse: exported for both buildMarkedDates (calendar dots) and weekChores (timeline entries)"
    - "RPC balance summation: .reduce() over pairwise rows instead of .find() for own user_id"

key-files:
  created: []
  modified:
    - lib/calendar-utils.ts
    - app/(app)/(tabs)/index.tsx
    - components/home/BalanceSummaryCard.tsx
    - components/home/WeeklyTimeline.tsx
    - .planning/phases/07-home-screen/07-CONTEXT.md

key-decisions:
  - "Balance buttons completely hidden when settled (user override of original 'visible but muted' decision)"
  - "myNetAmount computed via .reduce() summing all RPC balance rows (each row is pairwise net with another member)"
  - "weekChores uses projectChoreDates for recurring frequency projection instead of filtering by single next_due_at"
  - "fetchAllData scoped to selectedDate month so pull-to-refresh preserves calendar context"

patterns-established:
  - "Frequency-based date projection via projectChoreDates for any component needing recurring chore dates"

requirements-completed: [HOME-04, HOME-06]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 7 Plan 4: Gap Closure Summary

**Fixed 4 UAT bugs: recurring chore projection in WeeklyTimeline, balance .reduce() computation, hidden settled buttons, date-aware pull-to-refresh**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T18:37:11Z
- **Completed:** 2026-03-12T18:41:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- WeeklyTimeline now shows recurring chores projected from frequency (daily/weekly/monthly/custom) instead of filtering by single next_due_at timestamp
- Balance card correctly computes net amount via .reduce() summing all RPC pairwise balance rows (was always zero because .find() looked for current user's ID which the RPC never returns)
- Balance card Settle Up and Request buttons completely hidden when balance is zero (user override of original "visible but muted" decision)
- Pull-to-refresh preserves the selected calendar date context by scoping expense fetch to the selected month

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix WeeklyTimeline data pipeline and export projectChoreDates** - `10fd25a` (fix)
2. **Task 2: Fix balance computation, hide buttons when settled, make refresh date-aware, and update CONTEXT.md** - `d6d0659` (fix)

## Files Created/Modified
- `lib/calendar-utils.ts` - Added `export` keyword to projectChoreDates function
- `app/(app)/(tabs)/index.tsx` - Rewrote weekChores useMemo with projectChoreDates, fixed myNetAmount via .reduce(), made fetchAllData selectedDate-aware
- `components/home/BalanceSummaryCard.tsx` - Wrapped action buttons in `{!isSettled && (...)}` conditional
- `components/home/WeeklyTimeline.tsx` - Removed redundant week-filtering logic, simplified to use pre-filtered chores prop
- `.planning/phases/07-home-screen/07-CONTEXT.md` - Updated locked decision to document user override on button behavior

## Decisions Made
- Balance buttons hidden completely when settled (per user's explicit UAT override of original "visible but muted" CONTEXT.md decision)
- myNetAmount uses .reduce() to sum all balance rows since get_household_balances() RPC returns pairwise nets with OTHER members only (current user's ID is never in the result set)
- weekChores reuses the existing projectChoreDates function (already proven working for calendar dots) instead of implementing new projection logic
- fetchAllData dependency array includes selectedDate so useFocusEffect and onRefresh automatically scope to the selected month

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 UAT gaps from Phase 7 testing are now closed
- Home screen is functionally complete with correct data pipelines
- Ready to proceed to Phase 8 (Expense Screen) or further UAT verification

## Self-Check: PASSED

All 5 files found. All 2 commits verified. All 4 must-have artifacts confirmed.

---
*Phase: 07-home-screen*
*Completed: 2026-03-12*
