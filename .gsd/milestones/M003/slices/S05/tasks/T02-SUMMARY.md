---
id: T02
parent: S05
milestone: M003
provides:
  - Client-side nudge flow: handleNudge hook handler, nudge button on ChoreRow, props threaded through chores tab
key_files:
  - lib/hooks/use-chore-actions.ts
  - components/chores/ChoreRow.tsx
  - app/(app)/(tabs)/chores.tsx
key_decisions:
  - Nudge button uses opacity 0.4 + disabled state for already-nudged chores (dimmed, not hidden) so users see the action was taken
  - Error alerts surface the server-returned message directly, including phase info from T01's structured errors
patterns_established:
  - Session-level Set state (nudgedIds) for immediate UI feedback without server round-trip, complementing server-side rate limiting
observability_surfaces:
  - nudgingId non-null indicates in-flight Edge Function call (visible as ActivityIndicator)
  - Alert.alert surfaces both success and error with server-returned messages including phase info
  - supabase.functions.invoke call inspectable in device network logs
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Wire nudge button into ChoreRow and chores tab

**Added client-side nudge flow: handleNudge in useChoreActions, conditional nudge button on ChoreRow for overdue non-own chores, props threaded through chores tab**

## What Happened

Extended `useChoreActions` with `handleNudge` callback, `nudgingId` loading state (same pattern as `completingId`/`claimingId`), and `nudgedIds` Set for session-level disable tracking. The handler calls `supabase.functions.invoke('push-chore-nudge', { body: { chore_id } })`, shows Alert.alert for success/error, and adds to nudgedIds on success.

Added `onNudge`, `isNudging`, `nudgeDisabled` props to ChoreRow. Nudge button renders with `notifications-outline` icon, positioned before the claim button, conditionally visible when `!isMyChore && isOverdue && onNudge`. Uses same gray bg button style as claim. Shows ActivityIndicator during loading, dims to 0.4 opacity when disabled.

Threaded all three new props from the chores tab screen through to each ChoreRow instance.

## Verification

- `npx tsc --noEmit` — zero new errors in app/components/lib code (all 38 errors are pre-existing Deno Edge Function type issues in supabase/functions/)
- Nudge button visibility logic verified: condition `!isMyChore && isOverdue && onNudge` matches requirement (overdue + not own chore)
- Already-nudged chores: button disabled + dimmed (not hidden), matching plan spec

## Slice-Level Verification Status

- ✅ `npx tsc --noEmit` — zero new errors in app/components/lib code
- ⬜ `curl` test of Edge Function — requires deployed function (T01 scope, needs runtime)
- ⬜ Visual inspection in Expo Go — requires running app (manual/UAT)

## Diagnostics

- **nudgingId state**: Non-null while Edge Function call is in flight. If stuck, indicates network timeout or Edge Function issue.
- **nudgedIds Set**: Client-only session tracking. Resets on app restart. Server-side 24h rate limit (T01) is the durable guard.
- **Alert messages**: Error alerts include the server's `error` field which contains phase info (auth, validation, rate_limit, push) from T01's structured responses.
- **Network inspection**: `supabase.functions.invoke('push-chore-nudge', ...)` call visible in device/emulator network logs.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `lib/hooks/use-chore-actions.ts` — added `handleNudge`, `nudgingId`, `nudgedIds` state and callback
- `components/chores/ChoreRow.tsx` — added `onNudge`, `isNudging`, `nudgeDisabled` props; conditional nudge button before claim button
- `app/(app)/(tabs)/chores.tsx` — destructured new hook values, threaded nudge props to each ChoreRow
