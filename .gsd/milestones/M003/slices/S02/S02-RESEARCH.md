# S02: Room-Based Chores Tab with Templates & Private Rooms — Research

**Date:** 2026-03-16

## Summary

This is straightforward UI work following an established pattern. The groceries tab already implements the exact grouping-by-section pattern (department sections with collapsible `SectionHeader`, collapsed state set, items rendered inside each section). S02 applies this identical pattern to chores, grouping by room instead of department. The SectionHeader component from `components/groceries/` is directly reusable — it accepts label, icon, count, and collapse toggle. S01 delivered all the schema (rooms table, room_id/effort_points on chores), types (Room, updated Chore), and constants (ROOMS, ROOM_MAP, CHORE_TEMPLATES) that S02 consumes.

The scope breaks into three clear workstreams: (1) redesign chores tab from flat "Your Chores / Household" sections to room-grouped collapsible sections, (2) add room picker + effort picker to the add chore screen, and (3) build template-based quick-add flow. Private rooms are handled automatically by RLS — the SELECT query only returns chores in rooms the user can see — so the UI just renders what comes back without any client-side filtering.

## Recommendation

**Move the `SectionHeader` component to `components/ui/` (or import from groceries)** — it's a generic collapsible section header used identically across groceries and now chores. Either move it to shared UI or import it cross-domain from groceries. Moving to `components/ui/` is cleaner.

**Fetch rooms alongside chores** — the chores tab needs room data (name, icon via room_type, is_private) to render section headers. Fetch rooms once on mount and build a lookup map. The ROOM_MAP constant gives us icons/labels by room_type, but we need the actual room records to get room IDs that chores reference.

**Keep the add screen simple** — add a room dropdown (using the fetched household rooms) and an effort picker (three-button toggle like frequency picker). When coming from a template, pre-fill name, frequency, effort, and room.

**Templates as a bottom-sheet flow** — when user taps "Add from templates" on a room section or empty state, show a modal/bottom-sheet with CHORE_TEMPLATES for that room type. User checks which templates to add, taps "Add Selected", and each is inserted individually (no batch RPC needed for 3-5 items).

## Implementation Landscape

### Key Files

**Will be redesigned:**
- `app/(app)/(tabs)/chores.tsx` (768 LOC) — currently flat list with "Your Chores" and "Household" sections. Redesign to: fetch rooms, group chores by room_id, render SectionHeader per room, keep all existing actions (complete, claim, swap, dispute, delete). The swap/dispute modals stay unchanged.
- `app/(app)/chores/add.tsx` (357 LOC) — add room picker (dropdown or segmented control), effort picker (1/2/3 toggle), and accept template params (suggestedRoom, suggestedEffort in addition to existing suggestedName/suggestedFrequency).
- `components/chores/EmptyState.tsx` (86 LOC) — replace flat SUGGESTED_CHORES with room-based template selection. Show room cards that expand to show templates.

**Will be modified:**
- `components/chores/ChoreRow.tsx` (251 LOC) — add effort points badge (small pill showing 1-3 dots or "⚡×2" style). Keep everything else.
- `components/chores/StatsRow.tsx` (47 LOC) — no changes needed for S02. Effort-weighted stats are S03 scope.
- `components/chores/index.ts` — export any new components.

**Will be moved or shared:**
- `components/groceries/SectionHeader.tsx` (55 LOC) — reuse directly. Either import from `@/components/groceries` or move to `@/components/ui/SectionHeader`. The component is generic — takes label, icon, count, collapsible, expanded, onToggle.

**No changes needed:**
- `lib/constants/chore-rooms.ts` — already has ROOMS, ROOM_MAP (from S01)
- `lib/constants/chore-templates.ts` — already has CHORE_TEMPLATES per room type (from S01)
- `lib/types/database.ts` — already has Room type, Chore.room_id, Chore.effort_points (from S01)
- `supabase/migrations/` — no schema changes in S02
- `app/(app)/(tabs)/_layout.tsx` — header buttons stay the same (info, swap, dashboard, settings). The `+` FAB already routes to add screen.

### Build Order

1. **Move SectionHeader to shared UI + add effort badge to ChoreRow** — quick setup. Move SectionHeader from groceries to `components/ui/` (update groceries imports). Add effort_points display to ChoreRow. This unblocks the main chores tab redesign and is independently verifiable.

