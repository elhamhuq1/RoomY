# T03: 03-groceries 03

**Slice:** S03 — **Milestone:** M001

## Description

Fix three UX gaps identified during grocery list UAT: (1) edit modal keyboard coverage, (2) missing section label for unchecked items, and (3) swipe-to-delete auto-fires without letting user tap the delete button.

Purpose: Close all UAT gaps so Phase 3 groceries passes user acceptance testing.
Output: Updated groceries.tsx with all three fixes applied.

## Must-Haves

- [x] "Edit modal content stays fully visible above the keyboard on iOS"
- [x] "Each unchecked item row shows a visual indicator (pencil icon) that it is tappable for editing"
- [x] "Unchecked items section has a 'To Buy' label matching the 'Completed' label style"
- [x] "Swiping left reveals a tappable delete button that the user must deliberately tap to confirm deletion"
- [x] "Swipe action shows a 'Delete' text label beneath the trash icon"

## Files

- `app/(app)/(tabs)/groceries.tsx`
