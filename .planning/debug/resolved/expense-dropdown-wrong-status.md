---
status: resolved
trigger: "Expense row dropdown shows incorrect payment status - says members owe when all profiles are actually settled with no outstanding dues."
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — root cause was the binary isPayer check showing misleading "Owes" status
test: Applied fix, verified TypeScript compilation
expecting: N/A — fix applied and verified
next_action: Archive session

## Symptoms

expected: When all members have settled up and there are no outstanding dues, the expense dropdown should reflect that — showing "Paid" for everyone, not "Owes $X".
actual: The dropdown still shows members as owing money even though all balances are settled.
errors: No crash errors — data display is incorrect.
reproduction: Go to Expenses tab -> tap an expense row chevron to expand -> the expanded section shows "Owes $X" for members even though balances are all settled.
started: Started after the previous debug session redesigned the dropdown to show payment status based on `paid_by` field.

## Eliminated

## Evidence

- timestamp: 2026-03-12
  checked: ExpenseRow.tsx lines 87-116
  found: |
    Line 87: `const isPayer = split.user_id === expense.paid_by;`
    Lines 101-116: If isPayer -> green checkmark + "Paid"; else -> red "Owes $X"
    No settlement data is queried or considered. The dropdown only knows who paid_by.
  implication: Confirmed. The logic is a simple binary check against paid_by. Everyone who didn't front the money shows "Owes" regardless of settlement status.

- timestamp: 2026-03-12
  checked: Database schema (00002_expenses.sql) and TypeScript types
  found: |
    Settlements table tracks aggregate member-to-member payments, NOT per-expense payments.
    There is no column linking a settlement to a specific expense_id.
    The get_household_balances() function computes net balances across ALL expenses and settlements.
  implication: It is impossible to determine per-expense settlement status. The "Paid"/"Owes" framing is fundamentally unsupported by the data model.

- timestamp: 2026-03-12
  checked: How the split data is fetched (expenses.tsx handleExpensePress, lines 352-410)
  found: |
    Only fetches expense_splits + profiles. No settlement data is fetched for the dropdown.
    Even if we wanted to show settlement status, the data model doesn't support per-expense settlement tracking.
  implication: The fix must change the UI framing, not add settlement queries.

## Resolution

root_cause: "ExpenseRow.tsx uses `split.user_id === expense.paid_by` as the sole check to display 'Paid' vs 'Owes $X'. This incorrectly implies payment status when the app only tracks who fronted the expense. Settlements are aggregate (member-to-member), not per-expense, so there is no way to determine if a specific split has been 'settled'. The dropdown misleads users by showing red 'Owes' text for members who have already settled their overall balance."
fix: "Redesigned the dropdown to show a neutral 'Split breakdown' with each member's share amount in neutral text (text-neutral-text). Removed the red 'Owes $X' framing entirely. The payer still gets a green 'Paid' badge (factually correct — they fronted the expense). Added a 'Split breakdown' header label for clarity."
verification: "TypeScript compilation passes (no new errors). UI logic verified: all splits show share amount; payer additionally gets 'Paid' badge; no member shows misleading 'Owes' text."
files_changed: [components/expenses/ExpenseRow.tsx]
