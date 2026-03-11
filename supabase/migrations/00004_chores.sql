-- RoomY Chores Migration
-- Creates: chores, chore_assignments tables
-- Plus: RLS policies, indexes, triggers

-- ============================================================
-- TABLES
-- ============================================================

-- CHORES: chore definitions (recurring templates)
CREATE TABLE chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  effort_points INTEGER NOT NULL DEFAULT 1 CHECK (effort_points BETWEEN 1 AND 5),
  recurrence TEXT NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly', 'once')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CHORE_ASSIGNMENTS: specific instances of chores assigned to members
CREATE TABLE chore_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES chores ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_chores_household_id ON chores(household_id);
CREATE INDEX idx_chores_active ON chores(household_id, is_active);
CREATE INDEX idx_chore_assignments_chore_id ON chore_assignments(chore_id);
CREATE INDEX idx_chore_assignments_assigned_to ON chore_assignments(assigned_to);
CREATE INDEX idx_chore_assignments_due_date ON chore_assignments(due_date);
CREATE INDEX idx_chore_assignments_status ON chore_assignments(chore_id, status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Reuse existing update_updated_at() function
CREATE TRIGGER chores_updated_at
  BEFORE UPDATE ON public.chores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;

-- CHORES: household members can CRUD
CREATE POLICY "Members can view household chores"
  ON chores FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create household chores"
  ON chores FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update household chores"
  ON chores FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete household chores"
  ON chores FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- CHORE_ASSIGNMENTS: access based on parent chore's household membership
CREATE POLICY "Members can view chore assignments"
  ON chore_assignments FOR SELECT
  USING (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can create chore assignments"
  ON chore_assignments FOR INSERT
  WITH CHECK (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can update chore assignments"
  ON chore_assignments FOR UPDATE
  USING (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can delete chore assignments"
  ON chore_assignments FOR DELETE
  USING (
    chore_id IN (
      SELECT id FROM public.chores
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );
