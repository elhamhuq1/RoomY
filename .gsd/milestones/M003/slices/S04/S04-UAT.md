# S04: Smart "My Day" View & Visual Urgency Indicators — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Both features (urgency coloring and My Day screen) are visual/interactive — they must be verified in Expo Go on a real device to confirm colors render correctly, filtering works with real data, and actions execute properly.

## Preconditions

- Expo dev server running (`npx expo start`)
- App loaded in Expo Go on device or simulator
- User signed in with a household that has active chores
- At least one chore assigned to the current user with `next_due_at` in the past (overdue)
- At least one chore assigned to the current user with `next_due_at` today
- At least one chore assigned to the current user with `next_due_at` 2+ days from now
- At least one disputed chore in the household (for precedence testing)
- At least one chore assigned to a different household member (to verify My Day excludes it)

## Smoke Test

Navigate to the Chores tab → verify chore rows show colored left borders (not all the same color). Tap the sun icon in the header → My Day screen opens with a filtered list or empty state.

## Test Cases

### 1. Green urgency coloring (2+ days out)

1. Find a chore with `next_due_at` 3+ days in the future on the Chores tab
2. **Expected:** Left border is wintergreen (#2D6A4F). Due-date pill has green-tinted background with green text showing "Due in Xd" or a date.

### 2. Yellow urgency coloring (today/tomorrow)

1. Find a chore with `next_due_at` set to today or tomorrow on the Chores tab
2. **Expected:** Left border is amber/yellow (#F59E0B). Due-date pill has amber/yellow-tinted background with amber text showing "Due today" or "Due tomorrow".

### 3. Red urgency coloring (overdue)

1. Find a chore with `next_due_at` in the past on the Chores tab
2. **Expected:** Left border is red (#EF4444). Due-date pill has red-tinted background with red text showing "Xd overdue".

### 4. Disputed row styling takes precedence

1. Find a disputed chore on the Chores tab
2. **Expected:** Row has red-50 background with red-300 left border and "Disputed" badge — NOT urgency-based coloring. The disputed visual treatment overrides any urgency level.

### 5. My Day navigation via sun icon

1. On the Chores tab, locate the sun icon in the header (top-right area)
2. Tap the sun icon
3. **Expected:** Navigates to "My Day" screen with "My Day" title in the header and a "Chores" back button.

### 6. My Day shows only current user's due/overdue chores

1. On the My Day screen, count the chores displayed
2. Cross-reference against the Chores tab: filter mentally to only YOUR assigned chores that are due today or overdue
3. **Expected:** My Day shows exactly those chores — no chores assigned to other members, no chores due 2+ days from now.

### 7. My Day sort order (overdue first, then due-today)

1. On the My Day screen with both overdue and due-today chores
2. **Expected:** Overdue chores (red borders) appear above due-today chores (yellow borders). Within overdue, oldest overdue appears first. Within due-today, earliest due time appears first.

### 8. My Day header pill count

1. On the My Day screen, check the sun icon pill below the header
2. **Expected:** Shows "N chores for today" where N matches the actual number of chore rows displayed.

### 9. Complete action from My Day

1. On the My Day screen, find one of your assigned chores
2. Tap the green checkmark button
3. Confirm the "Mark Complete?" dialog
4. **Expected:** Chore disappears from My Day after a brief delay. Header pill count decreases by 1. Chore is marked complete on the main Chores tab.

### 10. Delete action from My Day

1. On the My Day screen, tap the red trash icon on any chore
2. Confirm the "Delete Chore?" dialog
3. **Expected:** Chore is removed from My Day list. Header pill count decreases by 1. Chore no longer appears on the main Chores tab.

### 11. Dispute action from My Day

1. On the My Day screen, find a chore that was recently completed by another member (shows a flag icon)
2. Tap the flag icon
3. Enter a dispute reason in the modal
4. Tap "Submit Dispute"
5. **Expected:** Dispute modal closes. Chore row updates to show disputed styling (red background, "Disputed" badge).

### 12. Swap action from My Day

1. On the My Day screen, find one of your assigned chores
2. Tap the swap icon (↔)
3. **Expected:** Bottom sheet appears showing "Request Swap With" and listing other household members in the chore's rotation. Selecting a member sends the swap request.

### 13. My Day empty state

1. Complete or delete all chores due today/overdue (or test with a user who has no due chores)
2. **Expected:** My Day shows a large sun icon, "You're all caught up! 🎉" heading, and "No chores due today. Enjoy your free time!" subtitle. No chore rows visible.

## Edge Cases

### Chore with no next_due_at value

1. If a chore somehow has a null or invalid `next_due_at`, check its display on the Chores tab
2. **Expected:** Row displays with green (default) urgency coloring — does not crash or show error state.

### Effort badge combined with urgency pill

1. Find a chore with `effort_points` > 1 (shows ⚡×2 or ⚡×3)
2. **Expected:** Both the effort badge (amber) and the urgency pill (green/yellow/red) display side by side in the metadata row without overlapping or clipping.

### My Day with only overdue chores (none due today)

1. Set up state where current user has overdue chores but nothing due today
2. **Expected:** My Day still shows the overdue chores. Header pill says "N chores for today" (even though they're overdue — this is the expected label).

## Failure Signals

- All chore rows show the same left border color regardless of due date → urgency logic broken
- Disputed rows show urgency coloring instead of red-50 bg → precedence bug in ChoreRow
- Sun icon missing from chores tab header → _layout.tsx wiring issue
- My Day shows chores assigned to other members → filter logic bug (check `current_assignee` comparison)
- My Day shows chores due 3+ days from now → end-of-today calculation wrong
- Overdue chores appear below due-today chores on My Day → sort comparator bug
- Complete/delete buttons do nothing on My Day → useChoreActions hook not wired to refreshMyDay
- App crashes on My Day → check for null user/household in useSession

## Requirements Proved By This UAT

- CHORE-06 — "My Day" view shows personalized daily task list (due today + overdue, sorted by urgency) with complete/claim/dispute/swap/delete actions
- CHORE-07 — Visual urgency indicators (green/yellow/red) on each chore based on due date, disputed rows retain precedence

## Not Proven By This UAT

- Push notification delivery (S05 scope)
- Room-based organization correctness (S02 — already validated)
- Effort-weighted leaderboard accuracy (S03 — already validated)
- Private room RLS enforcement (S01 — already validated)

## Notes for Tester

- The urgency color thresholds are: green = 2+ days out, yellow = today or tomorrow, red = overdue. To test all three colors you need chores spanning these ranges — adjust `next_due_at` in Supabase if needed.
- My Day uses client-side end-of-day calculation (`setHours(23,59,59,999)`) — if testing near midnight, chores right on the boundary may flip between showing and not showing.
- The frequency pill (Daily/Weekly/Monthly) and effort badge (⚡×N) are unaffected by this slice — they should look the same as before.
- Room labels are intentionally not shown on My Day (design decision) — don't flag this as a bug.
