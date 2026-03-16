---
id: S13
parent: M001
milestone: M001
provides:
  - lib/avatar-upload.ts utility with pickAndUploadAvatar and removeAvatar
  - Avatar component with optional avatarUrl prop and brand wintergreen ring
  - Supabase Storage avatars bucket with RLS policies
  - "AvatarUpload component with camera badge overlay and tap-to-upload action sheet"
  - "Settings profile screen with avatar upload replacing static initials"
  - "Onboarding profile screen with avatar upload above name input"
  - avatarUrl passed to every Avatar component across the app
  - Narrow profile queries updated to include avatar_url
  - Realtime subscription for profiles UPDATE events on home screen
requires: []
affects: []
key_files: []
key_decisions:
  - "Brand ring replaces shadow: wintergreen #2D6A4F ring (2px small, 3px large) around all avatars instead of shadow"
  - "Disk cache policy for expo-image with timestamp query param for cache busting"
  - "512x512 max resize using expo-image-manipulator with JPEG output at 0.8 quality"
  - "Action sheet via Alert.alert for native look-and-feel on both platforms"
  - "Edit sub-menu as separate Alert for clear UX separation from top-level options"
  - "Replaced inline initials avatar in settings/members with proper Avatar component for consistency"
  - "Added avatar_url to groceries narrow queries (not in original plan but necessary for GroceryItemRow avatars)"
  - "Realtime subscription scoped to household ID for proper cleanup on unmount"
patterns_established:
  - "Avatar upload pipeline: pick -> resize -> arrayBuffer -> supabase upload -> cache-busted URL -> profile update"
  - "Brand ring wrapper pattern: outer View with borderWidth/borderColor containing content circle"
  - "AvatarUpload component pattern: wraps Avatar with Pressable, action sheet, and camera badge overlay"
  - "All Avatar call sites pass avatarUrl from profile data when available"
  - "Narrow profile selects include avatar_url alongside id and display_name"
observability_surfaces: []
drill_down_paths: []
duration: 6min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# S13: Profile Pictures

**# Phase 13 Plan 01: Avatar Upload Foundation Summary**

## What Happened

# Phase 13 Plan 01: Avatar Upload Foundation Summary

**Avatar upload utility with camera/gallery pick, 512x512 resize, Supabase Storage upload, and brand-ringed Avatar component using expo-image**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T04:00:27Z
- **Completed:** 2026-03-14T04:03:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed expo-image-picker, expo-image, and expo-image-manipulator packages
- Created avatar upload utility with pick, resize, upload, and cache-busted URL generation
- Upgraded Avatar component with optional avatarUrl prop, expo-image rendering, and brand wintergreen ring
- Created Supabase Storage avatars bucket migration with 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and create Supabase Storage bucket with RLS** - `38ba680` (feat)
2. **Task 2: Create avatar upload utility and upgrade Avatar component** - `2007a8b` (feat)

## Files Created/Modified
- `lib/avatar-upload.ts` - Pick, upload, remove avatar utility functions
- `components/ui/Avatar.tsx` - Avatar with optional avatarUrl, expo-image, brand ring
- `package.json` - Added expo-image, expo-image-picker, expo-image-manipulator
- `package-lock.json` - Updated lockfile
- `supabase/migrations/00001_foundation.sql` - Appended avatars bucket SQL
- `supabase/migrations/00009_create_avatars_bucket.sql` - Standalone migration for avatars bucket

## Decisions Made
- Brand wintergreen ring (#2D6A4F) replaces shadow wrapper on Avatar - cleaner visual, matches design system
- Ring width scales with avatar size: 2px for small/medium, 3px for xl/2xl
- expo-image with disk cache policy for efficient avatar caching
- Timestamp query param on URLs stored in profiles.avatar_url for cache busting
- JPEG format at 0.8 quality for resized images (via expo-image-manipulator)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created standalone migration file in addition to foundation append**
- **Found during:** Task 1
- **Issue:** Plan only specified appending to 00001_foundation.sql and running via Supabase MCP. Created a standalone 00009 migration for clarity.
- **Fix:** Created `supabase/migrations/00009_create_avatars_bucket.sql` alongside the foundation append
- **Files modified:** supabase/migrations/00009_create_avatars_bucket.sql
- **Verification:** File exists with correct SQL
- **Committed in:** 38ba680

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor organizational improvement. No scope creep.

## User Setup Required

The Supabase Storage migration needs to be applied to the live database. Run the SQL in `supabase/migrations/00009_create_avatars_bucket.sql` via the Supabase Dashboard SQL Editor or MCP apply_migration tool to create the avatars bucket and RLS policies.

## Next Phase Readiness
- Avatar upload utility ready for integration in AvatarUpload component (Plan 02)
- Avatar component backward compatible - all existing call sites work unchanged
- avatarUrl prop ready for progressive adoption across the app (Plan 03)

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 13-profile-pictures*
*Completed: 2026-03-14*

# Phase 13 Plan 02: Avatar Upload UI Summary

**AvatarUpload component with camera badge overlay and action sheet, integrated into settings profile and onboarding display name screens**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T04:05:53Z
- **Completed:** 2026-03-14T04:07:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created AvatarUpload component with camera badge, action sheet (Take Photo / Choose from Library / Edit / Remove Photo), permission denial handling, and upload failure retry
- Integrated AvatarUpload into settings profile screen replacing static initials circle
- Integrated AvatarUpload into onboarding profile screen replacing illustration hero, with live avatar updates as user types name

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AvatarUpload component with camera badge and action sheet** - `a8a81d5` (feat)
2. **Task 2: Integrate AvatarUpload in settings profile and onboarding profile screens** - `3a340a5` (feat)

## Files Created/Modified
- `components/ui/AvatarUpload.tsx` - AvatarUpload component with camera badge overlay, action sheet, permission/error handling
- `components/ui/index.ts` - Added AvatarUpload export to UI barrel
- `app/(app)/settings/profile.tsx` - Replaced static initials circle with AvatarUpload, added avatarUrl state
- `app/(onboarding)/profile.tsx` - Replaced illustration hero with AvatarUpload (showBadgeAlways), removed Image/ONBOARDING_IMAGES imports

## Decisions Made
- Used Alert.alert for action sheet implementation (native look on both platforms, per plan specification)
- Edit option shows a sub-alert with Take Photo / Choose from Library options (separates "edit existing" from top-level quick access)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AvatarUpload component ready for use anywhere avatar upload is needed
- Plan 03 (realtime avatar sync across household) can proceed
- All avatar infrastructure (storage, upload, display, UI) is now complete

## Self-Check: PASSED

All 4 files verified present. Both task commits (a8a81d5, 3a340a5) verified in git log.

---
*Phase: 13-profile-pictures*
*Completed: 2026-03-14*

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
