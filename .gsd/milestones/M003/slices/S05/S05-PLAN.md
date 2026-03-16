# S05: Peer Nudge System with Push Notifications

**Goal:** Users can nudge a roommate about their overdue chore, delivering a push notification via Edge Function with 24h per-chore per-sender rate limiting.
**Demo:** Tap nudge button on an overdue chore assigned to another roommate → push notification delivered → second tap within 24h blocked with feedback.

## Must-Haves

- Edge Function `push-chore-nudge` receives `{ chore_id }`, validates sender ≠ assignee, checks overdue, enforces 24h rate limit, inserts nudge record, sends Expo Push notification respecting `notification_preferences.chores_enabled`
- Rate limiting: 1 nudge per chore per sender per 24h, checked via `chore_nudges` table query using composite index
- Nudge button on `ChoreRow` visible only when `!isMyChore && isOverdue`
- `useChoreActions` hook extended with `handleNudge` and `nudgingId` loading state
- Friendly notification copy: `"{senderName} thinks the {choreName} could use some love 🧹"` with title "Gentle Nudge"
- Self-nudge prevented in Edge Function (defense in depth beyond UI hiding)
- Missing push token handled gracefully (nudge recorded, push skipped)

## Proof Level

- This slice proves: integration (Edge Function → Expo Push API + client → Edge Function)
- Real runtime required: yes (Edge Function invocation via curl)
- Human/UAT required: yes (nudge button visibility and tap flow in Expo Go)

## Verification

- `curl` test of Edge Function: valid auth + overdue chore → 200 with nudge recorded + push payload logged; second call → rate-limit error response
- `npx tsc --noEmit` — zero new errors in app/components/lib code
- Visual: nudge button visible on overdue chores assigned to others, hidden on own chores and non-overdue chores

## Observability / Diagnostics

- Runtime signals: Edge Function console.log on each phase (auth extraction, rate-limit check, push send, push skip reasons)
- Inspection surfaces: `chore_nudges` table rows show nudge history; Edge Function logs in Supabase dashboard
- Failure visibility: Edge Function returns structured JSON with error field describing which phase failed (auth, validation, rate_limit, push_send)
- Redaction constraints: no secrets logged; push tokens not included in response payloads

## Integration Closure

- Upstream surfaces consumed: `chore_nudges` table + RLS + rate-limit index (S01), `ChoreNudge` type (S01), `notification_preferences` table, `profiles.expo_push_token`, existing `supabase.functions.invoke()` pattern
- New wiring introduced in this slice: Edge Function deployment, `handleNudge` in shared hook, nudge button on ChoreRow, props threaded through chores tab
- What remains before the milestone is truly usable end-to-end: nothing — S05 is the final slice

## Tasks

- [x] **T01: Build push-chore-nudge Edge Function** `est:45m`
  - Why: Core backend for CHORE-11 — rate-limited nudge with push notification delivery. Must be independently verifiable via curl before wiring the client.
  - Files: `supabase/functions/push-chore-nudge/index.ts`
  - Do: Create Edge Function following `push-chore-reminder` pattern (Deno, esm.sh imports, service-role client). Steps: extract sender from Authorization header via `supabase.auth.getUser(token)`, fetch chore (validate exists, is overdue, sender ≠ assignee), rate-limit check (`SELECT FROM chore_nudges WHERE chore_id = $1 AND sender_id = $2 AND created_at > now() - interval '24 hours'`), insert nudge record, fetch recipient push token + notification prefs, send Expo Push (title "Gentle Nudge", body `"{senderName} thinks the {choreName} could use some love 🧹"`). CORS headers on all responses including OPTIONS preflight per `search-products` pattern. Return structured JSON with phase-specific error messages. Log each phase for diagnostics. Handle missing push token gracefully (record nudge, skip push, return note).
  - Verify: `npx tsc --noEmit` passes (Edge Function is Deno so just verify no new TS errors in app code). Function file exists with correct structure.
  - Done when: Edge Function file complete with all validation, rate limiting, nudge insert, push send, CORS, and structured error responses.

- [ ] **T02: Wire nudge button into ChoreRow and chores tab** `est:30m`
  - Why: Client-side integration — makes the nudge feature accessible to users via the existing chore UI.
  - Files: `lib/hooks/use-chore-actions.ts`, `components/chores/ChoreRow.tsx`, `app/(app)/(tabs)/chores.tsx`
  - Do: (1) In `useChoreActions`, add `handleNudge(choreId: string)` that calls `supabase.functions.invoke('push-chore-nudge', { body: { chore_id: choreId } })`, manages `nudgingId` loading state (same pattern as `completingId`/`claimingId`), shows `Alert.alert` for success ("Nudge sent!") and error (including rate-limit message). Add `nudgedIds` Set state to track which chores have been nudged this session for immediate UI feedback. (2) In `ChoreRow`, add props `onNudge: () => void`, `isNudging: boolean`, `nudgeDisabled: boolean`. Render nudge button (Ionicons `notifications-outline`, 18px, gray bg like claim button) conditionally when `!isMyChore && overdueDays !== null`. Position before the claim button. Disable when `isNudging || nudgeDisabled`. Show ActivityIndicator when `isNudging`. (3) In `chores.tsx`, destructure new `handleNudge`, `nudgingId`, `nudgedIds` from hook. Pass `onNudge`, `isNudging`, `nudgeDisabled` props to each ChoreRow.
  - Verify: `npx tsc --noEmit` — zero new errors. Visual inspection: nudge button visible on overdue chores assigned to others, hidden on own chores and non-overdue chores.
  - Done when: Nudge button renders conditionally on ChoreRow, calls Edge Function via hook, shows loading and success/error feedback, and `npx tsc --noEmit` passes.

## Files Likely Touched

- `supabase/functions/push-chore-nudge/index.ts` (new)
- `lib/hooks/use-chore-actions.ts`
- `components/chores/ChoreRow.tsx`
- `app/(app)/(tabs)/chores.tsx`
