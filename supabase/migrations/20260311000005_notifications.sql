-- Notification Preferences & Push Token Migration
-- Creates: notification_preferences table, expo_push_token column on profiles
-- Plus: RLS policies, triggers, indexes

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

-- Add expo_push_token column to profiles for storing device push tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Per-user notification preferences (no groceries_enabled -- user decided no grocery notifications)
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  expenses_enabled BOOLEAN DEFAULT true,
  chores_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notification preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own notification preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own notification preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Reuse existing update_updated_at function from foundation migration
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for Edge Function push token lookups (only index non-null tokens)
CREATE INDEX idx_profiles_push_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;
