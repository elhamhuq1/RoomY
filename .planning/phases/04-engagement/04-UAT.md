---
status: complete
phase: 04-engagement
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-03-12T02:00:00Z
updated: 2026-03-12T02:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Calendar visible on Home tab
expected: Open app, navigate to Home tab. A month grid calendar should appear between the member avatars row and the module cards section. The calendar shows the current month with navigation arrows.
result: pass

### 2. Expense dots on calendar
expected: Days that have expenses should show a blue dot beneath the date number. If you've added any expenses, check those dates for blue indicators.
result: pass

### 3. Chore dots on calendar
expected: Days that have chores due should show a green dot beneath the date number. Chore dots are projected forward based on the chore's frequency (daily, weekly, monthly). If a chore has a next_due_at set, green dots should appear on projected dates.
result: pass

### 4. Day tap shows event list
expected: Tap a day that has dots (events). An event list should appear below the calendar showing each event with an icon, title, and detail. Expenses show a wallet icon with the dollar amount. Chores show a checkbox icon with assignee info.
result: issue
reported: "pass, but for a certain day the event list should show 5 in the users view and then if there are more than 5 users should be able to scroll on the event list because if there's like 10 it takes up a lot of space on the home page"
severity: minor

### 5. Event tap navigates to source screen
expected: Tap an expense event in the day detail list — it should navigate to the expense detail screen. Tap a chore event — it should navigate to the chores tab.
result: pass

### 6. Empty day message
expected: Tap a day with no dots (no events). The area below the calendar should show "No events on this day" in gray text.
result: pass

### 7. Month swipe navigation
expected: Swipe left on the calendar to go to the next month. Swipe right to go to the previous month. The calendar header updates to show the new month/year. Arrow buttons also navigate months.
result: pass

### 8. Today highlighted
expected: Today's date should be visually highlighted (yellow/amber text color) on the calendar grid, distinguishable from other dates.
result: pass

### 9. Color legend
expected: Below the day event list area, a small legend row shows: a blue dot labeled "Expenses" and a green dot labeled "Chores".
result: pass

### 10. Notifications row in Settings
expected: Navigate to Settings. A "Notifications" row should appear (between Members and Sign Out) with a bell icon and subtitle "Manage push notification preferences". Tap it to navigate to the notification preferences screen.
result: pass

### 11. Notification toggles
expected: On the Notifications screen, two toggle rows appear: "Expenses" (with wallet icon, blue background) and "Chores" (with checkbox icon, green background). Both default to ON. Each has a descriptive subtitle.
result: pass

### 12. Toggle persistence
expected: Toggle one notification off (e.g., Expenses), leave the screen, then come back to Notifications in Settings. The toggle you turned off should still be off (persisted to database).
result: issue
reported: "did not pass, got this error message: ERROR Push token registration failed: [Error: No \"projectId\" found. If \"projectId\" can't be inferred from the manifest (for instance, in bare workflow), you have to pass it in yourself.]"
severity: blocker

### 13. Notification info text
expected: Below the toggle cards on the Notifications screen, informational text appears explaining that notifications are per-device and mentioning system Do Not Disturb settings.
result: pass

## Summary

total: 13
passed: 11
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Event list below calendar should be scrollable with max 5 visible items to avoid taking up too much space on Home tab"
  status: failed
  reason: "User reported: pass, but for a certain day the event list should show 5 in the users view and then if there are more than 5 users should be able to scroll on the event list because if there's like 10 it takes up a lot of space on the home page"
  severity: minor
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Push token registration should not crash in Expo Go — must handle missing projectId gracefully"
  status: failed
  reason: "User reported: ERROR Push token registration failed: [Error: No \"projectId\" found. If \"projectId\" can't be inferred from the manifest (for instance, in bare workflow), you have to pass it in yourself.]"
  severity: blocker
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
