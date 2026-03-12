---
status: diagnosed
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
  root_cause: "weekChores useMemo in index.tsx filters by single next_due_at timestamp instead of using projectChoreDates() frequency-based projection. Completed chores have next_due_at pushed forward outside current week, so weekChores is empty. CalendarSection works because it uses projectChoreDates() correctly."
  artifacts:
    - path: "app/(app)/(tabs)/index.tsx"
      issue: "weekChores useMemo (lines 240-263) uses single-point isWithinInterval instead of projectChoreDates()"
    - path: "components/home/WeeklyTimeline.tsx"
      issue: "Redundant second week-filter (lines 42-48) should be removed once upstream fixed"
  missing:
    - "Use projectChoreDates() from lib/calendar-utils.ts to project recurring chore dates within the week"
    - "Remove redundant week-filtering inside WeeklyTimeline.tsx"
  debug_session: ".planning/debug/weekly-timeline-empty.md"

- truth: "Balance Summary Card hides Settle Up/Request buttons when all settled up"
  status: failed
  reason: "User reported: buttons show when all settled up, tapping Settle Up causes forever loading screen because nothing to settle"
  severity: minor
  test: 3
  root_cause: "BalanceSummaryCard.tsx renders buttons unconditionally — only reduces opacity to 0.7 when isSettled. No conditional hide, no disabled prop. handleSettleUp in index.tsx navigates without balance guard."
  artifacts:
    - path: "components/home/BalanceSummaryCard.tsx"
      issue: "Lines 72-89: buttons always rendered, only opacity reduced when settled"
    - path: "app/(app)/(tabs)/index.tsx"
      issue: "Lines 271-273: handleSettleUp navigates unconditionally"
  missing:
    - "Wrap buttons in {!isSettled && (...)} conditional to hide when zero balance"
  debug_session: ".planning/debug/balance-buttons-when-settled.md"

- truth: "Pull-to-refresh preserves selected calendar date context"
  status: failed
  reason: "User reported: selecting a different week then refreshing resets back to current week instead of preserving selection"
  severity: minor
  test: 8
  root_cause: "fetchAllData always scopes expenses to current month (new Date()) and weekChores always computes for current week (new Date()), both ignoring selectedDate. After refresh, data snaps back to current-week scope even though CalendarSection still shows correct selected date."
  artifacts:
    - path: "app/(app)/(tabs)/index.tsx"
      issue: "fetchAllData uses startOfMonth(new Date()) for expense scope (lines 73-74); weekChores uses new Date() for week boundaries (lines 240-243)"
  missing:
    - "Make fetchAllData accept selectedDate and scope expense query to that month"
    - "Derive weekChores from selectedDate instead of new Date()"
  debug_session: ".planning/debug/pull-refresh-resets-date.md"
