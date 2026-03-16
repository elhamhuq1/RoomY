# T02: 04-engagement 02

**Slice:** S05 — **Milestone:** M001

## Description

Database migration for notification preferences and push token storage, plus Supabase Edge Functions for expense notifications and daily chore reminders.

Purpose: Build the server-side push notification pipeline so household members are informed about new expenses (PUSH-01) and upcoming chores (PUSH-02). PUSH-03 (grocery notifications) is explicitly not implemented per user decision. Edge Functions handle notification dispatch via Expo Push API.
Output: Migration SQL, two Edge Functions, updated TypeScript types.

## Must-Haves

- [x] "Database has notification_preferences table with per-user expense and chore toggles"
- [x] "Profiles table has expo_push_token column for storing device tokens"
- [x] "Edge Function for expense notifications sends push to household members when expense is created"
- [x] "Edge Function for chore reminders queries chores due today and sends morning reminders"
- [x] "Notification preferences are respected -- users with disabled toggles do not receive push"
- [x] "PUSH-03 (grocery notifications) is explicitly not implemented per user decision"

## Files

- `supabase/migrations/00005_notifications.sql`
- `supabase/functions/push-expense/index.ts`
- `supabase/functions/push-chore-reminder/index.ts`
- `lib/types/database.ts`
