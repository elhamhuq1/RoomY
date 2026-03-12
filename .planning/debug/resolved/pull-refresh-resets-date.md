---
status: resolved
trigger: "Pull-to-refresh on the home screen resets the selected calendar date back to the current week"
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - selectedDate state is NOT reset by onRefresh, but fetchAllData always re-fetches data scoped to current month/week (not selectedDate), AND weekChores always computes for current week. The real issue is a data-scope mismatch, not a state reset.
test: exhaustive static code trace of all code paths touching selectedDate
expecting: no direct reset found; data-scope mismatch confirmed
next_action: return diagnosis

## Symptoms

expected: Pull-to-refresh reloads data but preserves the user's selected calendar date
actual: Pull-to-refresh resets the selected date back to the current week/today
errors: none
reproduction: select a different week/date in the calendar, then pull-to-refresh
started: likely since initial implementation

## Eliminated

- hypothesis: onRefresh directly calls setSelectedDate to reset it
  evidence: onRefresh (lines 151-155) only calls fetchAllData and toggles refreshing state. setSelectedDate is never called.
  timestamp: 2026-03-12

- hypothesis: fetchAllData resets selectedDate
  evidence: fetchAllData (lines 70-142) only updates members, balances, expenses, chores, disputes, loading. setSelectedDate is never called.
  timestamp: 2026-03-12

- hypothesis: useFocusEffect re-fires during refresh and causes reset
  evidence: useFocusEffect depends on [fetchAllData], which depends on [household?.id]. Neither changes during refresh. Pull-to-refresh does not trigger navigation focus events.
  timestamp: 2026-03-12

- hypothesis: Component remounts during refresh (losing useState)
  evidence: No dynamic keys in component hierarchy. No conditional rendering that would unmount/remount DashboardScreen during refresh. loading is not set to true during refresh. isSoloCreator only flips if members becomes empty, which cannot happen transiently due to React 18 batching.
  timestamp: 2026-03-12

- hypothesis: CalendarSection has a useEffect that resets date on prop change
  evidence: CalendarSection has zero useEffect hooks. onDateChange is only called on user interaction (day press).
  timestamp: 2026-03-12

- hypothesis: Auth context change during refresh causes (app) stack remount
  evidence: onAuthStateChange sets new session but isAuthenticated stays true (truthy->truthy). household is not set to null during normal fetchProfileAndHousehold (only on catch). Would only be an issue on network errors, not consistent behavior.
  timestamp: 2026-03-12

## Evidence

- timestamp: 2026-03-12
  checked: selectedDate state declaration in index.tsx
  found: useState initialized to format(new Date(), 'yyyy-MM-dd') on line 62-64. Only mutated via setSelectedDate, which is only passed to CalendarSection as onDateChange.
  implication: selectedDate is only changed by user interaction in CalendarSection, never by refresh logic.

- timestamp: 2026-03-12
  checked: onRefresh implementation (lines 151-155)
  found: setRefreshing(true) -> await fetchAllData() -> setRefreshing(false). No other state changes.
  implication: Refresh does not touch selectedDate.

- timestamp: 2026-03-12
  checked: fetchAllData data scoping (lines 73-74)
  found: monthStart = startOfMonth(new Date()), monthEnd = endOfMonth(new Date()). Always fetches CURRENT month expenses regardless of selectedDate.
  implication: If user selects a date in a different month, expense data won't cover that month after refresh.

- timestamp: 2026-03-12
  checked: weekChores computation (lines 240-263)
  found: Uses new Date() for week boundaries, NOT selectedDate. Recomputes when chores changes (after refresh).
  implication: WeeklyTimeline always shows current week chores even when user has selected a different week.

- timestamp: 2026-03-12
  checked: CalendarSection internal state
  found: Has local states expanded (boolean) and currentMonth (Date initialized to new Date()). No useEffect hooks. weekDays computed from selectedDate prop. markedDates computed from expenses, chores, currentMonth, selectedDate.
  implication: CalendarSection correctly displays the selected date's week as long as selectedDate prop is preserved.

- timestamp: 2026-03-12
  checked: Component hierarchy for remount triggers
  found: No dynamic keys in _layout.tsx, (app)/_layout.tsx, or (tabs)/_layout.tsx. Stack.Protected guards use !!session and !!household, neither of which change during normal refresh.
  implication: DashboardScreen does not unmount/remount during pull-to-refresh.

## Resolution

root_cause: |
  The selectedDate state itself is NOT being reset by pull-to-refresh. The onRefresh callback only calls fetchAllData, which updates data states but never touches selectedDate.

  However, there are TWO data-scope issues that create the APPEARANCE of a date reset:

  1. **fetchAllData always fetches expenses for the CURRENT month** (lines 73-74 in index.tsx). It computes monthStart/monthEnd from `new Date()`, ignoring selectedDate entirely. If the user selects a date in a different month, the expense dots disappear from the calendar after refresh because the fetched data doesn't cover that month.

  2. **weekChores always computes for the CURRENT week** (lines 240-243 in index.tsx). It uses `new Date()` for week boundaries, not selectedDate. After refresh, when chores state updates, weekChores recalculates and the WeeklyTimeline section shows current-week chores regardless of the selected date.

  Combined, these issues mean: after pull-to-refresh, the CalendarSection still shows the correct selected date visually, BUT all the data context around it (expense dots, WeeklyTimeline chores) snaps to the current week/month. This creates a strong visual impression that the date has "reset" even though the selectedDate state is preserved.

  The fix should make fetchAllData and weekChores respect selectedDate:
  - Pass selectedDate into fetchAllData to scope the expense query to the selected month
  - Derive weekChores from selectedDate instead of new Date()

fix:
verification:
files_changed: []
