---
phase: 04-engagement
plan: 02
subsystem: database, api
tags: [supabase, edge-functions, push-notifications, expo-push-api, deno, rls, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: profiles table, update_updated_at trigger function, get_user_household_ids helper
  - phase: 02-expenses
    provides: expenses table (webhook trigger source)
  - phase: 03.1-chores
    provides: chores table with next_due_at, current_assignee, is_active columns
provides:
  - notification_preferences table with per-user expense/chore toggles
  - expo_push_token column on profiles table
  - Edge Function for expense push notifications (webhook trigger)
  - Edge Function for daily chore reminder push notifications (cron trigger)
  - NotificationPreferences TypeScript interface
affects: [04-engagement-plan-03, settings-notifications-ui, push-token-registration]

# Tech tracking
tech-stack:
  added: [supabase-edge-functions, deno, expo-push-api]
  patterns: [database-webhook-to-edge-function, service-role-key-bypass-rls, notification-preference-filtering]

key-files:
  created:
    - supabase/migrations/00005_notifications.sql
    - supabase/functions/push-expense/index.ts
    - supabase/functions/push-chore-reminder/index.ts
  modified:
    - lib/types/database.ts

key-decisions:
  - "Individual notifications for v1 -- grouping deferred to v2 per research recommendation (low frequency in 2-4 person households)"
  - "No grocery notifications per user decision (PUSH-03 explicitly not implemented)"
  - "UTC-based chore reminder timing for v1 -- timezone handling deferred"
  - "Service role key in Edge Functions to bypass RLS for cross-user queries"
  - "Default notification preferences to enabled (no pref row = notifications on)"

patterns-established:
  - "Edge Function pattern: Deno.serve, createClient with service role key, graceful error handling returning 200"
  - "Notification preference check: query notification_preferences, build Map, filter by preference with default-true logic"
  - "Expo Push API batch send: POST array of notification objects to exp.host/--/api/v2/push/send"

requirements-completed: [PUSH-01, PUSH-02, PUSH-03]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 4 Plan 2: Push Notification Server Pipeline Summary

**Notification preferences migration with RLS, plus Supabase Edge Functions for expense webhook push and daily chore reminder cron via Expo Push API**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T01:41:45Z
- **Completed:** 2026-03-12T01:45:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- notification_preferences table with per-user expense/chore toggles and full RLS enforcement
- expo_push_token column on profiles with partial index for efficient Edge Function lookups
- push-expense Edge Function handles INSERT webhook, queries household members, checks preferences, sends via Expo Push API
- push-chore-reminder Edge Function queries chores due today, checks assignee preferences, batch-sends reminders
- TypeScript types updated with NotificationPreferences interface and expo_push_token on Profile

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification database migration and update TypeScript types** - `f077a90` (feat)
2. **Task 2: Create Supabase Edge Functions for push notifications** - `0e6422e` (feat)

## Files Created/Modified
- `supabase/migrations/00005_notifications.sql` - notification_preferences table, expo_push_token column, RLS policies, index
- `supabase/functions/push-expense/index.ts` - Edge Function for expense INSERT webhook push notifications
- `supabase/functions/push-chore-reminder/index.ts` - Edge Function for daily chore reminder push notifications (cron)
- `lib/types/database.ts` - Added NotificationPreferences interface, expo_push_token to Profile, notification_preferences to Database type

## Decisions Made
- Individual notifications for v1 -- grouping deferred to v2 (research recommendation: low frequency in small households makes grouping rarely triggered)
- PUSH-03 (grocery notifications) explicitly not implemented per user decision -- no groceries_enabled column or logic
- Chore reminder timing uses UTC for v1 -- cron at 1 PM UTC (~8 AM EST); proper timezone handling deferred
- Edge Functions return 200 even on errors to avoid webhook/cron retry storms on bad data
- Default notification preference is enabled -- users without a preference row receive notifications (opt-out model)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Previously staged Phase 4 Plan 01 files included in Task 1 commit**
- **Found during:** Task 1 (commit)
- **Issue:** `git add` picked up previously staged files from Plan 04-01 work (calendar-utils.ts, date-fns, react-native-calendars in package.json/lock)
- **Fix:** These are legitimate Phase 4 artifacts that were pending commit; no code changes needed. Documented in summary.
- **Files affected:** lib/calendar-utils.ts, package.json, package-lock.json
- **Verification:** All Task 1 target files correctly included; extra files are valid Phase 4 code
- **Committed in:** f077a90

---

**Total deviations:** 1 auto-documented (1 blocking -- git staging)
**Impact on plan:** Minor -- no incorrect code shipped. Plan 04-01 artifacts were legitimate pending work.

## Issues Encountered
None -- plan executed as specified.

## User Setup Required

**External services require manual configuration:**
1. **Apply migration:** Run `00005_notifications.sql` via Supabase Dashboard SQL Editor or MCP apply_migration
2. **Database Webhook:** Configure Supabase Dashboard > Database > Webhooks > New webhook on `expenses` table INSERT events, pointing to the `push-expense` Edge Function
3. **Cron schedule:** Configure Supabase Dashboard > Edge Functions > `push-chore-reminder` > Schedule with cron expression `0 13 * * *` (1 PM UTC / ~8 AM EST daily)
4. **Deploy Edge Functions:** `supabase functions deploy push-expense` and `supabase functions deploy push-chore-reminder`

## Next Phase Readiness
- Server-side push pipeline is complete -- ready for client-side token registration and preference UI (Plan 04-03)
- Edge Functions are ready for deployment; webhook and cron configuration are dashboard steps
- Push notifications require a Development Build (not Expo Go) for end-to-end testing

## Self-Check: PASSED

All 5 files verified present. Both commit hashes (f077a90, 0e6422e) verified in git log.

---
*Phase: 04-engagement*
*Completed: 2026-03-12*
