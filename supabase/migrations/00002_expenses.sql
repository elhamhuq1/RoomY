-- RoomY Expense Splitting Migration
-- Creates: expenses, expense_splits, settlements tables
-- Plus: get_household_balances() function, RLS policies, indexes, triggers

-- ============================================================
-- TABLES
-- ============================================================

-- EXPENSES: header record for each expense
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_by UUID REFERENCES auth.users NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- EXPENSE_SPLITS: per-member share of each expense
CREATE TABLE expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  share_amount NUMERIC(10,2) NOT NULL CHECK (share_amount > 0),
  UNIQUE(expense_id, user_id)
);

-- SETTLEMENTS: payments between users to settle debts
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES auth.users NOT NULL,
  paid_to UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_expenses_household_id ON expenses(household_id);
CREATE INDEX idx_expenses_created_at ON expenses(household_id, created_at DESC);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_settlements_household_id ON settlements(household_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Returns net balances between current user and each household member
-- Positive = they owe you, Negative = you owe them
CREATE OR REPLACE FUNCTION get_household_balances(p_household_id UUID)
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
  -- Net from current user's perspective
  -- Positive = other person owes me, Negative = I owe them
  combined AS (
    -- I paid, they owe me
    SELECT debtor AS other_user, amount
    FROM expense_debts WHERE creditor = auth.uid()
    UNION ALL
    -- They paid, I owe them (negative)
    SELECT creditor AS other_user, -amount
    FROM expense_debts WHERE debtor = auth.uid()
    UNION ALL
    -- I settled (paid them), reduces what I owe (positive for them)
    SELECT creditor AS other_user, -amount
    FROM settlement_credits WHERE debtor = auth.uid()
    UNION ALL
    -- They settled (paid me), reduces what they owe
    SELECT debtor AS other_user, amount
    FROM settlement_credits WHERE creditor = auth.uid()
  )
  SELECT other_user AS user_id, SUM(amount) AS net_amount
  FROM combined
  WHERE other_user != auth.uid()
  GROUP BY other_user
  HAVING SUM(amount) != 0;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Reuse existing update_updated_at() function from 00001_foundation.sql
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all 3 tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- EXPENSES: household members can CRUD
CREATE POLICY "Members can view household expenses"
  ON expenses FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create household expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update household expenses"
  ON expenses FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete household expenses"
  ON expenses FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- EXPENSE_SPLITS: access based on parent expense's household membership
CREATE POLICY "Members can view expense splits"
  ON expense_splits FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can create expense splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

CREATE POLICY "Members can delete expense splits"
  ON expense_splits FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE household_id IN (SELECT public.get_user_household_ids())
    )
  );

-- SETTLEMENTS: household members can view and create
CREATE POLICY "Members can view household settlements"
  ON settlements FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create household settlements"
  ON settlements FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );
