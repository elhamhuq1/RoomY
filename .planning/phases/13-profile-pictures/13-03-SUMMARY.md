---
phase: 13-profile-pictures
plan: 03
subsystem: ui
tags: [avatar, profile-picture, supabase-realtime, expo-image]

# Dependency graph
requires:
  - phase: 13-profile-pictures
    provides: Avatar component with avatarUrl prop, avatar_url column in profiles table
provides:
  - avatarUrl passed to every Avatar component across the app
  - Narrow profile queries updated to include avatar_url
  - Realtime subscription for profiles UPDATE events on home screen
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [realtime avatar update subscription on home screen, avatarUrl prop propagation pattern]

key-files:
  created: []
  modified:
    - components/home/MembersCard.tsx
    - components/expenses/BalanceMemberRow.tsx
    - components/expenses/BalanceSection.tsx
    - components/expenses/ExpenseRow.tsx
    - components/expenses/RoommateSection.tsx
    - components/home/WeeklyTimeline.tsx
    - components/groceries/GroceryItemRow.tsx
    - app/(app)/(tabs)/chores.tsx
    - app/(app)/(tabs)/expenses.tsx
    - app/(app)/(tabs)/groceries.tsx
    - app/(app)/(tabs)/index.tsx
    - app/(app)/chores/dispute.tsx
    - app/(app)/expenses/member-history.tsx
    - app/(app)/settings/members.tsx
    - app/(onboarding)/member-welcome.tsx

key-decisions:
  - "Replaced inline initials avatar in settings/members with proper Avatar component for consistency"
  - "Added avatar_url to groceries narrow queries (not in original plan but necessary for GroceryItemRow avatars)"
  - "Realtime subscription scoped to household ID for proper cleanup on unmount"

patterns-established:
  - "All Avatar call sites pass avatarUrl from profile data when available"
  - "Narrow profile selects include avatar_url alongside id and display_name"

requirements-completed: [PROF-05, PROF-08]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 13 Plan 03: App-wide Avatar URL Propagation Summary

**avatarUrl passed to every Avatar component across 15 files with narrow query updates and Realtime subscription for live avatar changes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T04:05:46Z
- **Completed:** 2026-03-14T04:11:23Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
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
3. **Task 3: Visual verification** - checkpoint:human-verify (pending)

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
- Awaiting human verification (Task 3 checkpoint) to confirm end-to-end flow

## Self-Check: PASSED

All 15 modified files verified present. Both commits (2c60bd2, a73fcb1) verified in git log.

---
*Phase: 13-profile-pictures*
*Completed: 2026-03-14*
