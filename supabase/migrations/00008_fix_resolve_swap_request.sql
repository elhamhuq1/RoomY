-- Fix resolve_swap_request: Instead of raising exception when accepter
-- is not in rotation_order, add them to it. This handles the case where
-- a swap request was sent to someone not in the chore's rotation.

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
