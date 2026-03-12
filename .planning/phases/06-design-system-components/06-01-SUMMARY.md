---
phase: 06-design-system-components
plan: 01
subsystem: ui
tags: [nativewind, tailwindcss, design-tokens, colors, typography, elevation]

# Dependency graph
requires:
  - phase: 04-engagement
    provides: Complete v1.0 app with orange palette to migrate from
provides:
  - Complete design token system (brand/semantic/neutral colors, 8 typography presets, 2-tier elevation)
  - lib/theme/colors.ts runtime color constants for inline styles
  - All 30 source files migrated from orange to emerald green palette
  - AVATAR_COLORS arrays updated with new palette (ready for Avatar component centralization in Plan 02)
affects: [06-02, 06-03, 06-04, 07, 08, 09, 10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token-first color system: all colors flow from tailwind.config.js tokens, duplicated in colors.ts for inline styles"
    - "NativeWind className for styling, colors.ts import only for JS-level APIs (tabBarActiveTintColor, ActivityIndicator, etc.)"

key-files:
  created:
    - lib/theme/colors.ts
  modified:
    - tailwind.config.js
    - app/_layout.tsx
    - app/(app)/_layout.tsx
    - app/(app)/(tabs)/_layout.tsx
    - app/(app)/(tabs)/index.tsx
    - app/(app)/(tabs)/expenses.tsx
    - app/(app)/(tabs)/groceries.tsx
    - app/(app)/(tabs)/chores.tsx
    - app/(auth)/welcome.tsx
    - app/(auth)/sign-up.tsx
    - app/(auth)/sign-in.tsx
    - app/(auth)/forgot-password.tsx
    - app/(onboarding)/profile.tsx
    - app/(onboarding)/setup-choice.tsx
    - app/(onboarding)/create-household.tsx
    - app/(onboarding)/join-household.tsx
    - app/(onboarding)/member-welcome.tsx
    - app/(onboarding)/module-quiz.tsx
    - app/(app)/expenses/add.tsx
    - app/(app)/expenses/detail.tsx
    - app/(app)/expenses/settle.tsx
    - app/(app)/groceries/complete-trip.tsx
    - app/(app)/groceries/trip-history.tsx
    - app/(app)/chores/create.tsx
    - app/(app)/chores/dashboard.tsx
    - app/(app)/chores/swap-request.tsx
    - app/(app)/settings/index.tsx
    - app/(app)/settings/members.tsx
    - app/(app)/settings/modules.tsx

key-decisions:
  - "Brand green (#10B981) kept separate from semantic success (#22C55E) per user design decision"
  - "headerTintColor uses neutral.text (dark) instead of brand color for readability"
  - "AVATAR_COLORS replaced with 8-color new-palette array as temporary measure until Avatar component in Plan 02"

patterns-established:
  - "Color import pattern: `import { colors } from '@/lib/theme/colors'` for all inline style color references"
  - "Tailwind class naming: bg-brand, text-brand-dark, bg-neutral-bg, text-neutral-secondary, bg-semantic-success"
  - "Header styling: backgroundColor = colors.neutral.bg, tintColor = colors.neutral.text across all Stack.Screen options"

requirements-completed: [DSYS-01, DSYS-02, DSYS-03]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 6 Plan 01: Design Tokens Summary

**Emerald green token system (brand/semantic/neutral colors, 8 typography presets, 2-tier elevation) defined in tailwind.config.js and colors.ts, with full migration of 30 source files from orange to green palette**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T13:56:59Z
- **Completed:** 2026-03-12T14:03:54Z
- **Tasks:** 2
- **Files modified:** 32

## Accomplishments
- Defined complete design token system in tailwind.config.js: brand/semantic/neutral colors, 8 typography presets, 2-tier boxShadow, card borderRadius
- Created lib/theme/colors.ts exporting runtime color constants for inline style usage
- Migrated all 30 source files from old orange/warm palette to new emerald green tokens
- Replaced all hardcoded hex values (#f9a825, #fefdfb, #faf3e8, #fde4b9, #66bb6a, etc.) with colors.* imports
- Replaced all old Tailwind class references (primary-*, surface-*, accent-*) with new token names (brand, neutral-*, semantic-*)
- Updated all headerStyle/headerTintColor configurations across layout files
- Replaced AVATAR_COLORS arrays in 11 files with new 8-color palette

## Task Commits

Each task was committed atomically:

1. **Task 1: Define design tokens in tailwind.config.js and colors.ts** - `1bf7b00` (feat)
2. **Task 2: Migrate all source files from orange palette to new tokens** - `60e3613` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `tailwind.config.js` - Complete design token system (colors, typography, shadows, borderRadius)
- `lib/theme/colors.ts` - Runtime color constants for inline styles
- `app/_layout.tsx` - Root layout header colors updated
- `app/(app)/_layout.tsx` - App group header colors updated
- `app/(app)/(tabs)/_layout.tsx` - Tab bar tint colors updated
- `app/(app)/(tabs)/index.tsx` - Dashboard colors and AVATAR_COLORS migrated
- `app/(app)/(tabs)/expenses.tsx` - Expense list colors and AVATAR_COLORS migrated
- `app/(app)/(tabs)/groceries.tsx` - Grocery list colors and AVATAR_COLORS migrated
- `app/(app)/(tabs)/chores.tsx` - Chore list colors and AVATAR_COLORS migrated
- `app/(auth)/welcome.tsx` - Welcome screen brand colors
- `app/(auth)/sign-up.tsx` - Sign-up form brand colors
- `app/(auth)/sign-in.tsx` - Sign-in form brand colors
- `app/(auth)/forgot-password.tsx` - Forgot password brand colors
- `app/(onboarding)/profile.tsx` - Profile setup brand colors
- `app/(onboarding)/setup-choice.tsx` - Setup choice card colors
- `app/(onboarding)/create-household.tsx` - Create household form colors
- `app/(onboarding)/join-household.tsx` - Join household form colors
- `app/(onboarding)/member-welcome.tsx` - Member welcome celebration colors
- `app/(onboarding)/module-quiz.tsx` - Module quiz toggle colors
- `app/(app)/expenses/add.tsx` - Add expense form and AVATAR_COLORS
- `app/(app)/expenses/detail.tsx` - Expense detail view colors
- `app/(app)/expenses/settle.tsx` - Settle-up screen colors
- `app/(app)/groceries/complete-trip.tsx` - Complete trip form colors
- `app/(app)/groceries/trip-history.tsx` - Trip history colors
- `app/(app)/chores/create.tsx` - Chore creation form colors
- `app/(app)/chores/dashboard.tsx` - Chore dashboard and AVATAR_COLORS
- `app/(app)/chores/swap-request.tsx` - Swap request colors
- `app/(app)/settings/index.tsx` - Settings screen Tailwind classes
- `app/(app)/settings/members.tsx` - Members list and AVATAR_COLORS
- `app/(app)/settings/modules.tsx` - Module toggle colors

## Decisions Made
- Brand green (#10B981) kept separate from semantic success (#22C55E) -- these serve different purposes and should not be conflated even though both are green
- Header navigation uses neutral.text for tintColor instead of brand color, prioritizing readability over brand expression in navigation chrome
- AVATAR_COLORS arrays replaced with a temporary 8-color palette using new brand colors; will be centralized into the Avatar component in Plan 02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - mechanical migration completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Design token system fully defined and applied across all source files
- Ready for Plan 02 (shared UI components) which depends on these tokens
- Ready for Plan 03 (tab bar + FAB) which depends on brand colors
- AVATAR_COLORS arrays in 11 files are temporary and will be replaced by Avatar component in Plan 02

## Self-Check: PASSED

- [x] tailwind.config.js exists
- [x] lib/theme/colors.ts exists
- [x] 06-01-SUMMARY.md exists
- [x] Commit 1bf7b00 exists (Task 1)
- [x] Commit 60e3613 exists (Task 2)
- [x] Zero old palette references remaining in app/ and lib/

---
*Phase: 06-design-system-components*
*Completed: 2026-03-12*
