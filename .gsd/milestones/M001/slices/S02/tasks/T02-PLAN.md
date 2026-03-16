# T02: 02-expense-splitting 02

**Slice:** S02 — **Milestone:** M001

## Description

Build the add-expense form, expense history list, and expense detail screen with edit/delete.

Purpose: This is the core data entry and viewing flow — users add expenses, see them in a date-grouped history, and can tap to view/edit/delete details.
Output: Three new screens (add, detail, history replaces placeholder), updated app layout with routes.

## Must-Haves

- [x] "User can tap FAB on expenses tab to open add-expense form"
- [x] "Add expense form has description, amount, payer selection, and member toggles"
- [x] "Expense is saved with correct equal split amounts across selected members"
- [x] "Expense history shows entries grouped by date with description, amount, payer"
- [x] "Tapping an expense opens detail screen with split members and shares"
- [x] "User can edit or delete any expense from the detail screen"

## Files

- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/[id].tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/_layout.tsx`
