# Phase 8: Expenses Screen - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual redesign of the expenses tab. Balance section with per-member rows showing owe amounts and action buttons. Expense/settlement history with visual differentiation and date-grouped headers. This is a presentation-layer phase — no new backend or Supabase changes.

</domain>

<decisions>
## Implementation Decisions

### Balance section layout
- Single-row per member: avatar on left, name, owe/owed amount on right, action button at far right
- Settle button goes directly to settle page with userId, amount, and direction params (same pattern as home screen)
- Remind button opens system share sheet with pre-filled message (not push notification)
- Members with zero balance are hidden from the balance section entirely
- Tapping a member row (not the button) navigates to a separate screen showing all expenses between you and that member

### Expense vs settlement rows
- Expense rows: amber icon container, expense description, bold total amount, "Paid by [name]" + date as secondary text
- Settlement rows: green checkmark icon, same layout but text is muted/dimmed to de-emphasize
- Tapping an expense row expands inline to show split breakdown (who owes what)
- Expanded view is read-only — shows split breakdown only, no edit/delete actions

### History grouping & ordering
- Three date groups: TODAY, YESTERDAY, EARLIER — overline-styled headers
- Newest first within each group
- All expenses accessible but loaded in paginated batches for performance (Claude decides batch size and infinite-scroll implementation)
- Empty state: friendly illustration + "No expenses yet" prompt with button to add first expense

### Screen structure & navigation
- Balance section at top, expense history below — entire screen scrolls as one unit (no sticky header)
- Add Expense uses existing layout FAB from Phase 6 — no new button needed
- Pull-to-refresh to reload balances and history (same pattern as home screen)
- Per-member expense breakdown navigates to a separate full screen with same date grouping and visual styling

### Claude's Discretion
- Pagination batch size and infinite scroll implementation
- Exact icon choices within amber/green icon containers
- Loading skeleton design while data fetches
- Empty state illustration style
- Spacing, typography, and shadow details within design system constraints

</decisions>

<specifics>
## Specific Ideas

- Balance row layout mirrors the home screen's balance card flow — settle/request go directly to settle page with params, consistent UX
- Remind via share sheet lets user choose their preferred messaging app rather than forcing push notifications
- Expand-to-show-split pattern keeps the screen clean while giving access to details without navigation

</specifics>

<deferred>
## Deferred Ideas

- Search expenses by name/description — future phase (user requested during discussion)
- Expense filtering (by member, date range, amount) — future phase (related to search)
- Edit/delete expense from expanded row — could be added later if needed

</deferred>

---

*Phase: 08-expenses-screen*
*Context gathered: 2026-03-12*
