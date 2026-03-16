-- RoomY Groceries Migration
-- Creates: grocery_trips, grocery_items tables
-- Plus: complete_grocery_trip() RPC function, RLS policies, indexes, realtime publication

-- ============================================================
-- TABLES
-- ============================================================

-- GROCERY_TRIPS: completed shopping runs (archive)
-- Must be created FIRST because grocery_items references it
CREATE TABLE grocery_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- GROCERY_ITEMS: active grocery list items
CREATE TABLE grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  is_checked BOOLEAN DEFAULT false,
  trip_id UUID REFERENCES grocery_trips(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Partial index: only active (non-archived) items for fast list queries
CREATE INDEX idx_grocery_items_household ON grocery_items(household_id)
  WHERE trip_id IS NULL;

CREATE INDEX idx_grocery_items_trip ON grocery_items(trip_id);
CREATE INDEX idx_grocery_trips_household ON grocery_trips(household_id);

-- ============================================================
-- REALTIME
-- ============================================================

-- Required for non-PK column filtering on UPDATE events
ALTER TABLE grocery_items REPLICA IDENTITY FULL;

-- Required for Supabase Realtime to broadcast changes
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_trips ENABLE ROW LEVEL SECURITY;

-- GROCERY_ITEMS: household members can CRUD
CREATE POLICY "Members can view grocery items"
  ON grocery_items FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can add grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update grocery items"
  ON grocery_items FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete grocery items"
  ON grocery_items FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- GROCERY_TRIPS: household members can view and create
CREATE POLICY "Members can view grocery trips"
  ON grocery_trips FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create grocery trips"
  ON grocery_trips FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Atomic trip completion: archives checked items, creates expense + splits, clears list
CREATE OR REPLACE FUNCTION complete_grocery_trip(
  p_household_id UUID,
  p_total_amount NUMERIC,
  p_paid_by UUID,
  p_split_user_ids UUID[],
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip_id UUID;
  v_expense_id UUID;
  v_share NUMERIC;
  v_user_id UUID;
BEGIN
  -- 1. Create trip record
  INSERT INTO public.grocery_trips (household_id, total_amount, paid_by, created_by)
  VALUES (p_household_id, p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_trip_id;

  -- 2. Archive checked items to the trip
  UPDATE public.grocery_items
  SET trip_id = v_trip_id, archived_at = now()
  WHERE household_id = p_household_id AND is_checked = true AND trip_id IS NULL;

  -- 3. Delete unchecked items (fresh start)
  DELETE FROM public.grocery_items
  WHERE household_id = p_household_id AND is_checked = false AND trip_id IS NULL;

  -- 4. Create expense
  INSERT INTO public.expenses (household_id, description, amount, paid_by, created_by)
  VALUES (p_household_id, 'Grocery trip', p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_expense_id;

  -- 5. Link expense to trip
  UPDATE public.grocery_trips SET expense_id = v_expense_id WHERE id = v_trip_id;

  -- 6. Create equal splits with penny-accurate rounding
  v_share := ROUND(p_total_amount / array_length(p_split_user_ids, 1), 2);
  FOREACH v_user_id IN ARRAY p_split_user_ids
  LOOP
    INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
    VALUES (v_expense_id, v_user_id, v_share);
  END LOOP;

  RETURN json_build_object(
    'trip_id', v_trip_id,
    'expense_id', v_expense_id
  );
END;
$$;
