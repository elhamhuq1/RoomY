---
phase: 13-profile-pictures
plan: 01
subsystem: ui, storage
tags: [expo-image, expo-image-picker, expo-image-manipulator, supabase-storage, avatar, profile-picture]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: profiles table with avatar_url column, Supabase client
provides:
  - lib/avatar-upload.ts utility with pickAndUploadAvatar and removeAvatar
  - Avatar component with optional avatarUrl prop and brand wintergreen ring
  - Supabase Storage avatars bucket with RLS policies
affects: [13-02-PLAN, 13-03-PLAN, settings, onboarding]

# Tech tracking
tech-stack:
  added: [expo-image ~3.0.11, expo-image-picker ~17.0.10, expo-image-manipulator ~14.0.8]
  patterns: [avatar upload pipeline with cache-busted URLs, brand ring avatar wrapper]

key-files:
  created:
    - lib/avatar-upload.ts
    - supabase/migrations/00009_create_avatars_bucket.sql
  modified:
    - components/ui/Avatar.tsx
    - package.json
    - package-lock.json
    - supabase/migrations/00001_foundation.sql

key-decisions:
  - "Brand ring replaces shadow: wintergreen #2D6A4F ring (2px small, 3px large) around all avatars instead of shadow"
  - "Disk cache policy for expo-image with timestamp query param for cache busting"
  - "512x512 max resize using expo-image-manipulator with JPEG output at 0.8 quality"

patterns-established:
  - "Avatar upload pipeline: pick -> resize -> arrayBuffer -> supabase upload -> cache-busted URL -> profile update"
  - "Brand ring wrapper pattern: outer View with borderWidth/borderColor containing content circle"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-08, PROF-09]

# Metrics
duration: 3min
completed: 2026-03-14
---

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
