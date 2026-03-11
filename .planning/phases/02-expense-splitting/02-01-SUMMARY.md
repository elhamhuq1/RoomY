---
phase: 02-expense-splitting
plan: 01
subsystem: database
tags: [postgres, supabase, rls, sql, typescript, expense-splitting]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "households, household_members tables, get_user_household_ids() function, update_updated_at() trigger"
provides:
  - "expenses, expense_splits, settlements tables with RLS"
  - "get_household_balances() SECURITY DEFINER function for computed net balances"
  - "Expense, ExpenseSplit, Settlement TypeScript interfaces"
  - "Database interface extensions for new tables and function"
affects: [02-expense-splitting, 03-groceries-chores]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Computed balances via SECURITY DEFINER SQL function (never stored as mutable state)"
    - "Expense splits junction table for per-member share tracking"
    - "RLS on child tables via parent FK lookup through get_user_household_ids()"

key-files:
  created:
    - supabase/migrations/00002_expenses.sql
  modified:
    - lib/types/database.ts

key-decisions:
  - "All RLS policies use get_user_household_ids() to avoid infinite recursion"
  - "Balances computed via DB function, never stored as mutable columns"
  - "Any household member can edit/delete any expense (per user decision from CONTEXT.md)"

patterns-established:
  - "Expense splits as junction table with UNIQUE(expense_id, user_id) constraint"
  - "NUMERIC(10,2) with CHECK > 0 for all monetary columns"
  - "get_household_balances() CTE pattern: expense_debts -> settlement_credits -> combined -> GROUP BY"

requirements-completed: [EXPN-01, EXPN-02, EXPN-03, EXPN-05]

# Metrics
duration: 1min
completed: 2026-03-11
---

# Phase 2 Plan 1: Database Schema Summary

**Expense splitting schema with expenses/splits/settlements tables, computed balance function, and RLS policies using get_user_household_ids() pattern**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-11T07:22:59Z
- **Completed:** 2026-03-11T07:23:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created three expense-related tables (expenses, expense_splits, settlements) with proper FK constraints and CHECK constraints on monetary amounts
- Implemented get_household_balances() SECURITY DEFINER function computing net balances from expenses and settlements using CTE pattern
- Added RLS policies on all three tables following established get_user_household_ids() pattern to prevent infinite recursion
- Extended TypeScript Database interface with Expense, ExpenseSplit, Settlement types and get_household_balances function type

## Task Commits

Each task was committed atomically:

1. **Task 1: Create expenses migration with tables, function, RLS, and indexes** - `5ab35ae` (feat)
2. **Task 2: Add Expense, ExpenseSplit, Settlement types and update Database interface** - `931de54` (feat)

## Files Created/Modified
- `supabase/migrations/00002_expenses.sql` - Three tables, 5 indexes, get_household_balances() function, RLS policies, updated_at trigger
- `lib/types/database.ts` - Expense, ExpenseSplit, Settlement interfaces; Database table and function type extensions

## Decisions Made
- All RLS policies follow the established get_user_household_ids() SECURITY DEFINER pattern from Phase 1 to avoid infinite recursion
- Computed balances via DB function (not stored columns) -- single source of truth that cannot drift across devices
- Any household member can edit/delete any expense -- per user decision documented in CONTEXT.md
- Used NUMERIC(10,2) for all monetary columns to avoid floating-point precision issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**Migration must be applied to Supabase.** The migration file `supabase/migrations/00002_expenses.sql` was created locally but needs to be applied to the live Supabase database. Apply via Supabase MCP (`mcp__supabase__apply_migration`) or the Supabase dashboard SQL editor.

## Next Phase Readiness
- Database schema ready for expense UI development (Plan 02-02: Add Expense form)
- TypeScript types ready for type-safe Supabase queries
- get_household_balances() function ready for balance dashboard (Plan 02-03)

## Self-Check: PASSED

All files and commits verified:
- supabase/migrations/00002_expenses.sql: FOUND
- lib/types/database.ts: FOUND
- Commit 5ab35ae (Task 1): FOUND
- Commit 931de54 (Task 2): FOUND

---
*Phase: 02-expense-splitting*
*Completed: 2026-03-11*
