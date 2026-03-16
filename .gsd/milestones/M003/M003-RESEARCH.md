# M003: Chore System Overhaul — Research

**Date:** 2026-03-16

## Summary

The existing chore system is a flat list with rotation, completion, dispute, and swap mechanics — ~600 LOC in the main screen, ~200 in ChoreRow, ~250 in the dashboard, ~200 in the add screen. The schema (`chores`, `chore_completions`, `chore_swap_requests`) is clean and all RPCs (`complete_chore`, `claim_chore`, `dispute_completion`, `resolve_swap_request`) are SECURITY DEFINER with proper RLS. The codebase already has every pattern needed for this overhaul: collapsible sections from grocery departments (SectionHeader + collapsed state set), fixed taxonomy constants (DEPARTMENTS pattern), push notifications via Expo Push API + Edge Functions, attention feed integration for overdue chores, and effort-weighted analytics would extend the existing dashboard which already tracks completion counts per period.

The overhaul is large but low-risk architecturally. No new external APIs. No new infrastructure. Every feature maps to existing patterns. The primary risks are: (1) the migration must be additive and preserve existing chore data, (2) private room RLS must be airtight at the database level, and (3) the smart daily list algorithm needs to feel useful without being complex. The biggest UI change is the main chores tab — today it's "Your Chores" and "Household" sections; it becomes room-based sections with collapsible headers, urgency coloring, and effort badges.

The recommended slice ordering is: schema + migration first (everything downstream depends on rooms and effort_points columns), then room-based UI + templates, then effort/fairness/leaderboard, then smart daily list, then nudging, then badges/polish. Schema first because it's the riskiest piece (additive migration with private room RLS) and every feature reads from it.

## Recommendation

**Prove the schema migration and private room RLS first.** This is the only slice with real integration risk — if the migration corrupts existing data or RLS leaks private chores, everything else is wasted. The room taxonomy should be a fixed constant (like DEPARTMENTS) with a `rooms` table for household-specific instances. Effort points (1-3) go directly on the `chores` table as a new column with DEFAULT 1. Private rooms use an `is_private` boolean + `created_by` on the rooms table, with RLS policies that filter chores through their room's visibility.

**Reuse the grocery department grouping pattern exactly.** The groceries tab already solved room-based (department-based) organization with collapsible sections, SectionHeader component, and a collapsed-set state pattern. The chores tab redesign should follow this identically — iterate over rooms, render a SectionHeader per room, show chore rows inside each section.

**Keep the "My Day" algorithm simple.** Filter to: (1) chores assigned to current user, (2) where next_due_at ≤ end of today OR is overdue. Sort by: overdue first (oldest first), then due today. No cap on items — if a user has 15 overdue chores, they should see all 15. This is just a filtered view, not a recommendation engine.

**Nudge as a new Edge Function** paralleling `push-chore-reminder`. The nudge table stores sender, recipient, chore_id, and created_at. Rate limiting (1 per chore per 24h per sender) is enforced at the DB level via a unique constraint on (chore_id, sender_id) with a time check, or more simply in the RPC before insert.

## Implementation Landscape

### Key Files

**Schema & Backend:**
- `supabase/migrations/20260311000004_chores.sql` — existing chore schema. New migration will ADD columns (room_id, effort_points) to `chores` table, CREATE `rooms` and `chore_nudges` tables, add RLS policies for private rooms, and update `complete_chore` RPC to return effort_points for leaderboard accumulation.
- `supabase/migrations/20260311000001_foundation.sql` — `get_user_household_ids()` function and `household_settings` table. RLS patterns to follow for new tables.
- `supabase/functions/push-chore-reminder/index.ts` — existing push notification Edge Function. Nudge Edge Function (`push-chore-nudge`) will follow this exact pattern: read from nudge table, check notification prefs, send via Expo Push API.
- `supabase/migrations/20260311000005_notifications.sql` — `notification_preferences` table. Nudges should respect `chores_enabled` preference.

**Shared Constants:**
- `lib/constants/grocery-departments.ts` — pattern for room taxonomy constant. Create `lib/constants/chore-rooms.ts` with the same structure: `{ id, label, icon }` per room type, plus `ROOM_MAP` for O(1) lookup. Fixed set: kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general.
- `lib/constants/chore-templates.ts` — new file. Pre-built chore suggestions per room with name, frequency, and effort_points defaults. Extends the existing `SUGGESTED_CHORES` in EmptyState.tsx but organized by room.

**Types:**
- `lib/types/database.ts` — `Chore` interface needs `room_id`, `effort_points`, `is_private` fields. New interfaces: `Room`, `ChoreNudge`. Dashboard types need effort-weighted stats.

**Main Chores Tab (complete redesign):**
- `app/(app)/(tabs)/chores.tsx` — currently 350+ LOC flat list. Redesign to room-grouped sections using SectionHeader from groceries. Add urgency color logic (green/yellow/red based on due date proximity). Preserve all existing actions (complete, claim, swap, dispute, delete).
- `components/chores/ChoreRow.tsx` — add effort badge (1-3 dots or number), replace text overdue label with color-coded urgency indicator. Keep existing emoji mapping.
- `components/chores/StatsRow.tsx` — add effort points display alongside existing pending/disputed/streak stats.
- `components/chores/EmptyState.tsx` — replace flat suggestion list with room-based template selection flow.

**New Screens:**
- `app/(app)/chores/my-day.tsx` — "My Day" smart daily task list. Filtered view of user's due/overdue chores.
- `app/(app)/chores/add.tsx` — extend with room picker (dropdown or segmented control) and effort picker (1-3 scale). Template quick-add when coming from room-based template selection.
- `app/(app)/chores/dashboard.tsx` — redesign with effort-weighted leaderboard (effort_points sum, not just completion count), fairness score, streak badges.

**Navigation:**
- `app/(app)/(tabs)/_layout.tsx` — chores tab header needs "My Day" button added. Existing: info, swap-request, dashboard, settings.
- `app/(app)/_layout.tsx` — add Stack.Screen entries for new screens (my-day, possibly room management).

**Home Tab Integration:**
- `components/home/AttentionFeed.tsx` — already shows overdue chores and chores due today. Nudge events could surface here as a new attention item type.

### Build Order

1. **Schema migration + RLS** — Create rooms table, add room_id/effort_points to chores, create nudges table, private room RLS. Migrate existing chores to "General" room with effort=1. This unblocks everything. Verify: migration runs cleanly, existing chores preserved, private room chores invisible to non-owners via RLS.

2. **Room taxonomy + templates constants** — `chore-rooms.ts` and `chore-templates.ts`. Pure client-side, no backend dependency beyond schema. Unblocks UI work.

3. **Room-based chores tab + add screen** — The core UX transformation. Collapsible room sections, room picker on add, urgency colors on ChoreRow. Reuses SectionHeader pattern from groceries. Verify: chores display grouped by room, new chores can be created with room assignment.

4. **Templates + onboarding flow** — Room template selection for quick chore setup. Extends EmptyState and add screen. Verify: user can populate a room's chores from templates in under 30 seconds.

5. **Effort-weighted dashboard + leaderboard + fairness** — Extend dashboard from completion-count to effort-point-sum ranking. Add fairness score (user effort / total effort). Update `complete_chore` RPC to carry effort_points through to completions (or join at query time). Verify: leaderboard ranks by effort, fairness percentages sum to 100%.

6. **Smart "My Day" view** — Filtered list: user's chores where due ≤ today or overdue. New screen with dedicated entry point. Verify: shows correct chores for current user, empty state when nothing due.

7. **Nudge system** — New table, RPC with rate limiting, Edge Function for push notification, UI button on overdue chores assigned to others. Verify: nudge sends push, rate limit prevents re-nudge within 24h.

8. **Streak badges + polish** — Visual badge display (7/30/60-day streaks) on dashboard and possibly profile. Final polish pass on all new UI. Verify: badges appear at correct thresholds.

### Verification Approach

- **TypeScript compilation** — `npx tsc --noEmit` after each slice
- **Migration verification** — Apply migration to local Supabase, verify via `psql` that existing chores got default room_id and effort_points=1, that private room RLS blocks cross-user access
- **In-app verification** — Run in Expo Go, visually confirm room sections render, urgency colors display, templates populate, dashboard shows effort-weighted stats
- **RLS verification** — Query private room chores as different user via Supabase client, confirm empty result set
- **Push notification verification** — Trigger nudge, confirm push notification received on test device (or verify Edge Function logs the correct payload)

## Constraints

