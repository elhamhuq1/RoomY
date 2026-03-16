# S03: Effort-Weighted Dashboard, Leaderboard, Fairness & Badges

**Goal:** Transform the count-based chore dashboard into an effort-weighted analytics surface with fairness scores and streak badges.
**Demo:** Dashboard ranks roommates by summed effort points (not flat count), shows each member's fairness percentage, and displays 🔥 streak badges at 7/30/60-day thresholds — all visible in Expo Go.

## Must-Haves

- `effort_points` column on `chore_completions` table (INT NOT NULL DEFAULT 1)
- `complete_chore` RPC stamps `v_chore.effort_points` onto completion record at insert time
- Existing completions backfilled with effort_points=1
- `ChoreCompletion` TypeScript interface includes `effort_points: number`
- Dashboard leaderboard sorts by effort points sum (not completion count)
- Each member card shows fairness percentage (member effort / total effort × 100)
- Streak badges render at 7-day, 30-day, and 60-day thresholds on the dashboard
- Division-by-zero guarded when total effort is 0

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes (migration must apply, dashboard must render)
- Human/UAT required: yes (visual verification in Expo Go)

## Verification

- `npx tsc --noEmit` — zero new errors in app/components/lib code
- Migration SQL reviewed: correct column addition, RPC signature match, backfill via DEFAULT
- Dashboard renders effort-weighted bars, fairness %, and streak badges at correct thresholds (Expo Go visual verification)
- RPC stamps correct effort_points: verified by reading migration logic (v_chore.effort_points flows into INSERT)

## Observability / Diagnostics

- Runtime signals: dashboard data fetch logs no errors; completions include effort_points in query results
- Inspection surfaces: `SELECT effort_points FROM chore_completions LIMIT 5;` — confirms column exists and has values; dashboard member cards show numeric effort and percentage
- Failure visibility: NaN/undefined in fairness % indicates division-by-zero bug or missing effort_points on completions
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `chores.effort_points` (from S01), `chore_completions` table (existing), `complete_chore` RPC (existing), `ChoreCompletion` type, dashboard.tsx
- New wiring introduced in this slice: `effort_points` column on `chore_completions`, modified `complete_chore` RPC, effort-weighted stats computation in dashboard
- What remains before the milestone is truly usable end-to-end: S04 (My Day + urgency), S05 (nudging)

## Tasks

- [ ] **T01: Migration & Types — effort_points on chore_completions + RPC update** `est:30m`
  - Why: The dashboard can't show effort-weighted stats until completions carry effort_points, and the RPC stamps it at completion time. This is the data foundation for all three S03 requirements (CHORE-08, CHORE-09, CHORE-13).
  - Files: `supabase/migrations/20260316000017_effort_on_completions.sql`, `lib/types/database.ts`
  - Do: New migration adds `effort_points INT NOT NULL DEFAULT 1` to `chore_completions`. `CREATE OR REPLACE FUNCTION complete_chore` with exact same signature `(p_chore_id UUID, p_completed_by UUID) RETURNS JSON` — adds `v_chore.effort_points` to the INSERT into `chore_completions`. Keep SECURITY DEFINER, `SET search_path = ''`, fully qualified table refs. Update `ChoreCompletion` interface with `effort_points: number`. Update Database type's `chore_completions` Insert/Update entries.
  - Verify: `npx tsc --noEmit` — zero new errors. SQL reviewed for signature match and correct column addition.
  - Done when: Migration file exists with correct SQL, ChoreCompletion has effort_points field, tsc passes.

- [ ] **T02: Effort-Weighted Dashboard with Fairness & Streak Badges** `est:1h`
  - Why: Delivers CHORE-08 (leaderboard by effort), CHORE-09 (fairness %), CHORE-10 (streak badges), CHORE-13 (effort-weighted dashboard). Replaces count-based ranking with effort-weighted ranking.
  - Files: `app/(app)/chores/dashboard.tsx`
  - Do: Add `effortPoints: number` and `fairnessPercent: number` to `MemberStats` interface. In `fetchData`, sum `effort_points` from completions per member (`.reduce()`). Compute `totalEffort` across all members, then `fairnessPercent = totalEffort > 0 ? (memberEffort / totalEffort * 100) : 0`. Sort by `effortPoints` descending. Update progress bar width to use `effortPoints / maxEffort`. Replace count display with effort points. Add fairness % display on each member card. Add streak badge indicators: 🔥×7, 🔥×30, 🔥×60 based on streak thresholds — show the highest achieved badge. Keep period toggle, empty state, and overall layout intact. Streaks remain all-time (no period filter).
  - Verify: `npx tsc --noEmit` — passes. Visual verification in Expo Go: member cards show effort points, fairness %, and badge icons.
  - Done when: Dashboard sorts by effort, shows fairness %, displays streak badges at 7/30/60 thresholds, tsc passes.

## Files Likely Touched

- `supabase/migrations/20260316000017_effort_on_completions.sql`
- `lib/types/database.ts`
- `app/(app)/chores/dashboard.tsx`
