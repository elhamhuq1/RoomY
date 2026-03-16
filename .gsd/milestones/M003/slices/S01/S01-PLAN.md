# S01: Schema Migration, Rooms Table & Private Room RLS

**Goal:** Establish the database foundation for room-based chore organization — rooms table, chore_nudges table, effort_points and room_id on chores, private room RLS, and safe migration of existing data — plus the TypeScript types and constants that all downstream slices consume.
**Demo:** After migration, existing chores have room_id pointing to their household's "General" room and effort_points=1. A psql query as a non-owner of a private room returns zero chores from that room. The `Room`, `ChoreNudge` types exist in `database.ts`, and room/template constants are importable.

## Must-Haves

- `rooms` table with `id`, `household_id`, `name`, `room_type`, `is_private`, `created_by` and RLS policies
- `chore_nudges` table with `chore_id`, `sender_id`, `recipient_id`, `created_at` and RLS policies
- `chores.room_id` FK column (NOT NULL after migration, pointing to household's "General" room for existing rows)
- `chores.effort_points` integer column (1-3, DEFAULT 1)
- Private room RLS: chores SELECT policy joins through rooms — non-private rooms visible to household, private rooms visible only to `created_by`
- All existing chores preserved with room_id and effort_points=1 after migration
- `Room` and `ChoreNudge` interfaces in `lib/types/database.ts` with Database type updated
- `lib/constants/chore-rooms.ts` — fixed room taxonomy (`{ id, label, icon }` per room type)
- `lib/constants/chore-templates.ts` — pre-built chore suggestions per room with name, frequency, effort defaults

## Proof Level

- This slice proves: contract (schema correctness) + integration (RLS enforcement across users)
- Real runtime required: yes — migration must run against Supabase, RLS must be tested with actual auth contexts
- Human/UAT required: no — all verification is psql/CLI

## Verification

- Migration applies cleanly: `supabase db reset` completes without errors
- Existing chore preservation: psql query confirms all chores have a non-null `room_id` pointing to a "General" room and `effort_points = 1`
- Private room RLS proof: insert a private room + chore as user A, then query chores as user B in the same household — returns zero rows for that room's chores. Query as user A returns the chore.
- `npx tsc --noEmit` produces zero new errors in app/components/lib code
- Room taxonomy constant exports `ROOMS` array with 8 entries and `ROOM_MAP` lookup
- Chore templates constant exports templates for each room type

## Observability / Diagnostics

- Runtime signals: migration success/failure is visible in `supabase db reset` output
- Inspection surfaces: `psql` queries against rooms, chores, chore_nudges tables; RLS tested via `SET ROLE authenticated; SET request.jwt.claims ...`
- Failure visibility: FK constraint violations surface as migration errors; RLS leaks detectable via cross-user SELECT
- Redaction constraints: none — no secrets in this slice

## Integration Closure

- Upstream surfaces consumed: `get_user_household_ids()` function from foundation migration, existing `chores` table schema
- New wiring introduced in this slice: rooms table (consumed by S02 UI), room_id/effort_points on chores (consumed by S02-S05), chore_nudges table (consumed by S05), TypeScript types and constants (consumed by all downstream slices)
- What remains before the milestone is truly usable end-to-end: UI for room-based organization (S02), effort-weighted dashboard (S03), My Day view (S04), nudge push notifications (S05)

## Tasks

- [ ] **T01: Database migration — rooms table, chore_nudges, alter chores, private room RLS, data migration** `est:1h`
  - Why: Every downstream slice depends on the rooms table, effort_points column, and room_id FK existing. The migration must create tables in correct order (rooms → alter chores → migrate data) within a single transaction to avoid FK failures. Private room RLS is the highest-risk item in the entire milestone — must be proven here.
  - Files: `supabase/migrations/20260316000016_chore_rooms.sql`
  - Do: (1) CREATE `rooms` table with id, household_id, name, room_type, is_private, created_by, created_at. (2) Enable RLS on rooms with policies: household members see non-private rooms; private rooms visible only to created_by; creators can insert rooms in their household; members can update/delete non-private rooms, creators can update/delete their private rooms. (3) CREATE `chore_nudges` table with id, chore_id, sender_id, recipient_id, created_at + RLS (household members via chores join). (4) INSERT a default "General" room (room_type='general', is_private=false) for every household that has at least one chore. (5) ALTER chores ADD room_id UUID REFERENCES rooms, ADD effort_points INT DEFAULT 1 CHECK (1-3). (6) UPDATE existing chores SET room_id to their household's "General" room. (7) ALTER chores ALTER room_id SET NOT NULL. (8) DROP the existing "Members can view chores" SELECT policy on chores. (9) CREATE new compound SELECT policy: household_id matches AND (room is NOT private OR room.created_by = auth.uid()). (10) Add index on rooms(household_id) and chores(room_id).
  - Verify: `supabase db reset` succeeds; psql confirms existing chores have room_id + effort_points=1; private room RLS blocks cross-user access
  - Done when: migration applies cleanly, all existing chores have valid room_id, private room chores are invisible to non-owners at the DB level

- [ ] **T02: TypeScript types, room taxonomy constant, and chore templates constant** `est:45m`
  - Why: All downstream slices (S02-S05) import Room/ChoreNudge types and room/template constants. These must match the migration schema exactly. The room taxonomy follows the same pattern as grocery-departments.ts. Templates provide the pre-built chore suggestions that S02's template UI will use.
  - Files: `lib/types/database.ts`, `lib/constants/chore-rooms.ts`, `lib/constants/chore-templates.ts`
  - Do: (1) Add `Room` interface to database.ts matching rooms table columns. (2) Add `ChoreNudge` interface matching chore_nudges table columns. (3) Add `room_id: string` and `effort_points: number` to existing `Chore` interface. (4) Add `rooms` and `chore_nudges` table entries to the Database type (Row/Insert/Update). (5) Update `chores` Insert type to include optional room_id and effort_points. (6) Create `lib/constants/chore-rooms.ts` following grocery-departments.ts pattern — `ROOMS` array with 8 entries (kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general) each having `{ id, label, icon }`, plus `ROOM_MAP` for O(1) lookup. (7) Create `lib/constants/chore-templates.ts` with pre-built chore suggestions per room type — each template has name, frequency ('daily'|'weekly'|'monthly'), and effort_points (1-3). Include 3-5 realistic templates per room (e.g., kitchen: dishes/daily/1, wipe counters/weekly/1, mop floor/weekly/2, clean oven/monthly/3).
  - Verify: `npx tsc --noEmit` passes with zero new errors
  - Done when: Room, ChoreNudge types compile, Chore has room_id/effort_points, ROOMS has 8 entries, templates cover all room types

## Files Likely Touched

- `supabase/migrations/20260316000016_chore_rooms.sql` (new)
- `lib/types/database.ts`
- `lib/constants/chore-rooms.ts` (new)
- `lib/constants/chore-templates.ts` (new)
