---
status: complete
phase: 07-home-screen
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md]
started: 2026-03-12T18:00:00Z
updated: 2026-03-12T18:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Time-Aware Greeting
expected: Top of home screen shows a greeting like "Good morning/afternoon/evening," followed by your first name, with today's date formatted as weekday + date below it.
result: pass

### 2. Members Card & Invite Code
expected: Below the greeting, a card shows the household name as an overline, a horizontal row of member avatars with first names, and an invite code. Copy and Share buttons are visible. Tapping Copy copies the code (brief "Copied!" feedback). Tapping Share opens the system share sheet.
result: pass

### 3. Balance Summary Card
expected: A dark gradient card (dark slate) shows your net balance amount. Green if others owe you, red if you owe others, or a checkmark with "All settled up" if zero. "Settle Up" and "Request" buttons are visible at the bottom of the card.
result: pass
note: UX improvement — hide Settle Up/Request buttons when "All settled up" since tapping them causes a forever loading screen with nothing to settle.

### 4. Week Strip Calendar
expected: A 7-day week strip shows the current week. Today's date is highlighted. Tapping another day selects it. Tapping the expand control opens a full month calendar view. Tapping a day in the month view collapses back to the week strip.
result: pass

### 5. Calendar Event Dots
expected: Days with expenses show a red/coral dot indicator. Days with chores show a green dot. A small color legend appears below the calendar explaining the dot colors.
result: pass

### 6. Attention Feed
expected: Below the calendar, attention cards appear in priority order: unsettled balances, overdue chores, disputes, chores due today. Each card has an icon, description, and tapping it navigates to the relevant screen. If nothing needs attention, shows a celebratory "All caught up!" empty state.
result: pass

### 7. Weekly Timeline
expected: A vertical timeline shows upcoming chores/events grouped by day. Each entry shows the task name, assignee avatar, and a completion indicator. Days are labeled as headers. A connecting line runs vertically between entries.
result: issue
reported: "did not pass, I don't see any of what you described even though I have chores and expenses for the current week"
severity: major

### 8. Pull-to-Refresh
expected: Pulling down on the home screen triggers a refresh. Data reloads and the screen updates with fresh information.
result: pass
note: UX improvement — pull-to-refresh should preserve selected date instead of resetting to current week.

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Weekly Timeline shows upcoming chores/events grouped by day with task name, assignee avatar, completion indicator, and connecting line"
  status: failed
  reason: "User reported: did not pass, I don't see any of what you described even though I have chores and expenses for the current week"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Balance Summary Card hides Settle Up/Request buttons when all settled up"
  status: failed
  reason: "User reported: buttons show when all settled up, tapping Settle Up causes forever loading screen because nothing to settle"
  severity: minor
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Pull-to-refresh preserves selected calendar date"
  status: failed
  reason: "User reported: selecting a different week then refreshing resets back to current week instead of preserving selection"
  severity: minor
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