- **Additive migrations only** — New columns on `chores` must have DEFAULT values. `room_id` defaults to the household's "General" room. `effort_points` defaults to 1. No column removals or type changes.
- **Expo Go compatibility** — No native modules. All UI is React Native + NativeWind. LayoutAnimation for collapsible sections (already used in groceries SectionHeader).
- **Existing RPC signatures** — `complete_chore(p_chore_id, p_completed_by)` is called from the client. If effort_points need to flow through completion, either join at query time (simpler) or add the field to the completion record. Prefer query-time join to avoid changing the RPC signature.
- **RLS via `get_user_household_ids()`** — All new table policies must use this helper to avoid infinite recursion. Private room RLS adds an additional layer: chores in private rooms must only be visible to `rooms.created_by`.
- **Realtime** — Chores tab currently does NOT use realtime subscriptions (uses `useCachedFetch` + `useFocusEffect`). Groceries tab DOES use realtime. The chores tab can stay on focus-based refresh for this milestone — realtime can be added later if needed.
- **Existing notification preferences** — Nudges must respect the `chores_enabled` flag in `notification_preferences`. Default is enabled (no pref row = on).
- **NativeWind v4 / Tailwind v3** — All styling via className strings. Design tokens in `lib/theme/colors.ts`. Use existing semantic colors: `brand.DEFAULT` for on-track (green), `semantic.warning` for approaching due (yellow), `semantic.error` for overdue (red).

## Common Pitfalls

- **Room FK on chores requires rooms to exist first** — The migration must CREATE the rooms table, INSERT a default "General" room per household, THEN ALTER chores to add room_id with that default. This must happen in a single transaction or the FK will fail. Use a DO block or multi-statement migration.
- **Private room RLS complexity** — A simple "household members can view chores" policy won't work for private rooms. Need: `chore is in a non-private room AND household matches` OR `chore is in a private room AND room.created_by = auth.uid()`. This is a compound policy that joins through rooms. Test it explicitly with two users.
- **Effort points on completions vs chores** — Effort can change on a chore after completions are recorded. Leaderboard should use the effort_points from the chore at completion time, not current value. Store `effort_points` on `chore_completions` (denormalized at completion time) via the `complete_chore` RPC. This avoids retrospective recalculation.
- **Room assignment during migration** — Existing chores have no room. The migration must create a "General" room for each household that has chores, then set `room_id` to that room's id. This requires a multi-step migration: create rooms table → insert general rooms → alter chores → update existing chores.
- **Template chore creation is still one-at-a-time** — Templates show suggestions but each still goes through the normal `INSERT INTO chores` path. Don't build a batch-insert RPC unless single-insert proves too slow (it won't for 5-10 template chores).
- **Urgency color thresholds** — Need clear, consistent rules. Recommendation: green (due in 2+ days), yellow (due tomorrow or today), red (overdue). Don't make this configurable — hardcode it.

## Open Risks

- **Smart daily list usefulness for small households** — With 2-4 people and 5-10 chores, "My Day" might show 0-2 items most days. It could feel empty and useless. Mitigation: show a friendly "nothing due today" state and perhaps surface "coming up tomorrow" items as secondary content.
- **Nudge tone** — Push notification copy matters for roommate relationships. Too aggressive feels passive-aggressive. Too gentle gets ignored. The CONTEXT lists two options; the friendlier one ("Alex thinks the kitchen could use some love 🧹") is probably better for the target audience (college-age roommates). This is a content decision, not a technical risk.
- **Fairness score interpretation** — A simple ratio (your effort / total effort) works but can feel unfair if one roommate has more chores assigned. "Expected vs actual" is more sophisticated but harder to explain. Recommend starting with the simple ratio and labeling it clearly: "You've contributed X% of effort points this week."

## Candidate Requirements

These should be added to REQUIREMENTS.md as Active during roadmap planning:

- **CHORE-01** — Chores are organized by room with collapsible sections (kitchen, bathroom, etc.)
- **CHORE-02** — Users can create private rooms (bedroom) visible only to the room creator
- **CHORE-03** — Private room chores are invisible to other household members at the database level (RLS)
- **CHORE-04** — Each chore has an effort_points value (1-3) reflecting difficulty
- **CHORE-05** — Pre-built chore templates available per room with default effort values
- **CHORE-06** — "My Day" view shows personalized daily task list (due today + overdue)
- **CHORE-07** — Visual urgency indicators (green/yellow/red) on each chore based on due date
- **CHORE-08** — Weekly leaderboard ranked by effort points with leader highlighted
- **CHORE-09** — Fairness score showing effort-weighted workload distribution per member
- **CHORE-10** — Streak badges (7-day, 30-day, 60-day) for consistent chore completion
- **CHORE-11** — Peer nudge sends push notification for overdue chores (rate limited: 1 per chore per 24h per sender)
- **CHORE-12** — Existing chores migrated to default "General" room with effort_points=1, preserving all history
- **CHORE-13** — Effort-weighted contribution dashboard replaces count-based dashboard

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Supabase / Postgres | `supabase/agent-skills@supabase-postgres-best-practices` (35K installs) | available — recommended for RLS and migration work |
| React Native / Expo | `wshobson/agents@react-native-architecture` (4.7K installs) | available — less critical, existing patterns are clear |
