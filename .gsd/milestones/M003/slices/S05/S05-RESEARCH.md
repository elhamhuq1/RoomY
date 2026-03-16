# S05: Peer Nudge System with Push Notifications — Research

**Date:** 2026-03-16

## Summary

This is straightforward integration work. S01 already created the `chore_nudges` table with RLS policies, a composite rate-limit index `(chore_id, sender_id, created_at)`, and the `ChoreNudge` TypeScript interface. The existing push notification pattern (`push-chore-reminder` Edge Function → Expo Push API) provides an exact template for the nudge Edge Function. The client already calls Edge Functions via `supabase.functions.invoke()` in five other places. The `notification_preferences` table has a `chores_enabled` flag that nudges must respect.

The work breaks into three clean units: (1) an Edge Function that receives `{ chore_id }` from an authenticated caller, enforces rate limiting via DB query, inserts the nudge record, looks up the recipient's push token, checks notification prefs, and sends via Expo Push API; (2) a `handleNudge` action added to the `useChoreActions` hook (or as a standalone hook) that calls the Edge Function; (3) a nudge button on `ChoreRow` shown when the chore is overdue and assigned to someone else.

## Recommendation

**Build the Edge Function first** — it's the only backend piece and can be verified independently via `curl`. Then wire the client: add the nudge handler, then the UI button on ChoreRow. The nudge button should appear alongside existing action buttons (swap, claim, complete, delete) conditionally: only when `!isMyChore && isOverdue`.

**Rate limiting in the Edge Function, not an RPC.** The M003-RESEARCH recommended rate limiting in an RPC, but the Edge Function already needs service-role access to read the recipient's push token and notification prefs (cross-user data). Doing the rate-limit check, nudge insert, and push send all in the Edge Function is simpler — one round-trip from client, one place for all nudge logic. The RPC approach would split logic across two layers for no benefit.

**Friendly notification copy** per DECISIONS.md: `"{senderName} thinks the {choreName} could use some love 🧹"` with title "Gentle Nudge".

## Implementation Landscape

### Key Files

**New file — Edge Function:**
- `supabase/functions/push-chore-nudge/index.ts` — New Edge Function. Receives `{ chore_id }` in request body. Auth header carries the sender's JWT. Steps: (1) create service-role Supabase client, (2) decode sender from JWT or use `auth.getUser()`, (3) fetch chore to get `current_assignee` and `household_id` and `name`, (4) validate sender ≠ assignee and chore is overdue, (5) rate-limit check: query `chore_nudges` for existing nudge from this sender for this chore in last 24h, (6) insert into `chore_nudges`, (7) fetch recipient's `expo_push_token` from `profiles`, (8) check `notification_preferences.chores_enabled` (default true if no row), (9) fetch sender's `display_name` from profiles, (10) send Expo Push notification. Pattern follows `push-chore-reminder/index.ts` exactly for the push send step. CORS headers follow `search-products/index.ts` pattern.

**Existing — shared hook:**
- `lib/hooks/use-chore-actions.ts` — Add `handleNudge(choreId: string)` alongside existing handlers. It calls `supabase.functions.invoke('push-chore-nudge', { body: { chore_id } })`, manages a `nudgingId` loading state, and shows success/error feedback via `Alert.alert`. The hook already has the pattern for loading state (`completingId`, `claimingId`) and alert feedback.

**Existing — ChoreRow component:**
- `components/chores/ChoreRow.tsx` — Add a nudge button in the action buttons area. Condition: `!isMyChore && overdueDays !== null` (overdue + not my chore). New props: `onNudge: () => void`, `isNudging: boolean`, `nudgeDisabled: boolean` (for rate-limit feedback). Icon: `notifications-outline` (Ionicons). Position: before the claim button in the action row.

**Existing — chores tab:**
- `app/(app)/(tabs)/chores.tsx` — Pass `onNudge`, `isNudging`, `nudgeDisabled` props to ChoreRow. The `nudgeDisabled` state tracks which chore IDs have been nudged in this session (local Set state) to provide immediate UI feedback without re-querying. The Edge Function handles actual rate limiting server-side.

**Existing — My Day screen:**
- `app/(app)/chores/my-day.tsx` — Same ChoreRow props wiring as chores tab. My Day only shows the current user's chores, so `!isMyChore` will be false and the nudge button won't appear here. No changes needed unless My Day is broadened to show other people's chores (it isn't per S04).

**Existing — types:**
- `lib/types/database.ts` — `ChoreNudge` interface already exists from S01. No changes needed.

### Build Order

1. **Edge Function** (`push-chore-nudge/index.ts`) — Backend logic for rate-limited nudge with push notification. Can be verified independently via `curl` with an auth token. This proves the core CHORE-11 requirement: rate-limited push delivery.

2. **useChoreActions hook extension** — Add `handleNudge` + `nudgingId` state. Small addition to existing hook.

3. **ChoreRow UI + chores tab wiring** — Add nudge button with conditional visibility, connect to hook handler. Visual verification in Expo Go.

### Verification Approach

- **Edge Function via curl:** Invoke with valid auth token and `chore_id` of an overdue chore assigned to another user. Verify: (a) nudge record created in `chore_nudges`, (b) correct Expo Push payload logged, (c) second call within 24h returns rate-limit error. This is the primary CHORE-11 verification.
- **TypeScript compilation:** `npx tsc --noEmit` — zero new errors.
- **UI verification:** In Expo Go, navigate to chores tab, find an overdue chore assigned to another roommate, verify nudge button appears. Tap it, verify loading state, verify success feedback. Verify the button is hidden on own chores and non-overdue chores.

## Constraints

- Edge Functions use Deno runtime with `https://esm.sh/@supabase/supabase-js@2` import — no npm, no node_modules.
- Service role key needed to read other users' push tokens and notification prefs (cross-user data behind RLS).
- Auth token from request `Authorization` header identifies the sender — same pattern as other Edge Functions that read from `req.headers`.
- CORS headers required on all responses (including OPTIONS preflight) per existing Edge Function pattern.
- The `chores_enabled` flag in `notification_preferences` must be respected — if the recipient has it set to `false`, skip the push but still record the nudge.
- Rate limit is 1 nudge per chore per sender per 24h. The composite index `idx_chore_nudges_rate_limit` on `(chore_id, sender_id, created_at)` makes this query efficient.

## Common Pitfalls

- **Auth extraction in Edge Functions** — The sender's user ID comes from the `Authorization: Bearer <token>` header. Use `supabase.auth.getUser(token)` with the service-role client, not a user-scoped client. The push-chore-reminder doesn't do this (it's a cron, no auth), but `push-expense` extracts from webhook payload. For nudge, extract JWT from header.
- **Rate limit query must use `created_at > now() - interval '24 hours'`** — not a calendar day check. The index on `(chore_id, sender_id, created_at)` supports this efficiently.
- **Nudge for non-overdue chores** — The UI hides the button, but the Edge Function should also validate that the chore is actually overdue (`next_due_at < now()`). Defense in depth.
- **Self-nudge prevention** — The RLS INSERT policy requires `sender_id = auth.uid()`, but the Edge Function uses service role (bypasses RLS). Must manually check `sender_id ≠ current_assignee` in the function logic.
- **Missing push token** — Recipient may not have registered for push notifications. The Edge Function should succeed (nudge record saved) but skip the push send, returning a note that no push was delivered.
