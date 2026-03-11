---
status: complete
phase: 03-groceries
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-11T19:30:00Z
updated: 2026-03-11T19:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Add Items to Grocery List
expected: Navigate to the Groceries tab. Type an item name and tap the add button. Item appears at the top of the list immediately. Add 3-4 items — each appears above the previous ones (newest first).
result: pass

### 2. Quantity Stepper on Item Rows
expected: Each unchecked item row shows a quantity stepper with [-] {qty} [+] buttons. Tapping [+] increments the quantity, [-] decrements (minimum 1). Changes persist after leaving and returning to the screen.
result: pass

### 3. Edit Item via Modal
expected: Tap on an item row to open an edit modal. The modal shows the item name (editable) and quantity stepper. Change the name and/or quantity, tap Save. The item updates in the list immediately.
result: issue
reported: "It passes but the keyboard is being a little weird and covers a bit of the modal. Also it should be clear to the user that they can click on an item for a modal to pop up."
severity: minor

### 4. Check Off Items
expected: Tap the checkbox on 2-3 items. Each checked item moves to a "Completed" section at the bottom of the list with grayed-out/muted styling. Unchecked items remain at the top.
result: issue
reported: "Yea that works but it should be explicit with the uncompleted section is. Maybe saying like 'Shopping' or something better"
severity: cosmetic

### 5. Swipe to Delete
expected: Swipe left on an unchecked item. A red trash action appears on the right side. Complete the swipe or tap the trash icon. The item is removed from the list.
result: issue
reported: "swipe to delete works, but when I swipe i don't get the chance to click the delete button because the swiping deletes it pretty quick. So the user won't know that swipe to delete is a feature, so maybe making it more explicit with UI could be nice"
severity: minor

### 6. Complete Trip Button Appears
expected: After checking off some items, a prominent "Complete Trip" button appears at the bottom of the screen (sticky, not inside the scroll area). It should NOT be visible when no items are checked.
result: pass

### 7. Complete Trip Flow
expected: Tap "Complete Trip". A new screen shows: receipt total input ($), payer picker (avatar chips, defaulting to you), member picker (checkboxes, all selected by default), and per-person split preview. Enter a total (e.g. $42.50), select payer and members, tap submit.
result: pass

### 8. Expense Created After Trip
expected: After completing a trip, navigate to the Expenses tab. A "Grocery trip" expense appears with the correct amount you entered. The split amounts match the equal division among selected members.
result: pass

### 9. Grocery List Resets After Trip
expected: After completing a trip, go back to the Groceries tab. The list should be empty — a fresh start. The checked items were archived, unchecked items were cleared.
result: pass

### 10. Trip History
expected: On the Groceries tab, tap the clock/history icon in the header. A Trip History screen shows the completed trip with date, total amount, and an expandable card showing the archived item names.
result: pass

## Summary

total: 10
passed: 7
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Edit modal is fully visible above keyboard and item tap affordance is discoverable"
  status: failed
  reason: "User reported: It passes but the keyboard is being a little weird and covers a bit of the modal. Also it should be clear to the user that they can click on an item for a modal to pop up."
  severity: minor
  test: 3
  artifacts: []
  missing: []

- truth: "Both list sections (unchecked and checked) have clear section labels"
  status: failed
  reason: "User reported: it should be explicit with the uncompleted section is. Maybe saying like 'Shopping' or something better"
  severity: cosmetic
  test: 4
  artifacts: []
  missing: []

- truth: "Swipe-to-delete reveals a tappable delete button and doesn't auto-delete too quickly; feature is discoverable"
  status: failed
  reason: "User reported: swipe to delete works, but when I swipe i don't get the chance to click the delete button because the swiping deletes it pretty quick. So the user won't know that swipe to delete is a feature, so maybe making it more explicit with UI could be nice"
  severity: minor
  test: 5
  artifacts: []
  missing: []
