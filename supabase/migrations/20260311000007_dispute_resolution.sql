-- Dispute Resolution Migration
-- Adds: dispute_reason column, resolve_dispute() function
-- Updates: dispute_completion() to accept a reason parameter

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

-- Add dispute_reason column to chore_completions
ALTER TABLE chore_completions
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update dispute_completion to accept a reason
CREATE OR REPLACE FUNCTION dispute_completion(
  p_completion_id UUID,
  p_disputed_by UUID,
  p_reason TEXT DEFAULT NULL
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
    disputed_at = now(),
    dispute_reason = p_reason
  WHERE id = p_completion_id
    AND is_reverted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found or already reverted';
  END IF;
END;
$$;

-- New: resolve_dispute - allows the disputed user to accept or dismiss the dispute
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_completion_id UUID,
  p_resolved_by UUID,
  p_action TEXT  -- 'accept' (agrees dispute is valid, revert completion) or 'dismiss' (dispute was wrong, keep completion)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_completion RECORD;
BEGIN
  SELECT * INTO v_completion
  FROM public.chore_completions
  WHERE id = p_completion_id
    AND is_disputed = true
    AND is_reverted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Disputed completion not found or already resolved';
  END IF;

  IF p_action = 'accept' THEN
    -- The completion was indeed not done properly - revert it
    UPDATE public.chore_completions SET
      is_reverted = true,
      reverted_at = now()
    WHERE id = p_completion_id;

  ELSIF p_action = 'dismiss' THEN
    -- The dispute was invalid - clear the dispute flags, keep the completion
    UPDATE public.chore_completions SET
      is_disputed = false,
      disputed_by = NULL,
      disputed_at = NULL,
      dispute_reason = NULL
    WHERE id = p_completion_id;

  ELSE
    RAISE EXCEPTION 'Invalid action. Use ''accept'' or ''dismiss''.';
  END IF;
END;
$$;
