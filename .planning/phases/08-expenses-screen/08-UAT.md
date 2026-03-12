---
status: diagnosed
phase: 08-expenses-screen
source: [08-01-SUMMARY.md, 08-02 checkpoint]
started: 2026-03-12T22:00:00Z
updated: 2026-03-12T22:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Balance Section Layout
expected: Navigate to the Expenses tab. The balance section shows member rows with gradient circle avatars, member names, owe amounts, and an action button (Remind or Settle) on the right side of each row. Members with zero balance should NOT appear.
result: pass

### 2. Remind Button
expected: Tap "Remind" on a member who owes you. The system share sheet should open with a pre-filled message about the amount owed.
result: pass

### 3. Settle Button
expected: Tap "Settle" on a member you owe. Should navigate to the settle/request screen with that member and amount pre-filled.
result: pass

### 4. Expense Row Styling
expected: Expense rows in the history section display with an amber/warning-colored icon container and bold amount text.
result: pass

### 5. Settlement Row Styling
expected: Settlement rows in the history section display with a green/success-colored icon container and dimmed/muted text styling, visually distinct from expense rows.
result: pass

### 6. Date Group Headers
expected: History entries are grouped under uppercase overline-styled date headers: "TODAY", "YESTERDAY", and "EARLIER". Each group is visually separated.
result: pass

### 7. Inline Expense Expansion
expected: Tap an expense row — it expands inline to show a read-only split breakdown (per-member amounts). Tap again — it collapses back.
result: pass
noted: "Not clear to the user that rows are expandable. Should add a small arrow/chevron indicator."

### 8. Pull-to-Refresh
expected: Pull down on the expenses screen — data reloads (balance section and history refresh).
result: pass

### 9. Per-Member Breakdown Navigation
expected: Tap a member row in the balance section (not the action button) — navigates to a per-member breakdown screen showing all expenses and settlements between you and that member, with the same date grouping and visual styling.
result: pass
noted: "Per-member navigation should move out of balance section. Better as a dedicated 'Expenses by roommate' section listing ALL roommates — balance section hides zero-balance members, making them unreachable."

### 10. Per-Member Screen Back Navigation
expected: From the per-member breakdown screen, navigate back — the expenses tab should be intact with all data still displayed.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Expandable expense rows should have a visual affordance indicating they can be tapped to expand"
  status: failed
  reason: "User reported: not clear to the user that they can expand rows. Should add a small arrow/chevron indicator."
  severity: cosmetic
  test: 7
  root_cause: "ExpenseRow.tsx has no chevron icon — nothing signals the row is expandable"
  artifacts:
    - path: "components/expenses/ExpenseRow.tsx"
      issue: "No expand/collapse affordance icon"
  missing:
    - "Add a small chevron-down icon that rotates to chevron-up when expanded"

- truth: "All roommates should be accessible for per-member expense breakdown, not just those with non-zero balances"
  status: failed
  reason: "User reported: per-member navigation should be a dedicated section listing ALL roommates, since balance section hides zero-balance members making them unreachable."
  severity: minor
  test: 9
  root_cause: "Per-member navigation is only available through BalanceMemberRow tap, which filters out zero-balance members"
  artifacts:
    - path: "components/expenses/BalanceSection.tsx"
      issue: "Zero-balance members filtered out, no alternate navigation path"
    - path: "app/(app)/(tabs)/expenses.tsx"
      issue: "No dedicated roommate list section"
  missing:
    - "Add a 'View expenses by roommate' section listing all household members regardless of balance"
