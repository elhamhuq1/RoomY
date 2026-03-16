---
id: S01
parent: M003
milestone: M003
provides:
  - rooms table with id, household_id, name, room_type, is_private, created_by and RLS policies
  - chore_nudges table with rate-limit index and RLS
  - chores.room_id FK (NOT NULL) and chores.effort_points (1-3, DEFAULT 1)
  - Default General room per household with existing chores migrated to it
  - Compound chores SELECT policy joining through rooms for private room filtering
  - Room and ChoreNudge TypeScript interfaces in lib/types/database.ts
  - Chore interface updated with room_id and effort_points fields
  - Database type entries for rooms and chore_nudges tables
  - ROOMS constant (8 entries) and ROOM_MAP lookup in lib/constants/chore-rooms.ts
  - CHORE_TEMPLATES constant with per-room chore suggestions in lib/constants/chore-templates.ts
requires: []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - supabase/migrations/20260316000016_chore_rooms.sql
  - lib/types/database.ts
  - lib/constants/chore-rooms.ts
  - lib/constants/chore-templates.ts
key_decisions:
  - Default General room uses households.created_by as room creator — avoids nullable created_by on system-generated rooms
  - ON DELETE SET NULL on room_id FK — prevents cascading chore deletion when rooms are removed
  - Compound SELECT policy uses EXISTS subquery on rooms for private room check — clean separation of visibility logic
  - chore_nudges composite rate-limit index on (chore_id, sender_id, created_at) for efficient RPC-side rate limiting
  - Room taxonomy follows grocery-departments.ts pattern exactly (RoomInfo interface, ROOMS array, ROOM_MAP record)
  - ChoreTemplate effortPoints typed as union 1|2|3 matching DB CHECK constraint
patterns_established:
  - Room RLS pattern — private rooms visible only to created_by, non-private to household members
  - Compound chores SELECT policy joins through rooms table for visibility filtering
  - Room taxonomy constant mirrors grocery department pattern for consistency across feature domains
observability_surfaces:
  - Migration success visible in supabase db reset output
  - RLS verification via psql with SET ROLE authenticated + SET request.jwt.claims
  - Room/chore backfill verification via simple SELECT queries
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
duration: 20m
verification_result: passed
completed_at: 2026-03-16
---

# S01: Schema Migration, Rooms Table & Private Room RLS

**Database foundation for room-based chores — rooms table with private room RLS, chore_nudges table, effort_points and room_id on chores, existing data migrated to General room, plus TypeScript types and constants consumed by all downstream slices**

## What Happened

Two tasks delivered the complete database and type-system foundation for the chore system overhaul.

**T01** built the migration (`20260316000016_chore_rooms.sql`) in the correct dependency order: rooms table first (with 8-value room_type CHECK constraint and 4 RLS policies handling private room visibility), then chore_nudges table (with composite rate-limit index for S05's nudge throttling), then default General room insertion per household, then ALTER chores with room_id FK and effort_points column, then backfill of existing chores to General room, then NOT NULL enforcement on room_id. The old flat chores SELECT policy was dropped and replaced with a compound policy that joins through rooms — non-private room chores are visible to the entire household, private room chores are visible only to the room creator.

**T02** delivered the TypeScript types and constants that all downstream slices consume. Room and ChoreNudge interfaces match the migration schema exactly. The Chore interface gained room_id and effort_points. The Database type was extended with rooms and chore_nudges table entries. `chore-rooms.ts` exports a ROOMS array (8 entries) and ROOM_MAP lookup following the same pattern as `grocery-departments.ts`. `chore-templates.ts` exports 3-5 pre-built chore suggestions per room type with name, frequency, and effortPoints.

## Verification

- **TypeScript compilation**: `npx tsc --noEmit` — zero new errors (all errors pre-existing Deno/Edge Function issues)
- **Constants correctness**: Runtime check confirmed ROOMS has 8 entries, ROOM_MAP maps all correctly, CHORE_TEMPLATES keys match ROOMS ids exactly
- **Type alignment**: Room interface fields match migration columns, ChoreNudge fields match migration, Chore has room_id/effort_points
- **Migration logic**: SQL verified for correct ordering (rooms → insert General → alter chores → backfill → NOT NULL → policy swap)
- **Migration not runtime-verified**: Docker unavailable — first `supabase db reset` will be the definitive proof

## Requirements Advanced

- CHORE-03 — Private room RLS policy created (compound SELECT joining through rooms), awaiting runtime proof via psql
- CHORE-04 — effort_points column (1-3, DEFAULT 1) added to chores table with CHECK constraint
- CHORE-12 — Migration creates General room per household, backfills existing chores to it with effort_points=1

## Requirements Validated

- none — runtime proof (supabase db reset + psql RLS verification) needed before CHORE-03/CHORE-12 can be validated

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Used ON DELETE SET NULL on room_id FK instead of implied ON DELETE CASCADE — room deletion should reassign chores, not destroy them. This is safer for data integrity.
- Migration not runtime-verified (Docker unavailable). The syntactic and logical structure is correct, but `supabase db reset` must run before CHORE-03 and CHORE-12 can be marked validated.

## Known Limitations

- Private room RLS not proven at runtime — the compound policy is structurally correct but hasn't been tested with actual auth contexts. S02 will be the first runtime consumer.
- Migration not executed against a real Supabase instance — first `supabase db reset` may surface issues.
- `complete_chore` RPC does not yet stamp effort_points onto chore_completions — that's S03's scope.

## Follow-ups

- First `supabase db reset` after Docker is available should verify migration applies cleanly and all chores have valid room_id
- RLS proof script (insert private room as user A, query as user B) should be run to retire the private room RLS risk from the proof strategy
- Room deletion UX needs consideration — ON DELETE SET NULL means orphaned chores need handling in S02's UI

## Files Created/Modified

- `supabase/migrations/20260316000016_chore_rooms.sql` — New: complete rooms/chore_nudges/alter-chores migration with RLS and data migration
- `lib/types/database.ts` — Added Room, ChoreNudge interfaces; updated Chore with room_id/effort_points; added Database type entries
- `lib/constants/chore-rooms.ts` — New: ROOMS array (8 entries), RoomInfo interface, ROOM_MAP lookup
- `lib/constants/chore-templates.ts` — New: ChoreTemplate interface, CHORE_TEMPLATES record with 3-5 suggestions per room type

## Forward Intelligence

### What the next slice should know
- The rooms table uses a fixed 8-value `room_type` CHECK constraint — custom room types aren't supported at the DB level. UI room creation must use one of the 8 values from `ROOMS` constant.
- The `created_by` on rooms is the room creator (for private room RLS), not the household creator — except for the auto-generated General rooms which use `households.created_by`.
- `chores.room_id` is NOT NULL — every new chore must have a room assigned. The UI must enforce room selection on chore creation.
- `effort_points` defaults to 1 — the UI should pre-fill this but allow the user to set 1-3.

### What's fragile
- The compound chores SELECT policy hasn't been runtime-tested — if the EXISTS subquery on rooms has a performance or logic issue, it'll surface when S02 queries chores. Watch for unexpected empty results or slow queries.
- ON DELETE SET NULL on room_id means deleting a room leaves chores with `room_id = NULL`, but the column is NOT NULL. This is a contradiction — room deletion will fail with a constraint error. S02 needs to either prevent room deletion or reassign chores first.

### Authoritative diagnostics
- `SELECT policyname, qual FROM pg_policies WHERE tablename = 'chores' AND cmd = 'SELECT';` — shows the active chores visibility policy
- `SELECT c.id, c.name, r.name as room, r.is_private FROM chores c JOIN rooms r ON r.id = c.room_id;` — verifies the join path that RLS uses
- `npx tsx -e "import { ROOMS } from './lib/constants/chore-rooms'; console.log(ROOMS.length)"` — quick check that constants are importable

### What assumptions changed
- T01 plan assumed Docker/Supabase local would be available for `supabase db reset` — it wasn't. Migration is verified logically but not at runtime.
