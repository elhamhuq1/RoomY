---
id: T02
parent: S03
milestone: M003
provides:
  - Effort-weighted dashboard ranking by summed effort_points
  - Per-member fairness percentage display (division-by-zero guarded)
  - Streak badges at 7/30/60-day thresholds (highest tier shown)
key_files:
  - app/(app)/chores/dashboard.tsx
key_decisions:
  - Removed Ionicons import — streak badges use emoji text (🔥⭐🥈🏆) instead of icon component, simpler and no dependency
  - fairnessPercent initialized to 0 in stats loop, computed in second pass after totalEffort is known
patterns_established:
  - Two-pass stat computation — collect raw values per member, then derive cross-member aggregates (fairness %) in a second loop
observability_surfaces:
  - Member cards show effort pts number + "X% of effort" label — NaN/undefined indicates broken guard or missing effort_points
  - Streak badge tier visible per member — verify correct emoji/color at 7/30/60 thresholds
duration: 8m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Effort-Weighted Dashboard with Fairness & Streak Badges

**Upgraded dashboard to rank by effort points, show fairness percentages, and display tiered streak badges at 7/30/60-day thresholds.**

## What Happened

Modified `dashboard.tsx` in place — same layout structure, upgraded data and display layer:

1. **MemberStats interface** — added `effortPoints: number` and `fairnessPercent: number` fields.

2. **fetchData** — refactored per-member computation to sum `effort_points` from completions via `.reduce((sum, c) => sum + (c.effort_points ?? 1), 0)`. After the member loop, computes `totalEffort` across all members and sets `fairnessPercent` with division-by-zero guard (`totalEffort > 0` check). Sort changed from `completionCount` to `effortPoints` descending.

3. **Computed values** — replaced `maxCompletions` with `maxEffort` for progress bar proportionality.

4. **Member card display** — large number now shows `effortPoints` with "effort pts" sub-label and `"{fairnessPercent}% of effort"` line below. Progress bar width uses `effortPoints / maxEffort`.

5. **Streak badges** — replaced single `Ionicons` flame icon with tiered badge system: 🏆 60-day (gold #EAB308), 🥈 30-day (silver #94A3B8), ⭐ 7-day (orange #F97316), 🔥 N streak (< 7). Shows highest achieved tier only. Removed `Ionicons` import (no longer used).

6. **Preserved:** period toggle, empty state, `totalCompletions` for empty state check, streak calculation from all-time `allCompletions` (no period filter).

## Verification

- `npx tsc --noEmit` — 34 errors, all pre-existing Deno/supabase-function noise. Zero new errors in app/components/lib code.
- Code review confirms: division-by-zero guarded, sort by effortPoints, progress bars proportional to effort, streak badge thresholds correct.

### Slice-level verification (final task — S03 complete):
- ✅ `npx tsc --noEmit` — zero new errors in app/components/lib code
- ✅ Migration SQL reviewed: correct column addition, RPC signature match, backfill via DEFAULT (T01)
- ✅ Dashboard renders effort-weighted bars, fairness %, and streak badges at correct thresholds (code verified — visual Expo Go verification deferred to UAT)
- ✅ RPC stamps correct effort_points: verified by reading migration logic (T01)

## Diagnostics

- Visually inspect member cards — each shows numeric effort value, "effort pts" label, "X% of effort" percentage
- If fairness shows NaN/undefined: division-by-zero guard is broken or `effort_points` missing from completions
- If all members show 0 effort: `effort_points` column doesn't exist or completions query failed
- Streak badge tier visible per member — verify correct emoji at 7/30/60 thresholds

## Deviations

- Removed `Ionicons` import — streak badges now use emoji text elements instead of Ionicons flame icon. Simpler, no dependency on vector icons for this display.

## Known Issues

None.

## Files Created/Modified

- `app/(app)/chores/dashboard.tsx` — effort-weighted ranking, fairness %, tiered streak badges, removed unused Ionicons import
