-- RoomY Foundation Migration
-- Creates: profiles, households, household_members, household_settings
-- Plus: RLS policies, triggers, functions, indexes

-- ============================================================
-- TABLES
-- ============================================================

-- PROFILES: extends auth.users with app-specific data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  venmo_username TEXT,  -- optional, prompted in Phase 2
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HOUSEHOLDS: the core tenant/group entity
CREATE TABLE households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invite_code_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_members INT DEFAULT 10,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HOUSEHOLD_MEMBERS: junction table (who belongs to which household)
CREATE TABLE household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- HOUSEHOLD_SETTINGS: which modules are enabled
CREATE TABLE household_settings (
  household_id UUID REFERENCES households ON DELETE CASCADE PRIMARY KEY,
  expenses_enabled BOOLEAN DEFAULT true,   -- always true, cannot be disabled
  groceries_enabled BOOLEAN DEFAULT false,
  chores_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users
);

-- ============================================================
-- INDEXES (for RLS subquery performance -- see RESEARCH.md Pitfall 2)
-- ============================================================

CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_household_members_household_id ON household_members(household_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate a human-friendly 8-character invite code
-- Uses uppercase letters + digits, avoiding ambiguous characters (0/O, 1/I/L)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create household_settings when a household is created
CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.household_settings (household_id, updated_by)
  VALUES (new.id, new.created_by);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_household();

-- Set invite_code to a generated code if not provided on household insert
CREATE OR REPLACE FUNCTION public.set_household_invite_code()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  IF new.invite_code IS NULL OR new.invite_code = '' THEN
    new.invite_code := public.generate_invite_code();
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_household_insert
  BEFORE INSERT ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.set_household_invite_code();

-- Join household by invite code (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION join_household_by_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household RECORD;
  v_member_count INT;
BEGIN
  -- Find household by invite code
  SELECT * INTO v_household
  FROM public.households
  WHERE invite_code = code
    AND invite_code_expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count
  FROM public.household_members
  WHERE household_id = v_household.id;

  IF v_member_count >= v_household.max_members THEN
    RAISE EXCEPTION 'Household is full';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household.id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member of this household';
  END IF;

  -- Add member
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household.id, auth.uid(), 'member');

  -- Return household info
  RETURN json_build_object(
    'household_id', v_household.id,
    'household_name', v_household.name,
    'member_count', v_member_count + 1
  );
END;
$$;

-- Updated_at trigger function for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER household_settings_updated_at
  BEFORE UPDATE ON public.household_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid infinite recursion in RLS policies.
-- Policies on household_members cannot reference household_members in a subquery
-- (it triggers the same policy again). This SECURITY DEFINER function bypasses RLS.
CREATE OR REPLACE FUNCTION public.get_user_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid();
$$;

-- PROFILES: users can read/update their own; household members can read each other
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Household members can view each others profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT hm.user_id FROM public.household_members hm
      WHERE hm.household_id IN (SELECT public.get_user_household_ids())
    )
  );

-- HOUSEHOLDS: only members can view; authenticated users can create
CREATE POLICY "Members can view their household"
  ON households FOR SELECT
  USING (id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Creator can view their own household (needed for INSERT...RETURNING before member row exists)
CREATE POLICY "Creator can view own household"
  ON households FOR SELECT
  USING (created_by = auth.uid());

-- Allow household creator to update (e.g., regenerate invite code)
CREATE POLICY "Creator can update household"
  ON households FOR UPDATE
  USING (created_by = auth.uid());

-- HOUSEHOLD_MEMBERS: members can view co-members; creator can insert first member
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- Allow the household creator to insert themselves as the first member
CREATE POLICY "Creator can add themselves as first member"
  ON household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (SELECT id FROM public.households WHERE created_by = auth.uid())
  );

-- HOUSEHOLD_SETTINGS: members can view and update
CREATE POLICY "Members can view household settings"
  ON household_settings FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can update household settings"
  ON household_settings FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- ============================================================
-- SUPABASE STORAGE: AVATARS BUCKET
-- ============================================================

-- Create the avatars bucket (public reads, RLS for writes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- SELECT: Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Users can overwrite their own avatar (needed for upsert)
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
