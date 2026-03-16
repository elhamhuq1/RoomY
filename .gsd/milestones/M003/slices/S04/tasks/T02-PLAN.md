---
estimated_steps: 8
estimated_files: 5
---

# T02: Build My Day screen with shared action hooks and navigation wiring

**Slice:** S04 — Smart "My Day" View & Visual Urgency Indicators
**Milestone:** M003

## Description

Deliver the "My Day" screen (CHORE-06) — a personalized daily task list showing the current user's due/overdue chores sorted by urgency. Extract chore action handlers into a shared hook to avoid duplicating ~150 LOC between the chores tab and My Day. Wire navigation: sun icon in chores tab header + Stack.Screen registration.

## Steps

1. **Create `lib/hooks/use-chore-actions.ts`** — extract action handlers from `app/(app)/(tabs)/chores.tsx`:

   The hook signature:
   ```typescript
   export function useChoreActions(refreshFn: () => void) {
     // Returns: { handleComplete, handleClaim, handleDispute, handleDisputeSubmit,
     //           handleDelete, handleViewDispute, completingId, claimingId,
     //           disputeReasonModal, setDisputeReasonModal, disputeReason,
     //           setDisputeReason, disputeSubmitting }
   }
   ```

   Move these from `chores.tsx` into the hook:
   - `handleComplete` (lines ~274-300) — calls `supabase.rpc("complete_chore", ...)`, needs `user?.id` and `refreshFn`
   - `handleClaim` (lines ~303-317) — calls `supabase.rpc("claim_chore", ...)`, needs `user?.id` and `refreshFn`
   - `handleDispute` (lines ~319-353) — fetches recent completion, shows dispute modal
   - `handleDisputeSubmit` (lines ~355-379) — calls `supabase.rpc("dispute_completion", ...)` with reason
   - `handleDelete` (lines ~488-512) — soft-deletes chore (sets `is_active: false`)
   - `handleViewDispute` — this one depends on `disputeDetails` state that lives in the chores tab's fetch cycle. Instead of extracting it, leave `handleViewDispute` in chores.tsx and My Day will implement its own version (it needs to fetch dispute details for its own chores anyway).

   The hook uses `useSession` internally to get `user.id`. It manages its own state for `completingId`, `claimingId`, `disputeReasonModal`, `disputeReason`, `disputeSubmitting`.

   Imports needed: `useState`, `useCallback` from react; `Alert` from react-native; `supabase` from `@/lib/supabase`; `useSession` from `@/lib/auth-context`.

2. **Refactor `app/(app)/(tabs)/chores.tsx`** to use `useChoreActions`:
   - Import `useChoreActions` from `@/lib/hooks/use-chore-actions`
   - Call `const { handleComplete, handleClaim, handleDispute, handleDisputeSubmit, handleDelete, completingId, claimingId, disputeReasonModal, setDisputeReasonModal, disputeReason, setDisputeReason, disputeSubmitting } = useChoreActions(refreshChores);`
   - Remove the now-extracted handler functions and their associated state declarations (`completingId`, `claimingId`, etc.)
   - Keep `handleViewDispute` and `handleSwapRequest` in chores.tsx (they depend on local state)
   - Keep the dispute reason modal JSX in chores.tsx — it uses the state from the hook
   - Verify the chores tab still compiles and works identically

3. **Create `app/(app)/chores/my-day.tsx`** — the My Day screen:

   **Data fetching** (reuse the established pattern from chores.tsx):
   ```typescript
   const fetchData = useCallback(async () => {
     if (!household?.id || !user?.id) return;

     // Fetch all active chores for household (RLS handles visibility)
     const { data: choresData } = await supabase
       .from('chores')
       .select('*')
       .eq('household_id', household.id)
       .eq('is_active', true);

     if (!choresData) { setLoading(false); return; }

     // Filter to current user's chores that are due today or overdue
     const now = new Date();
     const endOfToday = new Date();
     endOfToday.setHours(23, 59, 59, 999);

     const myChores = (choresData as Chore[]).filter(c => {
       if (c.current_assignee !== user.id) return false;
       const dueDate = new Date(c.next_due_at);
       return dueDate <= endOfToday; // includes overdue + due today
     });

     // Sort: overdue oldest-first, then due-today
     myChores.sort((a, b) => {
       const aDue = new Date(a.next_due_at).getTime();
       const bDue = new Date(b.next_due_at).getTime();
       const nowMs = now.getTime();
       const aOverdue = aDue < nowMs;
       const bOverdue = bDue < nowMs;
       if (aOverdue && !bOverdue) return -1;
       if (!aOverdue && bOverdue) return 1;
       return aDue - bDue; // both same category: earliest first
     });

     setChores(myChores);

     // Fetch profiles for display
     const { data: membersData } = await supabase
       .from('household_members')
       .select('user_id')
       .eq('household_id', household.id);
     if (membersData) {
       const userIds = membersData.map(m => m.user_id);
       const { data: profilesData } = await supabase
         .from('profiles')
         .select('*')
         .in('id', userIds);
       if (profilesData) {
         const map: Record<string, Profile> = {};
         (profilesData as Profile[]).forEach(p => { map[p.id] = p; });
         setProfiles(map);
       }
     }

     // Fetch disputed completions for badge display
     const choreIds = myChores.map(c => c.id);
     if (choreIds.length > 0) {
       const { data: disputedData } = await supabase
         .from('chore_completions')
         .select('*')
         .in('chore_id', choreIds)
         .eq('is_disputed', true)
         .eq('is_reverted', false);
       // ... build disputedSet, disputedByMeSet, disputeDetails same as chores.tsx
     }

     setLoading(false);
   }, [household?.id, user?.id]);
   ```

   Use `useCachedFetch(fetchData, { staleTime: 30_000, deps: [...] })` and `useFocusEffect` same as chores tab.

   **Actions**: Use `useChoreActions(refreshMyDay)` for complete/claim/dispute/delete. Implement `handleViewDispute` locally using local `disputeDetails` state (same pattern as chores.tsx).

   **Rendering**:
   - ScrollView (with `style={{ flex: 1 }}` per DECISIONS.md) containing ChoreRow for each chore
   - For each chore, show room context: small room label from `ROOM_MAP[chore.room_id]` — actually room_id is a UUID, not a room_type. Need to fetch rooms and look up room_type to get the label. Add rooms fetch to fetchData, build a roomMap by id, then display `ROOM_MAP[room.room_type]?.label` next to each chore. This can be a subtle metadata line or small pill above or below the chore name. Simplest: add room name to the ChoreRow metadata pills area — but ChoreRow doesn't accept a room name prop. Instead, render a small room label View above each ChoreRow or group by room with simple text dividers.
   - Actually, simplest approach: render a flat list with each ChoreRow. Room context is secondary — the user knows their chores. Skip room labels on My Day to keep it clean. The main chores tab already shows room grouping.

   **Empty state**: When `chores.length === 0` after loading, show a centered view with sunny icon and "You're all caught up! 🎉" text + "No chores due today" subtitle. Use the same empty-state visual pattern as other screens.

   **Dispute modal**: Include the same dispute-reason Modal JSX from chores.tsx (it uses `disputeReasonModal`, `disputeReason`, `disputeSubmitting` from the hook).

   **Swap**: Include a swap modal identical to chores.tsx's pattern — show household members to swap with when tapping swap button on a chore.

