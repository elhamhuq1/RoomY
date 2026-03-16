# S05: Peer Nudge System with Push Notifications — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: mixed (artifact-driven for code structure + live-runtime for Edge Function + human-experience for in-app nudge flow)
- Why this mode is sufficient: Edge Function requires deployed runtime to test push delivery and rate limiting; UI nudge button behavior requires visual confirmation in Expo Go; code structure verification confirms correct wiring

## Preconditions

- Supabase project deployed with `push-chore-nudge` Edge Function
- At least two user accounts in the same household
- At least one chore that is overdue and assigned to the other user (not the tester)
- Recipient user has `expo_push_token` set in profiles (has opened the app and accepted notification permissions)
- Expo Go running on a device or emulator for the sender's account

## Smoke Test

Open chores tab → find an overdue chore assigned to another roommate → nudge button (bell icon) should be visible. Tap it → should show "Nudge sent!" alert.

## Test Cases

### 1. Nudge button visibility — overdue chore assigned to another user

1. Log in as User A
2. Navigate to chores tab
3. Find a chore that is overdue and assigned to User B
4. **Expected:** Bell icon (notifications-outline) button visible on that chore row, before the claim button

### 2. Nudge button hidden — own chore

1. Log in as User A
2. Navigate to chores tab
3. Find a chore that is overdue and assigned to User A (self)
4. **Expected:** No nudge button visible on that row

### 3. Nudge button hidden — non-overdue chore assigned to another user

1. Log in as User A
2. Navigate to chores tab
3. Find a chore due tomorrow or later, assigned to User B
4. **Expected:** No nudge button visible on that row

### 4. Successful nudge delivery

1. Log in as User A on Device 1
2. Ensure User B's device (Device 2) has push notifications enabled and app backgrounded
3. Navigate to chores tab, find overdue chore assigned to User B
4. Tap the nudge button
5. **Expected:** 
   - ActivityIndicator shows briefly on the button
   - Alert says "Nudge sent!" (or similar success message)
   - Button becomes dimmed (opacity 0.4) and disabled
   - User B receives push notification with title "Gentle Nudge" and body containing User A's name and the chore name

### 5. Rate limiting — second nudge within 24h blocked

1. Immediately after test 4, tap the dimmed nudge button (or restart app and find the same chore)
2. If button is still accessible after app restart (nudgedIds resets), tap it
3. **Expected:** Alert shows rate-limit error message (e.g., "Already nudged within the last 24 hours")
4. Verify in database: `SELECT * FROM chore_nudges WHERE chore_id = '<id>' AND sender_id = '<user_a_id>' ORDER BY created_at DESC` — should show exactly one row from step 4, no duplicate

### 6. Edge Function curl test — successful nudge

1. Get a valid auth token for User A (from Supabase auth)
2. Identify an overdue chore assigned to User B (chore_id)
3. Run:
   ```
   curl -X POST https://<project>.supabase.co/functions/v1/push-chore-nudge \
     -H "Authorization: Bearer <user_a_token>" \
     -H "Content-Type: application/json" \
     -d '{"chore_id": "<chore_id>"}'
   ```
4. **Expected:** 200 response with JSON containing `nudge_id`, `push_sent: true` (or `false` with `reason` if no token/prefs disabled)

### 7. Edge Function curl test — rate limit enforced

1. Immediately repeat the same curl from test 6 (same chore_id, same auth token)
2. **Expected:** 429 response with JSON `{ "error": "...", "phase": "rate_limit" }`

### 8. Edge Function curl test — self-nudge prevented

1. Get auth token for User B
2. Use the same chore_id (which is assigned to User B)
3. Run curl with User B's token
4. **Expected:** 400 response with JSON containing `"phase": "validation"` and error about self-nudge

## Edge Cases

### Missing push token

1. Set recipient's `expo_push_token` to NULL in profiles table
2. Send nudge via curl or in-app
3. **Expected:** 200 response with `push_sent: false`, `reason: "no_push_token"` (or similar). Nudge record still inserted in `chore_nudges`.

### Notifications disabled

1. Set recipient's `notification_preferences.chores_enabled` to `false`
2. Send nudge
3. **Expected:** 200 response with `push_sent: false`, `reason` indicating disabled prefs. Nudge record still inserted.

### Non-existent chore_id

1. Send nudge with a random UUID as chore_id
2. **Expected:** 400 response with `"phase": "validation"` error

### Chore not overdue

1. Find a chore with `next_due_at` in the future, assigned to another user
2. Send nudge via curl (bypassing UI which hides the button)
3. **Expected:** 400 response with validation error about chore not being overdue

## Failure Signals

- Nudge button visible on own chores or non-overdue chores → visibility condition wrong
- Tap nudge → no loading indicator or no alert → hook wiring broken
- Tap nudge → success alert but no push received → Edge Function push phase failing (check Edge Function logs)
- Second nudge succeeds within 24h → rate limiting broken (check chore_nudges table)
- 500 from Edge Function → check Supabase Dashboard > Edge Functions > Logs for phase-specific error
- `npx tsc --noEmit` shows new errors in app/components/lib → type regression

## Requirements Proved By This UAT

- CHORE-11 — Tests 4-7 prove the full nudge lifecycle: push delivery, rate limiting (1 per chore per 24h per sender), and self-nudge prevention. Tests 1-3 prove conditional UI rendering.

## Not Proven By This UAT

- Cross-timezone rate limiting accuracy — 24h window uses server time, not user local time
- Behavior under network failure mid-nudge — client shows error alert, but exact UX not tested
- Nudge interaction with disputed or completed chores — Edge Function checks is_active and overdue, but edge transitions not explicitly tested

## Notes for Tester

- The nudge button is subtle — small bell icon in gray, positioned before the claim button on ChoreRow. Look for it on overdue rows assigned to other users.
- After a successful nudge, the button dims but stays visible (opacity 0.4). This is intentional — shows the action was taken.
- The `nudgedIds` Set resets when the app restarts. If testing rate limiting through the UI, restart the app between attempts to exercise the server-side rate limit (not just the client-side disable).
- Friendly notification copy uses the sender's display name and chore name: e.g., "Alex thinks the Kitchen Floor could use some love 🧹". Verify the names render correctly, not as undefined/null.
