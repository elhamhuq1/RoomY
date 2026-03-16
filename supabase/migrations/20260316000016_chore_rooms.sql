-- Chore Rooms Migration
-- Creates: rooms table, chore_nudges table
-- Alters: chores table (adds room_id FK, effort_points)
-- Migrates: existing chores → default "General" room per household
-- Replaces: chores SELECT policy with private-room-aware compound policy

-- ============================================================
-- 1. ROOMS TABLE
-- ============================================================

CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'kitchen', 'bathroom', 'living_room', 'bedroom',
    'laundry', 'outdoor', 'garage', 'general'
  )),
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rooms_household ON rooms(household_id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Household members see non-private rooms; private rooms visible only to creator
CREATE POLICY "Members can view non-private rooms"
  ON rooms FOR SELECT
  USING (
    household_id IN (SELECT public.get_user_household_ids())
    AND (is_private = false OR created_by = auth.uid())
  );

-- Any household member can create rooms in their household
CREATE POLICY "Members can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

-- Members can update non-private rooms; creators can update their private rooms
CREATE POLICY "Members can update rooms"
  ON rooms FOR UPDATE
  USING (
    household_id IN (SELECT public.get_user_household_ids())
    AND (is_private = false OR created_by = auth.uid())
  );

-- Members can delete non-private rooms; creators can delete their private rooms
CREATE POLICY "Members can delete rooms"
  ON rooms FOR DELETE
  USING (
    household_id IN (SELECT public.get_user_household_ids())
    AND (is_private = false OR created_by = auth.uid())
  );

-- ============================================================
-- 2. CHORE_NUDGES TABLE
-- ============================================================

CREATE TABLE chore_nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES chores ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  recipient_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chore_nudges_chore ON chore_nudges(chore_id);
CREATE INDEX idx_chore_nudges_rate_limit ON chore_nudges(chore_id, sender_id, created_at);

ALTER TABLE chore_nudges ENABLE ROW LEVEL SECURITY;

-- Household members can view nudges for their household's chores
CREATE POLICY "Members can view nudges"
  ON chore_nudges FOR SELECT
  USING (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

-- Members can send nudges (sender must be current user)
CREATE POLICY "Members can send nudges"
  ON chore_nudges FOR INSERT
  WITH CHECK (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
    AND sender_id = auth.uid()
  );

-- ============================================================
-- 3. INSERT DEFAULT "General" ROOMS
-- ============================================================
-- One "General" room per household that has at least one chore.
-- Uses the household creator as room creator.

INSERT INTO rooms (household_id, name, room_type, is_private, created_by)
SELECT DISTINCT
  c.household_id,
  'General',
  'general',
  false,
  h.created_by
FROM chores c
JOIN households h ON h.id = c.household_id;

-- ============================================================
-- 4. ALTER CHORES — add room_id and effort_points
-- ============================================================

ALTER TABLE chores ADD COLUMN room_id UUID REFERENCES rooms ON DELETE SET NULL;
ALTER TABLE chores ADD COLUMN effort_points INT NOT NULL DEFAULT 1
  CHECK (effort_points >= 1 AND effort_points <= 3);

-- Backfill existing chores → their household's "General" room
UPDATE chores SET room_id = (
  SELECT r.id FROM rooms r
  WHERE r.household_id = chores.household_id
    AND r.room_type = 'general'
  LIMIT 1
)
WHERE room_id IS NULL;

-- Now enforce NOT NULL
ALTER TABLE chores ALTER COLUMN room_id SET NOT NULL;

CREATE INDEX idx_chores_room ON chores(room_id);

-- ============================================================
-- 5. REPLACE CHORES SELECT POLICY (private room awareness)
-- ============================================================
-- Drop the old flat household-based SELECT policy
DROP POLICY "Members can view chores" ON chores;

-- New compound policy: household member AND (room is not private OR room creator)
CREATE POLICY "Members can view chores"
  ON chores FOR SELECT
  USING (
    household_id IN (SELECT public.get_user_household_ids())
    AND (
      EXISTS (
        SELECT 1 FROM rooms r
        WHERE r.id = chores.room_id
          AND (r.is_private = false OR r.created_by = auth.uid())
      )
    )
  );
