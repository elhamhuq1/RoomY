---
id: S07
parent: M001
milestone: M001
provides:
  - "GreetingHeader component with time-of-day greeting"
  - "MembersCard component with household member avatars"
  - "BalanceSummaryCard with dark gradient showing net balance"
  - "CalendarSection component with month grid and dot markers"
  - "AttentionFeed component with pending items requiring action"
  - "WeeklyTimeline component showing upcoming chore schedule"
  - "Composed home screen dashboard with all 6 sections"
requires: []
affects: []
key_files:
  - components/home/GreetingHeader.tsx
  - components/home/MembersCard.tsx
  - components/home/BalanceSummaryCard.tsx
  - components/home/CalendarSection.tsx
  - components/home/AttentionFeed.tsx
  - components/home/WeeklyTimeline.tsx
  - app/(app)/(tabs)/index.tsx
key_decisions:
  - "BalanceSummaryCard uses dark gradient for visual prominence over outline cards"
  - "AttentionFeed shows actionable items: unsettled balances, overdue chores, pending swap requests"
  - "WeeklyTimeline projects recurring chore dates for the current week"
  - "Centralized data fetching in parent screen, passed to presentational children"
patterns_established:
  - "Section component pattern: self-contained home screen sections in components/home/"
  - "Composition pattern: parent screen fetches all data, composes section components"
  - "Gradient card pattern: dark bg with white text for hero metrics"
observability_surfaces: []
drill_down_paths: []
duration: ~15min
verification_result: passed
completed_at: 2026-03-13
blocker_discovered: false
---
# S07: Home Screen

**Home screen dashboard composing 6 sections: greeting header, member avatars, gradient balance card, calendar, attention feed, and weekly chore timeline**

## What Happened

Built 6 presentational section components and composed them into the home screen. GreetingHeader shows time-of-day salutation. MembersCard displays household member avatars. BalanceSummaryCard uses a dark gradient to show net balance prominently. CalendarSection wraps the react-native-calendars grid with dot markers. AttentionFeed surfaces pending items (unsettled balances, overdue chores, swap requests). WeeklyTimeline projects recurring chore assignments across the current week.

Multiple UAT gaps were discovered and fixed: balance computation errors, WeeklyTimeline not projecting recurring dates, settle-up button infinite loading, and conditional button display for settled states.

Key commits: `d8892a6` (GreetingHeader/MembersCard), `0660921` (BalanceSummaryCard), `9f5b107` (CalendarSection), `bc94c81` (AttentionFeed/WeeklyTimeline), `8dd93d8` (composed dashboard), `d6d0659`/`10fd25a`/`ee73851`/`d4a5406` (UAT fixes).
