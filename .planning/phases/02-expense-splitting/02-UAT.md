---
status: diagnosed
phase: 02-expense-splitting
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-03-11T08:00:00Z
updated: 2026-03-11T08:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Empty State
expected: Expenses tab shows empty state message (e.g. "No expenses yet") with a (+) FAB button at bottom-right
result: pass

### 2. Add Expense Form
expected: Tap the (+) FAB. Add Expense form opens with: description field, amount field ($ prefix, decimal pad), payer selection (you selected by default), and member checkboxes (all checked by default) showing computed share amounts
result: pass

### 3. Equal Split Calculation
expected: With all members selected, share amounts should be equal and sum to the total. Deselect a member — shares recalculate. Re-select — shares go back to equal. Try amount "100.00" with 3 members — each should show $33.34, $33.33, $33.33 (penny-correct rounding)
result: issue
reported: "Okay the splitting works but there's no way to make the keyboard go away so that I can press the add expense button, also in the amount field the $ is centered with the textbox, however the value that I enter seems to be a little lower than the $ sign which looks a bit off."
severity: major

### 4. Submit Expense
expected: Enter description "Electric bill", amount "120.00", leave defaults, submit. You're redirected back to expenses tab. The expense appears in history under a "Today" header with description, amount, and "paid by [You]"
result: pass

### 5. Balance Dashboard
expected: At the top of expenses tab, a balance section appears. Other household members show in an "Owed to you" section with green amounts (their share of the $120). If you're the only member, balances may be empty.
result: pass

### 6. Expense Detail
expected: Tap the expense in history. Detail screen opens showing: description (large), total amount, "Paid by [You]" with date, and a list of split members with avatar initials, name, and individual share amount
result: pass

### 7. Edit Expense
expected: On the detail screen, tap Edit. Description and amount become editable. Change the description or amount. Save — you're back to history, the updated values are reflected. Balances should also update
result: pass

### 8. Delete Expense
expected: Open an expense detail, tap Delete. A confirmation alert appears. Confirm — expense is removed from history. Balances recalculate (should go to zero if it was the only expense)
result: pass

### 9. Recent Description Suggestions
expected: Tap (+) to add a new expense. Below the description field, you should see a horizontal row of recent descriptions (e.g. "Electric bill" from before). Tap one — it fills the description field
result: pass

### 10. Settle Up Flow
expected: Add an expense so balances are non-zero. In the balance section, tap "Settle Up" next to a person. Settle screen opens with the correct amount pre-filled. Amount is editable (try changing it). Tap "Record Payment" — you're redirected back, and a settlement appears in history with checkmark styling. Balance for that person should decrease or go to zero
result: issue
reported: "everything worked, except when I input a value of $38 for elham3, the balance for that person went to $78 meaning it added the amount instead of subtracting it for some reason"
severity: major

### 11. Venmo Deep Link
expected: On the settle screen or balance section, if the other person has a venmo_username, a "Request via Venmo" button appears. Tapping it opens Venmo (or venmo.com in browser) with pre-filled recipient and amount. After returning, a "Mark as Settled" option should be available. If no venmo_username, a hint should show instead
result: issue
reported: "it passed, great job here. However when it takes me to venmo the payment's description in venmo's pay description field is 'RoomY:+Sttement+for+Clowns'. I'd rather it be the description such as 'Water Bill' and then with the date. So 'Water Bill - 03/11/26'"
severity: minor

### 12. All Settled Up Zero State
expected: When all balances are settled (no one owes anything), the balance section shows a green checkmark icon with "All settled up!" message
result: issue
reported: "when I click settle, the amount gets added to the previous amount so that the bill never gets settled"
severity: major

### 13. Settlement in History
expected: Settlements appear in the expense history timeline with distinct styling — green checkmark icon, "[Name] paid [Name]" text, amount, and "Settlement" label. Tapping opens detail with delete option (no edit)
result: pass

## Summary

total: 13
passed: 9
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Dollar sign and amount value are vertically aligned in the amount field"
  status: failed
  reason: "User reported: the $ is centered with the textbox but the value entered is a little lower than the $ sign"
  severity: cosmetic
  test: 3
  root_cause: "Font weight mismatch ($ has font-semibold, TextInput has no weight) and TextInput default internal vertical padding pushes text down"
  artifacts:
    - path: "app/(app)/expenses/add.tsx"
      issue: "$ Text has font-semibold, TextInput missing paddingVertical: 0"
  missing:
    - "Remove font-semibold from $ or add to both, add style={{ paddingVertical: 0 }} to TextInput"
  debug_session: ".planning/debug/expense-ui-issues.md"
- truth: "Recording a settlement reduces the balance owed between two users"
  status: failed
  reason: "User reported: settling $38 for elham3 made the balance go to $78 — it added instead of subtracting"
  severity: major
  test: 10
  root_cause: "Signs swapped in get_household_balances() combined CTE: settlement rows use -amount where they should use +amount and vice versa"
  artifacts:
    - path: "supabase/migrations/00002_expenses.sql"
      issue: "Lines 95 and 99 in combined CTE have inverted signs for settlement credits"
  missing:
    - "Swap -amount to amount on line 95, swap amount to -amount on line 99"
  debug_session: ".planning/debug/settlement-adds-to-balance.md"
- truth: "Venmo note shows expense description with date (e.g. 'Water Bill - 03/11/26')"
  status: failed
  reason: "User reported: Venmo note shows 'RoomY:+Sttement+for+Clowns' with URL encoding artifacts instead of expense description + date"
  severity: minor
  test: 11
  root_cause: "Venmo note hardcoded as 'RoomY: Settlement for {household}' in settle.tsx line 140. Settle screen has no access to expense description or date — not passed as route params"
  artifacts:
    - path: "app/(app)/expenses/settle.tsx"
      issue: "Line 140 hardcoded generic note, no description/date params received"
    - path: "app/(app)/(tabs)/expenses.tsx"
      issue: "Navigation to settle screen doesn't pass description or date"
  missing:
    - "Pass description and date as route params to settle screen"
    - "Format note as 'Description - MM/DD/YY'"
  debug_session: ".planning/debug/expense-ui-issues.md"
