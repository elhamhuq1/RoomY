# S03: Effort-Weighted Dashboard, Leaderboard, Fairness & Badges — Research

**Date:** 2026-03-16

## Summary

S03 transforms the existing count-based chore dashboard (~413 LOC) into an effort-weighted analytics surface. The current dashboard (`app/(app)/chores/dashboard.tsx`) already fetches completions per period, computes per-member stats, renders progress bars, and shows streaks — but it ranks by `completionCount` (flat count) instead of effort points. The chores tab (`app/(app)/(tabs)/chores.tsx`) also has a `StatsRow` component showing pending/disputed/streak counts that could surface effort info.

The core backend work is: (1) add `effort_points` column to `chore_completions` via a new migration, (2) modify the `complete_chore` RPC to stamp `effort_points` from the chore at completion time, (3) backfill existing completions with effort_points=1. On the frontend: replace `completionCount` ranking with `effortPoints` sum, add fairness percentage per member, add streak badge thresholds (7/30/60-day), and update the `MemberStats` interface and rendering. The existing dashboard structure (period toggle, member cards, progress bars, empty state) is preserved — this is a data-layer upgrade and visual enhancement, not a layout rewrite.

No new libraries or unfamiliar patterns. Every piece maps to existing code.

## Recommendation

**Start with the migration + RPC modification.** This is the only backend change and everything downstream depends on it. The migration adds `effort_points INT NOT NULL DEFAULT 1` to `chore_completions` and modifies `complete_chore` to read the chore's `effort_points` and stamp it onto the completion record. Backfilling existing completions with 1 is trivial (they already have DEFAULT 1).

**Redesign the dashboard in-place.** The current `dashboard.tsx` is a single-file screen with inline data fetching and rendering. Replace `completionCount` sorting with `effortPoints` sorting, add fairness percentage (`member effort / total effort`), and add streak badge indicators at 7/30/60-day thresholds. Keep the period toggle (week/month), keep the member cards layout, keep the empty state. The `MemberStats` interface gains `effortPoints: number` and `fairnessPercent: number`.

**Update types to match.** `ChoreCompletion` interface needs `effort_points: number`, the Database type's `chore_completions` table entry needs the column, and the `complete_chore` RPC return type can stay the same (effort_points doesn't need to be in the return — the dashboard fetches completions separately).

## Implementation Landscape

### Key Files

- `supabase/migrations/20260311000004_chores.sql` — existing `chore_completions` table (lines 30-40) and `complete_chore` RPC (lines 126-180). The RPC does `INSERT INTO chore_completions (chore_id, completed_by)` — needs `effort_points` added to that INSERT. The RPC already does `SELECT * INTO v_chore FROM chores WHERE id = p_chore_id` so `v_chore.effort_points` is already available in scope.
- `supabase/migrations/20260316000016_chore_rooms.sql` — S01 migration that added `effort_points` to chores table. New S03 migration will follow this file.
- `app/(app)/chores/dashboard.tsx` — the screen to redesign. Currently 413 LOC. `fetchData` fetches completions by period, computes `MemberStats` with `completionCount` and `streak`, sorts by count. Needs: sum `effort_points` per member instead, compute fairness %, detect streak badge thresholds.
- `components/chores/StatsRow.tsx` — shows pending/disputed/streak on chores tab. Could gain an effort summary, but CHORE-13 specifically targets the dashboard, so StatsRow changes are optional polish.
- `lib/types/database.ts` — `ChoreCompletion` interface (line 115) needs `effort_points: number`. Database type `chore_completions` entries (lines 273-284) need the column.
- `lib/theme/colors.ts` — has `brand.DEFAULT` (#2D6A4F), `semantic.warning` (#F59E0B), `semantic.error` (#EF4444) for badge/ranking colors if needed.

### Build Order

1. **Migration + RPC update** — New migration file adds `effort_points` to `chore_completions`, modifies `complete_chore` RPC with `CREATE OR REPLACE FUNCTION` to stamp `v_chore.effort_points` into the INSERT. Backfill existing rows with DEFAULT 1. This is a clean additive change — same pattern as S01's room migration.

2. **TypeScript type updates** — Add `effort_points: number` to `ChoreCompletion` interface, update Database type entries for `chore_completions` to include the column in Row/Insert/Update types.

3. **Dashboard redesign** — Modify `fetchData` to sum `effort_points` from completions (they're already fetched — just `.reduce()` over them per member). Replace `completionCount` ranking with `effortPoints` ranking. Add fairness percentage: `memberEffort / totalEffort * 100`. Add streak badge display: check if streak ≥ 7/30/60 and render badge indicators. Update `MemberStats` interface. Keep period toggle, empty state, and overall layout intact.

### Verification Approach

- **TypeScript compilation**: `npx tsc --noEmit` — zero new errors
- **Migration correctness**: Review SQL for correct column addition, RPC replacement, and backfill
- **RPC behavior**: After migration applies, `complete_chore` should produce `chore_completions` rows with the correct `effort_points` value matching the chore's difficulty at completion time
- **Dashboard data**: With effort_points on completions, the dashboard should rank members by effort sum, show fairness percentages that sum to ~100%, and display streak badges at correct thresholds
- **Visual verification**: Run in Expo Go — dashboard shows effort-weighted bars, leader highlighted, fairness %, badge icons at 7/30/60 thresholds

## Constraints

- `complete_chore` is `SECURITY DEFINER` with `SET search_path = ''` — must keep these attributes when replacing. All table references must be fully qualified (`public.chore_completions`).
- The RPC already does `SELECT * INTO v_chore FROM public.chores` — `v_chore.effort_points` is available without any join change.
- The client calls `complete_chore` with two args `(p_chore_id, p_completed_by)` — the signature must NOT change. The effort_points value comes from the chore row server-side.
- Existing completions have no `effort_points` — the migration DEFAULT 1 handles backfill. This matches S01's decision that existing chores got `effort_points=1`.
- Dashboard uses `useCachedFetch` + `useFocusEffect` (no realtime) — this stays the same.
- Streak calculation currently counts consecutive non-reverted completions — S03 adds badge thresholds on top of this, doesn't change the algorithm.
- Per DECISIONS.md: streak badges displayed on dashboard only (not chore rows or profile).
- Per DECISIONS.md: fairness uses simple ratio (your effort / total effort), not expected-vs-actual.

## Common Pitfalls

- **`CREATE OR REPLACE FUNCTION` must match the exact signature** — If the new migration's `complete_chore` has different args than the original, Postgres will create a second overloaded function instead of replacing. Use the exact same `(p_chore_id UUID, p_completed_by UUID) RETURNS JSON` signature.
- **Fairness percentages with zero total effort** — If no completions exist in the period, total effort is 0. Division by zero → NaN. Guard with `totalEffort > 0 ? (memberEffort / totalEffort * 100) : 0`.
- **Streak badges are all-time, not per-period** — The dashboard's period toggle (week/month) filters completions for the leaderboard, but streaks are calculated from ALL completions (no date filter). The current code already does this correctly — don't accidentally filter the streak query by period.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Supabase / Postgres | `supabase/agent-skills@supabase-postgres-best-practices` (35K installs) | available — already noted in M003 research |
