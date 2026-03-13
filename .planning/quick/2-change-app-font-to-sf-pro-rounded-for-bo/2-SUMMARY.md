---
phase: quick
plan: 2
subsystem: ui
tags: [nativewind, tailwind, font, sf-pro-rounded, platformSelect]

# Dependency graph
requires:
  - phase: 06-design-system
    provides: "Design system fontSize tokens (page-title, key-number, section-heading, card-title)"
provides:
  - "font-heading utility class via NativeWind platformSelect"
  - "SF Pro Rounded heading font on iOS for all heading text elements"
affects: [any-new-heading-components]

# Tech tracking
tech-stack:
  added: []
  patterns: ["platformSelect for platform-specific font families in Tailwind config"]

key-files:
  created: []
  modified:
    - tailwind.config.js
    - components/home/GreetingHeader.tsx
    - components/home/BalanceSummaryCard.tsx
    - components/home/MembersCard.tsx
    - components/home/WeeklyTimeline.tsx
    - components/home/AttentionFeed.tsx
    - components/chores/StatsRow.tsx
    - components/chores/ChoreRow.tsx
    - components/chores/EmptyState.tsx
    - components/groceries/EmptyState.tsx
    - components/expenses/BalanceSection.tsx
    - components/expenses/BalanceMemberRow.tsx
    - components/expenses/RoommateSection.tsx
    - components/expenses/EmptyState.tsx
    - components/expenses/ExpenseRow.tsx
    - components/expenses/SettlementRow.tsx

key-decisions:
  - "SF Pro Rounded as iOS system font (no bundled font files needed)"
  - "platformSelect from nativewind/theme for platform-specific font family"
  - "font-heading applied only to heading text sizes (page-title, key-number, section-heading, card-title), not body/metadata/badge/overline"

patterns-established:
  - "font-heading class: add to any new heading text element that uses text-page-title, text-key-number, text-section-heading, or text-card-title"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-13
---

# Quick Task 2: Change App Font to SF Pro Rounded Summary

**SF Pro Rounded heading font on iOS via NativeWind platformSelect, applied to 21 heading elements across 15 component files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T20:17:24Z
- **Completed:** 2026-03-13T20:18:59Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Added fontFamily.heading to Tailwind config using NativeWind platformSelect (SF Pro Rounded on iOS, System default elsewhere)
- Applied font-heading class to all 21 heading text elements across 15 component files
- No bundled fonts, no expo font loading, no app.json changes required

## Task Commits

Each task was committed atomically:

1. **Task 1: Add heading font family to Tailwind config** - `279e33a` (feat)
2. **Task 2: Apply font-heading class to all heading text elements** - `6b98101` (feat)

## Files Created/Modified
- `tailwind.config.js` - Added platformSelect import and fontFamily.heading config
- `components/home/GreetingHeader.tsx` - Added font-heading to page title
- `components/home/BalanceSummaryCard.tsx` - Added font-heading to key number
- `components/home/MembersCard.tsx` - Added font-heading to section heading (invite code)
- `components/home/WeeklyTimeline.tsx` - Added font-heading to section heading + chore card titles
- `components/home/AttentionFeed.tsx` - Added font-heading to section heading, empty state heading, and attention card titles
- `components/chores/StatsRow.tsx` - Added font-heading to 3 key number stats
- `components/chores/ChoreRow.tsx` - Added font-heading to chore name card title
- `components/chores/EmptyState.tsx` - Added font-heading to empty state section heading
- `components/groceries/EmptyState.tsx` - Added font-heading to empty state section heading
- `components/expenses/BalanceSection.tsx` - Added font-heading to Balances section heading
- `components/expenses/BalanceMemberRow.tsx` - Added font-heading to member name card title
- `components/expenses/RoommateSection.tsx` - Added font-heading to section heading + member card titles
- `components/expenses/EmptyState.tsx` - Added font-heading to empty state section heading
- `components/expenses/ExpenseRow.tsx` - Added font-heading to expense description card title
- `components/expenses/SettlementRow.tsx` - Added font-heading to settlement card title

## Decisions Made
- Used "System" as the default fallback (Android/web) instead of a specific font name, matching NativeWind convention
- Placed fontFamily before colors in theme.extend for logical grouping (typography before color)
- Inserted font-heading immediately after the text size class in className strings for consistent ordering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - SF Pro Rounded is a system font on iOS 13+. No bundled fonts or configuration needed.

## Next Phase Readiness
- Any new components with heading text sizes should include the font-heading class
- Pattern established: font-heading goes with text-page-title, text-key-number, text-section-heading, text-card-title

## Self-Check: PASSED

- All 16 modified files exist on disk
- Both task commits verified (279e33a, 6b98101)
- platformSelect and fontFamily present in tailwind.config.js
- font-heading count: 21 occurrences across 15 files (matches expected)

---
*Quick Task: 2*
*Completed: 2026-03-13*
