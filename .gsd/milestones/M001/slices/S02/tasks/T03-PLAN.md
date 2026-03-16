# T03: 02-expense-splitting 03

**Slice:** S02 — **Milestone:** M001

## Description

Build the balance dashboard and settle-up flow with Venmo deep link integration.

Purpose: This completes the expense splitting loop — users can see who owes whom and settle debts. The balance dashboard calls the DB function for accurate, server-computed balances. Venmo integration enables one-tap payment requests.
Output: Balance section replaces placeholder in expenses tab, new settle screen with Venmo link.

## Must-Haves

- [x] "User sees net balance per roommate at top of expenses tab"
- [x] "Balances show You owe and Owed to you sections"
- [x] "Zero state shows All settled up! with checkmark"
- [x] "User can tap Settle Up to open confirmation screen with editable amount"
- [x] "User can record a payment that updates balances"
- [x] "User can tap Request via Venmo to open Venmo with pre-filled amount and recipient"

## Files

- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/expenses/settle.tsx`
- `app/(app)/_layout.tsx`
