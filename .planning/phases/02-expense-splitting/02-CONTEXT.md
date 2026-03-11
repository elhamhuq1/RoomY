# Phase 2: Expense Splitting - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log shared expenses with per-member selection, view net balances between roommates, scroll through expense history, and settle debts via Venmo deep link. Equal split only (custom percentages are v2). Recurring auto-creation is v2. Parent/external payers are out of scope — the roommate is always the payer in-app regardless of funding source.

</domain>

<decisions>
## Implementation Decisions

### Add expense form
- Minimal fields: description, amount, payer, member split — no categories, no date picker
- All household members pre-selected by default; tap to deselect individuals (not every expense involves everyone)
- Payer defaults to current user, tap to change
- Entry point: floating action button (+) on the expenses tab
- Recent descriptions shown as suggestions for quick re-entry of common expenses (e.g., "Rent", "Electric") — this is form UX, not a recurring expense system

### Balance dashboard
- Net amount per person — all expenses between you and a roommate collapsed into one number
- Only your own balances visible (you owe / owed to you). Cannot see other pairs' debts (e.g., Alex ↔ Jordan)
- "You owe" and "Owed to you" sections with settle/request actions per person
- Zero state: friendly "All settled up!" message with checkmark when no outstanding balances
- Layout: balance summary sits at top of expenses tab, expense history scrolls below

### Expense history
- Grouped by date (Today, Yesterday, Mar 8, etc.), newest first
- Each row shows: description, total amount, who paid
- Tap opens full detail screen showing: all split members with individual shares, date, edit and delete buttons
- Any household member can edit or delete any expense (not restricted to creator)
- Settlements appear in the history list, styled differently from regular expenses (checkmark + "Settlement" label)

### Settle up & Venmo flow
- Tapping "Settle Up" opens confirmation screen showing amount owed, with editable amount field for partial settlements
- Two actions: "Record Payment" (marks as settled in-app) and "Request via Venmo" (deep link)
- Venmo deep link pre-fills recipient (from profile Venmo username) and amount
- After returning from Venmo, user manually taps "Mark as settled" in RoomY — no auto-detection
- Either side can record a settlement (debtor or creditor)

### Claude's Discretion
- Loading states and skeleton designs
- Exact card/list styling and spacing
- Error state handling (network failures, etc.)
- Expense detail screen layout
- Animation and transition choices
- How "recent descriptions" suggestions are stored/surfaced

</decisions>

<specifics>
## Specific Ideas

- Per-expense member selection is key — households don't always split everything with everyone (e.g., only 3 of 4 roommates share electric, only 2 went to dinner)
- The balance view should feel like Splitwise's simplicity: one number per person, not a matrix of debts
- Settlements in history create a clear audit trail — roommates can see when payments were made

</specifics>

<deferred>
## Deferred Ideas

- Recurring expenses auto-creation (rent, utilities monthly) — v2 requirement EXPN-07
- Custom split percentages — v2 requirement EXPN-09
- Debt simplification algorithm for 3+ people — v2 requirement EXPN-08

</deferred>

---

*Phase: 02-expense-splitting*
*Context gathered: 2026-03-11*
