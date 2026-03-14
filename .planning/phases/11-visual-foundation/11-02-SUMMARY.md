---
phase: 11-visual-foundation
plan: 02
subsystem: ui
tags: [nativewind, color-tokens, avatar-colors, card-styling, wintergreen]

# Dependency graph
requires:
  - phase: 11-visual-foundation-01
    provides: "Wintergreen color palette tokens, AVATAR_COLORS export, transparent outline Card component"
provides:
  - "Zero hardcoded emerald hex values in app/, components/, lib/"
  - "8 files consolidated to shared AVATAR_COLORS import"
  - "All non-Card containers restyled to outline-only pattern"
  - "Bottom bars using cream background for seamless integration"
affects: [11-03, 12-empty-states, 13-profile-pictures]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Shared AVATAR_COLORS import from @/lib/theme/colors", "Outline-only container: bg-transparent rounded-card border border-neutral-border", "Cream bottom bar: bg-[#F5F0EB] for seamless integration"]

key-files:
  created: []
  modified:
    - app/(app)/expenses/settle.tsx
    - app/(app)/expenses/add.tsx
    - app/(app)/expenses/[id].tsx
    - app/(app)/chores/swap-request.tsx
    - app/(app)/chores/dashboard.tsx
    - app/(app)/chores/add.tsx
    - app/(app)/groceries/complete-trip.tsx
    - app/(app)/settings/members.tsx
    - app/(auth)/welcome.tsx
    - components/ui/Toggle.tsx
    - components/chores/ChoreRow.tsx
    - app/(app)/settings/index.tsx
    - app/(app)/settings/notifications.tsx
    - app/(app)/settings/modules.tsx
    - app/(app)/groceries/trip-history.tsx
    - components/home/CalendarSection.tsx
    - app/(app)/(tabs)/groceries.tsx

key-decisions:
  - "Welcome screen uses wintergreen #2D6A4F for active dots and CTA button, #1B4332 for login link"
  - "Toggle active state references colors.brand.DEFAULT instead of hardcoded hex"
  - "Bottom bars use cream #F5F0EB background instead of white for seamless integration with app surface"

patterns-established:
  - "AVATAR_COLORS: always import from @/lib/theme/colors, never declare locally"
  - "Non-Card containers: bg-transparent rounded-card border border-neutral-border (no shadow)"
  - "Bottom action bars: border-t border-neutral-border bg-[#F5F0EB]"

requirements-completed: [VIS-03, VIS-04, CARD-02, CARD-03]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 11 Plan 02: Color & Container Propagation Summary

**Replaced all hardcoded emerald hex values across 11 files, consolidated 8 AVATAR_COLORS arrays to shared import, and restyled all non-Card containers to outline-only pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T00:33:02Z
- **Completed:** 2026-03-14T00:36:30Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Eliminated all hardcoded emerald hex values (#10B981, #059669, #D1FAE5) from app/, components/, and lib/
- Consolidated 8 local AVATAR_COLORS array declarations to a single shared import from @/lib/theme/colors
- Restyled all non-Card containers from bg-white shadow-sm to bg-transparent border border-neutral-border
- Updated bottom bars to cream background (#F5F0EB) for seamless integration with app surface
- Preserved gradient balance card and dark invite code card styling (CARD-02)
- Verified zero shadow+outline violations (CARD-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace all hardcoded emerald hex values and consolidate AVATAR_COLORS imports** - `62232ad` (feat)
2. **Task 2: Restyle non-Card containers to outline-only and verify CARD-02/CARD-03** - `93fbf0b` (feat)

## Files Created/Modified
- `app/(app)/expenses/settle.tsx` - Shared AVATAR_COLORS import + outline container
- `app/(app)/expenses/add.tsx` - Shared AVATAR_COLORS import
- `app/(app)/expenses/[id].tsx` - Shared AVATAR_COLORS import + 3 outline containers
- `app/(app)/chores/swap-request.tsx` - Shared AVATAR_COLORS import
- `app/(app)/chores/dashboard.tsx` - Shared AVATAR_COLORS import + outline containers (empty state, member cards)
- `app/(app)/chores/add.tsx` - Shared AVATAR_COLORS import + cream bottom bar
- `app/(app)/groceries/complete-trip.tsx` - Shared AVATAR_COLORS import
- `app/(app)/settings/members.tsx` - Shared AVATAR_COLORS import + 2 outline containers
- `app/(auth)/welcome.tsx` - Wintergreen colors (#2D6A4F, #1B4332) replacing emerald
- `components/ui/Toggle.tsx` - colors.brand.DEFAULT for active state
- `components/chores/ChoreRow.tsx` - colors.brand.DEFAULT for indicator/icon colors
- `app/(app)/settings/index.tsx` - 2 outline containers (user card, settings rows)
- `app/(app)/settings/notifications.tsx` - Outline container for toggle card
- `app/(app)/settings/modules.tsx` - Outline containers for module cards (removed shadow-sm)
- `app/(app)/groceries/trip-history.tsx` - Outline containers for trip cards
- `components/home/CalendarSection.tsx` - Outline container for calendar
- `app/(app)/(tabs)/groceries.tsx` - Cream bottom bar

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All color tokens and container patterns are now fully propagated across the app
- Plan 11-03 can update system chrome (tab bar, headers, StatusBar) against the new palette
- No remaining hardcoded emerald values or inconsistent container styles

## Self-Check: PASSED

All 17 modified files exist on disk. Both task commits (62232ad, 93fbf0b) verified in git log.

---
*Phase: 11-visual-foundation*
*Completed: 2026-03-14*
