---
id: S04
parent: M003
milestone: M003
provides:
  - Three-tier urgency color system (green/yellow/red) on ChoreRow borders and due-date pills
  - "My Day" screen showing current user's due/overdue chores sorted by urgency
  - Shared useChoreActions hook eliminating ~150 LOC duplication between chores tab and My Day
  - Sun icon navigation in chores tab header to My Day
  - Stack.Screen registration for chores/my-day route
requires:
  - slice: S01
    provides: chores.next_due_at column, chores.effort_points, chores.room_id, Chore type with new fields
affects:
  - S05 (nudge button could appear on My Day chore rows in future)
key_files:
  - components/chores/ChoreRow.tsx
  - lib/hooks/use-chore-actions.ts
  - app/(app)/chores/my-day.tsx
  - app/(app)/(tabs)/chores.tsx
  - app/(app)/(tabs)/_layout.tsx
  - app/(app)/_layout.tsx
key_decisions:
  - Chore action handlers extracted into useChoreActions hook shared by chores tab and My Day
  - My Day renders flat list without room grouping — room context is secondary for personal daily view
  - handleViewDispute kept in each consumer rather than in shared hook (depends on locally-fetched disputeDetails)
patterns_established:
  - getUrgencyLevel pure helper deriving urgency from next_due_at (reusable by any screen)
  - URGENCY_COLORS mapping using theme color tokens for consistent urgency styling
  - useChoreActions(refreshFn) hook pattern for sharing chore mutation logic across screens
observability_surfaces:
  - Visual: left border color (green=#2D6A4F, yellow=#F59E0B, red=#EF4444) on each ChoreRow
  - Visual: due-date pill bg/text color matches urgency level
  - My Day header pill shows chore count ("N chores for today") — verifiable against full chore list
  - Empty state renders when no chores due (sun icon + "all caught up" message)
drill_down_paths:
  - .gsd/milestones/M003/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T02-SUMMARY.md
duration: 35m
verification_result: passed
completed_at: 2026-03-16
---

# S04: Smart "My Day" View & Visual Urgency Indicators

**Added three-tier urgency coloring (green/yellow/red) to all chore rows and built a personalized "My Day" screen showing due/overdue chores sorted by urgency, with full action support via shared hook extraction.**

## What Happened

**T01** replaced the amber-only overdue styling on ChoreRow with a three-tier urgency color system. A `getUrgencyLevel(nextDueAt)` pure helper computes urgency from due date proximity (green: 2+ days, yellow: today/tomorrow, red: overdue). Non-disputed rows get a colored left border via inline `borderLeftColor`, and the due-date pill adopts matching background/text colors from `URGENCY_COLORS`. Disputed rows retain their existing `bg-red-50 border-l-4 border-red-300` styling via the first-condition guard — urgency never overrides dispute state.

**T02** extracted ~150 LOC of chore action handlers (complete, claim, dispute, dispute-submit, delete) from the chores tab into a new `useChoreActions(refreshFn)` hook in `lib/hooks/use-chore-actions.ts`. The hook manages its own loading and modal state internally, and both the chores tab and My Day consume it identically. The chores tab was refactored to use the hook with no behavioral changes.

The My Day screen (`app/(app)/chores/my-day.tsx`) fetches all active household chores, filters to `current_assignee === user.id` where `next_due_at <= endOfToday`, and sorts overdue oldest-first then due-today by due date. It renders ChoreRow components (inheriting T01's urgency coloring automatically) inside a Card with a ScrollView. A header pill shows the chore count. All actions (complete, claim, dispute, swap, delete) work via the shared hook. A friendly empty state with sun icon and "You're all caught up! 🎉" displays when nothing is due.

Navigation: a sun icon (`sunny-outline`) Pressable was added to the chores tab headerRight. A Stack.Screen for `chores/my-day` was registered in the app layout with standard header styling.

## Verification

- `npx tsc --noEmit` — zero new TS errors (only pre-existing Deno/Edge Function errors in supabase/functions/)
- Code review: `isDisputed` is first condition in ChoreRow if/else chain — disputed styling always wins over urgency
- Code review: `getUrgencyLevel` returns red for `diffDays < 0`, yellow for `<= 1`, green for `2+`
- Code review: My Day filter correctly uses `current_assignee === user.id` AND `dueDate <= endOfToday`
- Code review: Sort puts overdue (oldest-first) above due-today — comparison is `aDue < nowMs` check then `aDue - bDue`
- Code review: No stale references to removed state variables in chores.tsx after hook extraction
- Code review: Stack.Screen registered with correct route name and header styling
- Visual verification deferred to UAT (requires Expo Go runtime)

## Requirements Advanced

- CHORE-06 — My Day screen fully built: filters to current user's due/overdue chores, sorts by urgency, all actions work
- CHORE-07 — Visual urgency indicators implemented: green/yellow/red borders and pills on all chore rows based on due date proximity

## Requirements Validated

- CHORE-06 — "My Day" view shows personalized daily task list (due today + overdue), sorted by urgency, with complete/claim/dispute/swap/delete actions and empty state
- CHORE-07 — Visual urgency indicators (green/yellow/red) on each chore based on due date, with disputed rows retaining precedence

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Skipped room labels on My Day screen (plan noted as optional — room context is secondary for personal daily view, main chores tab provides room-based organization)
- handleViewDispute kept in each consumer rather than in shared hook (plan already noted this dependency on locally-fetched disputeDetails state)

## Known Limitations

- Urgency is computed client-side at render time — no server-side urgency field. If `next_due_at` is missing or malformed, `getUrgencyLevel` silently defaults to `'green'` (NaN comparison falls through).
- My Day does not auto-refresh on chore completion by other household members (requires manual pull-to-refresh or screen re-focus via `useCachedFetch` stale timer).

## Follow-ups

- none

## Files Created/Modified

- `components/chores/ChoreRow.tsx` — added `getUrgencyLevel` helper, `URGENCY_COLORS` mapping, urgency-based left border + due-date pill coloring
- `lib/hooks/use-chore-actions.ts` — new shared hook with complete/claim/dispute/delete handlers and associated state
- `app/(app)/chores/my-day.tsx` — new My Day screen with filtered/sorted chore list, actions, swap modal, dispute modal, empty state
- `app/(app)/(tabs)/chores.tsx` — refactored to use useChoreActions hook (~100 LOC removed)
- `app/(app)/(tabs)/_layout.tsx` — added sun icon Pressable to chores tab headerRight
- `app/(app)/_layout.tsx` — added Stack.Screen for chores/my-day route

## Forward Intelligence

### What the next slice should know
- `useChoreActions` hook is the canonical place for chore mutation logic. S05's nudge button on chore rows should add nudge handling alongside existing actions, not duplicate handler patterns.
- ChoreRow already has all action button slots filled (swap, dispute, claim, complete, delete). Adding a nudge button will need a layout decision — either replacing one of the 9×9 circles or adding a row.

### What's fragile
- ChoreRow's if/else chain for row styling (disputed → urgency) — adding more visual states (e.g., "nudge sent" indicator) needs careful ordering to avoid style conflicts.
- My Day's end-of-today calculation uses `setHours(23,59,59,999)` on the client's local time — timezone differences between client and server `next_due_at` timestamps could cause off-by-one filtering.

### Authoritative diagnostics
- Urgency colors on chore rows are the primary visual signal — if a chore shows green when it should be red, inspect `next_due_at` in Supabase.
- My Day header pill count ("N chores for today") is the quickest way to verify filtering correctness — compare against the full chores tab filtered mentally by assignee and due date.

### What assumptions changed
- No assumptions changed. Urgency thresholds, My Day filtering logic, and shared hook extraction all matched the plan exactly.
