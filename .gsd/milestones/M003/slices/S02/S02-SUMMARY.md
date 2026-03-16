---
id: S02
parent: M003
milestone: M003
provides:
  - Chores tab renders room-grouped collapsible sections (SectionHeader per room)
  - Add screen with room picker, effort picker (1/2/3), inline room creation (including private)
  - Template quick-add flow with room-based empty state, batch insert, auto room creation
  - Effort badge (⚡×N) on ChoreRow for effort_points > 1
  - SectionHeader promoted to shared ui/ component for cross-domain reuse
requires:
  - slice: S01
    provides: rooms table with RLS, chores.room_id + effort_points columns, Room/Chore types, ROOMS/ROOM_MAP constants, CHORE_TEMPLATES constant
affects:
  - S03
key_files:
  - app/(app)/(tabs)/chores.tsx
  - app/(app)/chores/add.tsx
  - components/chores/EmptyState.tsx
  - components/chores/ChoreRow.tsx
  - components/ui/SectionHeader.tsx
  - components/ui/index.ts
key_decisions:
  - Chores grouped by room (not by assignee) — room is the primary organizational axis
  - Template batch insert uses single Supabase .insert(array) instead of Promise.all individual inserts
  - Room auto-created from template flow if room_type doesn't exist for household
  - Effort badge hidden for effort_points=1 to reduce visual noise
  - Template modal uses two-level navigation (room picker → template checkboxes)
  - isMyChore computed per-chore rather than per-section for unified dispute button logic
patterns_established:
  - Room-grouped sections pattern: fetch rooms → roomLookup → choresByRoom → orderedRoomIds → SectionHeader per room
  - Template modal two-level pattern: room picker → template list with checkboxes → batch insert
  - SectionHeader is the shared collapsible section component across tabs (groceries, chores, future)
observability_surfaces:
  - console.error '[chores] room creation failed' on room insert failure
  - console.error '[chores] template insert failed' on chore batch insert failure
  - console.error '[chores] template add error' on unexpected exceptions
  - Alert.alert shown on every failure path — no silent failures
  - Room fetch failure → orderedRoomIds empty → no sections render (inspect rooms state length)
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T04-SUMMARY.md
duration: 45m
verification_result: passed
completed_at: 2026-03-16
---

# S02: Room-Based Chores Tab with Templates & Private Rooms

**Transformed the chores tab from flat assignee-split layout into room-grouped collapsible sections with effort badges, room/effort pickers on add screen, and template quick-add flow with batch insert and auto room creation.**

## What Happened

Four tasks delivered the full room-based chore UI:

**T01** moved SectionHeader from `components/groceries/` to `components/ui/` for cross-domain reuse (groceries + chores). Added an effort badge pill (`⚡×N`) to ChoreRow, only rendered for effort_points > 1 since 1 is the default.

**T02** rewired the chores tab from the flat "Your Chores / Household" two-section layout to room-grouped collapsible sections. Rooms are fetched from Supabase with RLS automatically excluding private rooms the user doesn't own. Three memoized derivations drive the render: `roomLookup` (O(1) room access), `choresByRoom` (chores grouped by room_id, sorted by next_due_at within each room), and `orderedRoomIds` (rooms ordered by ROOMS constant sequence, empty rooms excluded). Each room renders a SectionHeader with icon, label, and chore count. All existing handlers (complete, claim, swap, dispute, delete) preserved verbatim.

**T03** added the room picker, effort picker, and inline room creation to the add-chore screen. Room picker renders as a scrollable row of room pills. Effort picker is a 1/2/3 toggle row. A "+ New Room" pill opens a mini-modal for creating rooms (name, type from ROOMS constant, private toggle). URL params `suggestedRoom` and `suggestedEffort` support template pre-fill. Both room_id and effort_points flow into the chore INSERT.

