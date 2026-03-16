# S02: Expense Splitting

**Goal:** Create the expense splitting database schema (tables, functions, RLS policies) and TypeScript types.
**Demo:** Create the expense splitting database schema (tables, functions, RLS policies) and TypeScript types.

## Must-Haves


## Tasks

- [x] **T01: 02-expense-splitting 01** `est:1min`
  - Create the expense splitting database schema (tables, functions, RLS policies) and TypeScript types.

Purpose: All UI plans depend on these tables and types existing. The get_household_balances() database function is the single source of truth for balance computation.
Output: Migration SQL file applied to Supabase, updated TypeScript types file.
- [x] **T02: 02-expense-splitting 02** `est:5min`
  - Build the add-expense form, expense history list, and expense detail screen with edit/delete.

Purpose: This is the core data entry and viewing flow — users add expenses, see them in a date-grouped history, and can tap to view/edit/delete details.
Output: Three new screens (add, detail, history replaces placeholder), updated app layout with routes.
- [x] **T03: 02-expense-splitting 03** `est:4min`
  - Build the balance dashboard and settle-up flow with Venmo deep link integration.

Purpose: This completes the expense splitting loop — users can see who owes whom and settle debts. The balance dashboard calls the DB function for accurate, server-computed balances. Venmo integration enables one-tap payment requests.
Output: Balance section replaces placeholder in expenses tab, new settle screen with Venmo link.
- [x] **T04: 02-expense-splitting 04**
  - User acceptance testing of the complete expense splitting flow.

Purpose: Verify the full expense → balance → settle loop works correctly on a physical device before marking Phase 2 complete.
Output: Verified working expense splitting feature.
- [x] **T05: 02-expense-splitting 05** `est:~20min`
  - Fix three UAT-reported issues: settlement balance calculation bug (major -- settlements add to balance instead of subtracting), dollar sign vertical alignment in add expense form (cosmetic), keyboard blocking submit button (UX), and Venmo note content (minor -- shows generic text instead of expense description with date).

Purpose: Close all UAT gaps so Phase 2 can pass user acceptance testing.
Output: Fixed SQL function, updated UI components, all 13 UAT tests passing.

## Files Likely Touched

- `supabase/migrations/00002_expenses.sql`
- `lib/types/database.ts`
- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/[id].tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/expenses/settle.tsx`
- `app/(app)/_layout.tsx`
- `supabase/migrations/00002_expenses.sql`
- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/settle.tsx`
- `app/(app)/(tabs)/expenses.tsx`
