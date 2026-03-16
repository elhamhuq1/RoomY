---
estimated_steps: 5
estimated_files: 3
---

# T02: Wire nudge button into ChoreRow and chores tab

**Slice:** S05 — Peer Nudge System with Push Notifications
**Milestone:** M003

## Description

Add the client-side nudge feature: extend `useChoreActions` hook with `handleNudge` handler and loading state, add a conditional nudge button to `ChoreRow`, and thread the new props through the chores tab. The nudge button appears only on overdue chores assigned to someone else.

## Steps

1. In `lib/hooks/use-chore-actions.ts`:
   - Add `nudgingId` state (`useState<string | null>(null)`) following the `completingId`/`claimingId` pattern
   - Add `nudgedIds` state (`useState<Set<string>>(new Set())`) to track chores nudged this session for immediate UI disable feedback
   - Add `handleNudge` callback: receives `choreId: string`, sets `nudgingId`, calls `supabase.functions.invoke('push-chore-nudge', { body: { chore_id: choreId } })`, on success shows `Alert.alert("Nudge Sent", "Your roommate will get a notification.")` and adds choreId to `nudgedIds`, on error extracts message from response and shows `Alert.alert("Nudge Failed", message)`, clears `nudgingId` in finally
   - Return `handleNudge`, `nudgingId`, `nudgedIds` from the hook

2. In `components/chores/ChoreRow.tsx`:
   - Add to `ChoreRowProps` interface: `onNudge?: () => void`, `isNudging?: boolean`, `nudgeDisabled?: boolean`
   - Add nudge button in the action buttons row, positioned before the claim button (`!isMyChore` section). Condition: `!isMyChore && overdueDays !== null && onNudge`. Use `Ionicons` `notifications-outline` at size 18, gray bg (`bg-gray-100 active:bg-gray-200`) matching the claim button style. Disable when `isNudging || nudgeDisabled`. Show `ActivityIndicator` when `isNudging`, same pattern as claim button loading state.

3. In `app/(app)/(tabs)/chores.tsx`:
   - Destructure `handleNudge`, `nudgingId`, `nudgedIds` from the `useChoreActions` hook call
   - Pass to each `<ChoreRow>`: `onNudge={() => handleNudge(chore.id)}`, `isNudging={nudgingId === chore.id}`, `nudgeDisabled={nudgedIds.has(chore.id)}`

4. Run `npx tsc --noEmit` and fix any type errors.

5. Verify nudge button visibility logic: should appear only when `!isMyChore && overdueDays !== null` (overdue + not my chore). Should be hidden on own chores, non-overdue chores, and already-nudged chores (disabled, not hidden).

## Must-Haves

- [ ] `handleNudge` calls `supabase.functions.invoke('push-chore-nudge', ...)` with correct body
- [ ] Loading state via `nudgingId` — button shows ActivityIndicator while in flight
- [ ] Session-level `nudgedIds` Set disables button after successful nudge (prevents rapid re-taps without server round-trip)
- [ ] Nudge button conditionally rendered: only on `!isMyChore && overdueDays !== null`
- [ ] Success and error feedback via `Alert.alert`
- [ ] `npx tsc --noEmit` zero new errors

## Verification

- `npx tsc --noEmit` — zero new errors in app/components/lib code
- Visual inspection in Expo Go: nudge button visible on overdue chores assigned to others, hidden on own chores and non-overdue chores
- Tap nudge → loading indicator → success alert → button disabled for that chore

## Inputs

- `lib/hooks/use-chore-actions.ts` — existing hook with `completingId`/`claimingId` pattern to follow for `nudgingId`
- `components/chores/ChoreRow.tsx` — existing component with action button row pattern (swap, dispute, claim, complete, delete)
- `app/(app)/(tabs)/chores.tsx` — existing tab that destructures hook and passes props to ChoreRow
- T01 output: `supabase/functions/push-chore-nudge/index.ts` exists and expects `{ chore_id }` body

## Expected Output

- `lib/hooks/use-chore-actions.ts` — extended with `handleNudge`, `nudgingId`, `nudgedIds`
- `components/chores/ChoreRow.tsx` — nudge button added to action row with conditional visibility
- `app/(app)/(tabs)/chores.tsx` — new props threaded through to ChoreRow
