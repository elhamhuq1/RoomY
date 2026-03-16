# S04: Smart "My Day" View & Visual Urgency Indicators

**Goal:** "My Day" screen shows personalized daily task list (due today + overdue, sorted by urgency), and chore rows display green/yellow/red urgency coloring based on due date proximity.
**Demo:** Open chores tab → see urgency-colored left borders and due-date pills on all chore rows (green for 2+ days, yellow for today/tomorrow, red for overdue). Tap sun icon in header → "My Day" screen shows only current user's due/overdue chores sorted by urgency. Complete/claim/dispute/delete actions work from My Day.

## Must-Haves

- `getUrgencyLevel(nextDueAt)` helper returns `'green' | 'yellow' | 'red'` based on due date thresholds (green: 2+ days, yellow: today/tomorrow, red: overdue)
- ChoreRow renders urgency-colored left border and due-date pill (replacing amber-only overdue styling)
- Disputed row styling (red bg + red border) takes visual precedence over urgency coloring
- "My Day" screen at `app/(app)/chores/my-day.tsx` filters chores to `current_assignee = user.id` where `next_due_at <= end of today` or overdue
- My Day sorts overdue first (oldest first), then due-today
- My Day shows friendly empty state when nothing is due
- My Day accessible via sun icon button in chores tab header
- Stack.Screen registered for `chores/my-day` in `app/(app)/_layout.tsx`
- All chore action handlers (complete, claim, dispute, swap, delete) work from My Day via shared `useChoreActions` hook
- `npx tsc --noEmit` passes with zero new errors

## Proof Level

- This slice proves: integration
- Real runtime required: yes (Expo Go visual verification)
- Human/UAT required: yes (urgency colors and My Day filtering)

## Verification

- `npx tsc --noEmit` — zero new TS errors (pre-existing Deno/Edge Function errors are acceptable)
- Visual in Expo Go: ChoreRow shows green/yellow/red left border + pill coloring on chores tab
- Visual in Expo Go: Disputed chores retain red-50 bg + red border (urgency coloring does not override)
- Visual in Expo Go: Sun icon in chores header navigates to My Day screen
- Visual in Expo Go: My Day shows only current user's chores due today or overdue, sorted correctly
- Visual in Expo Go: My Day empty state displays when no chores are due
- Visual in Expo Go: Complete/claim/delete actions work from My Day screen

## Observability / Diagnostics

- **Runtime signals:** Urgency level is computed per-render from `chore.next_due_at` — no persisted state. Visual left-border color and pill color are the observable outputs. My Day screen's filtered list count is visible in the UI.
- **Inspection surfaces:** In React DevTools, check `urgency` and `urgencyStyle` local variables inside ChoreRow. My Day screen's filtering logic can be verified by comparing displayed chores against the full household chore list in the chores tab.
- **Failure visibility:** If `next_due_at` is missing or malformed, `getUrgencyLevel` will return `'green'` (NaN comparison falls through to default). This is safe but may hide data issues — inspect raw chore data via Supabase dashboard if urgency colors look wrong.
- **Redaction constraints:** None — no secrets or PII involved in urgency computation.

## Integration Closure

- Upstream surfaces consumed: `components/chores/ChoreRow.tsx` (existing component), `app/(app)/(tabs)/chores.tsx` (action handler patterns, data fetching pattern), `lib/theme/colors.ts` (brand/semantic color tokens), `lib/constants/chore-rooms.ts` (room labels/icons), `lib/types/database.ts` (Chore type with room_id, effort_points, next_due_at)
- New wiring introduced in this slice: `useChoreActions` hook extracted from chores tab (shared by both chores tab and My Day), sun icon header button, Stack.Screen for `chores/my-day`
- What remains before the milestone is truly usable end-to-end: S05 (peer nudge system)

## Tasks

- [x] **T01: Add urgency color system and update ChoreRow visual styling** `est:30m`
  - Why: CHORE-07 — replaces amber-only overdue styling with green/yellow/red urgency indicators on all chore rows (shared component affects both chores tab and My Day)
  - Files: `components/chores/ChoreRow.tsx`
  - Do: Add `getUrgencyLevel(nextDueAt: string): 'green' | 'yellow' | 'red'` helper using thresholds from DECISIONS.md. Replace the current amber-only `rowBg` logic (lines 115-119) with urgency-based left border coloring for non-disputed rows. Replace the amber due-date pill (lines 216-229) with urgency-colored pill. Use existing color tokens: `colors.brand.DEFAULT` (#2D6A4F) for green, `colors.semantic.warning` (#F59E0B) for yellow, `colors.semantic.error` (#EF4444) for red. Disputed styling (`bg-red-50 border-l-4 border-red-300`) must remain the first condition and take precedence.
  - Verify: `npx tsc --noEmit` passes; visual check in Expo Go shows correct urgency colors on chores tab
  - Done when: ChoreRow renders green border+pill for 2+ days, yellow for today/tomorrow, red for overdue; disputed rows unchanged

- [ ] **T02: Build My Day screen with shared action hooks and navigation wiring** `est:1h`
  - Why: CHORE-06 — delivers the personalized daily task list screen with all chore actions working, plus extracts shared action logic to prevent duplication between chores tab and My Day
  - Files: `lib/hooks/use-chore-actions.ts` (new), `app/(app)/chores/my-day.tsx` (new), `app/(app)/(tabs)/chores.tsx`, `app/(app)/(tabs)/_layout.tsx`, `app/(app)/_layout.tsx`
  - Do: (1) Extract action handlers (handleComplete, handleClaim, handleDispute, handleDisputeSubmit, handleDelete, handleViewDispute) from chores.tsx into a new `useChoreActions(refreshFn)` hook returning the handler functions + dispute modal state. (2) Refactor chores.tsx to use the hook. (3) Create `my-day.tsx` screen: fetch household chores, filter to `current_assignee === user.id` where `next_due_at <= endOfToday` or overdue (use `setHours(23,59,59,999)` for local end-of-day), sort overdue oldest-first then due-today. Render flat ScrollView of ChoreRow components using useChoreActions. Include dispute reason modal (same pattern as chores tab). Show friendly empty state with sun icon when nothing is due. Display room label from ROOM_MAP next to each chore for context. (4) Add sun icon (`sunny-outline`) Pressable to chores tab headerRight. (5) Add Stack.Screen for `chores/my-day` in `_layout.tsx`.
  - Verify: `npx tsc --noEmit` passes; My Day accessible via header button; shows only user's due/overdue chores; actions work
  - Done when: My Day screen renders correct filtered/sorted chore list, all actions work, empty state shows, navigation is wired

## Files Likely Touched

- `components/chores/ChoreRow.tsx`
- `lib/hooks/use-chore-actions.ts` (new)
- `app/(app)/chores/my-day.tsx` (new)
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/_layout.tsx`
