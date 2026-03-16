-- RoomY Chores Migration
-- Creates: chores, chore_completions, chore_swap_requests tables
-- Plus: complete_chore(), claim_chore(), dispute_completion(), resolve_swap_request(),
--        auto_revert_stale_disputes() functions, RLS policies, indexes, pg_cron schedule

-- ============================================================
-- TABLES
-- ============================================================

-- CHORES: chore definition (what + how often + rotation)
CREATE TABLE chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  custom_interval_days INT,  -- only used when frequency = 'custom'
  -- Rotation tracking
  rotation_order UUID[] NOT NULL DEFAULT '{}',  -- ordered array of user_ids
  current_assignee_index INT NOT NULL DEFAULT 0,
  current_assignee UUID REFERENCES auth.users,
  -- Timing
  next_due_at TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- CHORE_COMPLETIONS: completion history (one row per "done" action)
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

-- CHORE_SWAP_REQUESTS: swap negotiation between members
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

-- CHORE_COMPLETIONS: household members can view and create (via chores join)
CREATE POLICY "Members can view chore completions"
  ON chore_completions FOR SELECT
  USING (chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids())));

CREATE POLICY "Members can create chore completions"
  ON chore_completions FOR INSERT
  WITH CHECK (
    chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids()))
    AND completed_by = auth.uid()
  );

CREATE POLICY "Members can update chore completions"
  ON chore_completions FOR UPDATE
  USING (chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids())));

-- CHORE_SWAP_REQUESTS: household members can view and create (via chores join)
CREATE POLICY "Members can view swap requests"
  ON chore_swap_requests FOR SELECT
  USING (chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids())));

CREATE POLICY "Members can create swap requests"
  ON chore_swap_requests FOR INSERT
  WITH CHECK (
    chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids()))
    AND requested_by = auth.uid()
  );

CREATE POLICY "Members can update swap requests"
  ON chore_swap_requests FOR UPDATE
  USING (chore_id IN (SELECT id FROM public.chores WHERE household_id IN (SELECT public.get_user_household_ids())));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- 1. complete_chore: mark complete + rotate + set next due date (atomic)
CREATE OR REPLACE FUNCTION complete_chore(
  p_chore_id UUID,
  p_completed_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chore RECORD;
  v_next_index INT;
  v_next_assignee UUID;
  v_next_due TIMESTAMPTZ;
  v_completion_id UUID;
BEGIN
  SELECT * INTO v_chore FROM public.chores WHERE id = p_chore_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chore not found or inactive';
  END IF;

  -- Record completion
  INSERT INTO public.chore_completions (chore_id, completed_by)
  VALUES (p_chore_id, p_completed_by)
  RETURNING id INTO v_completion_id;

  -- Advance rotation (round-robin)
  v_next_index := (v_chore.current_assignee_index + 1) % array_length(v_chore.rotation_order, 1);
  v_next_assignee := v_chore.rotation_order[v_next_index + 1]; -- Postgres arrays are 1-indexed

  -- Compute next due date
  v_next_due := CASE v_chore.frequency
    WHEN 'daily'   THEN now() + interval '1 day'
    WHEN 'weekly'  THEN now() + interval '7 days'
    WHEN 'monthly' THEN now() + interval '1 month'
    WHEN 'custom'  THEN now() + (v_chore.custom_interval_days || ' days')::interval
  END;

  -- Update chore
  UPDATE public.chores SET
    current_assignee_index = v_next_index,
    current_assignee = v_next_assignee,
    next_due_at = v_next_due,
    last_completed_at = now()
  WHERE id = p_chore_id;

  RETURN json_build_object(
    'completion_id', v_completion_id,
    'next_assignee', v_next_assignee,
    'next_due_at', v_next_due
  );
END;
$$;

-- 2. claim_chore: volunteer/claim a chore assigned to someone else
CREATE OR REPLACE FUNCTION claim_chore(
  p_chore_id UUID,
  p_claimed_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chore RECORD;
  v_position INT;
BEGIN
  SELECT * INTO v_chore FROM public.chores WHERE id = p_chore_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chore not found or inactive';
  END IF;

  -- Find the claimer's position in the rotation order
  v_position := array_position(v_chore.rotation_order, p_claimed_by);
  IF v_position IS NULL THEN
    RAISE EXCEPTION 'User is not in the rotation order for this chore';
  END IF;

  -- Update current assignee and index (0-based index = position - 1 since Postgres arrays are 1-indexed)
  UPDATE public.chores SET
    current_assignee = p_claimed_by,
    current_assignee_index = v_position - 1
  WHERE id = p_chore_id;
END;
$$;

-- 3. dispute_completion: flag a completion as not actually done
CREATE OR REPLACE FUNCTION dispute_completion(
  p_completion_id UUID,
  p_disputed_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chore_completions SET
    is_disputed = true,
    disputed_by = p_disputed_by,
    disputed_at = now()
  WHERE id = p_completion_id
    AND is_reverted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found or already reverted';
  END IF;
END;
$$;

-- 4. resolve_swap_request: accept or decline a swap request
CREATE OR REPLACE FUNCTION resolve_swap_request(
  p_request_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request RECORD;
  v_position INT;
BEGIN
  SELECT * INTO v_request FROM public.chore_swap_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap request not found or already resolved';
  END IF;

  -- Update the swap request status
  UPDATE public.chore_swap_requests SET
    status = p_status,
    resolved_at = now()
  WHERE id = p_request_id;

  -- If accepted, reassign the chore to the accepter (requested_to)
  IF p_status = 'accepted' THEN
    v_position := (SELECT array_position(rotation_order, v_request.requested_to)
                   FROM public.chores WHERE id = v_request.chore_id);

    -- If accepter is not in rotation, add them
    IF v_position IS NULL THEN
      UPDATE public.chores SET
        rotation_order = array_append(rotation_order, v_request.requested_to)
      WHERE id = v_request.chore_id;
      v_position := (SELECT array_length(rotation_order, 1)
                     FROM public.chores WHERE id = v_request.chore_id);
    END IF;

    UPDATE public.chores SET
      current_assignee = v_request.requested_to,
      current_assignee_index = v_position - 1
    WHERE id = v_request.chore_id;
  END IF;
END;
$$;

-- 5. auto_revert_stale_disputes: revert disputed completions older than 24 hours
CREATE OR REPLACE FUNCTION auto_revert_stale_disputes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chore_completions
  SET is_reverted = true, reverted_at = now()
  WHERE is_disputed = true
    AND is_reverted = false
    AND disputed_at < now() - interval '24 hours';
END;
$$;

-- ============================================================
-- PG_CRON SCHEDULE (with fallback if pg_cron not enabled)
-- ============================================================

DO $$
BEGIN
  PERFORM cron.schedule(
    'revert-stale-disputes',
    '0 * * * *',
    'SELECT public.auto_revert_stale_disputes()'
  );
  RAISE NOTICE 'pg_cron job scheduled: revert-stale-disputes (hourly)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron is not available. Stale disputes will be checked client-side. Error: %', SQLERRM;
END;
$$;