2. **Redesign chores tab with room-grouped sections** — the core task. Fetch rooms from Supabase, group chores by room_id, render collapsible room sections using SectionHeader. Private rooms auto-filtered by RLS. Preserve all existing action handlers. Room sections ordered by ROOMS constant order. Empty rooms hidden (or shown with "add from templates" CTA).

3. **Add room picker + effort picker to add screen** — extend the add form. Room picker as a scrollable row of room pills (like frequency picker). Effort picker as 1/2/3 toggle. Accept new URL params for template pre-fill. Insert must include room_id and effort_points.

4. **Template quick-add flow + redesigned empty state** — template selection modal. User picks a room → sees template chores for that room type → checks/unchecks → adds selected. EmptyState redesigned to show room-based template entry points instead of flat suggestions.

### Verification Approach

- `npx tsc --noEmit` — zero new TypeScript errors
- Visual verification in Expo Go:
  - Chores appear grouped by room with collapsible section headers (room icon + name + count)
  - Collapsing/expanding a room section works with LayoutAnimation
  - Private room section appears only for room creator (RLS handles this server-side)
  - ChoreRow shows effort badge (e.g., "⚡2")
  - Add screen has working room picker and effort picker
  - Creating a chore with room + effort inserts correctly (verify room_id and effort_points in Supabase dashboard)
  - Template flow: tap room → see templates → add selected → chores appear in correct room section
  - Existing actions (complete, claim, swap, dispute, delete) still work unchanged
  - Empty state shows room-based template suggestions instead of flat list

## Constraints

- `chores.room_id` is NOT NULL — every new chore must have a room. The add screen must require room selection (no "unassigned" option). Default to "General" room when no room is pre-selected.
- SectionHeader imports: if moved to `components/ui/`, all groceries imports must update. If kept in groceries, the cross-domain import is slightly unusual but works.
- Room creation (creating new rooms for the household) is NOT in S02 scope — users select from existing rooms that were either auto-created (General) or can be created via a future room management screen. S02 should include an inline "Create Room" option in the room picker so users aren't stuck with only "General".
- The chores query currently uses `.select("*")` — this already returns room_id and effort_points. Rooms must be fetched separately since they're a different table.
- Private room creation needs the room INSERT to set `is_private: true` and `created_by: auth.uid()`. The add-room flow in the room picker must support marking a room as private (bedroom use case).

## Common Pitfalls

- **Room ordering** — rooms should display in a consistent, predictable order, not random DB order. Use the ROOMS constant ordering (kitchen → bathroom → living_room → bedroom → laundry → outdoor → garage → general) to sort rooms for display. Rooms not in the taxonomy (shouldn't happen with CHECK constraint) go last.
- **Empty rooms in the list** — if a room exists but has no chores, should it show? Show it only if the user just created it (to avoid confusion), otherwise hide empty rooms from the chore list. Template flow can still show all room types.
- **Room picker must fetch actual household rooms** — the ROOMS constant defines the taxonomy, but the room picker needs real room records from the DB (to get the UUID). The add screen must fetch household rooms and let users pick from those (or create a new one inline).
- **Template batch add UX** — adding 5 templates one-by-one will flash 5 loading states. Use Promise.all for parallel inserts (same pattern as recipe import) and show a single loading state.
- **ON DELETE SET NULL vs NOT NULL contradiction** — S01 forward intelligence flagged this: the room_id FK has ON DELETE SET NULL but the column is NOT NULL. For S02, this means room deletion is effectively blocked by the DB. Don't build room deletion UI — just room creation. This contradiction needs a migration fix later.

## Open Risks

- **First runtime test of S01 migration** — S01's migration hasn't been runtime-verified (Docker was unavailable). The chores tab redesign is the first real consumer of rooms/room_id. If the migration has issues, S02 will surface them. Verify rooms exist and chores have valid room_id before building UI on top.
- **Room creation inline in add screen** — creating a room is a Supabase INSERT requiring household_id and created_by. The add screen needs access to these. If the inline "create room" flow is complex, it could be a separate screen. Keep it minimal — name + room_type + is_private toggle in a modal.
