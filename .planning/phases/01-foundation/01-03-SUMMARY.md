---
phase: 01-foundation
plan: 03
subsystem: onboarding
tags: [expo-router, nativewind, supabase, onboarding-wizard, invite-code, share-sheet, toggle-cards, react-native]

# Dependency graph
requires:
  - phase: 01-01
    provides: Supabase client, auth context with refreshProfile, protected navigation, NativeWind warm theme, database schema with households/members/settings tables
  - phase: 01-02
    provides: Auth screens (welcome, sign-up, sign-in) that redirect to onboarding via Stack.Protected
provides:
  - Profile setup screen (display name + avatar initial preview)
  - Household create-or-join equal fork screen
  - Household creation with auto-generated invite code + native share sheet
  - Household joining via invite code RPC with friendly error messages
  - Member welcome screen with household name and member list
  - Module quiz with toggle cards (Expenses locked on, Groceries/Chores opt-in)
  - Complete onboarding wizard flow ending with dashboard redirect
affects: [01-04-PLAN, 02-expense-splitting, 03-groceries-chores]

# Tech tracking
tech-stack:
  added: []
  patterns: [react-native-share-api-invite-code, supabase-rpc-join-household, toggle-card-module-selection, refreshProfile-triggers-navigation-guard]

key-files:
  created: [app/(onboarding)/household-choice.tsx, app/(onboarding)/create-household.tsx, app/(onboarding)/join-household.tsx, app/(onboarding)/member-welcome.tsx, app/(onboarding)/module-quiz.tsx]
  modified: [app/(onboarding)/_layout.tsx, app/(onboarding)/profile.tsx]

key-decisions:
  - "Used React Native Share API instead of expo-sharing for invite code sharing -- simpler API, no file requirement, works cross-platform"
  - "Invite code formatted with space in middle (ABCD EFGH) for readability in both display and input"
  - "Module quiz fetches household_id from household_members rather than passing through navigation params for reliability"
  - "refreshProfile triggers Stack.Protected guard redirect rather than manual router.replace to (app)"

patterns-established:
  - "Pattern: React Native Share API for text sharing (invite codes, links)"
  - "Pattern: Supabase RPC for operations requiring SECURITY DEFINER (join_household_by_code)"
  - "Pattern: Friendly error message mapping from Supabase exceptions"
  - "Pattern: Toggle cards with icon/description/switch for module selection"
  - "Pattern: refreshProfile to trigger auth context state change -> navigation guard redirect"
  - "Pattern: Colored initials avatars (alternating palette) for member lists"

requirements-completed: [AUTH-02, AUTH-03, AUTH-04, AUTH-05]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 1 Plan 03: Onboarding Wizard Summary

**Seven-screen onboarding wizard with profile setup, equal-fork household create/join, invite code sharing via native share sheet, member welcome, and module toggle quiz redirecting to dashboard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T04:58:53Z
- **Completed:** 2026-03-11T05:02:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built complete onboarding wizard with 7 screens covering profile setup, household choice, creation, joining, welcome, and module quiz
- Household choice screen presents create/join as equally-weighted options (neither feels secondary) with matching card sizes, borders, and styling
- Create household flow auto-generates invite code via DB trigger, displays with spaced formatting, and offers native share sheet with pre-written message
- Join household flow calls Supabase RPC with friendly error messages for invalid/expired codes, full households, and duplicate membership
- Module quiz with three toggle cards (Expenses always on, Groceries/Chores opt-in) saves settings and triggers dashboard redirect via auth context refresh

## Task Commits

Each task was committed atomically:

1. **Task 1: Build profile, household choice, and household creation screens** - `de1ad34` (feat)
2. **Task 2: Build join household, member welcome, and module quiz screens** - `88c492c` (feat)

## Files Created/Modified
- `app/(onboarding)/_layout.tsx` - Updated with initialRouteName="profile" for wizard entry point
- `app/(onboarding)/profile.tsx` - Display name input with avatar initial preview, updates profiles table + auth metadata
- `app/(onboarding)/household-choice.tsx` - Equal-fork create/join with two identically-styled cards (home icon + key icon)
- `app/(onboarding)/create-household.tsx` - Household name form, inserts household + member, shows invite code with share button
- `app/(onboarding)/join-household.tsx` - Invite code input with auto-capitalize, RPC call, friendly error handling
- `app/(onboarding)/member-welcome.tsx` - Celebratory "You're in!" with household name, member list with colored initials
- `app/(onboarding)/module-quiz.tsx` - Three toggle cards for Expenses (locked), Groceries, Chores with settings save + auth refresh

## Decisions Made
- Used React Native's built-in `Share` API instead of `expo-sharing` for invite code sharing -- Share.share() handles plain text directly without needing a file URI, which is the correct API for sharing text content
- Formatted invite codes with a space in the middle (ABCD EFGH) for better readability in both the display view and the text input
- Module quiz screen fetches household_id from household_members table on mount rather than relying on navigation params, ensuring it works for both create and join paths
- Used refreshProfile (which re-fetches profile + household) to trigger the Stack.Protected guard redirect to (app) group, avoiding manual navigation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

The onboarding screens use the same Supabase backend configured in Plan 01. No additional setup required beyond what was documented in 01-01-SUMMARY.md:
- Supabase project with database migration applied (households, household_members, household_settings tables)
- The `join_household_by_code` RPC function and `generate_invite_code` trigger must be deployed

## Next Phase Readiness
- Complete auth + onboarding flow ready: welcome -> sign-up/sign-in -> profile -> household-choice -> (create|join) -> module-quiz -> dashboard
- Users can form households and configure their app experience
- Household state drives navigation guards -- completing onboarding redirects to (app) group
- Ready for 01-04-PLAN (dashboard placeholder / final foundation)
- Ready for Phase 2 (expense splitting) once foundation is complete

## Self-Check: PASSED

- All 7 files verified present
- Both task commits verified (de1ad34, 88c492c)
- TypeScript compilation passes with zero errors

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
