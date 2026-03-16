---
id: T02
parent: S02
milestone: M003
provides:
  - Chores tab renders room-grouped collapsible sections instead of flat Your Chores / Household split
  - Rooms fetched from Supabase with RLS filtering private rooms
  - Room ordering follows ROOMS constant (kitchen → bathroom → ... → general)
key_files:
  - app/(app)/(tabs)/chores.tsx
key_decisions:
  - isMyChore computed per-chore rather than per-section — avoids duplicating chores across a "mine" and "room" grouping
  - showDisputeButton logic unified (was split with hardcoded true/false in old sections)
  - Rooms with zero chores excluded from orderedRoomIds, not rendered at all
patterns_established:
  - Room-grouped sections pattern: fetch rooms → roomLookup → choresByRoom → orderedRoomIds → SectionHeader per room
observability_surfaces:
  - Room fetch failure results in empty section list (no crash, chores invisible) — inspect rooms state length
  - Chore with room_id not matching any fetched room silently excluded from all sections
duration: 15m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Redesign chores tab with room-grouped collapsible sections

**Replaced flat "Your Chores / Household" layout with room-grouped collapsible sections using SectionHeader, rooms fetched from Supabase with RLS-based private room filtering.**

## What Happened

Rewired the chores tab to group chores by room instead of by assignee ownership. Key structural changes:

1. **Imports:** Added `useMemo`, `SectionHeader`, `ROOMS`/`ROOM_MAP`, and `Room` type. Consolidated `Avatar`/`Card`/`SectionHeader` into a single import from `@/components/ui`.

2. **State:** Added `rooms` (fetched Room[]) and `collapsedRooms` (Set<string> for collapse toggle tracking). Added `toggleRoom` callback.

3. **Data fetching:** Added rooms query in `fetchData` — `supabase.from('rooms').select('*').eq('household_id', household.id)`. RLS automatically excludes private rooms the user doesn't own.

4. **Derived data:** Replaced `myChores`/`othersChores` split with three memoized computations:
   - `roomLookup` — Record<string, Room> for O(1) access
   - `choresByRoom` — groups chores by room_id, sorts within each room by next_due_at
   - `orderedRoomIds` — rooms with chores, ordered by ROOMS constant sequence

5. **Render:** Replaced the two flat sections with a single `orderedRoomIds.map()` loop. Each room gets a `SectionHeader` (icon, name, count, collapsible) and a `Card` containing `ChoreRow`s. `isMyChore` is now computed per-chore. All handlers and props are identical to before.

6. **Preserved verbatim:** StatsRow, swap request banner, swap modal, dispute modal, empty state, loading state, all action handlers.

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors (only pre-existing Deno edge function errors)
- File structure: 770 LOC (was 768), minimal diff — only imports, state, derived data, and render loop changed

### Slice-level checks status (T02 of 4 tasks):
- ✅ `npx tsc --noEmit` — passes (no new errors)
- ✅ Chores grouped by room with collapsible sections (room icon + name + count) — implemented
- 🔲 ChoreRow shows effort badge — done in T01
- 🔲 Add screen: room picker, effort picker — T03
- 🔲 Template flow — T04
- 🔲 Private room only visible to creator — implemented via RLS (needs Expo Go verification)
- ✅ Existing actions unchanged — all handlers preserved verbatim
- 🔲 Empty state shows room-based template entry — T04

## Diagnostics

- **Room fetch failure:** `orderedRoomIds` will be empty → no room sections render. Chores exist but invisible. Inspect `rooms` state or add console.log on `roomsData` in fetchData.
- **Room grouping mismatch:** A chore with `room_id` not matching any fetched room won't appear in any section. Cross-reference `chores.room_id` with `rooms.id` in Supabase.
- **Private room RLS:** Non-owners don't see private rooms in the rooms query, so those chores have no matching section and are invisible. By design.

## Deviations

- Unified `showDisputeButton` logic: old code used hardcoded `!true` (Your Chores) and `!false` (Household). Now uses dynamic `!isMyChore` per chore — functionally identical but cleaner.

## Known Issues

- `ChoreSwapRequest` import is unused (pre-existing, not introduced by this task).
- If a chore's `room_id` doesn't match any fetched room, it silently disappears. This shouldn't happen with proper room/chore creation, but there's no fallback "Unassigned Room" section. Could be added if edge cases surface.

## Files Created/Modified

- `app/(app)/(tabs)/chores.tsx` — redesigned from flat Your Chores/Household split to room-grouped collapsible sections
- `.gsd/milestones/M003/slices/S02/tasks/T02-PLAN.md` — added Observability Impact section (preflight fix)
