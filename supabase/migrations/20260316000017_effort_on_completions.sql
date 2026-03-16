-- Add effort_points to chore_completions so each completion carries the chore's
-- effort weight at the time it was completed.  DEFAULT 1 backfills existing rows.

ALTER TABLE public.chore_completions
  ADD COLUMN effort_points INT NOT NULL DEFAULT 1;

-- Replace complete_chore RPC to stamp effort_points from the chore record onto
-- each new completion row.  Signature and behaviour are otherwise identical to
-- the original in 20260311000004_chores.sql.

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

  -- Record completion with effort_points from the chore definition
  INSERT INTO public.chore_completions (chore_id, completed_by, effort_points)
  VALUES (p_chore_id, p_completed_by, v_chore.effort_points)
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
