---
phase: quick-10
plan: 01
subsystem: ui
tags: [react-native, scrollview, keyboard, expo]

requires:
  - phase: quick-8
    provides: Even/Custom split toggle on expense screens
  - phase: quick-9
    provides: Member selection checkboxes in custom split mode
provides:
  - Auto-scroll for custom split amount inputs above keyboard
affects: []

tech-stack:
  added: []
  patterns:
    - "automaticallyAdjustKeyboardInsets on ScrollViews with TextInputs"

key-files:
  created: []
  modified:
    - app/(app)/expenses/add.tsx
    - app/(app)/groceries/complete-trip.tsx

key-decisions:
  - "Used automaticallyAdjustKeyboardInsets (RN built-in) instead of third-party keyboard-aware libraries"

patterns-established:
  - "ScrollView keyboard pattern: combine keyboardShouldPersistTaps, keyboardDismissMode, and automaticallyAdjustKeyboardInsets for full keyboard UX"

requirements-completed: [QUICK-10]

duration: 1min
completed: 2026-03-15
---

# Quick Task 10: Fix Keyboard Hiding Custom Split Amounts Summary

**Added automaticallyAdjustKeyboardInsets to ScrollViews on Add Expense and Complete Trip screens so custom split inputs stay visible above keyboard**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T00:15:43Z
- **Completed:** 2026-03-16T00:16:03Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Custom split amount TextInputs on both screens now auto-scroll above the keyboard when focused
- Uses built-in React Native ScrollView prop (no additional dependencies)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add automaticallyAdjustKeyboardInsets to both ScrollViews** - `65f2631` (fix)

## Files Created/Modified
- `app/(app)/expenses/add.tsx` - Added automaticallyAdjustKeyboardInsets={true} to main ScrollView
- `app/(app)/groceries/complete-trip.tsx` - Added automaticallyAdjustKeyboardInsets={true} to main ScrollView

## Decisions Made
- Used automaticallyAdjustKeyboardInsets (available since RN 0.73, Expo SDK 54 uses RN 0.76) instead of third-party keyboard-aware scroll view libraries -- simpler and zero dependencies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

---
*Quick Task: 10-fix-keyboard-hiding-custom-split-amount*
*Completed: 2026-03-15*
