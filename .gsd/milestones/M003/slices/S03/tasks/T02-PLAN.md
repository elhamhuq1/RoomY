---
estimated_steps: 7
estimated_files: 1
---

# T02: Effort-Weighted Dashboard with Fairness & Streak Badges

**Slice:** S03 — Effort-Weighted Dashboard, Leaderboard, Fairness & Badges
**Milestone:** M003

## Description

Redesign the existing chore dashboard (`dashboard.tsx`, 413 LOC) to rank members by effort points instead of flat completion count, show per-member fairness percentages, and display streak badges at 7/30/60-day thresholds. This is an in-place upgrade — the layout (period toggle, member cards, progress bars, empty state) stays the same; the data layer and display values change.

## Steps

1. Update the `MemberStats` interface (currently at line ~69 in dashboard.tsx) — add two fields:
   ```ts
   interface MemberStats {
     userId: string;
     displayName: string;
     avatarUrl: string | null;
     completionCount: number;  // keep for display context
     effortPoints: number;     // NEW — sum of effort_points from completions
     fairnessPercent: number;  // NEW — (effortPoints / totalEffort) * 100
     streak: number;
   }
   ```

2. In `fetchData`, after filtering completions per member, compute effort points:
   ```ts
   const effortPoints = completions
     .filter(c => c.completed_by === userId)
     .reduce((sum, c) => sum + (c.effort_points ?? 1), 0);
   ```
   Also compute total effort across all members after the loop:
   ```ts
   const totalEffort = stats.reduce((sum, s) => sum + s.effortPoints, 0);
   ```
   Then set fairness on each:
   ```ts
   stats.forEach(s => {
     s.fairnessPercent = totalEffort > 0
       ? Math.round((s.effortPoints / totalEffort) * 100)
       : 0;
   });
   ```
   Change sort to `b.effortPoints - a.effortPoints`.
   Update `setTotalCompletions` to remain as completion count (used for empty state check), but also track `totalEffort` in state or compute inline.

3. Update computed values — replace `maxCompletions` with `maxEffort`:
   ```ts
   const maxEffort = Math.max(...memberStats.map(s => s.effortPoints), 1);
   ```

4. Update the progress bar width from `completionCount / maxCompletions` to `effortPoints / maxEffort`.

5. Update the large number display on each member card. Currently shows `member.completionCount`. Change to show `member.effortPoints` with a smaller "effort pts" label. Also add fairness percentage display — e.g., a text line showing `{member.fairnessPercent}% of effort` below the effort points.

6. Add streak badge display. Current code shows `🔥 {streak} streak` when streak > 0. Enhance to show badge level based on thresholds:
   - streak ≥ 60: show `🏆 60-day streak` (gold color, e.g. #EAB308)
   - streak ≥ 30: show `🥈 30-day streak` (silver-ish, e.g. #94A3B8)
   - streak ≥ 7: show `⭐ 7-day streak` (orange, e.g. #F97316)
   - streak > 0 but < 7: keep existing `🔥 {streak} streak` display
   Show the highest achieved badge only. Per DECISIONS.md: streak badges displayed on dashboard only.

7. Run `npx tsc --noEmit` to verify zero new errors.

## Must-Haves

- [ ] `MemberStats` has `effortPoints` and `fairnessPercent` fields
- [ ] Leaderboard sorts by `effortPoints` descending (not `completionCount`)
- [ ] Progress bars proportional to effort points
- [ ] Fairness percentage shown on each member card (division-by-zero guarded)
- [ ] Streak badges at 7/30/60 thresholds — highest badge shown
- [ ] Period toggle (week/month) and empty state preserved
- [ ] Streak calculation remains all-time (no period filter) — existing `allCompletions` query untouched

## Verification

- `npx tsc --noEmit` — zero new errors
- Visual review in Expo Go: member cards show effort points (not flat count), fairness %, streak badges at correct thresholds

## Inputs

- `app/(app)/chores/dashboard.tsx` — current 413 LOC dashboard. Key locations:
  - Imports: line 1-16 (includes `ChoreCompletion`, `Avatar`, `Ionicons`)
  - `calculateStreak`: lines 57-63 (unchanged — returns consecutive non-reverted count)
  - `MemberStats`: lines 69-75 (add `effortPoints`, `fairnessPercent`)
  - `fetchData`: lines 95-211 (add effort computation and fairness %)
  - `maxCompletions`: line 244 (replace with `maxEffort`)
  - Member card render: lines 340-410 (update display values, add fairness, enhance streak)
- T01 summary — `ChoreCompletion` interface now includes `effort_points: number`, so `c.effort_points` is typed
- DECISIONS.md — streak badges on dashboard only, fairness uses simple ratio

## Expected Output

- `app/(app)/chores/dashboard.tsx` — modified: effort-weighted ranking, fairness %, streak badges. Same file, same overall structure, upgraded data and display layer.

## Observability Impact

- **Changed signals:** Member cards now display `effortPoints` (number), `fairnessPercent` (percentage), and streak badge tier instead of flat `completionCount`. If `NaN` or `undefined` appears in fairness %, the division-by-zero guard is broken or `effort_points` is missing from completions.
- **Inspection:** Visually inspect member cards in Expo Go — each should show a numeric effort value, "effort pts" label, and "X% of effort" line. Streak badges should show emoji+label at the correct tier threshold.
- **Failure state:** If all members show 0 effort pts and 0% fairness, the `effort_points` column likely doesn't exist or completions aren't being fetched. If bars are all zero-width but numbers are nonzero, `maxEffort` computation is wrong.
