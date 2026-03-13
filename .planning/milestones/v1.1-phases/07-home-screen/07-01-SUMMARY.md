---
phase: 07-home-screen
plan: 01
subsystem: ui
tags: [react-native, nativewind, date-fns, expo-linear-gradient, expo-clipboard, avatar, card]

# Dependency graph
requires:
  - phase: 06-design-system
    provides: Avatar, Card, Button components and design tokens (colors.ts, tailwind.config.js)
provides:
  - GreetingHeader component with time-aware greeting and formatted date
  - MembersCard component with avatar row and invite code copy/share
  - BalanceSummaryCard component with dark gradient and conditional owe/owed display
affects: [07-home-screen plan 03 (assembly), 10-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section component pattern: presentational components in components/home/ accepting typed props, no data fetching"
    - "Dark gradient card: LinearGradient with slate-800/900 colors, inline style borderRadius for rounded-card-lg"
    - "Invite code interaction: expo-clipboard + Share API with 2s copied feedback timeout"

key-files:
  created:
    - components/home/GreetingHeader.tsx
    - components/home/MembersCard.tsx
    - components/home/BalanceSummaryCard.tsx
  modified: []

key-decisions:
  - "BalanceSummaryCard uses inline style for borderRadius (16px) since LinearGradient className may not apply borderRadius consistently"
  - "MembersCard differentiates solo vs multi-member state inline rather than separate components"
  - "Outline variant Button used on dark gradient background for Request action -- border-brand provides sufficient contrast on slate bg"

patterns-established:
  - "Section component props pattern: components accept pre-fetched data as props, parent handles all data fetching"
  - "Solo creator detection: isSolo = members.length <= 1 controls invite section prominence"

requirements-completed: [HOME-01, HOME-02, HOME-04]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 7 Plan 01: Hero Section Components Summary

**Three above-the-fold home screen components: time-aware GreetingHeader with date-fns, MembersCard with Avatar row and clipboard/share invite, and dark gradient BalanceSummaryCard with conditional owe/owed display**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T17:40:01Z
- **Completed:** 2026-03-12T17:43:41Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- GreetingHeader renders morning/afternoon/evening greeting with user's first name and date-fns formatted weekday + date
- MembersCard renders household name overline, horizontal Avatar row with first-name labels, and invite code with copy/share -- solo creators get prominent invite with Share and Copy buttons
- BalanceSummaryCard renders dark diagonal gradient (slate-800 to slate-900) with conditional green/red dollar amount, checkmark settled state, and always-visible Settle Up + Request buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GreetingHeader and MembersCard** - `d8892a6` (feat)
2. **Task 2: Create BalanceSummaryCard** - `0660921` (feat)

## Files Created/Modified
- `components/home/GreetingHeader.tsx` - Time-aware greeting (morning/afternoon/evening) with date-fns formatted date display
- `components/home/MembersCard.tsx` - Household name, Avatar row, invite code with copy (expo-clipboard) and share (React Native Share API)
- `components/home/BalanceSummaryCard.tsx` - Dark gradient balance card with conditional owe/owed text, dollar amount, Settle Up and Request buttons

## Decisions Made
- Used inline `style={{ borderRadius: 16 }}` on LinearGradient instead of `className="rounded-card-lg"` for reliable rendering since NativeWind className borderRadius on LinearGradient can be inconsistent
- MembersCard handles both solo creator and multi-member states within a single component, using conditional rendering for the invite section prominence
- Button outline variant on dark gradient background provides sufficient contrast with brand green border on slate background

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three hero section components ready for composition in Plan 03 (home screen assembly)
- Components accept well-typed props with no `any` types
- Components use Phase 6 design system (Avatar, Card, Button) and design tokens consistently

## Self-Check: PASSED

- All 3 component files found
- All 2 task commits verified (d8892a6, 0660921)
- SUMMARY.md created at expected path

---
*Phase: 07-home-screen*
*Completed: 2026-03-12*
