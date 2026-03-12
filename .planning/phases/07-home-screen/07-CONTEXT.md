# Phase 7: Home Screen - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

The daily landing screen gives users an at-a-glance view of their household, finances, schedule, and pending tasks. Six sections: greeting header, members card, balance summary, week-strip calendar, attention feed, and weekly timeline. No new data features — this screen reads and displays existing household data.

</domain>

<decisions>
## Implementation Decisions

### Screen layout & scroll
- Dashboard priority order: Greeting → Members card → Balance summary → Calendar → Attention feed → Weekly timeline
- Spacious density — generous padding (16-20px gaps) between cards; only greeting + members card + top of balance visible above the fold
- Single continuous scroll for the whole screen
- Greeting header scrolls with content (not sticky) — tab bar already anchors navigation
- Members card always visible — shows household name, avatar row, and invite link regardless of household size

### Calendar interaction
- Week strip shows 7 days with today highlighted
- Inline slide-down expansion to full month view — tap to expand, tap again or swipe up to collapse; pushes content down
- Multi-colored event dots: green for chores due, red/coral for expenses/settlements due
- Single dot per type per day (max 2 dots per day)
- Tapping a day filters the "This Week" timeline section below to show only that day's items

### Attention feed
- Item types: unsettled balances, overdue chores, pending disputes, chores due today
- Priority order (top to bottom): unsettled balances first (core feature), then overdue chores, pending disputes, chores due today
- Tapping a card navigates to the relevant screen (expenses tab, chores tab, expense detail)
- No inline quick actions — cards are navigation targets only
- Empty state: celebratory "All caught up!" message with illustration/icon; section stays visible

### Balance card
- Dark gradient background with net position framing: "You owe $X" (red text) or "You're owed $X" (green text)
- Both "Settle up" and "Request" buttons always visible regardless of owe direction
- Tapping card body navigates to expenses tab for full breakdown
- Buttons navigate to their respective action flows (settle-up flow, request/reminder flow)
- Zero balance state: "All settled up" with checkmark; buttons still visible but muted

### Claude's Discretion
- Loading skeleton design for each section
- Exact spacing and typography within cards
- Error state handling for failed data fetches
- Greeting text variations (morning/afternoon/evening wording)
- Animation timing for calendar expand/collapse
- Timeline visual style and completion indicators
- Invite link interaction (copy, share sheet, etc.)

</decisions>

<specifics>
## Specific Ideas

- Balance card is the hero element — unsettled balances are the core feature and should be prioritized in the attention feed too
- Calendar dots should be distinct enough at small size — green (chores) and red/coral (expenses) provide good contrast
- "All caught up!" empty state should feel rewarding, not just informational

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-home-screen*
*Context gathered: 2026-03-12*
