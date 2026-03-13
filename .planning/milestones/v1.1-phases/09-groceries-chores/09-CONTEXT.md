# Phase 9: Groceries + Chores - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Restyle the grocery and chore screens using the design system components established in Phase 6. Consistent visual states for item status, member attribution, and task urgency. This is presentation-layer only — no new backend functionality.

</domain>

<decisions>
## Implementation Decisions

### Grocery list layout
- Compact one-line rows: circle checkbox, item name, who-added avatar on the right
- Checked items move immediately to the DONE section (not strikethrough-in-place)
- DONE section collapsed by default — shows "DONE (5)" header, tap to expand
- TO GET sorted with most recently added items first

### Quick-add input
- Positioned at top of list, above the TO GET section (always visible without scrolling)
- Card-styled input field with branded square add button
- Add button disabled/muted when input is empty, turns branded when text is entered
- Enter/Return on keyboard submits the item (fast multi-item entry)
- After adding: input clears, new item appears at top of TO GET list, no toast/flash

### Chore stats row
- Horizontal row of 3 equal-width cards: Pending (warning), Disputed (danger), Streak (brand)
- Scrolls with content (not sticky) — more room for the chore list
- Streak card shows current streak count + personal best (e.g., "5 🔥 / Best: 12")
- Disputed card shows a count badge in danger color (e.g., red "2")

### Chore list sections
- YOUR CHORES and HOUSEHOLD sections with overline headers
- Each chore row: emoji icon in rounded container, chore name, assignee avatar, due date/overdue indicator
- Overdue chores get subtle red/danger background tint and red due date text
- Disputed chores use danger-tinted background with red borders (per requirements)
- Completing a chore shows a brief checkmark animation; if it extends the streak, stats card updates
- Completed chores hidden from sections (disappear until next recurrence)

### Claude's Discretion
- Exact animation timing for check-off and completion feedback
- Spacing and typography within cards and rows
- Empty state design for both screens
- Loading skeleton patterns
- How the streak personal best is calculated and displayed when there's no streak yet

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches consistent with the design system from Phase 6.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-groceries-chores*
*Context gathered: 2026-03-13*
