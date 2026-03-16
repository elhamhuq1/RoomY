# S05: Engagement

**Goal:** Shared household calendar on the Home tab showing expenses and chore schedules as color-coded dots on a month grid, with tappable day detail expansion.
**Demo:** Shared household calendar on the Home tab showing expenses and chore schedules as color-coded dots on a month grid, with tappable day detail expansion.

## Must-Haves


## Tasks

- [x] **T01: 04-engagement 01** `est:4min`
  - Shared household calendar on the Home tab showing expenses and chore schedules as color-coded dots on a month grid, with tappable day detail expansion.

Purpose: Users can see upcoming obligations and past activity at a glance without navigating to individual module tabs. This satisfies CALC-01 (shared calendar) and CALC-02 (recurring events on calendar).
Output: Calendar utility functions and updated Home tab with integrated calendar section.
- [x] **T02: 04-engagement 02** `est:3min`
  - Database migration for notification preferences and push token storage, plus Supabase Edge Functions for expense notifications and daily chore reminders.

Purpose: Build the server-side push notification pipeline so household members are informed about new expenses (PUSH-01) and upcoming chores (PUSH-02). PUSH-03 (grocery notifications) is explicitly not implemented per user decision. Edge Functions handle notification dispatch via Expo Push API.
Output: Migration SQL, two Edge Functions, updated TypeScript types.
- [x] **T03: 04-engagement 03**
  - Client-side push notification registration, notification handler with deep-linking, Android channel setup, and notification preferences settings screen.

Purpose: Complete the push notification pipeline by connecting the mobile client to the server-side Edge Functions. Users can receive push notifications for expenses and chores, tap them to navigate to the relevant screen, and control which notifications they receive via per-type toggles in Settings.
Output: Notification utility library, updated root layout, notification settings screen.
- [x] **T04: 04-engagement 04** `est:2min`
  - Fix two UAT-reported gaps in the Phase 4 engagement features: (1) bound the day event list height on the Home tab calendar so it shows max 5 items with scrolling for overflow, and (2) add a projectId guard in push token registration to prevent crashes in Expo Go.

Purpose: Close blocker (push crash) and minor UX issue (unbounded event list) identified during user acceptance testing.
Output: Patched index.tsx and notifications.ts files.

## Files Likely Touched

- `lib/calendar-utils.ts`
- `app/(app)/(tabs)/index.tsx`
- `lib/types/database.ts`
- `supabase/migrations/00005_notifications.sql`
- `supabase/functions/push-expense/index.ts`
- `supabase/functions/push-chore-reminder/index.ts`
- `lib/types/database.ts`
- `lib/notifications.ts`
- `app/_layout.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/notifications.tsx`
- `app/(app)/(tabs)/index.tsx`
- `lib/notifications.ts`
