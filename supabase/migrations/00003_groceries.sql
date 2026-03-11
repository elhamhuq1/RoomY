-- RoomY Groceries Migration
-- Creates: grocery_lists, grocery_items tables
-- Plus: RLS policies, indexes, triggers

-- ============================================================
-- TABLES
-- ============================================================

-- GROCERY_LISTS: represents a shopping trip/list
CREATE TABLE grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Shopping List',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'shopping', 'completed')),
  shopper_id UUID REFERENCES auth.users,
  total_amount NUMERIC(10,2),
  expense_id UUID REFERENCES expenses,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- GROCERY_ITEMS: individual items on a list
CREATE TABLE grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES grocery_lists ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT,
  notes TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  checked_by UUID REFERENCES auth.users,
  added_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_grocery_lists_household_id ON grocery_lists(household_id);
CREATE INDEX idx_grocery_lists_status ON grocery_lists(household_id, status);
CREATE INDEX idx_grocery_items_list_id ON grocery_items(list_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- GROCERY_LISTS: household members can CRUD
CREATE POLICY "Members can view household grocery lists"
  ON grocery_lists FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create household grocery lists"
  ON grocery_lists FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update household grocery lists"
  ON grocery_lists FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete household grocery lists"
  ON grocery_lists FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- GROCERY_ITEMS: access based on parent list's household membership
CREATE POLICY "Members can view grocery items"
  ON grocery_items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM public.grocery_lists
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can create grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM public.grocery_lists
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
    AND added_by = auth.uid()
  );

CREATE POLICY "Members can update grocery items"
  ON grocery_items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM public.grocery_lists
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can delete grocery items"
  ON grocery_items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM public.grocery_lists
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );
