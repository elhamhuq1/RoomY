---
status: diagnosed
trigger: "WeeklyTimeline component on home screen not rendering any content even though user has chores and expenses for current week"
created: 2026-03-12T19:00:00Z
updated: 2026-03-12T19:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - weekChores uses only chore.next_due_at (a single timestamp) to filter for current week, but CalendarSection uses projectChoreDates() which walks forward/backward from next_due_at based on frequency to generate all occurrence dates. When next_due_at is outside the current week, weekChores returns empty while CalendarSection still shows dots.
test: Compared CalendarSection data pipeline (projectChoreDates) vs weekChores data pipeline (single next_due_at filter)
expecting: CalendarSection projects recurring dates, weekChores does not
next_action: Return root cause diagnosis

## Symptoms

expected: Vertical timeline showing upcoming chores/events grouped by day with task name, assignee avatar, completion indicator, connecting line
actual: Nothing renders - component appears blank/empty
errors: None reported (no crash, just empty)
reproduction: Load home screen with chores and expenses for current week
started: First time testing this feature (phase 07)

## Eliminated

## Evidence

- timestamp: 2026-03-12T19:00:00Z
  checked: CalendarSection component
  found: CalendarSection receives raw `chores` array (Chore[]) and does its own date filtering internally via buildMarkedDates. It works correctly, confirming chores data IS being fetched and IS available.
  implication: The data fetch is not the problem. The issue is specific to WeeklyTimeline's data pipeline.

- timestamp: 2026-03-12T19:01:00Z
  checked: index.tsx weekChores useMemo (lines 240-263) and WeeklyTimeline component (lines 36-71)
  found: DOUBLE FILTERING. index.tsx weekChores memo (line 246-249) filters chores to current week using isWithinInterval. Then WeeklyTimeline component ALSO filters by current week (line 42-48) using the same isWithinInterval logic. The double filter itself shouldn't eliminate items, BUT there's a critical difference in the selectedDate behavior.
  implication: Double filtering is redundant but not the root cause by itself.

- timestamp: 2026-03-12T19:02:00Z
  checked: selectedDate prop passed to WeeklyTimeline
  found: index.tsx line 361 passes `selectedDate={isDateFiltered ? selectedDate : null}`. The default selectedDate is initialized to `format(new Date(), 'yyyy-MM-dd')` (line 62-64). isDateFiltered (line 267) checks `selectedDate !== todayString`. Since selectedDate starts as today's date string and todayString is also today's date string, isDateFiltered starts as FALSE, so null is passed. This is correct for default behavior.
  implication: selectedDate prop is null by default, which is correct - WeeklyTimeline should show all week's chores.

- timestamp: 2026-03-12T19:03:00Z
  checked: Chore type's next_due_at field and how chores are queried
  found: Chores query (line 120-125) fetches ALL active chores with `eq('is_active', true)`. No date filter on the query. The Chore type has `next_due_at: string` which is a timestamp. The weekChores memo (line 247) parses it with parseISO and checks isWithinInterval. The chores only have ONE date field relevant here: `next_due_at`. If a chore is recurring (e.g., weekly), `next_due_at` represents the NEXT occurrence. If the chore's next_due_at is already past (overdue), it would NOT fall within the current week's start-end range unless it happens to be this week.
  implication: This is a potential issue but depends on actual data. CalendarSection also uses next_due_at to place dots, and those dots ARE showing, so the dates must be within range.

- timestamp: 2026-03-12T19:04:00Z
  checked: WeeklyTimeline's hasItems check and rendering logic
  found: Line 73 `const hasItems = dayGroups.some((g) => g.items.length > 0)`. If dayGroups is empty array (no groups), .some() returns false, so hasItems = false. The component then renders "No chores scheduled" text (line 82-84). BUT the user says they see NO content at all, not even the "No chores scheduled" fallback or the "This Week" header. This suggests the component might not be rendering at all, OR the text is there but the user interpreted "No chores scheduled" as "not rendering."
  implication: Need to distinguish between: (a) component renders but shows empty state, (b) component doesn't render at all. Looking at the component, it ALWAYS renders the "This Week" header (line 77-79) regardless of hasItems. So if the user truly sees nothing, the component itself may not be mounting.

- timestamp: 2026-03-12T19:05:00Z
  checked: isSoloCreator check in index.tsx (line 293-315)
  found: Line 293 `const isSoloCreator = members.length <= 1`. If the household has only 1 member (or 0, during loading), the dashboard returns a simplified view with ONLY GreetingHeader and MembersCard - NO WeeklyTimeline. However, the user says other sections like CalendarSection ARE working, meaning they must be seeing the full dashboard, not the solo creator view.
  implication: Not the cause if user sees calendar section.

- timestamp: 2026-03-12T19:06:00Z
  checked: WeeklyTimeline's dueDate field mapping vs what it expects
  found: CRITICAL MISMATCH. In index.tsx weekChores memo (line 257), dueDate is set to `c.next_due_at`. The Chore.next_due_at field is a full ISO timestamp like "2026-03-12T14:00:00.000Z". In WeeklyTimeline, line 43 does `parseISO(chore.dueDate)` which handles full timestamps fine. Line 47 does `isWithinInterval(dueDate, { start: weekStart, end: weekEnd })` where weekStart/weekEnd are from startOfWeek/endOfWeek of `new Date()`. This should work correctly with timestamps. BUT - the double filtering should be harmless if both use the same week boundaries.
  implication: Timestamps should parse correctly. Double filtering is redundant but not destructive.

- timestamp: 2026-03-12T19:07:00Z
  checked: Re-examining the actual rendering output more carefully
  found: CRITICAL REALIZATION. The WeeklyTimeline component ALWAYS renders a View with "This Week" text and either the empty state or timeline items. If the user says they "don't see any of what you described" for the WeeklyTimeline section, they might be seeing "No chores scheduled" text instead of the timeline. The component DOES render - it just shows the empty state. This means weekChores is likely an empty array when passed to the component, meaning the filtering in index.tsx weekChores memo is filtering everything out.
  implication: The root cause is likely in how weekChores filters chores, not in the WeeklyTimeline component itself.

- timestamp: 2026-03-12T19:08:00Z
  checked: weekChores filter vs CalendarSection's filter
  found: KEY DIFFERENCE FOUND. CalendarSection receives the raw `chores` array directly (line 346) and uses `buildMarkedDates` to process dates. WeeklyTimeline receives the pre-filtered `weekChores` (line 360). The weekChores filter (line 246-249) uses parseISO on `c.next_due_at` and checks isWithinInterval with startOfWeek/endOfWeek. If `next_due_at` values are stored as date-only strings (like "2026-03-12") rather than full timestamps, parseISO would still work. But if the chores are overdue (next_due_at is before this week), they'd be filtered out by the week interval check. Since CalendarSection shows dots for the WHOLE MONTH and uses a month range, it would catch chores that weekChores' week filter misses.
  implication: Need to check what buildMarkedDates actually does with dates.

- timestamp: 2026-03-12T19:09:00Z
  checked: lib/calendar-utils.ts - projectChoreDates() function
  found: ROOT CAUSE CONFIRMED. CalendarSection uses projectChoreDates() which takes the chore's next_due_at as an anchor and WALKS FORWARD AND BACKWARD based on frequency (daily/weekly/monthly/custom) to generate ALL occurrence dates within a month range. For example, a weekly chore with next_due_at of March 19 would project backward to March 12, March 5, etc. This is why CalendarSection shows dots correctly. In contrast, weekChores in index.tsx (lines 240-263) only checks `c.next_due_at` directly against the current week interval - it does NOT project recurring dates. So if next_due_at has been advanced to next week (after completing the chore), weekChores returns an empty array.
  implication: This is the root cause. The weekChores computation needs to use the same frequency-based date projection logic that CalendarSection uses.

- timestamp: 2026-03-12T19:09:30Z
  checked: complete_chore() SQL function in 00004_chores.sql (line 158-163)
  found: When a chore is completed, next_due_at is advanced to `now() + interval` based on frequency. For a weekly chore completed today (March 12), next_due_at becomes March 19. March 19 is next week's Thursday, which falls OUTSIDE the current week (Sun March 8 - Sat March 14). So after completing a chore, it immediately vanishes from weekChores. Even for uncompleted chores: if the chore was initially created with a next_due_at that doesn't fall in the current week, it won't appear.
  implication: Confirms the mechanism. The single-timestamp approach fundamentally cannot represent recurring chores that have multiple occurrences per week/month.

## Resolution

root_cause: The `weekChores` useMemo in index.tsx filters chores by checking only the single `next_due_at` timestamp against the current week interval. This is fundamentally wrong for recurring chores. CalendarSection works because it uses `projectChoreDates()` from `lib/calendar-utils.ts`, which walks forward and backward from `next_due_at` based on the chore's frequency to generate all occurrence dates. The weekChores computation does not use this projection logic, so any chore whose `next_due_at` falls outside the current week (common after completion advances it, or if it was never set to this week) produces an empty array, causing WeeklyTimeline to show "No chores scheduled."
fix:
verification:
files_changed: []
