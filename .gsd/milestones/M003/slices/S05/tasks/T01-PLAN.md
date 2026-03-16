---
estimated_steps: 6
estimated_files: 1
---

# T01: Build push-chore-nudge Edge Function

**Slice:** S05 — Peer Nudge System with Push Notifications
**Milestone:** M003

## Description

Create the `push-chore-nudge` Supabase Edge Function that handles the complete nudge lifecycle: authenticate the sender, validate the chore is overdue and assigned to someone else, enforce 24h rate limiting via `chore_nudges` table, insert the nudge record, look up recipient push token and notification preferences, and send the Expo Push notification with friendly copy. This is the only backend piece in the slice and can be verified independently via curl.

## Steps

1. Create `supabase/functions/push-chore-nudge/index.ts` with Deno `Deno.serve` handler.

2. Add CORS headers constant and OPTIONS preflight handler — copy pattern from `search-products/index.ts`:
   ```ts
   const CORS_HEADERS = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
   };
   ```
   Add `jsonResponse(body, status)` helper for DRY response construction.

3. Implement auth extraction: read `Authorization` header, strip `Bearer ` prefix, call `supabase.auth.getUser(token)` on service-role client to get sender user ID. Return 401 if invalid.

4. Parse `{ chore_id }` from request body. Fetch the chore from `chores` table: validate it exists, `is_active = true`, `next_due_at < now()` (overdue), and `current_assignee != sender_id` (not self-nudge). Return specific error messages for each failure case.

5. Rate-limit check: query `chore_nudges` for a row matching `chore_id` + `sender_id` + `created_at > now() - interval '24 hours'`. If found, return 429 with `"You already nudged about this chore in the last 24 hours"`.

6. Insert nudge record into `chore_nudges` (chore_id, sender_id, recipient_id = current_assignee). Then: fetch recipient's `expo_push_token` from `profiles`, fetch `notification_preferences.chores_enabled` (default true if no row), fetch sender's `display_name` from `profiles`. If recipient has `chores_enabled = false`, return success with note that notification was suppressed. If no push token, return success with note that no device registered. Otherwise, send Expo Push: `POST https://exp.host/--/api/v2/push/send` with title "Gentle Nudge", body `"{senderName} thinks the {choreName} could use some love 🧹"`, channelId "chores", data `{ type: "nudge", choreId }`.

## Must-Haves

- [ ] CORS headers on all responses including OPTIONS preflight
- [ ] Auth extracted from Authorization header (not from request body)
- [ ] Overdue validation: `next_due_at < now()` checked in Edge Function (defense in depth)
- [ ] Self-nudge prevention: `sender_id ≠ current_assignee` checked in Edge Function
- [ ] Rate limit: 1 per chore per sender per 24h via DB query (not calendar day)
- [ ] Nudge record always inserted (even if push skipped due to prefs or missing token)
- [ ] `notification_preferences.chores_enabled` respected (default true if no row)
- [ ] Missing push token handled gracefully (nudge recorded, push skipped)
- [ ] Friendly notification copy: title "Gentle Nudge", body uses sender display name and chore name
- [ ] Structured JSON error responses with phase identification

## Verification

- File exists at `supabase/functions/push-chore-nudge/index.ts`
- `npx tsc --noEmit` produces zero new errors in app/components/lib code
- Code review: CORS headers present, auth extraction from header, overdue check, self-nudge check, rate-limit query with 24h interval, nudge insert, push token lookup, notification prefs check, Expo Push send with correct payload format

## Observability Impact

- Signals added: console.log on each phase (auth, chore fetch, rate-limit check, nudge insert, push send/skip)
- How a future agent inspects this: Supabase Edge Function logs; `SELECT * FROM chore_nudges WHERE chore_id = '...'` for nudge history
- Failure state exposed: structured JSON response with `{ error: "description", phase: "auth|validation|rate_limit|push" }`

## Inputs

- `supabase/functions/push-chore-reminder/index.ts` — template for Expo Push send pattern (batch send, headers, channelId)
- `supabase/functions/search-products/index.ts` — template for CORS headers and jsonResponse helper
- `supabase/migrations/20260316000016_chore_rooms.sql` — `chore_nudges` table schema with composite rate-limit index on `(chore_id, sender_id, created_at)`
- `lib/types/database.ts` — `ChoreNudge` interface (chore_id, sender_id, recipient_id, created_at)

## Expected Output

- `supabase/functions/push-chore-nudge/index.ts` — Complete Edge Function (~120 lines) handling auth, validation, rate limiting, nudge insert, and push notification send
