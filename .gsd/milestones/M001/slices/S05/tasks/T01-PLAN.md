# T01: 04-engagement 01

**Slice:** S05 — **Milestone:** M001

## Description

Shared household calendar on the Home tab showing expenses and chore schedules as color-coded dots on a month grid, with tappable day detail expansion.

Purpose: Users can see upcoming obligations and past activity at a glance without navigating to individual module tabs. This satisfies CALC-01 (shared calendar) and CALC-02 (recurring events on calendar).
Output: Calendar utility functions and updated Home tab with integrated calendar section.

## Must-Haves

- [x] "User can see a month grid calendar on the Home tab with colored dots indicating expenses and chores"
- [x] "User can tap a day to see an expandable event list below the calendar grid"
- [x] "User can swipe left/right to navigate between months"
- [x] "Tapping a calendar item navigates to its source screen (expense detail or chore detail)"
- [x] "Chore schedules are projected forward on the calendar based on frequency"
- [x] "Expenses appear on the calendar on their created_at date"

## Files

- `lib/calendar-utils.ts`
- `app/(app)/(tabs)/index.tsx`
- `lib/types/database.ts`
