# S02: Room-Based Chores Tab with Templates & Private Rooms

**Goal:** Transform the chores tab from a flat "Your Chores / Household" split into a room-grouped, collapsible-section layout. Users can create chores with room assignment and effort points, create new rooms (including private), and populate rooms from templates.
**Demo:** Chores grouped by room with collapsible SectionHeaders. Add screen has room picker and effort picker. Template flow populates a room in one tap. Private rooms visible only to creator. All in Expo Go.

## Must-Haves

- Chores display grouped by room with collapsible section headers (CHORE-01)
- Private rooms appear only for their creator — RLS handles server-side (CHORE-02)
- Effort picker (1/2/3) on add/edit screen, effort badge on ChoreRow (CHORE-04 supporting)
- Template quick-add populates rooms with pre-built chores (CHORE-05)
- Room picker on add screen with inline "create room" option
- All existing chore actions (complete, claim, swap, dispute, delete) still work

## Proof Level

- This slice proves: integration
- Real runtime required: yes (Expo Go)
- Human/UAT required: yes (visual verification of room sections, template flow)

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors (pre-existing Deno errors excluded)
- Visual in Expo Go:
  - Chores grouped by room with collapsible sections (room icon + name + count)
  - ChoreRow shows effort badge (e.g. "⚡2")
  - Add screen: room picker, effort picker, template pre-fill params work
  - Template flow: tap room → see templates → add selected → chores appear in room
  - Private room only visible to creator
  - Existing actions (complete, claim, swap, dispute, delete) unchanged
  - Empty state shows room-based template entry

## Integration Closure

- Upstream surfaces consumed: `lib/constants/chore-rooms.ts` (ROOMS, ROOM_MAP), `lib/constants/chore-templates.ts` (CHORE_TEMPLATES), `lib/types/database.ts` (Room, Chore with room_id/effort_points), `supabase/migrations/20260316000016_chore_rooms.sql` (rooms table + RLS)
- New wiring introduced in this slice: room fetch + grouping in chores tab, room_id/effort_points in chore INSERT, inline room creation, template-to-chore insertion
- What remains before milestone is truly usable end-to-end: S03 (effort-weighted dashboard), S04 (My Day + urgency), S05 (nudge system)

## Tasks

