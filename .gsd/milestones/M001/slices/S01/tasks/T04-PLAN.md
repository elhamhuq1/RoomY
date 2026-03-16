# T04: 01-foundation 04

**Slice:** S01 — **Milestone:** M001

## Description

Build the main app dashboard with dynamic module tabs, empty states for solo creators, and all settings screens (profile, modules, members/invite). This is the home experience after onboarding.

Purpose: Delivers the post-onboarding experience -- dashboard with module tabs that respond to AUTH-05 settings, invite code management from AUTH-03, and validates RLS isolation. After this plan, the foundation phase is complete.

Output: Dashboard with conditional tabs, empty states, profile settings, module toggle settings, and member management with invite code sharing/regeneration.

## Must-Haves

- [x] "Dashboard shows only the module tabs the household has enabled"
- [x] "Empty dashboard for solo creator prominently displays invite code with share action"
- [x] "User can edit their display name in settings"
- [x] "User can toggle modules on/off in household settings and tabs update immediately"
- [x] "User can view household members and share/regenerate invite code in settings"
- [x] "Household data is isolated -- RLS prevents cross-household access"

## Files

- `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/(tabs)/index.tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/profile.tsx`
- `app/(app)/settings/modules.tsx`
- `app/(app)/settings/members.tsx`
- `app/(app)/_layout.tsx`
