---
id: T01
parent: S04
milestone: M001
provides:
  - chores, chore_completions, chore_swap_requests tables with RLS
  - complete_chore, claim_chore, dispute_completion, resolve_swap_request RPC functions
  - auto_revert_stale_disputes function with pg_cron schedule
  - Chore, ChoreCompletion, ChoreSwapRequest TypeScript interfaces
  - Main chore list screen with grouping, summary header, overdue badges, empty state
  - Create chore screen with frequency picker and member rotation setup
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---
# T01: 03.1-chores 01

**# Phase 3.1 Plan 01: Chores Schema & Core UI Summary**

## What Happened

# Phase 3.1 Plan 01: Chores Schema & Core UI Summary

**Chore database schema with round-robin rotation RPC, RLS policies, pg_cron dispute auto-revert, and full chore list/create UI with grouping, overdue badges, and suggested chores empty state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T20:27:21Z
- **Completed:** 2026-03-11T20:32:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Complete chore data model with 3 tables, 5 functions, RLS policies, indexes, and pg_cron schedule
- Main chore list screen with summary header (pending/overdue/streak), grouped sections (my chores/household), overdue badges, complete and claim actions
- Create chore screen with name input, frequency picker (daily/weekly/monthly/custom), member selection with checkboxes, random rotation order
- Empty state with 7 suggested chores grid and one-tap creation navigation
- TypeScript interfaces and Database type entries for all chore tables and functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Chore database schema, RLS policies, RPC functions, pg_cron, and TypeScript types** - `c4615e6` (feat)
2. **Task 2: Main chore list screen with create, complete, claim, grouping, and empty state** - `e2ba1d1` (feat)

## Files Created/Modified
- `supabase/migrations/00004_chores.sql` - 3 tables, 5 functions, RLS policies, indexes, pg_cron schedule
- `lib/types/database.ts` - Added Chore, ChoreCompletion, ChoreSwapRequest interfaces and Database type entries
- `app/(app)/(tabs)/chores.tsx` - Full chore list screen replacing placeholder (527 lines)
- `app/(app)/chores/add.tsx` - Create chore screen with frequency picker and member rotation (359 lines)
- `app/(app)/(tabs)/_layout.tsx` - Added dashboard icon + settings icon to chores tab header

## Decisions Made
- UUID array for rotation_order instead of junction table -- simpler for 2-4 member households
- No optimistic updates for completion/claim -- show loading indicator, call RPC, refresh (per research pitfall #6 about cascading state changes)
- pg_cron with DO-block exception handling -- graceful fallback if pg_cron is not available on the instance
- Chores due immediately on creation (next_due_at = now) so they appear in the list right away

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Web export (`npx expo export --platform web`) not available due to missing react-dom/react-native-web dependencies (pre-existing). Verified with `npx tsc --noEmit` instead, which passed cleanly.

## User Setup Required

Migration `00004_chores.sql` needs to be applied via Supabase SQL editor. The migration creates all tables, functions, RLS policies, indexes, and attempts to schedule the pg_cron job.

## Next Phase Readiness
- Core chore CRUD and rotation is complete
- Plan 03.1-02 (dashboard with contribution history) can build on chore_completions table and profiles
- Dashboard screen route referenced in tab layout header (stats-chart-outline icon)

## Self-Check: PASSED

All 5 files verified present. Both task commits (c4615e6, e2ba1d1) confirmed in git log.

---
*Phase: 03.1-chores*
*Completed: 2026-03-11*
