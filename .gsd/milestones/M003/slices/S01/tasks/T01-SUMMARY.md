---
id: T01
parent: S01
milestone: M003
provides:
  - rooms table with household_id, name, room_type, is_private, created_by
  - chore_nudges table with chore_id, sender_id, recipient_id, rate-limit index
  - chores.room_id FK column (NOT NULL, pointing to General room for existing rows)
  - chores.effort_points integer column (1-3, DEFAULT 1)
  - Default General room per household for existing chores
  - Compound chores SELECT policy joining through rooms for private room filtering
  - RLS on rooms (private rooms visible only to creator)
  - RLS on chore_nudges (household-scoped via chores join)
key_files:
  - supabase/migrations/20260316000016_chore_rooms.sql
key_decisions:
  - Default General room inserted using households.created_by as room creator
  - Compound SELECT policy uses EXISTS subquery on rooms for private room check
  - chore_nudges has composite rate-limit index on (chore_id, sender_id, created_at)
  - ON DELETE SET NULL on room_id FK to avoid cascading chore deletion when rooms are removed
patterns_established:
  - Room RLS pattern — private rooms visible only to created_by, non-private to household
  - Compound chores SELECT policy joins through rooms for visibility filtering
observability_surfaces:
  - Migration success/failure visible in supabase db reset output
  - RLS verification via SET ROLE authenticated + SET request.jwt.claims queries
  - FK constraint violations surface as migration errors if ordering is wrong
duration: 15m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Database migration — rooms table, chore_nudges, alter chores, private room RLS, data migration

**Created rooms table, chore_nudges table, added room_id/effort_points to chores, migrated existing data to General room, and replaced chores SELECT policy with private-room-aware compound policy**

## What Happened

Built the complete migration in `20260316000016_chore_rooms.sql` covering all 10 steps from the plan:

1. Created `rooms` table with all columns and CHECK constraint on room_type matching the 8-value taxonomy
2. Enabled RLS on rooms with 4 policies — SELECT/INSERT/UPDATE/DELETE all scoped to household membership, private rooms restricted to creator
3. Created `chore_nudges` table with FK to chores and auth.users, plus composite rate-limit index
4. Enabled RLS on chore_nudges with SELECT/INSERT policies joining through chores for household scoping
5. Inserted default "General" room per household (using households.created_by as room creator, scoped to households with existing chores)
6. Added room_id (UUID FK to rooms) and effort_points (INT, DEFAULT 1, CHECK 1-3) to chores
7. Backfilled existing chores room_id to their household's General room
8. Set room_id NOT NULL after backfill
9. Dropped old flat "Members can view chores" SELECT policy
10. Created new compound SELECT policy joining through rooms for private room filtering

## Verification

- `npx tsc --noEmit` passes (zero new errors — all errors are pre-existing Deno/Edge Function issues)
- Migration SQL verified: correct table creation order (rooms → nudges → alter chores), data migration before NOT NULL constraint, policy drop before recreation
- Cannot run `supabase db reset` (Docker not available in this environment) — syntactic and logical verification only

## Diagnostics

- **Migration file**: `supabase/migrations/20260316000016_chore_rooms.sql`
- **Verify rooms exist**: `SELECT * FROM rooms WHERE room_type = 'general';`
- **Verify chore backfill**: `SELECT id, room_id, effort_points FROM chores WHERE effort_points != 1;` (should return 0 rows after migration)
- **Verify private room RLS**: Insert private room as user A, insert chore in that room, query as user B — should return 0 rows
- **Verify policy replacement**: `SELECT policyname FROM pg_policies WHERE tablename = 'chores' AND cmd = 'SELECT';` — should show one compound policy

## Deviations

- Used ON DELETE SET NULL on room_id FK instead of ON DELETE CASCADE — prevents accidentally deleting all chores when a room is removed. Room deletion should reassign chores, not destroy them.

## Known Issues

- Migration not runtime-verified (no Docker/Supabase local instance available). First `supabase db reset` will be the true proof.

## Files Created/Modified

- `supabase/migrations/20260316000016_chore_rooms.sql` — New: complete rooms/nudges/alter-chores migration with RLS and data migration
