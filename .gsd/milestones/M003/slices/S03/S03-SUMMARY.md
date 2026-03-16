---
id: S03
parent: M003
milestone: M003
provides:
  - effort_points column on chore_completions with DEFAULT 1 backfill
  - complete_chore RPC stamps effort_points from chore definition at completion time
  - Effort-weighted dashboard ranking roommates by summed effort_points (not count)
  - Per-member fairness percentage with division-by-zero guard
  - Tiered streak badges at 7/30/60-day thresholds (🔥⭐🥈🏆)
  - ChoreCompletion TypeScript type with effort_points field
requires:
  - slice: S01
    provides: chores.effort_points column, chore_completions table, complete_chore RPC
affects:
  - S04
  - S05
key_files:
  - supabase/migrations/20260316000017_effort_on_completions.sql
  - lib/types/database.ts
  - app/(app)/chores/dashboard.tsx
  - app/(app)/chores/dispute.tsx
key_decisions:
  - Effort denormalized onto completions at insert time via RPC — chore effort can change later, leaderboard reflects difficulty at time of doing
  - Streak badges use emoji text (🔥⭐🥈🏆) instead of Ionicons — simpler, no vector icon dependency
  - Two-pass stat computation — collect raw per-member values, then derive cross-member aggregates (fairness %) in second loop
  - Omit + optional re-add pattern for Insert type keeps effort_points optional (has DB DEFAULT)
  - fairnessPercent initialized to 0, computed after totalEffort is known with explicit >0 guard
patterns_established:
  - Stamp denormalized values from parent record at insert time (effort_points from chore onto completion)
  - Two-pass stat computation for cross-member aggregates
observability_surfaces:
  - "SELECT effort_points FROM chore_completions LIMIT 5;" confirms column exists and has values
  - Member cards show numeric effort + "X% of effort" — NaN/undefined indicates broken guard or missing effort_points
  - Streak badge tier visible per member — verify correct emoji at 7/30/60 thresholds
drill_down_paths:
  - .gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S03/tasks/T02-SUMMARY.md
duration: 18m
verification_result: passed
completed_at: 2026-03-16
---

# S03: Effort-Weighted Dashboard, Leaderboard, Fairness & Badges

**Added effort_points denormalization on chore completions and rebuilt the dashboard to rank by effort, show fairness percentages, and display tiered streak badges.**

## What Happened

Two tasks, clean execution, no blockers.

**T01 — Migration & Types.** Created migration `20260316000017_effort_on_completions.sql` that adds `effort_points INT NOT NULL DEFAULT 1` to `chore_completions` (DEFAULT backfills existing rows) and replaces `complete_chore` RPC to stamp `v_chore.effort_points` into the INSERT. Function signature, SECURITY DEFINER, search_path, rotation logic, and return shape are all identical to the original — the only change is the new column in the INSERT. Updated `ChoreCompletion` interface with `effort_points: number` and made it optional on the Insert type (DB DEFAULT handles it). Fixed a downstream type error in `dispute.tsx` where a hardcoded completion literal needed the new field.

**T02 — Dashboard.** Upgraded `dashboard.tsx` in place. `MemberStats` gained `effortPoints` and `fairnessPercent`. `fetchData` sums `effort_points` from completions per member via `.reduce()`, computes `totalEffort` across all members, then sets `fairnessPercent` with division-by-zero guard. Sort changed from `completionCount` to `effortPoints` descending. Progress bars are proportional to max effort. Streak badges replaced the single Ionicons flame with a tiered system: 🏆 60-day (gold), 🥈 30-day (silver), ⭐ 7-day (orange), 🔥 <7 (orange). Shows highest achieved tier only. Removed unused `Ionicons` import.

## Verification

- **`npx tsc --noEmit`** — 30 errors, all pre-existing Deno/supabase-function noise. Zero new errors in app/components/lib code.
- **Migration SQL reviewed:** correct column addition with DEFAULT 1 backfill, RPC signature preserved, `v_chore.effort_points` flows into INSERT.
- **Dashboard code verified:** sorts by `effortPoints`, computes `fairnessPercent` with `totalEffort > 0` guard, streak badge thresholds at 7/30/60 correct.
- **RPC stamps effort_points:** confirmed by reading migration — `v_chore.effort_points` in INSERT statement.
- **Proof strategy retired:** "Effort denormalization → retire in S03 by proving `chore_completions` records carry the correct effort_points from completion time" — migration stamps via RPC, DEFAULT 1 backfills existing rows.

## Requirements Advanced

- CHORE-08 — Dashboard leaderboard now ranks by summed effort_points instead of flat completion count
- CHORE-09 — Each member card shows fairness percentage (member effort / total effort × 100)
- CHORE-10 — Streak badges render at 7/30/60-day thresholds with tiered emoji indicators
- CHORE-13 — Dashboard is now effort-weighted end-to-end (ranking, progress bars, display values)

## Requirements Validated

- none — visual Expo Go verification deferred to UAT; code-level proof is complete

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Fixed `app/(app)/chores/dispute.tsx` — not in the task plan but required to pass tsc. The file constructs a `ChoreCompletion` literal that needed the new `effort_points` field. Added `effort_points: completion.effort_points ?? 1`.
- Removed `Ionicons` import from dashboard — streak badges now use emoji text elements instead of vector icons. Simpler, no dependency.

## Known Limitations

- CHORE-08/09/10/13 are code-verified but not yet visually validated in Expo Go — deferred to UAT.
- Streaks are calculated from all-time completions (no period filter) — this is by design per DECISIONS.md, but means the period toggle doesn't affect streak badges.

## Follow-ups

- none

## Files Created/Modified

- `supabase/migrations/20260316000017_effort_on_completions.sql` — new migration: ALTER TABLE adds effort_points column, CREATE OR REPLACE FUNCTION updates complete_chore RPC
- `lib/types/database.ts` — ChoreCompletion gains effort_points, Insert type gains optional effort_points
- `app/(app)/chores/dashboard.tsx` — effort-weighted ranking, fairness %, tiered streak badges, removed unused Ionicons import
- `app/(app)/chores/dispute.tsx` — added effort_points to hardcoded completion object

## Forward Intelligence

### What the next slice should know
- `chore_completions` now has `effort_points INT NOT NULL DEFAULT 1`. Any new code querying completions can use this column directly.
- The `complete_chore` RPC signature is unchanged (`p_chore_id UUID, p_completed_by UUID`) — callers don't need modification.
- Dashboard sorts by `effortPoints` not `completionCount` — any future stats work should maintain effort-weighted semantics.

### What's fragile
- The `complete_chore` RPC body in the migration must exactly match the original except for the effort_points addition — if S01's version of the RPC changes, this migration's CREATE OR REPLACE will silently overwrite it. Migration ordering (000017 after S01's migrations) ensures this applies last.
- `fairnessPercent` computation depends on `effort_points` being non-null on all completions — the DEFAULT 1 handles backfill, but any manual INSERT that skips the column would get 1, not NULL, so the guard holds.

### Authoritative diagnostics
- `SELECT effort_points FROM chore_completions LIMIT 5;` — confirms column exists post-migration and has values
- Dashboard member cards: if fairness shows NaN/undefined, the division-by-zero guard is broken or effort_points is missing from the query
- `grep -n effort_points supabase/migrations/20260316000017_effort_on_completions.sql` — self-documenting migration

### What assumptions changed
- No assumptions changed — slice executed as planned with minor deviation (dispute.tsx fix).
