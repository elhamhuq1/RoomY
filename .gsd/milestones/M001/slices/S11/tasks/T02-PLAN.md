# T02: 11-visual-foundation 02

**Slice:** S11 — **Milestone:** M001

## Description

Replace all hardcoded emerald hex values and local AVATAR_COLORS duplicates across the entire app, consolidating to shared imports. Then audit and restyle all non-Card containers to use outline-only styling, ensuring no container has both shadow and outline.

Purpose: Plan 01 updated the token definitions and shared components. This plan propagates those changes to the ~17 hardcoded hex occurrences and ~11 non-Card containers that bypass the token system, ensuring visual consistency throughout the app.

Output: Zero hardcoded emerald hex values, all AVATAR_COLORS arrays consolidated, all containers using consistent outline-only styling.

## Must-Haves

- [x] "No hardcoded emerald hex values (#10B981, #059669, #D1FAE5) remain in any .ts/.tsx file under app/, components/, or lib/"
- [x] "All 8 files that had local AVATAR_COLORS arrays now import from @/lib/theme/colors"
- [x] "No container in the app displays both shadow and outline simultaneously"
- [x] "Gradient balance card and dark invite code card retain their distinctive elevated styling unchanged"

## Files

- `app/(app)/expenses/settle.tsx`
- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/[id].tsx`
- `app/(app)/chores/swap-request.tsx`
- `app/(app)/chores/dashboard.tsx`
- `app/(app)/chores/add.tsx`
- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/settings/members.tsx`
- `app/(auth)/welcome.tsx`
- `components/ui/Toggle.tsx`
- `components/chores/ChoreRow.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/notifications.tsx`
- `app/(app)/settings/modules.tsx`
- `app/(app)/groceries/trip-history.tsx`
- `components/home/CalendarSection.tsx`
- `app/(app)/groceries.tsx`
- `app/(app)/chores/add.tsx`
