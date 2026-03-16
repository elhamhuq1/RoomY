# T04: 04-engagement 04

**Slice:** S05 — **Milestone:** M001

## Description

Fix two UAT-reported gaps in the Phase 4 engagement features: (1) bound the day event list height on the Home tab calendar so it shows max 5 items with scrolling for overflow, and (2) add a projectId guard in push token registration to prevent crashes in Expo Go.

Purpose: Close blocker (push crash) and minor UX issue (unbounded event list) identified during user acceptance testing.
Output: Patched index.tsx and notifications.ts files.

## Must-Haves

- [x] "Day event list on Home tab shows at most 5 items without scrolling; additional items are reachable by scrolling within a bounded container"
- [x] "Push token registration does not crash in Expo Go or when projectId is unavailable; the app continues to function without push"
- [x] "Notification preferences screen loads without error regardless of push token state"

## Files

- `app/(app)/(tabs)/index.tsx`
- `lib/notifications.ts`
