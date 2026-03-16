# T01: 03.1-chores 01

**Slice:** S04 — **Milestone:** M001

## Description

Create the chores database schema and build the main chore list with create/complete/claim functionality.

Purpose: Establish the full chore data model (tables, RLS, rotation RPC, dispute auto-revert) and deliver the core chore management UI -- users can create chores, see them grouped and sorted, mark them complete with rotation, and claim others' chores.

Output: Migration file, updated TypeScript types, functional chore list screen, create chore screen.

## Must-Haves

- [x] "User can see a chore list grouped by 'my chores' first, then others' chores"
- [x] "User can create a chore with name and frequency (daily/weekly/monthly/custom) and it gets assigned randomly to a member"
- [x] "User can mark a chore as complete via tap + confirmation dialog, and it rotates to the next person"
- [x] "Anyone can volunteer/claim a chore assigned to someone else"
- [x] "Overdue chores show a red badge with 'X days overdue'"
- [x] "Empty state shows suggested common chores with icons for one-tap creation"
- [x] "Summary header shows pending count, overdue count, and current streak"

## Files

- `supabase/migrations/00004_chores.sql`
- `lib/types/database.ts`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/chores/add.tsx`
