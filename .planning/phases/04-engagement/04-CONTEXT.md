# Phase 4: Engagement - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Push notifications for household activity (expenses, chores) and a shared household calendar showing upcoming obligations. Users stay informed without opening the app and can see what's coming up at a glance. Creating new event types or in-app messaging are separate concerns.

</domain>

<decisions>
## Implementation Decisions

### Notification triggers & content
- Expense notifications show amount + who added (e.g. "Sarah added $42.50 for Groceries")
- Chore reminders fire on the morning of the due date (day-of only)
- No notifications for grocery list updates
- Group notifications when multiple events happen in quick succession (e.g. "Sarah added 3 expenses ($127.00 total)")

### Notification preferences
- Per-type toggles in settings (expenses on/off, chores on/off)
- Per-user preferences only — no household-level defaults
- Notification settings live inside the existing Settings screen (new "Notifications" section)
- No in-app quiet hours — rely on OS-level Do Not Disturb

### Calendar layout & navigation
- Month grid view with dots/indicators on days that have events
- Tap a day to see expandable event list below the grid (calendar stays visible)
- Month grid only — no week or agenda view alternatives
- Swipe left/right to navigate between months

### Calendar item display
- Color-coded dots on month grid + icons per item type (e.g. green for chores, blue for expenses)
- Day detail list shows title + key detail per item (e.g. "Rent — $1,200", "Vacuum — Sarah")
- Tapping a calendar item deep-links to its source screen (expense detail, chore detail)
- Calendar lives inside the Home tab, not as a separate bottom tab

### Claude's Discretion
- Exact color palette for item types
- Month grid dot layout when many events on one day
- "Today" indicator styling
- Empty state for months with no events
- How far back/forward users can navigate

</decisions>

<specifics>
## Specific Ideas

- Calendar interaction inspired by Apple Calendar's month view — grid at top, day details expanding below
- Notifications should feel informative but not noisy — grouping is key

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-engagement*
*Context gathered: 2026-03-11*