- [x] **T01: Move SectionHeader to shared UI and add effort badge to ChoreRow** `est:25m`
  - Why: SectionHeader is generic but lives in `components/groceries/`. Chores tab needs it. Moving to `components/ui/` avoids cross-domain imports. Effort badge on ChoreRow is needed before the tab redesign renders room sections.
  - Files: `components/groceries/SectionHeader.tsx`, `components/ui/SectionHeader.tsx`, `components/ui/index.ts`, `app/(app)/(tabs)/groceries.tsx`, `components/groceries/index.ts`, `components/chores/ChoreRow.tsx`, `components/chores/index.ts`
  - Do: Move SectionHeader to `components/ui/SectionHeader.tsx`. Update groceries.tsx import from `@/components/groceries` to `@/components/ui`. Remove from groceries/index.ts. Add to ui/index.ts export. Add effort_points badge to ChoreRow metadata pills row (show "⚡×2" or "⚡×3" pill, hide for effort=1 since it's default).
  - Verify: `npx tsc --noEmit` — no new errors. Groceries tab still renders sections correctly.
  - Done when: SectionHeader importable from `@/components/ui`, ChoreRow renders effort badge for effort > 1, groceries tab unbroken.

- [ ] **T02: Redesign chores tab with room-grouped collapsible sections** `est:1h30m`
  - Why: Core of CHORE-01. Transforms the flat "Your Chores / Household" layout into room-grouped sections. Private rooms auto-filtered by RLS (CHORE-02). This is the largest task — the 768 LOC chores.tsx gets substantial restructuring.
  - Files: `app/(app)/(tabs)/chores.tsx`
  - Do: Fetch rooms from `supabase.from('rooms').select('*').eq('household_id', household.id)` alongside chores. Build a `roomMap: Record<string, Room>` from fetched rooms. Group chores by `room_id`. Render one SectionHeader per room (using ROOM_MAP for icon/label, room record for count), collapsible with `collapsedRooms` state set. Inside each section, render ChoreRows in a Card, preserving all existing props/handlers (complete, claim, swap, dispute, delete). Order rooms by ROOMS constant order. Hide rooms with zero chores. Keep StatsRow and swap-request banner at top. Keep swap modal and dispute modal unchanged.
  - Verify: `npx tsc --noEmit`. Visual in Expo Go: chores grouped by room, collapse/expand works, all action buttons functional.
  - Done when: Chores tab renders room sections with collapsible headers, private room chores hidden from non-owners (RLS), all existing functionality preserved.

- [ ] **T03: Add room picker, effort picker, and inline room creation to add screen** `est:1h`
  - Why: Every new chore needs a room_id (NOT NULL) and effort_points. Supports CHORE-04 (effort UI) and CHORE-02 (private room creation). Also accepts template pre-fill params for T04.
  - Files: `app/(app)/chores/add.tsx`
  - Do: Fetch household rooms on mount. Add room picker as scrollable row of room pills (icon + label, same style as frequency picker). Default to "General" room. Add "+ New Room" pill that opens a mini-modal (name, room_type picker from ROOMS constant, is_private toggle). Private room sets `is_private: true, created_by: auth.uid()`. Add effort picker as 1/2/3 toggle row below frequency. Accept URL params `suggestedRoom`, `suggestedEffort` for template pre-fill. Include `room_id` and `effort_points` in the INSERT call.
  - Verify: `npx tsc --noEmit`. Visual in Expo Go: room picker renders with household rooms, effort picker toggles 1/2/3, new room creation works, chore inserts with correct room_id and effort_points visible in Supabase.
  - Done when: Add screen includes working room picker (with inline creation), effort picker, all fields flow into INSERT, template params pre-fill correctly.

- [ ] **T04: Template quick-add flow and redesigned empty state** `est:45m`
  - Why: Delivers CHORE-05. Templates let users populate rooms with chores in one tap. Empty state should guide toward room-based template selection instead of a flat suggestion list.
  - Files: `components/chores/EmptyState.tsx`, `app/(app)/(tabs)/chores.tsx`
  - Do: Redesign EmptyState to show room cards (one per room type from ROOMS). Tapping a room card opens a template selection modal showing CHORE_TEMPLATES for that room type with checkboxes. "Add Selected" creates a room (if it doesn't exist) then inserts selected template chores via Promise.all (parallel, single loading state). Each inserted chore gets: name, frequency, effort_points from template, room_id from the created/existing room, rotation_order from all household members, household_id, created_by. Also add a "Browse Templates" entry point on the chores tab (small button below StatsRow or on empty room sections) for when chores already exist but user wants to add more from templates.
  - Verify: `npx tsc --noEmit`. Visual in Expo Go: empty state shows room template cards, template selection modal works, added chores appear in correct room section after refresh.
  - Done when: Users can populate a room with template chores in under 30 seconds (success criterion), empty state guides toward room-based templates.

## Observability / Diagnostics

- **Runtime signals:** No new runtime signals from this slice — chore grouping and template insertion use existing Supabase queries. Errors surface through existing React Native error boundaries and console warnings.
- **Inspection surfaces:** Room grouping correctness inspectable via `supabase.from('rooms').select('*')` and `supabase.from('chores').select('room_id, name')`. Template insertion results visible in chore list refresh. Effort badge visibility driven by `chore.effort_points` — inspect via row props.
- **Failure visibility:** Room fetch failure → empty section list (no crash). Template insert failure → Promise.all rejection logged to console. Private room RLS filtering invisible to non-owners by design — verify by querying as different user.
- **Redaction:** No secrets or PII in this slice. Room names and chore names are user-generated but non-sensitive household data.

## Files Likely Touched

- `components/ui/SectionHeader.tsx` (moved from groceries)
- `components/ui/index.ts`
- `components/groceries/SectionHeader.tsx` (removed)
- `components/groceries/index.ts`
- `app/(app)/(tabs)/groceries.tsx` (import update)
- `components/chores/ChoreRow.tsx`
- `components/chores/EmptyState.tsx`
- `components/chores/index.ts`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/chores/add.tsx`
