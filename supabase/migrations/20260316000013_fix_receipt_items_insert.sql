-- Fix: insert receipt items as grocery_items when they don't already exist in the list
-- Without this, scanned items that weren't on the grocery list never become rows and
-- trip history shows 0 items.

CREATE OR REPLACE FUNCTION complete_grocery_trip_with_receipt(
  p_household_id UUID,
  p_total_amount NUMERIC,
  p_paid_by UUID,
  p_split_user_ids UUID[],
  p_created_by UUID,
  p_item_prices JSONB DEFAULT NULL,
  p_item_assignments JSONB DEFAULT NULL
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
  v_item_qty INT;
  v_matched_count INT;
  v_assigned_to UUID;
  v_assignment JSONB;
  v_user_shares JSONB := '{}'::JSONB;
  v_assigned_total NUMERIC := 0;
  v_unassigned_total NUMERIC := 0;
  v_unassigned_share NUMERIC;
  v_user_share NUMERIC;
  v_has_ownership_splits BOOLEAN := false;
  v_split_count INT;
BEGIN
  v_split_count := array_length(p_split_user_ids, 1);

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

  -- 4. Insert receipt items that don't already exist as archived grocery_items
  --    This ensures scanned items appear in trip history even if they weren't on the list
  IF p_item_prices IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_prices)
    LOOP
      v_item_name := v_item->>'name';
      v_item_price := (v_item->>'price')::NUMERIC;
      v_item_qty := COALESCE((v_item->>'quantity')::INT, 1);

      -- Check if an archived item with this name already exists on this trip
      SELECT COUNT(*) INTO v_matched_count
      FROM public.grocery_items
      WHERE trip_id = v_trip_id AND LOWER(name) = LOWER(v_item_name);

      IF v_matched_count > 0 THEN
        -- Update existing item with receipt price
        UPDATE public.grocery_items
        SET unit_price = v_item_price, source = 'receipt'
        WHERE trip_id = v_trip_id AND LOWER(name) = LOWER(v_item_name);
      ELSE
        -- Insert new item directly archived to this trip
        INSERT INTO public.grocery_items (
          household_id, name, quantity, is_checked, trip_id, archived_at,
          unit_price, source, created_by
        ) VALUES (
          p_household_id, v_item_name, v_item_qty, true, v_trip_id, now(),
          v_item_price, 'receipt', p_created_by
        );
      END IF;
    END LOOP;
  END IF;

  -- 5. Apply item assignments (if provided)
  IF p_item_assignments IS NOT NULL THEN
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_item_assignments)
    LOOP
      v_item_name := v_assignment->>'name';
      v_assigned_to := (v_assignment->>'assigned_to')::UUID;

      UPDATE public.grocery_items
      SET assigned_to = v_assigned_to
      WHERE trip_id = v_trip_id
        AND LOWER(name) = LOWER(v_item_name);
    END LOOP;
  END IF;

  -- 6. Create expense
  INSERT INTO public.expenses (household_id, description, amount, paid_by, created_by)
  VALUES (p_household_id, 'Grocery trip', p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_expense_id;

  -- 7. Link expense to trip
  UPDATE public.grocery_trips SET expense_id = v_expense_id WHERE id = v_trip_id;

  -- 8. Calculate splits — ownership-based if assignments exist, else even
  SELECT COALESCE(SUM(unit_price), 0) INTO v_assigned_total
  FROM public.grocery_items
  WHERE trip_id = v_trip_id AND assigned_to IS NOT NULL AND unit_price IS NOT NULL;

  IF v_assigned_total > 0 THEN
    v_has_ownership_splits := true;

    FOR v_user_id IN SELECT DISTINCT assigned_to FROM public.grocery_items
      WHERE trip_id = v_trip_id AND assigned_to IS NOT NULL AND unit_price IS NOT NULL
    LOOP
      SELECT COALESCE(SUM(unit_price), 0) INTO v_user_share
      FROM public.grocery_items
      WHERE trip_id = v_trip_id AND assigned_to = v_user_id AND unit_price IS NOT NULL;

      v_user_shares := v_user_shares || jsonb_build_object(v_user_id::TEXT, v_user_share);
    END LOOP;

    v_unassigned_total := p_total_amount - v_assigned_total;

    IF v_unassigned_total > 0 AND v_split_count > 0 THEN
      v_unassigned_share := ROUND(v_unassigned_total / v_split_count, 2);
    ELSE
      v_unassigned_share := 0;
    END IF;

    FOREACH v_user_id IN ARRAY p_split_user_ids
    LOOP
      v_user_share := COALESCE((v_user_shares->>v_user_id::TEXT)::NUMERIC, 0) + v_unassigned_share;

      IF v_user_share > 0 THEN
        INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
        VALUES (v_expense_id, v_user_id, ROUND(v_user_share, 2));
      END IF;
    END LOOP;
  ELSE
    v_share := ROUND(p_total_amount / v_split_count, 2);
    FOREACH v_user_id IN ARRAY p_split_user_ids
    LOOP
      INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
      VALUES (v_expense_id, v_user_id, v_share);
    END LOOP;
  END IF;

  RETURN json_build_object(
    'trip_id', v_trip_id,
    'expense_id', v_expense_id,
    'split_mode', CASE WHEN v_has_ownership_splits THEN 'ownership' ELSE 'even' END
  );
END;
$$;
