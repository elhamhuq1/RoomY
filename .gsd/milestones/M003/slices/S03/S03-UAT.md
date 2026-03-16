# S03: Effort-Weighted Dashboard, Leaderboard, Fairness & Badges — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: Migration correctness is artifact-verifiable (SQL review), but dashboard rendering (effort-weighted bars, fairness %, streak badges) requires visual confirmation in Expo Go

## Preconditions

- Supabase local or remote instance running with migration `20260316000017_effort_on_completions.sql` applied
- At least 2 household members exist
- At least one member has completed chores (so completions exist for leaderboard data)
- Expo Go running and connected to dev server (`npx expo start`)

## Smoke Test

Open Chores tab → tap Dashboard → confirm member cards show numeric effort values (not just completion counts) and "X% of effort" labels appear below each member's stats.

## Test Cases

### 1. Effort column exists on completions

1. Connect to Supabase DB (psql or Studio)
2. Run: `SELECT effort_points FROM chore_completions LIMIT 5;`
3. **Expected:** Column exists, all rows show integer values (existing completions backfilled to 1)

### 2. RPC stamps effort_points on new completion

1. Have a chore with `effort_points = 2` (set via S02's effort picker or direct DB update)
2. Complete that chore in the app
3. Query: `SELECT effort_points FROM chore_completions WHERE chore_id = '<that chore>' ORDER BY created_at DESC LIMIT 1;`
4. **Expected:** The new completion row has `effort_points = 2` (not the default 1)

### 3. Leaderboard ranks by effort points

1. Ensure Member A has completed 3 chores at effort 1 (total effort: 3)
2. Ensure Member B has completed 1 chore at effort 3 (total effort: 3)
3. Open Dashboard
4. **Expected:** Both members show "3 effort pts". If one member also has more completions, they should NOT rank higher unless their effort sum is higher. Sorting is by effort, not count.

### 4. Fairness percentage displays correctly

1. Open Dashboard with at least 2 members who have completions
2. Read the "X% of effort" values on each member card
3. **Expected:** Percentages sum to 100% (±1% rounding). Each percentage = (member effort / total effort × 100). If only one member has completions, they show 100%.

### 5. Fairness handles zero completions

1. Create a new household or clear all completions
2. Open Dashboard
3. **Expected:** Empty state shows (no crash, no NaN). If members display, fairness shows 0% — not NaN or undefined.

### 6. Streak badge — 7-day threshold

1. Ensure a member has a streak of exactly 7 consecutive days of completions
2. Open Dashboard
3. **Expected:** That member's card shows ⭐ badge with orange coloring

### 7. Streak badge — 30-day threshold

1. Ensure a member has a streak of 30+ consecutive days
2. Open Dashboard
3. **Expected:** 🥈 badge with silver coloring (not ⭐ — highest tier wins)

### 8. Streak badge — 60-day threshold

1. Ensure a member has a streak of 60+ consecutive days
2. Open Dashboard
3. **Expected:** 🏆 badge with gold coloring (not 🥈 or ⭐)

### 9. Streak badge — below 7 days

1. Member with streak of 3 days
2. Open Dashboard
3. **Expected:** 🔥 with "3 streak" label. No tier badge.

### 10. Progress bars proportional to effort

1. Open Dashboard with 2+ members having different effort totals
2. Look at the colored progress bars
3. **Expected:** The member with the highest effort has a full-width bar. Other bars are proportional (e.g., if max is 10 and another member has 5, their bar is ~50% width).

### 11. Period toggle still works

1. Open Dashboard, note the default period stats
2. Toggle to a different period (e.g., "This Month")
3. **Expected:** Stats update to reflect only completions within that period. Effort and fairness recalculate. Streak badges remain (streaks are all-time, not period-filtered).

## Edge Cases

### Zero total effort (empty household)

1. Open Dashboard with no completions for any member in the selected period
2. **Expected:** Empty state displays. No division-by-zero crash, no NaN values.

### Single member household

1. Household with only one member who has completions
2. Open Dashboard
3. **Expected:** That member shows 100% fairness. Progress bar is full width.

### Effort points = 1 on all legacy completions

1. Query: `SELECT DISTINCT effort_points FROM chore_completions WHERE created_at < '2026-03-16';`
2. **Expected:** All pre-migration completions show effort_points = 1 (backfilled by DEFAULT)

## Failure Signals

- **NaN or "undefined%" on member cards** — division-by-zero guard is broken or effort_points missing from completions query
- **Members ranked by count instead of effort** — sort field not updated from `completionCount` to `effortPoints`
- **All members show 0 effort pts** — effort_points column doesn't exist or completions query excludes it
- **No streak badges visible** — streak calculation broken or badge rendering conditionals wrong
- **Wrong badge tier** — threshold logic inverted (check order: 60 → 30 → 7 → fallback)
- **App crash on Dashboard** — likely undefined access on missing effort_points field in type

## Requirements Proved By This UAT

- CHORE-08 — leaderboard ranks by effort points (test cases 2, 3)
- CHORE-09 — fairness score shows workload distribution (test cases 4, 5)
- CHORE-10 — streak badges at 7/30/60-day thresholds (test cases 6, 7, 8, 9)
- CHORE-13 — effort-weighted dashboard replaces count-based (test cases 3, 10, 11)

## Not Proven By This UAT

- Effort picker UI on chore creation (S02 scope — already validated)
- My Day view or urgency indicators (S04 scope)
- Nudge system (S05 scope)
- RLS enforcement on completions — not in S03 scope, completions follow existing household RLS

## Notes for Tester

- Streak badges are easiest to test by inserting completion rows directly into `chore_completions` with sequential dates. Creating 60 real completions via the UI is impractical.
- The period toggle affects effort and fairness calculations but NOT streak badges (streaks are always all-time). This is intentional.
- The `Ionicons` import was removed — if you see a missing icon error, that's a regression from a bad merge, not an S03 issue.
