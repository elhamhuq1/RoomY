-- RoomY Chores Migration
-- Creates: chores, chore_completions, chore_swap_requests tables
-- Plus: complete_chore(), claim_chore(), dispute_completion(), resolve_swap_request() RPCs
-- Plus: auto_revert_stale_disputes() worker and pg_cron schedule

-- ============================================================
-- TABLES
-- ============================================================

-- CHORES: master chore definitions and state
CREATE TABLE chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  custom_interval_days INT,
  rotation_order UUID[] NOT NULL DEFAULT '{}',
  current_assignee_index INT NOT NULL DEFAULT 0,
  current_assignee UUID REFERENCES auth.users,
  next_due_at TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- CHORE_COMPLETIONS: history of chore actions
CREATE TABLE chore_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES chores ON DELETE CASCADE NOT NULL,
  completed_by UUID REFERENCES auth.users NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  is_disputed BOOLEAN DEFAULT false,
  disputed_by UUID REFERENCES auth.users,
  disputed_at TIMESTAMPTZ,
  is_reverted BOOLEAN DEFAULT false,
  reverted_at TIMESTAMPTZ
);

-- CHORE_SWAP_REQUESTS: negotiations between members
CREATE TABLE chore_swap_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES chores ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users NOT NULL,
  requested_to UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_chores_household ON chores(household_id) WHERE is_active = true;
CREATE INDEX idx_chore_completions_chore ON chore_completions(chore_id);
CREATE INDEX idx_chore_completions_user ON chore_completions(completed_by);
CREATE INDEX idx_chore_swap_requests_pending ON chore_swap_requests(chore_id) WHERE status = 'pending';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_swap_requests ENABLE ROW LEVEL SECURITY;

-- CHORES: household members can CRUD
CREATE POLICY "Members can view chores"
  ON chores FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create chores"
  ON chores FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update chores"
  ON chores FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete chores"
  ON chores FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- CHORE_COMPLETIONS: household members can view and create via join to chores
CREATE POLICY "Members can view chore completions"
  ON chore_completions FOR SELECT
  USING (
    chore_id IN (
      SELECT id FROM public.chores 
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can mark chores complete"
  ON chore_completions FOR INSERT
  WITH CHECK (
    chore_id IN (
      SELECT id FROM public.chores 
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
    AND completed_by = auth.uid()
  );

-- CHORE_SWAP_REQUESTS: household members can CRUD via join to chores
CREATE POLICY "Members can view swap requests"
  ON chore_swap_requests FOR SELECT
  USING (
    chore_id IN (
      SELECT id FROM public.chores 
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can create swap requests"
  ON chore_swap_requests FOR INSERT
  WITH CHECK (
    chore_id IN (
      SELECT id FROM public.chores 
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Members can update swap requests"
  ON chore_swap_requests FOR UPDATE
  USING (
    chore_id IN (
      SELECT id FROM public.chores 
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- COMPLETE_CHORE: Advances rotation and schedules next due date
CREATE OR REPLACE FUNCTION complete_chore(p_chore_id UUID, p_completed_by UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chore RECORD;
  v_next_index INT;
  v_next_assignee UUID;
  v_next_due_at TIMESTAMPTZ;
  v_completion_id UUID;
BEGIN
  -- 1. Validate chore
  SELECT * INTO v_chore FROM public.chores WHERE id = p_chore_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chore not found or inactive';
  END IF;

  -- 2. Insert completion record
  INSERT INTO public.chore_completions (chore_id, completed_by)
  VALUES (p_chore_id, p_completed_by)
  RETURNING id INTO v_completion_id;

  -- 3. Advance rotation
  IF array_length(v_chore.rotation_order, 1) > 0 THEN
    v_next_index := (v_chore.current_assignee_index + 1) % array_length(v_chore.rotation_order, 1);
    v_next_assignee := v_chore.rotation_order[v_next_index + 1]; -- 1-indexed array
  ELSE
    v_next_index := 0;
    v_next_assignee := v_chore.current_assignee;
  END IF;

  -- 4. Compute next due date
  v_next_due_at := CASE v_chore.frequency
    WHEN 'daily' THEN now() + INTERVAL '1 day'
    WHEN 'weekly' THEN now() + INTERVAL '7 days'
    WHEN 'monthly' THEN now() + INTERVAL '1 month'
    WHEN 'custom' THEN now() + (COALESCE(v_chore.custom_interval_days, 1) || ' days')::INTERVAL
    ELSE now() + INTERVAL '1 day'
  END;

  -- 5. Update chore record
  UPDATE public.chores
  SET 
    current_assignee_index = v_next_index,
    current_assignee = v_next_assignee,
    next_due_at = v_next_due_at,
    last_completed_at = now()
  WHERE id = p_chore_id;

  RETURN json_build_object(
    'completion_id', v_completion_id,
    'next_assignee', v_next_assignee,
    'next_due_at', v_next_due_at
  );
END;
$$;

-- CLAIM_CHORE: Allows anyone to volunteer for a chore
CREATE OR REPLACE FUNCTION claim_chore(p_chore_id UUID, p_claimed_by UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_index INT;
BEGIN
  -- Find index in rotation order
  SELECT array_position(rotation_order, p_claimed_by) INTO v_index
  FROM public.chores WHERE id = p_chore_id;

  IF v_index IS NULL THEN
    RAISE EXCEPTION 'User not in chore rotation';
  END IF;

  UPDATE public.chores
  SET 
    current_assignee = p_claimed_by,
    current_assignee_index = v_index - 1 -- array_position is 1-indexed, we use 0-indexed
  WHERE id = p_chore_id;
END;
$$;

-- DISPUTE_COMPLETION: Flags a completion for review
CREATE OR REPLACE FUNCTION dispute_completion(p_completion_id UUID, p_disputed_by UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chore_completions
  SET 
    is_disputed = true,
    disputed_by = p_disputed_by,
    disputed_at = now()
  WHERE id = p_completion_id AND is_reverted = false;
END;
$$;

-- RESOLVE_SWAP_REQUEST: Finalizes a chore swap
CREATE OR REPLACE FUNCTION resolve_swap_request(p_request_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request RECORD;
  v_index INT;
BEGIN
  UPDATE public.chore_swap_requests
  SET status = p_status, resolved_at = now()
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap request not found or already resolved';
  END IF;

  IF p_status = 'accepted' THEN
    -- Find index of requester in rotation
    SELECT array_position(rotation_order, v_request.requested_by) INTO v_index
    FROM public.chores WHERE id = v_request.chore_id;

    UPDATE public.chores
    SET 
      current_assignee = v_request.requested_by,
      current_assignee_index = COALESCE(v_index - 1, current_assignee_index)
    WHERE id = v_request.chore_id;
  END IF;
END;
$$;

-- AUTO_REVERT_STALE_DISPUTES: Worker function for stale disputes
CREATE OR REPLACE FUNCTION auto_revert_stale_disputes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chore_completions
  SET 
    is_reverted = true,
    reverted_at = now()
  WHERE is_disputed = true 
    AND is_reverted = false 
    AND disputed_at < now() - INTERVAL '24 hours';
END;
$$;

-- ============================================================
-- CRON
-- ============================================================

DO $$
BEGIN
  PERFORM cron.schedule(
    'revert-stale-disputes',
    '0 * * * *', -- hourly
    'SELECT public.auto_revert_stale_disputes()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, stale disputes will be handled client-side fallback.';
END;
$$;
