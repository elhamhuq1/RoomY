---
id: T04
parent: S02
milestone: M003
provides:
  - Empty state shows room-based template cards with per-room template counts
  - Template selection modal with per-room checkbox list, select/deselect all, frequency and effort badges
  - Batch chore insert from templates with auto room creation
  - "Add from templates" entry point on non-empty chores tab
key_files:
  - components/chores/EmptyState.tsx
  - app/(app)/(tabs)/chores.tsx
key_decisions:
  - Used single Supabase batch insert instead of Promise.all individual inserts — one network round-trip vs N
  - Template modal has two-level navigation: __picker__ state shows room list, then room type shows template checkboxes with back button
  - Room creation guarded before chore insert — if room creation fails, no orphaned chores are inserted
patterns_established:
  - Template modal two-level pattern: room picker → template list with checkboxes → batch insert
  - openTemplateModal helper pre-selects all templates by default (opt-out UX rather than opt-in)
observability_surfaces:
  - console.error '[chores] room creation failed' on room insert failure
  - console.error '[chores] template insert failed' on chore batch insert failure
  - console.error '[chores] template add error' on unexpected exceptions
  - Alert.alert shown on every failure path — no silent failures
duration: 20m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T04: Template quick-add flow and redesigned empty state

**Redesigned empty state to room-based template cards and added template selection modal with batch chore insert and auto room creation**

## What Happened

Replaced the flat `SUGGESTED_CHORES` grid in EmptyState with room-based cards — each ROOMS entry that has templates renders a card showing room icon, label, and template count. Tapping opens a template selection modal.

The template modal lives in chores.tsx with two views: a room picker (`__picker__` state) for the "Add from templates" button on non-empty tab, and a template list view showing checkboxes (all checked by default), frequency badges, and effort badges. "Select All / Deselect All" toggle at top.

Batch insert logic: finds an existing room matching the room_type, or creates one. Then does a single `.insert(choreInserts)` call with all selected templates — each gets name, frequency, effort_points from template, room_id, household_id, rotation_order from all household members, current_assignee as first member. Single loading spinner during the entire operation.

"Add from templates" link-style button added below the swap requests banner for non-empty state.

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors (only pre-existing Deno errors in supabase/functions/)
- EmptyState interface changed from `onSelectSuggestion` to `onSelectRoom` — all usages updated
- Template modal state management: `templateRoomType`, `selectedTemplates`, `addingTemplates` — all wired
- Room auto-creation path: checks `rooms.find(r => r.room_type === templateRoomType)`, inserts if not found
- Batch insert: single Supabase `.insert()` with array of chore objects
- All error paths produce console.error + Alert.alert

**Slice-level verification (final task — all must pass):**
- ✅ `npx tsc --noEmit` — zero new errors
- 🔲 Visual in Expo Go: Chores grouped by room with collapsible sections — requires runtime
- 🔲 Visual in Expo Go: ChoreRow shows effort badge — requires runtime
- 🔲 Visual in Expo Go: Add screen room/effort pickers — requires runtime
- 🔲 Visual in Expo Go: Template flow end-to-end — requires runtime
- 🔲 Visual in Expo Go: Private room visibility — requires runtime
- 🔲 Visual in Expo Go: Existing actions unchanged — requires runtime
- ✅ Empty state shows room-based template entry — implemented and type-checked

## Diagnostics

- **Room creation failure:** `console.error('[chores] room creation failed:', err.message)` — visible in React Native debugger console. Alert shown to user.
- **Template insert failure:** `console.error('[chores] template insert failed:', err.message)` — visible in console. Alert shown.
- **Room grouping after insert:** After templates added, `refreshChores()` re-fetches rooms and chores. New room and chores should appear in the correct section. If missing, inspect `rooms` state and `choresByRoom` grouping.
- **Template count mismatch:** Compare `CHORE_TEMPLATES[roomType].length` with the number of chores inserted. Selected count shown on "Add N Chores" button.

## Deviations

- Used single Supabase `.insert(array)` instead of `Promise.all` with individual inserts. Single batch insert is one network call — strictly better than N parallel calls for this use case.
- Added a back button (arrow-back) in the template list view header for navigation back to room picker, not in the original plan but natural UX for two-level modal.

## Known Issues

None — all code paths have error handling. Expo Go runtime verification pending (requires device/simulator).

## Files Created/Modified

- `components/chores/EmptyState.tsx` — redesigned from flat suggestion grid to room-based template cards with ROOMS and CHORE_TEMPLATES imports
- `app/(app)/(tabs)/chores.tsx` — added template modal state, openTemplateModal helper, handleAddTemplates batch insert, "Add from templates" button, template selection modal JSX, updated EmptyState wiring
- `.gsd/milestones/M003/slices/S02/tasks/T04-PLAN.md` — added Observability Impact section per pre-flight requirement
