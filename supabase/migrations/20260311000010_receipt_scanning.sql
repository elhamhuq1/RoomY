-- Receipt Scanning Migration
-- Phase: M002-S01 Receipt Scanning
-- Adds: unit_price + source columns on grocery_items,
--        receipts Storage bucket with RLS,
--        complete_grocery_trip_with_receipt RPC

-- ============================================================
-- COLUMNS
-- ============================================================

-- Nullable — existing items don't have prices
ALTER TABLE grocery_items ADD COLUMN unit_price NUMERIC(10,2);

-- Source provenance: manual (default), receipt, recipe, kroger
ALTER TABLE grocery_items ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

-- ============================================================
-- STORAGE: receipts bucket
-- ============================================================

-- Private bucket for receipt photos, scoped to household_id/ prefix
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- SELECT: Household members can read receipts in their household folder
CREATE POLICY "Household members can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids())
);

-- INSERT: Household members can upload receipts to their household folder
CREATE POLICY "Household members can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids())
);

-- UPDATE: Household members can overwrite receipts in their household folder
CREATE POLICY "Household members can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids())
);

-- DELETE: Household members can delete receipts in their household folder
CREATE POLICY "Household members can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids())
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Extended trip completion that optionally stores per-item prices from a scanned receipt.
-- Identical to complete_grocery_trip except:
--   - Accepts p_item_prices JSONB (array of {name, quantity, price})
--   - After archiving, updates matched items with unit_price and source='receipt'
CREATE OR REPLACE FUNCTION complete_grocery_trip_with_receipt(
  p_household_id UUID,
  p_total_amount NUMERIC,
  p_paid_by UUID,
  p_split_user_ids UUID[],
  p_created_by UUID,
  p_item_prices JSONB DEFAULT NULL
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
  v_item JSONB;
  v_item_name TEXT;
  v_item_price NUMERIC;
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

  -- 4. Apply per-item prices from receipt scan (if provided)
  IF p_item_prices IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_prices)
    LOOP
      v_item_name := v_item->>'name';
      v_item_price := (v_item->>'price')::NUMERIC;

      UPDATE public.grocery_items
      SET unit_price = v_item_price, source = 'receipt'
      WHERE trip_id = v_trip_id
        AND LOWER(name) = LOWER(v_item_name);
    END LOOP;
  END IF;

  -- 5. Create expense
  INSERT INTO public.expenses (household_id, description, amount, paid_by, created_by)
  VALUES (p_household_id, 'Grocery trip', p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_expense_id;

  -- 6. Link expense to trip
  UPDATE public.grocery_trips SET expense_id = v_expense_id WHERE id = v_trip_id;

  -- 7. Create equal splits with penny-accurate rounding
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
