# T05: 02-expense-splitting 05

**Slice:** S02 — **Milestone:** M001

## Description

Fix three UAT-reported issues: settlement balance calculation bug (major -- settlements add to balance instead of subtracting), dollar sign vertical alignment in add expense form (cosmetic), keyboard blocking submit button (UX), and Venmo note content (minor -- shows generic text instead of expense description with date).

Purpose: Close all UAT gaps so Phase 2 can pass user acceptance testing.
Output: Fixed SQL function, updated UI components, all 13 UAT tests passing.

## Must-Haves

- [x] "Recording a settlement reduces the balance owed between two users"
- [x] "Dollar sign and amount value are vertically aligned in the add expense form"
- [x] "Keyboard can be dismissed to access the Add Expense submit button"
- [x] "Venmo note shows expense description with date (e.g. 'Water Bill - 03/11/26')"

## Files

- `supabase/migrations/00002_expenses.sql`
- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/settle.tsx`
- `app/(app)/(tabs)/expenses.tsx`
