---
id: S04
parent: M001
milestone: M001
provides:
  - chores, chore_completions, chore_swap_requests tables with RLS
  - complete_chore, claim_chore, dispute_completion, resolve_swap_request RPC functions
  - auto_revert_stale_disputes function with pg_cron schedule
  - Chore, ChoreCompletion, ChoreSwapRequest TypeScript interfaces
  - Main chore list screen with grouping, summary header, overdue badges, empty state
  - Create chore screen with frequency picker and member rotation setup
  - Dispute system with flag icon, confirmation dialog, "Disputed" badge, and 24h client-side auto-revert fallback
  - Swap request flow with member picker modal, insert to chore_swap_requests, pending count banner
  - Swap request screen with incoming (accept/decline) and outgoing sections
  - Contribution dashboard with week/month toggle, per-member completion counts, streaks, relative progress bars
  - Household totals row with completed count, active chores, average per member
requires: []
affects: []
key_files: []
key_decisions:
  - "UUID array for rotation_order instead of junction table -- simpler for 2-4 member households"
  - "No optimistic updates for completion/claim -- show loading indicator, call RPC, refresh (per research pitfall #6)"
  - "pg_cron with DO-block exception handling -- graceful fallback if pg_cron not available"
  - "Chores due immediately on creation (next_due_at = now) per research pattern"
  - "Client-side fallback for dispute auto-revert queries stale disputes (>24h) on chore list focus, does not depend on pg_cron"
  - "Streaks calculated globally from all-time completions (not per-period) for accurate representation"
  - "Swap request modal uses bottom-sheet style Pressable overlay pattern consistent with app design"
  - "Dashboard shows all household members even with zero completions for full visibility"
patterns_established:
  - "Chore RPC pattern: SECURITY DEFINER functions for atomic rotation and assignment changes"
  - "Suggested chores empty state: grid of pre-defined chores with icons for one-tap creation"
  - "FAB (floating action button) pattern for quick add navigation"
  - "Segmented control pattern: rounded-xl bg-gray-100 container with white active segment and shadow"
  - "Bottom-sheet modal: transparent Modal with bg-black/40 overlay and rounded-t-3xl white content"
  - "Relative progress bar: width percentage proportional to max value in set"
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---
# S04: Chores

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

# Phase 3.1 Plan 02: Chore Swaps, Disputes & Dashboard Summary

**Swap request flow with member picker modal, dispute system with 24h auto-revert fallback, and contribution dashboard with week/month toggle showing completion counts, streaks, and relative progress bars**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T20:35:20Z
- **Completed:** 2026-03-11T20:39:40Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Dispute system on chore list: flag icon on completed chores (not by current user), confirmation dialog, "Disputed" badge, client-side 24h auto-revert fallback
- Swap request flow: swap icon on own chores opens member picker modal, creates request, pending count banner navigates to swap screen
- Swap request screen with incoming requests (accept/decline buttons) and outgoing requests (status badges)
- Contribution dashboard with segmented "This Week" / "This Month" toggle, household totals, per-member cards with avatar, completion count, streak, and relative progress bars
- Stack.Screen routes registered for swap-request and dashboard; swap icon added to chores tab header

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap requests and dispute system on chore list** - `85ba868` (feat)
2. **Task 2: Chore contribution dashboard with completion counts, streaks, and week/month views** - `c9cdb24` (feat)

## Files Created/Modified
- `app/(app)/(tabs)/chores.tsx` - Updated with dispute button, dispute badge, swap request modal, pending swap banner, client-side revert fallback (795 lines)
- `app/(app)/chores/swap-request.tsx` - Swap request screen with incoming/outgoing sections, accept/decline, status badges (399 lines)
- `app/(app)/chores/dashboard.tsx` - Contribution dashboard with week/month toggle, member stats cards, progress bars (468 lines)
- `app/(app)/(tabs)/_layout.tsx` - Added swap-request icon to chores tab header
- `app/(app)/_layout.tsx` - Added Stack.Screen entries for chores/add, chores/swap-request, chores/dashboard

## Decisions Made
- Client-side fallback for dispute auto-revert: on screen focus, queries for disputed completions older than 24 hours and reverts them directly, ensuring reverts happen even without pg_cron
- Streaks are calculated globally from all-time completion history (not filtered by period) for accurate representation
- Swap request modal uses a bottom-sheet style pattern (transparent overlay with rounded top content) consistent with app design language
- Dashboard includes all household members even those with zero completions in the period for full visibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Stack.Screen routes for chores sub-screens**
- **Found during:** Task 1
- **Issue:** `app/(app)/_layout.tsx` had no Stack.Screen entries for chores/add, chores/swap-request, or chores/dashboard -- navigation would fail
- **Fix:** Added three Stack.Screen entries with proper header configuration
- **Files modified:** `app/(app)/_layout.tsx`
- **Verification:** TypeScript compilation passes, routes registered
- **Committed in:** 85ba868 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for navigation to work. No scope creep.

## Issues Encountered
- Web export (`npx expo export --platform web`) not available due to missing react-dom/react-native-web dependencies (pre-existing from Plan 01). Verified with `npx tsc --noEmit` instead, which passed cleanly.

## User Setup Required
None - no external service configuration required. Migration from Plan 01 (00004_chores.sql) already provides all needed tables, functions, and RLS policies.

## Next Phase Readiness
- Full chore management feature is complete: CRUD, rotation, completion, disputes, swaps, and dashboard
- Phase 03.1 (Chores) is fully delivered
- Phase 04 (Notifications/Engagement) can build on chore_completions and chore_swap_requests for push notification triggers

## Self-Check: PASSED

All 5 files verified present. Both task commits (85ba868, c9cdb24) confirmed in git log.

---
*Phase: 03.1-chores*
*Completed: 2026-03-11*
