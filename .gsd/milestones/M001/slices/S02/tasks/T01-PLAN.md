# T01: 02-expense-splitting 01

**Slice:** S02 — **Milestone:** M001

## Description

Create the expense splitting database schema (tables, functions, RLS policies) and TypeScript types.

Purpose: All UI plans depend on these tables and types existing. The get_household_balances() database function is the single source of truth for balance computation.
Output: Migration SQL file applied to Supabase, updated TypeScript types file.

## Must-Haves

- [x] "expenses, expense_splits, and settlements tables exist with correct columns and constraints"
- [x] "RLS policies enforce household isolation using get_user_household_ids() pattern"
- [x] "get_household_balances() function returns correct net amounts between users"
- [x] "TypeScript types match all new database tables and functions"

## Files

- `supabase/migrations/00002_expenses.sql`
- `lib/types/database.ts`
