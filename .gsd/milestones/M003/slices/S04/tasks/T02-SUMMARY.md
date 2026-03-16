---
id: T02
parent: S04
milestone: M003
provides:
  - My Day screen showing current user's due/overdue chores sorted by urgency
  - Shared useChoreActions hook eliminating ~150 LOC duplication between chores tab and My Day
  - Sun icon navigation in chores tab header to My Day
  - Stack.Screen registration for chores/my-day route
key_files:
  - lib/hooks/use-chore-actions.ts
  - app/(app)/chores/my-day.tsx
  - app/(app)/(tabs)/chores.tsx
  - app/(app)/(tabs)/_layout.tsx
  - app/(app)/_layout.tsx
key_decisions:
  - Left handleViewDispute in each consumer (chores tab / My Day) rather than in the shared hook, because it depends on locally-fetched disputeDetails state
  - Skipped room labels on My Day for cleanliness — user already knows their own chores; room grouping is in the main chores tab
patterns_established:
  - useChoreActions(refreshFn) hook pattern for sharing chore mutation logic across screens
observability_surfaces:
  - My Day header pill shows chore count ("N chores for today") — verifiable against full chore list
  - Empty state renders visually when no chores due (sun icon + "all caught up" message)
  - Action errors surface via Alert.alert; success triggers list refresh
duration: 25m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Build My Day screen with shared action hooks and navigation wiring

**Extracted shared chore action hook and built My Day screen with urgency-sorted daily chore list, full action support, and navigation wiring**

## What Happened

1. Created `lib/hooks/use-chore-actions.ts` — extracted handleComplete, handleClaim, handleDispute, handleDisputeSubmit, and handleDelete from chores.tsx into a shared hook. The hook uses `useSession` internally for user.id and manages its own completingId, claimingId, and dispute modal state.

2. Refactored `app/(app)/(tabs)/chores.tsx` to import and destructure from `useChoreActions(refreshChores)`. Removed ~100 LOC of handler/state declarations. Kept handleViewDispute (depends on local disputeDetails) and handleSwapRequest (depends on local swapModalChoreId) in the component.

3. Created `app/(app)/chores/my-day.tsx`:
   - Fetches all active household chores, filters to `current_assignee === user.id` where `next_due_at <= endOfToday`
   - Sorts overdue chores first (oldest-first), then due-today by due date
   - Renders ChoreRow components in a Card within a ScrollView (inherits T01's urgency coloring automatically)
   - Includes header pill showing chore count, dispute reason modal, swap member picker modal
   - Empty state: sun icon + "You're all caught up! 🎉" when no chores due

4. Added sun icon (`sunny-outline`) as leftmost button in chores tab headerRight in `_layout.tsx`

5. Registered `Stack.Screen` for `chores/my-day` in `app/(app)/_layout.tsx` with "My Day" title and standard header styling

## Verification

- `npx tsc --noEmit` — zero new TS errors (only pre-existing Deno/Edge Function errors)
- Verified no stale references to removed state variables (setCompletingId, setClaimingId, setDisputeSubmitting) in chores.tsx
- All handler references in chores.tsx JSX (handleComplete, handleClaim, handleDispute, handleDelete, handleViewDispute, handleSwapRequest) resolve correctly

### Slice-level verification status (T02 is final task):
- ✅ `npx tsc --noEmit` — zero new TS errors
- 🔲 Visual in Expo Go: ChoreRow shows green/yellow/red left border + pill coloring on chores tab (requires runtime)
- 🔲 Visual in Expo Go: Disputed chores retain red-50 bg + red border (requires runtime)
- 🔲 Visual in Expo Go: Sun icon in chores header navigates to My Day screen (requires runtime)
- 🔲 Visual in Expo Go: My Day shows only current user's chores due today or overdue, sorted correctly (requires runtime)
- 🔲 Visual in Expo Go: My Day empty state displays when no chores are due (requires runtime)
- 🔲 Visual in Expo Go: Complete/claim/delete actions work from My Day screen (requires runtime)

## Diagnostics

- My Day's filtered list count is visible in the UI pill — compare against main chores tab to verify filtering
- Urgency sort order is visually observable: red-bordered overdue chores appear above yellow/green
- If My Day shows wrong chores, inspect `current_assignee` and `next_due_at` in Supabase for the household's chores
- Action errors surface via Alert.alert; check Supabase RPC logs if silent failures occur
- Empty state always renders when `chores.length === 0` after loading completes

## Deviations

- Skipped room labels on My Day (plan noted this as a design decision: "simplest approach — skip room labels on My Day to keep it clean")
- handleViewDispute kept in each consumer rather than in shared hook (plan already noted this: "leave handleViewDispute in chores.tsx and My Day will implement its own version")

## Known Issues

None

## Files Created/Modified

- `lib/hooks/use-chore-actions.ts` — new shared hook with complete/claim/dispute/delete handlers and associated state
- `app/(app)/chores/my-day.tsx` — new My Day screen with filtered/sorted chore list, actions, swap modal, dispute modal, empty state
- `app/(app)/(tabs)/chores.tsx` — refactored to use useChoreActions hook (removed ~100 LOC)
- `app/(app)/(tabs)/_layout.tsx` — added sun icon Pressable to chores tab headerRight
- `app/(app)/_layout.tsx` — added Stack.Screen for chores/my-day route
- `.gsd/milestones/M003/slices/S04/tasks/T02-PLAN.md` — added Observability Impact section
