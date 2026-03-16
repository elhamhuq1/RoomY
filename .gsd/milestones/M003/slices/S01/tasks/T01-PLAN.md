---
estimated_steps: 10
estimated_files: 1
---

# T01: Database migration — rooms table, chore_nudges, alter chores, private room RLS, data migration

**Slice:** S01 — Schema Migration, Rooms Table & Private Room RLS
**Milestone:** M003

## Description

Create the Supabase migration that establishes the entire database foundation for room-based chores. This is a multi-step migration in a single file that must execute in correct order: create rooms table → insert default "General" rooms per household → alter chores table → migrate existing chore data → replace chore SELECT RLS policy with compound private-room-aware policy → create chore_nudges table. The private room RLS policy is the highest-risk piece — it must join through the rooms table to enforce visibility at the DB level.

## Steps

1. Create file `supabase/migrations/20260316000016_chore_rooms.sql`
2. CREATE `rooms` table:
   ```sql
   CREATE TABLE rooms (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     room_type TEXT NOT NULL CHECK (room_type IN ('kitchen','bathroom','living_room','bedroom','laundry','outdoor','garage','general')),
     is_private BOOLEAN DEFAULT false,
     created_by UUID REFERENCES auth.users NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_rooms_household ON rooms(household_id);
   ```
3. Enable RLS on rooms and create policies:
   - SELECT: household members see non-private rooms; private rooms visible only to `created_by`. Use:
     ```sql
     USING (
       household_id IN (SELECT public.get_user_household_ids())
       AND (is_private = false OR created_by = auth.uid())
     )
     ```
   - INSERT: `WITH CHECK (household_id IN (SELECT public.get_user_household_ids()) AND created_by = auth.uid())`
   - UPDATE: household members can update non-private rooms; private room only by creator:
     ```sql
     USING (household_id IN (SELECT public.get_user_household_ids()) AND (is_private = false OR created_by = auth.uid()))
     ```
   - DELETE: same as UPDATE
4. INSERT a default "General" room for every household that has at least one chore:
   ```sql
   INSERT INTO rooms (household_id, name, room_type, is_private, created_by)
   SELECT DISTINCT c.household_id, 'General', 'general', false, h.created_by
   FROM chores c
   JOIN households h ON h.id = c.household_id;
   ```
5. ALTER `chores` table — add `room_id` (nullable initially) and `effort_points`:
   ```sql
   ALTER TABLE chores ADD COLUMN room_id UUID REFERENCES rooms ON DELETE CASCADE;
   ALTER TABLE chores ADD COLUMN effort_points INT NOT NULL DEFAULT 1 CHECK (effort_points >= 1 AND effort_points <= 3);
   ```
6. UPDATE existing chores to point to their household's "General" room:
   ```sql
   UPDATE chores SET room_id = r.id
   FROM rooms r
   WHERE r.household_id = chores.household_id AND r.room_type = 'general';
   ```
7. Set room_id NOT NULL after data migration:
   ```sql
   ALTER TABLE chores ALTER COLUMN room_id SET NOT NULL;
   ```
8. DROP the existing "Members can view chores" SELECT policy, CREATE replacement compound policy that joins through rooms for private room filtering:
   ```sql
   DROP POLICY "Members can view chores" ON chores;
   CREATE POLICY "Members can view chores" ON chores FOR SELECT
   USING (
     household_id IN (SELECT public.get_user_household_ids())
     AND (
       room_id IN (SELECT id FROM public.rooms WHERE is_private = false)
       OR room_id IN (SELECT id FROM public.rooms WHERE created_by = auth.uid())
     )
   );
   ```
   This ensures: non-private room chores → visible to all household members. Private room chores → visible only to the room creator.
9. CREATE `chore_nudges` table:
   ```sql
   CREATE TABLE chore_nudges (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     chore_id UUID REFERENCES chores ON DELETE CASCADE NOT NULL,
     sender_id UUID REFERENCES auth.users NOT NULL,
     recipient_id UUID REFERENCES auth.users NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_chore_nudges_chore ON chore_nudges(chore_id);
   CREATE INDEX idx_chore_nudges_rate_limit ON chore_nudges(chore_id, sender_id, created_at DESC);
   ```
   Enable RLS with policies: SELECT/INSERT via chores join to household (same pattern as chore_completions).
10. Add index on chores(room_id):
    ```sql
    CREATE INDEX idx_chores_room ON chores(room_id);
    ```

## Must-Haves

- [ ] Migration applies cleanly via `supabase db reset`
- [ ] Existing chores have non-null room_id pointing to a "General" room
- [ ] Existing chores have effort_points = 1
- [ ] Private room chores invisible to non-owners via RLS
- [ ] All existing RLS policies on chore_completions and chore_swap_requests continue working (they join through chores, which now has the compound policy)
- [ ] chore_nudges table exists with proper RLS

## Verification

- Run `supabase db reset` — must complete without errors
- Query `SELECT id, room_id, effort_points FROM chores LIMIT 10;` — all rows have room_id and effort_points=1
- Query `SELECT * FROM rooms;` — "General" rooms exist for each household
- RLS proof: As user A, insert a private room + chore. As user B (same household), `SELECT * FROM chores WHERE room_id = <private_room_id>` returns 0 rows. As user A, same query returns the chore.
- `npx tsc --noEmit` — no new errors (migration doesn't affect TS, but sanity check)

## Inputs

- `supabase/migrations/20260311000004_chores.sql` — existing chore schema (tables, RLS policies, RPCs). The SELECT policy "Members can view chores" must be replaced.
- `supabase/migrations/20260311000001_foundation.sql` — `get_user_household_ids()` helper used in all RLS policies, `households` table structure (need `created_by` for default room insertion)
- Decision: "All RLS policies use get_user_household_ids() to avoid infinite recursion"
- Decision: "Fixed room taxonomy (kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general) as constant"
- Decision: "Nudge rate limiting enforced in RPC before insert (not DB unique constraint with time check)"

## Expected Output

- `supabase/migrations/20260316000016_chore_rooms.sql` — complete migration file with rooms table, chore_nudges table, chore alterations, data migration, and RLS policies
