---
id: S05
parent: M001
milestone: M001
provides:
  - Calendar utility functions (buildMarkedDates, getEventsForDate)
  - Home tab calendar section with month grid, day detail, and deep-link navigation
  - notification_preferences table with per-user expense/chore toggles
  - expo_push_token column on profiles table
  - Edge Function for expense push notifications (webhook trigger)
  - Edge Function for daily chore reminder push notifications (cron trigger)
  - NotificationPreferences TypeScript interface
  - Bounded scrollable day event list on Home tab (max 5 visible)
  - Graceful push token registration with projectId guard
requires: []
affects: []
key_files: []
key_decisions:
  - "Used react-native-calendars multi-dot marking for color-coded expense/chore indicators"
  - "Chore date projection walks both forward and backward from next_due_at to cover full visible month"
  - "Calendar data fetched via useFocusEffect + useEffect on month change for reliable refresh"
  - "Pull-to-refresh fetches both members and calendar data in parallel"
  - "Individual notifications for v1 -- grouping deferred to v2 per research recommendation (low frequency in 2-4 person households)"
  - "No grocery notifications per user decision (PUSH-03 explicitly not implemented)"
  - "UTC-based chore reminder timing for v1 -- timezone handling deferred"
  - "Service role key in Edge Functions to bypass RLS for cross-user queries"
  - "Default notification preferences to enabled (no pref row = notifications on)"
  - "280px maxHeight for event list (~5 items at 56px each)"
  - "try/catch around getExpoPushTokenAsync as safety net beyond projectId guard"
patterns_established:
  - "Calendar utility pattern: pure functions for date projection and event building, consumed via useMemo"
  - "Multi-dot marking: expense (blue #3b82f6) and chore (green #22c55e) color convention"
  - "Edge Function pattern: Deno.serve, createClient with service role key, graceful error handling returning 200"
  - "Notification preference check: query notification_preferences, build Map, filter by preference with default-true logic"
  - "Expo Push API batch send: POST array of notification objects to exp.host/--/api/v2/push/send"
  - "Nested ScrollView with nestedScrollEnabled for bounded sublists"
  - "Graceful null return for optional platform features unavailable in Expo Go"
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---
# S05: Engagement

**# Phase 4 Plan 01: Shared Calendar Summary**

## What Happened

# Phase 4 Plan 01: Shared Calendar Summary

**Month grid calendar on Home tab with color-coded expense/chore dots, day detail expansion, and deep-link navigation using react-native-calendars and date-fns**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T01:41:40Z
- **Completed:** 2026-03-12T01:46:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Calendar utility module with buildMarkedDates (multi-dot marking) and getEventsForDate (day detail list)
- Chore date projection handles all frequencies (daily, weekly, monthly, custom) with forward+backward walk
- Home tab now shows month grid calendar between member avatars and module cards
- Day tap shows expandable event list with deep-link navigation to expense/chore screens
- Color legend and "No events on this day" empty state included

## Task Commits

Each task was committed atomically:

1. **Task 1: Create calendar utility functions and install dependencies** - `f077a90` (feat)
2. **Task 2: Add calendar section to Home tab** - `cda3cde` (feat)

## Files Created/Modified
- `lib/calendar-utils.ts` - Calendar utility functions: buildMarkedDates, getEventsForDate, chore date projection
- `app/(app)/(tabs)/index.tsx` - Home tab with calendar section, data fetching, computed marked dates
- `package.json` - Added react-native-calendars and date-fns dependencies

## Decisions Made
- Used react-native-calendars multi-dot marking type for clean color-coded indicators on the month grid
- Chore date projection walks both forward and backward from next_due_at anchor to cover any visible month range
- Calendar data fetched in parallel with members on pull-to-refresh for snappy UX
- useFocusEffect used for calendar data refresh (consistent with existing project pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 1 artifacts (calendar-utils.ts, package.json changes) were already committed in a prior session's commit (f077a90) alongside notification work. No re-commit needed; used existing commit hash.
- TypeScript errors in supabase/functions/ (Deno edge functions) are pre-existing and out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Calendar foundation complete; expenses and chores display on the Home tab calendar
- Ready for 04-02 (push notifications) and 04-03 (notification preferences)
- Chore assignee names in calendar detail list show "Assigned"/"Unassigned" rather than display names (would need profile join for richer detail)

## Self-Check: PASSED

All files and commits verified:
- lib/calendar-utils.ts: FOUND
- app/(app)/(tabs)/index.tsx: FOUND
- 04-01-SUMMARY.md: FOUND
- Commit f077a90: FOUND
- Commit cda3cde: FOUND

---
*Phase: 04-engagement*
*Completed: 2026-03-11*

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

# Phase 4 Plan 4: UAT Gap Closure Summary

**Bounded ScrollView for day event list (280px/5 items) and projectId null guard preventing push crash in Expo Go**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T02:13:12Z
- **Completed:** 2026-03-12T02:14:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Day event list on Home tab now bounded to ~5 items with overflow scrolling
- "Scroll for more (N events)" hint shown when list exceeds 5 items
- Push token registration returns null gracefully when EAS projectId unavailable
- try/catch wraps token request as additional safety net against uncaught exceptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Bound day event list height with ScrollView** - `6b798a1` (feat)
2. **Task 2: Guard push token registration against missing projectId** - `8fff85a` (fix)

## Files Created/Modified
- `app/(app)/(tabs)/index.tsx` - Wrapped day event map in ScrollView with maxHeight 280px, nestedScrollEnabled, and overflow hint
- `lib/notifications.ts` - Added projectId null guard + try/catch around getExpoPushTokenAsync

## Decisions Made
- 280px maxHeight chosen for event list (~5 items at 56px row height)
- try/catch added around entire token registration block as defense-in-depth beyond the projectId guard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All UAT-identified gaps closed
- Phase 4 engagement features complete
- App ready for final review

## Self-Check: PASSED

All files exist, all commits verified, all key code patterns confirmed.

---
*Phase: 04-engagement*
*Completed: 2026-03-12*