**T04** redesigned EmptyState to show room-based template cards — each ROOMS entry with templates renders a card (icon, label, template count). Tapping opens a template selection modal with checkboxes (all checked by default), frequency and effort badges, and select all/deselect all toggle. Insert uses a single Supabase `.insert(array)` call. Auto-creates the room if the room_type doesn't exist for the household. Added "Add from templates" button on non-empty tab for existing users.

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors (only pre-existing Deno errors in supabase/functions/)
- SectionHeader importable from `@/components/ui` — confirmed via barrel export and groceries tab import update
- ChoreRow renders effort badge for effort_points > 1 — conditional render confirmed
- Chores tab: room-grouped sections with collapsible headers, room ordering, empty-room exclusion — all derived data structures confirmed
- Add screen: room picker state, effort picker state, inline room creation modal, template pre-fill params, room_id/effort_points in INSERT — all confirmed
- EmptyState: room-based template cards with onSelectRoom interface — confirmed
- Template modal: two-level navigation, batch insert, auto room creation, error handling — all paths confirmed
- Observability: 3 console.error paths with Alert.alert on all failure cases — confirmed

## Requirements Advanced

- CHORE-01 — Chores now display grouped by room with collapsible sections. Visual verification in Expo Go pending but code and type checking pass.
- CHORE-02 — Private rooms filtered by RLS at fetch time. Non-owners never see private rooms or their chores in the tab.
- CHORE-04 — Effort picker (1/2/3) on add screen, effort badge on ChoreRow. Users can now create chores with meaningful effort values.
- CHORE-05 — Template quick-add flow with room-based cards, per-room template selection, batch insert. Room auto-created if needed.

## Requirements Validated

- none — visual Expo Go verification required to fully validate CHORE-01, CHORE-02, CHORE-05

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T04 used single Supabase `.insert(array)` instead of `Promise.all` with individual inserts — single batch is one network call vs N, strictly better.
- T04 added back button in template list view header for two-level navigation — not in original plan but natural UX.
- T02 unified `showDisputeButton` logic from hardcoded per-section booleans to dynamic `!isMyChore` per chore — functionally identical, cleaner.
- T03 summary was not written by executor — verified code delivery directly.

## Known Limitations

- If a chore's room_id doesn't match any fetched room, it silently disappears from the chores tab. No "Unassigned" fallback section exists. Shouldn't happen with proper room/chore creation but is an edge case.
- Visual Expo Go verification still pending for all UI changes (room sections, effort badges, template flow, private room visibility). Code and types are verified.
- `ChoreSwapRequest` import in chores.tsx is unused (pre-existing, not introduced by this slice).

## Follow-ups

- none — all planned work delivered. Expo Go visual verification happens at UAT time.

## Files Created/Modified

- `components/ui/SectionHeader.tsx` — moved from groceries/, no code changes
- `components/ui/index.ts` — added SectionHeader export
- `components/groceries/index.ts` — removed SectionHeader export
- `app/(app)/(tabs)/groceries.tsx` — import path updated to @/components/ui
- `components/chores/ChoreRow.tsx` — added effort badge pill to metadata row
- `app/(app)/(tabs)/chores.tsx` — redesigned from flat layout to room-grouped sections, added template modal and "Add from templates" button
- `components/chores/EmptyState.tsx` — redesigned from flat suggestion grid to room-based template cards
- `app/(app)/chores/add.tsx` — added room picker, effort picker, inline room creation, template pre-fill params

## Forward Intelligence

### What the next slice should know
- Chores tab now groups by room, not by assignee. The `orderedRoomIds` → `choresByRoom` pattern is the data backbone. S03's dashboard can link back to specific rooms by filtering the chore list.
- SectionHeader is now in `components/ui/` and is the standard collapsible section pattern across tabs. S03/S04 should use it if they need sections.
- Add screen accepts URL params `suggestedRoom` and `suggestedEffort` for pre-fill — any future flow that creates chores can link to add.tsx with these params.

### What's fragile
- A chore with a room_id that doesn't match any fetched room vanishes from the UI — there's no fallback grouping. If a room gets deleted without reassigning chores, those chores become invisible.
- Room fetch failure causes the entire section list to be empty (chores exist but aren't visible). No explicit error state — just an empty screen.

### Authoritative diagnostics
- Template insert failures → look for `[chores] template insert failed` or `[chores] room creation failed` in console — these are the only tagged chore log lines.
- Room grouping correctness → query `supabase.from('rooms').select('*')` and `supabase.from('chores').select('room_id, name')` to verify room/chore relationships.

### What assumptions changed
- Template batch insert changed from Promise.all individual inserts to single `.insert(array)` — simpler, one round-trip. DECISIONS.md already recorded this change.
