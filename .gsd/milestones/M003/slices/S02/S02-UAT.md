# S02: Room-Based Chores Tab with Templates & Private Rooms — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: All changes are UI — room sections, effort badges, room/effort pickers, template flow. Must be visually verified in Expo Go on a real device or simulator.

## Preconditions

- Expo dev server running (`npx expo start`)
- Supabase project running with S01 migration applied (rooms table, chores.room_id, chores.effort_points columns exist)
- At least one household with 2+ members
- At least one existing chore (migrated to "General" room with effort_points=1 from S01)
- Test user signed in and viewing the chores tab

## Smoke Test

Open the chores tab → existing chores should appear under a "General" room section header (not the old "Your Chores / Household" split). Section header shows a grid icon, "General" label, and chore count.

## Test Cases

### 1. Room-grouped collapsible sections (CHORE-01)

1. Open chores tab with existing chores in the "General" room
2. Verify chores appear under a "General" section header with icon and count badge
3. Tap the section header to collapse it
4. **Expected:** Chores in that section hide. Header still shows with collapsed chevron.
5. Tap the header again to expand
6. **Expected:** Chores reappear. Expand/collapse is toggleable.

### 2. Multiple rooms display in correct order

1. Create chores in at least 3 different rooms (e.g., Kitchen, Bathroom, General)
2. Open chores tab
3. **Expected:** Room sections appear in ROOMS constant order: Kitchen → Bathroom → ... → General. Empty rooms do not appear.

### 3. Effort badge on ChoreRow (CHORE-04)

1. Ensure there are chores with effort_points=1, effort_points=2, and effort_points=3
2. Open chores tab
3. **Expected:** Effort=1 chores show NO effort badge. Effort=2 shows "⚡×2" amber pill. Effort=3 shows "⚡×3" amber pill.

### 4. Room picker on add screen

1. Tap FAB to add a new chore
2. Scroll to the room picker section
3. **Expected:** Scrollable row of room pills (icon + label) showing all household rooms. "General" is the default selection.
4. Tap a different room pill (e.g., Kitchen)
5. **Expected:** Kitchen pill becomes selected (highlighted). Previous selection deselects.

### 5. Effort picker on add screen (CHORE-04)

1. On the add chore screen, find the effort picker
2. **Expected:** Three toggle options: ⚡1 Easy, ⚡2 Medium, ⚡3 Hard. Default is 1.
3. Tap ⚡2 (Medium)
4. Fill in name, confirm, save the chore
5. Return to chores tab
6. **Expected:** New chore appears in the selected room with "⚡×2" effort badge.

### 6. Inline room creation

1. On the add chore screen, tap "+ New Room" pill in the room picker
2. **Expected:** Modal appears with room name field, room type picker (from ROOMS constant), and private toggle.
3. Enter a name (e.g., "My Office"), select room type "Bedroom", toggle private ON
4. Tap create
5. **Expected:** New room pill appears in the room picker. It becomes selected. The chore can be saved to this new room.

### 7. Private room visibility (CHORE-02)

1. User A creates a private room "My Bedroom" and adds a chore to it
2. Sign in as User B (same household)
3. Open chores tab
4. **Expected:** "My Bedroom" section does NOT appear for User B. The chore in that room is invisible.
5. Sign back in as User A
6. **Expected:** "My Bedroom" section appears with the chore visible.

### 8. Template quick-add from empty state (CHORE-05)

1. Start with an empty chores list (no chores in household)
2. Open chores tab
3. **Expected:** Empty state shows room-based template cards (Kitchen, Bathroom, etc.) with template counts.
4. Tap "Kitchen" card
5. **Expected:** Template selection modal opens showing kitchen templates (e.g., "Clean dishes", "Wipe counters") with checkboxes (all checked by default), frequency badges, effort badges.
6. Deselect one template
7. Tap "Add N Chores" button
8. **Expected:** Loading spinner briefly, then chores appear in a new "Kitchen" room section. Count matches selected templates.

### 9. Template quick-add from non-empty tab

1. With chores already existing, find the "Add from templates" button/link on the chores tab (below swap requests banner)
2. Tap it
3. **Expected:** Room picker modal appears showing all room types with template counts.
4. Select a room type, select templates, add
5. **Expected:** New chores appear in the correct room section.

### 10. Template pre-fill on add screen

1. From the template flow, note that URL params `suggestedRoom` and `suggestedEffort` are accepted
2. Navigate to add screen with these params set (e.g., deep link or via template flow)
3. **Expected:** Room picker and effort picker are pre-filled with the suggested values.

### 11. Existing actions still work

1. Complete a chore (tap checkmark)
2. **Expected:** Completion works as before, chore updates.
3. Claim an unassigned chore
4. **Expected:** Claim works, chore moves to your assignment.
5. Initiate a swap request
6. **Expected:** Swap modal appears and works.
7. Dispute a completion
8. **Expected:** Dispute modal appears and works.
9. Delete a chore
10. **Expected:** Chore removed from the list.

## Edge Cases

### Empty room after completing all chores

1. Complete or delete all chores in a room
2. Refresh the chores tab
3. **Expected:** That room section disappears (empty rooms are not rendered).

### Room creation failure

1. Attempt to create a room with network disconnected (airplane mode)
2. **Expected:** Alert shown with error message. No crash. Room picker unchanged.

### Template insert failure

1. Attempt to add templates with network disconnected
2. **Expected:** Alert shown with error message. No orphaned rooms created (room creation and chore insert are sequential — if room creation fails, no chores attempted).

### Many rooms

1. Create chores in 5+ different rooms
2. **Expected:** All rooms render in correct order. Scrolling works. No layout overflow or truncation.

## Failure Signals

- Chores tab shows flat list instead of room sections → room fetch failed or chores.tsx didn't get the T02 changes
- Room sections appear but chores are missing → room_id mismatch between chores and rooms tables
- Effort badge shows for effort_points=1 → ChoreRow conditional render broken
- Private room visible to non-owner → RLS policy not applied or rooms query missing household_id filter
- Template "Add N Chores" does nothing → batch insert failed silently (check console for `[chores]` prefixed errors)
- Add screen missing room picker → add.tsx didn't get T03 changes
- Empty state shows old flat suggestion grid → EmptyState.tsx didn't get T04 changes

## Requirements Proved By This UAT

- CHORE-01 — room-based collapsible sections (tests 1, 2)
- CHORE-02 — private room visibility restricted to creator (test 7)
- CHORE-04 — effort picker on add screen, effort badge on chore rows (tests 3, 5)
- CHORE-05 — template quick-add populates rooms in under 30 seconds (tests 8, 9)

## Not Proven By This UAT

- CHORE-03 — private room RLS at database level (proved by S01 psql verification, not re-verified here)
- CHORE-12 — migration of existing chores to General room (proved by S01, assumed as precondition here)
- Effort-weighted dashboard, leaderboard, fairness (S03)
- My Day view and visual urgency indicators (S04)
- Peer nudge system (S05)

## Notes for Tester

- The room order follows the ROOMS constant: kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general. If a room type is missing from this list, it sorts to the end.
- Effort badge uses amber colors (distinct from the green brand palette and red overdue indicator).
- Template modal has two levels: tapping a room card from empty state goes directly to that room's templates, while the "Add from templates" button on a non-empty tab shows a room picker first.
- All test cases assume S01 migration is applied. If rooms table doesn't exist, the chores tab will render empty (no crash, but no rooms).
- The `ChoreSwapRequest` unused import warning is pre-existing — ignore it.
