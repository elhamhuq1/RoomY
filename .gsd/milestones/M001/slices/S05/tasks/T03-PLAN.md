# T03: 04-engagement 03

**Slice:** S05 — **Milestone:** M001

## Description

Client-side push notification registration, notification handler with deep-linking, Android channel setup, and notification preferences settings screen.

Purpose: Complete the push notification pipeline by connecting the mobile client to the server-side Edge Functions. Users can receive push notifications for expenses and chores, tap them to navigate to the relevant screen, and control which notifications they receive via per-type toggles in Settings.
Output: Notification utility library, updated root layout, notification settings screen.

## Must-Haves

- [x] "App registers for push notifications on launch and stores token in profiles table"
- [x] "Notification tap navigates to the relevant expense or chore screen"
- [x] "User can toggle expense and chore notifications on/off in Settings"
- [x] "Notification preferences persist across app restarts"
- [x] "Android notification channels are configured for expenses and chores"

## Files

- `lib/notifications.ts`
- `app/_layout.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/notifications.tsx`
