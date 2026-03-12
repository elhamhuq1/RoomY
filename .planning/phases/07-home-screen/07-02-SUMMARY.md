---
phase: 07-home-screen
plan: 02
subsystem: ui
tags: [react-native-calendars, calendar, week-strip, dot-markers, layout-animation]

# Dependency graph
requires:
  - phase: 06-design-system
    provides: "Design system colors, Card/Avatar components"
provides:
  - "CalendarSection component with collapsible week-strip/month toggle"
  - "Updated calendar-utils with red/coral expense dots and exported dot constants"
affects: [07-home-screen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom week-strip with LayoutAnimation toggle to full Calendar (avoids ExpandableCalendar ScrollView conflicts)"
    - "Exported dot color constants from calendar-utils for legend reuse"

key-files:
  created:
    - components/home/CalendarSection.tsx
  modified:
    - lib/calendar-utils.ts

key-decisions:
  - "Used custom week-strip + Calendar toggle instead of ExpandableCalendar to avoid gesture conflicts inside parent ScrollView"
  - "Expense dot color changed from blue (#3b82f6) to red/coral (#EF4444) per design spec"

patterns-established:
  - "Week-strip pattern: 7-day row from startOfWeek with today highlight, selected highlight, and dot indicators"
  - "Calendar expand/collapse: LayoutAnimation.configureNext before boolean toggle for smooth transitions"

requirements-completed: [HOME-03]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 7 Plan 02: Calendar Section Summary

**Collapsible week-strip calendar component with red/coral expense dots and green chore dots using LayoutAnimation toggle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T17:40:04Z
- **Completed:** 2026-03-12T17:44:15Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Updated calendar-utils.ts expense dot color from blue (#3b82f6) to red/coral (#EF4444)
- Exported EXPENSE_DOT and CHORE_DOT constants for reuse in CalendarSection legend
- Created CalendarSection component with collapsible week-strip that expands to full month Calendar
- Week strip shows 7 days with today highlighted (brand-light bg), selected date (brand bg), and event dot indicators

## Task Commits

Each task was committed atomically:

1. **Task 1: Update calendar-utils dot colors and create CalendarSection component** - `9f5b107` (feat)

**Plan metadata:** `996267d` (docs: complete plan)

## Files Created/Modified
- `components/home/CalendarSection.tsx` - Collapsible week-strip/month calendar with event dots and color legend
- `lib/calendar-utils.ts` - Updated EXPENSE_DOT to red/coral (#EF4444), exported dot constants

## Decisions Made
- Used custom week-strip + Calendar toggle (fallback approach) instead of ExpandableCalendar. The ExpandableCalendar requires CalendarProvider wrapper and has gesture conflicts when nested inside a parent ScrollView. Since the home screen is a single ScrollView with multiple sections, the custom approach provides reliable behavior with LayoutAnimation for smooth transitions.
- Kept the expanded state within CalendarSection (not lifted to parent) since only the calendar needs to know its expansion state.
- On day press in expanded mode, the calendar collapses back to week strip (matching the "tap to expand, tap again to collapse" user constraint from CONTEXT.md).

## Deviations from Plan

None - plan executed exactly as written. The fallback approach (custom week strip + Calendar toggle) was used as the plan anticipated, given ExpandableCalendar's documented gesture conflicts with parent ScrollViews.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CalendarSection ready to be integrated into the rewritten home screen (index.tsx)
- The existing index.tsx still uses the old inline Calendar and blue legend color -- these will be replaced when the home screen is rewritten to compose the new section components
- The old #3b82f6 blue reference in index.tsx line 439 legend is expected to be cleaned up when CalendarSection is integrated

## Self-Check: PASSED

- [x] components/home/CalendarSection.tsx exists
- [x] lib/calendar-utils.ts exists
- [x] 07-02-SUMMARY.md exists
- [x] Commit 9f5b107 exists

---
*Phase: 07-home-screen*
*Completed: 2026-03-12*
