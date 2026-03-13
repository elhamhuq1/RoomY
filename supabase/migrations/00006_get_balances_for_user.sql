-- RoomY: get_balances_for_user() function
-- Like get_household_balances() but parameterized by user_id instead of auth.uid().
-- Returns net balances between a specified user and each other household member.
-- Used by expense dropdown to show payment status from the payer's perspective.

CREATE OR REPLACE FUNCTION get_balances_for_user(p_household_id UUID, p_user_id UUID)
RETURNS TABLE(user_id UUID, net_amount NUMERIC)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  WITH expense_debts AS (
    -- Money owed TO the payer BY each split member (excluding self-splits)
    SELECT
      e.paid_by AS creditor,
      es.user_id AS debtor,
      es.share_amount AS amount
    FROM public.expenses e
    JOIN public.expense_splits es ON es.expense_id = e.id
    WHERE e.household_id = p_household_id
      AND e.paid_by != es.user_id
  ),
  settlement_credits AS (
    SELECT
      s.paid_by AS debtor,
      s.paid_to AS creditor,
      s.amount
    FROM public.settlements s
    WHERE s.household_id = p_household_id
  ),
  -- Net from p_user_id's perspective
  -- Positive = other person owes p_user_id, Negative = p_user_id owes them
  combined AS (
    -- p_user_id paid, they owe p_user_id
    SELECT debtor AS other_user, amount
    FROM expense_debts WHERE creditor = p_user_id
    UNION ALL
    -- They paid, p_user_id owes them (negative)
    SELECT creditor AS other_user, -amount
    FROM expense_debts WHERE debtor = p_user_id
    UNION ALL
    -- p_user_id settled (paid them), reduces what p_user_id owes
    SELECT creditor AS other_user, amount
    FROM settlement_credits WHERE debtor = p_user_id
    UNION ALL
    -- They settled (paid p_user_id), reduces what they owe p_user_id
    SELECT debtor AS other_user, -amount
    FROM settlement_credits WHERE creditor = p_user_id
  )
  SELECT other_user AS user_id, SUM(amount) AS net_amount
  FROM combined
  WHERE other_user != p_user_id
  GROUP BY other_user;
$$;