4. **Add sun icon to chores tab header** in `app/(app)/(tabs)/_layout.tsx`:
   - In the chores tab `headerRight`, add a new Pressable before the existing info button:
     ```tsx
     <Pressable
       onPress={() => router.push("/(app)/chores/my-day" as never)}
       style={{ marginRight: 8 }}
     >
       <Ionicons name="sunny-outline" size={24} color={colors.neutral.tertiary} />
     </Pressable>
     ```
   - Place it as the first icon in the row (leftmost position in the header right area) so it's easy to discover.

5. **Register Stack.Screen** in `app/(app)/_layout.tsx`:
   ```tsx
   <Stack.Screen
     name="chores/my-day"
     options={{
       headerShown: true,
       title: "My Day",
       headerBackTitle: "Chores",
       headerTintColor: colors.neutral.text,
       headerStyle: { backgroundColor: colors.neutral.bg },
       headerShadowVisible: false,
     }}
   />
   ```
   Place it near the other chores Stack.Screen entries (dashboard, dispute, swap-request).

6. **Verify TypeScript** compiles: `npx tsc --noEmit` — zero new errors.

7. **Verify chores tab** still works identically after the hook extraction — complete, claim, dispute, delete actions unchanged.

8. **Verify My Day** screen — accessible via header button, shows correct filtered/sorted chores, empty state works, actions work.

## Must-Haves

- [ ] `useChoreActions` hook extracted and used by both chores tab and My Day
- [ ] Chores tab still works identically after refactor (no behavioral change)
- [ ] My Day screen filters to `current_assignee === user.id` AND (`next_due_at <= endOfToday` OR overdue)
- [ ] My Day sorts overdue oldest-first, then due-today
- [ ] My Day empty state shows when no chores are due
- [ ] Sun icon in chores tab header navigates to My Day
- [ ] Stack.Screen registered for `chores/my-day`
- [ ] Complete/claim/dispute/delete actions work from My Day
- [ ] Dispute reason modal works from My Day

## Verification

- `npx tsc --noEmit` — zero new TS errors
- Visual in Expo Go: sun icon visible in chores tab header, tapping navigates to My Day
- Visual in Expo Go: My Day shows only current user's due/overdue chores
- Visual in Expo Go: overdue chores appear before due-today chores
- Visual in Expo Go: empty state shows when nothing is due
- Visual in Expo Go: complete action works from My Day and refreshes the list
- Visual in Expo Go: chores tab behavior unchanged after hook extraction

## Inputs

- `app/(app)/(tabs)/chores.tsx` — source of action handlers to extract (handleComplete ~lines 274-300, handleClaim ~303-317, handleDispute ~319-353, handleDisputeSubmit ~355-379, handleDelete ~488-512)
- `lib/theme/colors.ts` — `colors.neutral.tertiary` for header icon, `colors.neutral.text`/`colors.neutral.bg` for Stack.Screen header
- `lib/types/database.ts` — Chore type (has `current_assignee`, `next_due_at`, `room_id`, `effort_points`), Profile type, ChoreCompletion type
- `lib/auth-context` — `useSession` provides `user.id` and `household.id`
- `lib/use-cached-fetch` — `useCachedFetch` for data fetching with stale-time caching
- `components/chores/ChoreRow.tsx` — updated in T01 with urgency coloring
- `components/chores/EmptyState.tsx` — reference for empty state pattern (or build a simple inline one)
- T01 summary: ChoreRow now has urgency-colored left borders and pills — My Day inherits this automatically

## Expected Output

- `lib/hooks/use-chore-actions.ts` — new shared hook with complete/claim/dispute/delete handlers
- `app/(app)/chores/my-day.tsx` — new My Day screen with filtered/sorted chore list, actions, empty state
- `app/(app)/(tabs)/chores.tsx` — refactored to use `useChoreActions` hook (less LOC, same behavior)
- `app/(app)/(tabs)/_layout.tsx` — sun icon button added to chores tab headerRight
- `app/(app)/_layout.tsx` — Stack.Screen entry for `chores/my-day`
