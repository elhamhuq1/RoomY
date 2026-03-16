# S01: Schema Migration, Rooms Table & Private Room RLS — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: mixed (artifact-driven for types/constants, live-runtime for migration/RLS)
- Why this mode is sufficient: Types and constants are compile-time verified. Migration and RLS require real Supabase instance to prove correctness.

## Preconditions

- Docker daemon running (`docker ps` succeeds)
- Supabase local instance available (`npx supabase status` shows running services)
- At least one household with at least one chore exists in seed data (or from prior milestones)
- Two test user accounts in the same household (user A and user B)

## Smoke Test

Run `npx supabase db reset` — must complete without errors. Then run:
```sql
SELECT COUNT(*) FROM rooms WHERE room_type = 'general';
```
Should return at least 1 (one General room per household with chores).

## Test Cases

### 1. Migration applies cleanly

1. Run `npx supabase db reset`
2. Check exit code is 0
3. **Expected:** All migrations apply in sequence, no errors

### 2. Rooms table exists with correct structure

1. Run: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'rooms' ORDER BY ordinal_position;`
2. **Expected:** Columns: id (uuid, NO), household_id (uuid, NO), name (text, NO), room_type (text, NO), is_private (boolean, NO), created_by (uuid, NO), created_at (timestamptz, YES)

### 3. Default General rooms created for existing households

1. Run: `SELECT r.id, r.household_id, r.name, r.room_type, r.is_private FROM rooms r WHERE r.room_type = 'general';`
2. **Expected:** One row per household that had chores, all with name='General', is_private=false

### 4. Existing chores have room_id and effort_points

1. Run: `SELECT id, name, room_id, effort_points FROM chores;`
2. **Expected:** Every chore has a non-null room_id pointing to their household's General room and effort_points=1

### 5. No orphaned chores (room_id integrity)

1. Run: `SELECT c.id FROM chores c LEFT JOIN rooms r ON r.id = c.room_id WHERE r.id IS NULL;`
2. **Expected:** Zero rows — every chore points to a valid room

### 6. Effort points CHECK constraint enforced

1. Run: `INSERT INTO chores (household_id, name, frequency, rotation_order, next_due_at, room_id, effort_points, created_by) VALUES ((SELECT id FROM households LIMIT 1), 'Test', 'daily', '{}', now(), (SELECT id FROM rooms LIMIT 1), 4, auth.uid());`
2. **Expected:** Error — CHECK constraint violation (effort_points must be 1-3)

### 7. Private room visible only to creator (RLS proof)

1. As user A: create a private room:
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims = '{"sub": "<user_a_id>"}';
   INSERT INTO rooms (household_id, name, room_type, is_private, created_by)
   VALUES ('<household_id>', 'My Room', 'bedroom', true, '<user_a_id>');
   ```
2. As user A: insert a chore in that room:
   ```sql
   INSERT INTO chores (household_id, name, frequency, rotation_order, next_due_at, room_id, effort_points, created_by)
   VALUES ('<household_id>', 'Private chore', 'weekly', '{<user_a_id>}', now(), '<private_room_id>', 1, '<user_a_id>');
   ```
3. As user B (same household): query chores:
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims = '{"sub": "<user_b_id>"}';
   SELECT * FROM chores WHERE name = 'Private chore';
   ```
4. **Expected:** Zero rows returned for user B
5. As user A: query the same:
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims = '{"sub": "<user_a_id>"}';
   SELECT * FROM chores WHERE name = 'Private chore';
   ```
6. **Expected:** One row returned for user A

### 8. Non-private room chores visible to all household members

1. As user A: insert a chore in the General (non-private) room
2. As user B: query chores
3. **Expected:** User B can see the chore in the General room

### 9. Chore nudges table exists with RLS

1. Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'chore_nudges' ORDER BY ordinal_position;`
2. **Expected:** Columns: id, chore_id, sender_id, recipient_id, created_at
3. As user A: insert a nudge for a chore in user A's household
4. **Expected:** Insert succeeds with sender_id = user A's id

### 10. TypeScript types compile

1. Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | grep "error TS"`
2. **Expected:** No output (zero type errors in app/components/lib code)

### 11. Room constants are correct

1. Run: `npx tsx -e "import { ROOMS, ROOM_MAP } from './lib/constants/chore-rooms'; console.log(ROOMS.length, Object.keys(ROOM_MAP).length);"`
2. **Expected:** Output: `8 8`

### 12. Template constants cover all room types

1. Run: `npx tsx -e "import { ROOMS } from './lib/constants/chore-rooms'; import { CHORE_TEMPLATES } from './lib/constants/chore-templates'; const missing = ROOMS.filter(r => !CHORE_TEMPLATES[r.id]); console.log('Missing:', missing.length);"`
2. **Expected:** Output: `Missing: 0`

## Edge Cases

### Private room creator leaves household

1. User A creates a private room and chore, then is removed from the household
2. **Expected:** The room and chore still exist in the database but are invisible to remaining members (no one matches created_by). This is an orphan scenario — acceptable for v1, noted as a follow-up.

### Household with no chores

1. Check rooms table for a household that had zero chores
2. **Expected:** No General room auto-created for that household (migration only creates rooms for households with existing chores)

### Room type constraint violation

1. Attempt to insert a room with room_type = 'closet'
2. **Expected:** CHECK constraint error — only the 8 defined types are allowed

## Failure Signals

- `supabase db reset` fails with FK constraint error — room creation order is wrong
- Chores query returns empty for a household member who should see non-private chores — compound SELECT policy is too restrictive
- Private room chores visible to non-creator — RLS policy is too permissive (critical security bug)
- `npx tsc --noEmit` shows new errors in app/ or lib/ — type definitions don't match

## Requirements Proved By This UAT

- CHORE-03 — Private room RLS proven via test case 7 (psql query as non-owner returns zero rows)
- CHORE-04 — Effort points column proven via test cases 4 and 6 (values exist, CHECK constraint enforced)
- CHORE-12 — Migration to General room proven via test cases 3, 4, 5 (existing chores have valid room_id and effort_points=1)

## Not Proven By This UAT

- CHORE-01 (room-based UI organization) — S02 scope
- CHORE-02 (private room creation UI) — S02 scope
- CHORE-05 (template UI) — S02 scope
- Runtime performance of the compound SELECT policy under load — acceptable for small households
- Edge Function behavior with new schema — S05 scope

## Notes for Tester

- Test cases 7-9 require psql with ability to SET ROLE and SET request.jwt.claims — this simulates authenticated Supabase users. Use `supabase db` or direct psql connection to the local instance.
- The migration creates General rooms only for households that already have chores. If testing with a fresh seed that has no chores, you won't see any rooms until you create chores first.
- Test cases 10-12 can run without Docker — they verify compile-time artifacts only.
