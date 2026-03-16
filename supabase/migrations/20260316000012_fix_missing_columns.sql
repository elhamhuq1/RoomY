-- Fixup: add columns from migration 00010 that were never applied to remote
-- unit_price and source columns on grocery_items, plus receipts storage bucket

ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);

DO $$
BEGIN
  ALTER TABLE grocery_items ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Receipts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Household members can view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Household members can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Household members can update receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Household members can delete receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_household_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
