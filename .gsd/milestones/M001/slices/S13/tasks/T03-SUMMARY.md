---
id: T03
parent: S13
milestone: M001
provides:
  - avatarUrl passed to every Avatar component across the app
  - Narrow profile queries updated to include avatar_url
  - Realtime subscription for profiles UPDATE events on home screen
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 6min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# T03: 13-profile-pictures 03

**# Phase 13 Plan 03: App-wide Avatar URL Propagation Summary**

## What Happened

# Phase 13 Plan 03: App-wide Avatar URL Propagation Summary

**avatarUrl passed to every Avatar component across 15 files with narrow query updates and Realtime subscription for live avatar changes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T04:05:46Z
- **Completed:** 2026-03-14T04:11:23Z
- **Tasks:** 3 of 3
- **Files modified:** 16

## Accomplishments
- Every Avatar component across the app now receives avatarUrl prop from profile data
- Five narrow `.select('id, display_name')` queries updated to include `avatar_url`
- Realtime subscription on home screen pushes avatar changes from other household members immediately
- Settings/members screen upgraded from inline initials to proper Avatar component with profile picture support

## Task Commits

Each task was committed atomically:

1. **Task 1: Pass avatarUrl to all Avatar usages and update narrow profile queries** - `2c60bd2` (feat)
2. **Task 2: Add Realtime subscription for other members' avatar updates** - `a73fcb1` (feat)
3. **Task 3: Visual verification** - checkpoint:human-verify (approved)

## Files Created/Modified
- `components/home/MembersCard.tsx` - Added avatar_url to Member interface, passed avatarUrl to Avatar
- `components/expenses/BalanceMemberRow.tsx` - Added avatarUrl prop, passed to Avatar
- `components/expenses/BalanceSection.tsx` - Passed avatar_url from profile data through to BalanceMemberRow
- `components/expenses/ExpenseRow.tsx` - Updated SplitWithProfile type to include avatar_url, passed to Avatar
- `components/expenses/RoommateSection.tsx` - Added avatar_url to RoommateMember interface, passed to Avatar
- `components/home/WeeklyTimeline.tsx` - Added assigneeAvatarUrl to TimelineChore interface, passed to Avatar
- `components/groceries/GroceryItemRow.tsx` - Added creatorAvatarUrl prop, passed to Avatar
- `app/(app)/(tabs)/chores.tsx` - Passed avatar_url to Avatar in swap modal
- `app/(app)/(tabs)/expenses.tsx` - Updated 2 narrow queries and member mapping to include avatar_url
- `app/(app)/(tabs)/groceries.tsx` - Updated 2 narrow queries and creatorProfiles type for avatar_url
- `app/(app)/(tabs)/index.tsx` - Added avatar_url to MemberWithProfile type, membersList, weekChores; added Realtime subscription
- `app/(app)/chores/dispute.tsx` - Passed avatar_url from profile data to both Avatar instances
- `app/(app)/expenses/member-history.tsx` - Updated narrow query and profileMap for avatar_url
- `app/(app)/settings/members.tsx` - Replaced inline initials with Avatar component using avatarUrl
- `app/(onboarding)/member-welcome.tsx` - Passed avatar_url from member profiles to Avatar

## Decisions Made
- Replaced inline initials avatar in settings/members.tsx with proper Avatar component -- ensures consistency and profile picture display on the members list
- Added avatar_url to groceries screen narrow queries -- GroceryItemRow also uses Avatar, would have had no profile picture without this fix
- Realtime subscription channel scoped to household ID for proper lifecycle management

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added avatar_url to groceries screen queries**
- **Found during:** Task 1
- **Issue:** Plan only listed expenses.tsx and member-history.tsx for narrow query updates, but groceries.tsx also had `.select("id, display_name")` for creator profiles used by GroceryItemRow Avatar
- **Fix:** Updated both narrow queries in groceries.tsx and the creatorProfiles type to include avatar_url, passed as creatorAvatarUrl prop to GroceryItemRow
- **Files modified:** app/(app)/(tabs)/groceries.tsx, components/groceries/GroceryItemRow.tsx
- **Verification:** TypeScript compiles clean, Avatar receives avatarUrl from creator profile data
- **Committed in:** 2c60bd2

**2. [Rule 2 - Missing Critical] Replaced inline avatar in settings/members with Avatar component**
- **Found during:** Task 1
- **Issue:** settings/members.tsx used a custom inline View+Text for member avatars instead of the Avatar component -- profile pictures would never show there
- **Fix:** Replaced with proper Avatar component with avatarUrl prop from member profile data
- **Files modified:** app/(app)/settings/members.tsx
- **Verification:** TypeScript compiles clean, Avatar component renders with profile picture support
- **Committed in:** 2c60bd2

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both fixes essential for complete profile picture coverage. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile picture system complete across all screens
- Human verification approved — profile pictures confirmed working across all screens
- Additional fixes during verification: settings index, ChoreRow, chore dashboard, swap requests, removed redundant Edit option

## Self-Check: PASSED

All 15 modified files verified present. Both commits (2c60bd2, a73fcb1) verified in git log.

---
*Phase: 13-profile-pictures*
*Completed: 2026-03-14*
