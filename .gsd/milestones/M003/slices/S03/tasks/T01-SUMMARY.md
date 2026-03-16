---
id: T01
parent: S03
milestone: M003
provides:
  - effort_points column on chore_completions with DEFAULT 1 backfill
  - complete_chore RPC stamps effort_points from chore definition
  - ChoreCompletion TypeScript type with effort_points field
key_files:
  - supabase/migrations/20260316000017_effort_on_completions.sql
  - lib/types/database.ts
  - app/(app)/chores/dispute.tsx
key_decisions:
  - Used Omit + optional re-add pattern for Insert type to keep effort_points optional (has DB DEFAULT)
  - Fallback `?? 1` in dispute.tsx for query results that may not yet have effort_points column applied
patterns_established:
  - Stamp denormalized values from parent record at insert time (effort_points from chore onto completion)
observability_surfaces:
  - "SELECT effort_points FROM chore_completions LIMIT 5;" confirms column exists and has values
  - RPC body visible in migration file — grep for effort_points in INSERT to verify stamping logic
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Migration & Types — effort_points on chore_completions + RPC update

**Added effort_points INT NOT NULL DEFAULT 1 to chore_completions, updated complete_chore RPC to stamp effort from chore definition, and aligned TypeScript types.**

## What Happened

Created migration `20260316000017_effort_on_completions.sql` with two statements: ALTER TABLE to add the column (DEFAULT 1 backfills existing rows), and CREATE OR REPLACE FUNCTION to update `complete_chore` — the only change to the RPC body is inserting `v_chore.effort_points` alongside `chore_id` and `completed_by`. The function signature, SECURITY DEFINER, search_path, rotation logic, and return shape are all identical to the original.

Updated `ChoreCompletion` interface with `effort_points: number`. Made the Insert type omit effort_points from the base (since it's required on the interface) and re-add it as optional (`effort_points?: number`) to reflect the DB DEFAULT. The Update type inherits automatically via `Partial<Omit<ChoreCompletion, "id">>`.

Fixed a downstream type error in `dispute.tsx` where a hardcoded ChoreCompletion object literal was missing the new field — added `effort_points: completion.effort_points ?? 1`.

## Verification

- `npx tsc --noEmit` — 0 errors outside pre-existing Deno/supabase-function noise (34 total, all in `supabase/functions/`)
- `grep effort_points` on migration — shows column addition, INSERT usage with `v_chore.effort_points`
- `grep effort_points` on database.ts — shows field in ChoreCompletion interface + both Insert types
- Migration preserves SECURITY DEFINER, `SET search_path = ''`, fully qualified table refs

### Slice-level verification (partial — T01 is intermediate):
- ✅ `npx tsc --noEmit` — zero new errors in app/components/lib code
- ✅ Migration SQL reviewed: correct column addition, RPC signature match, backfill via DEFAULT
- ⬜ Dashboard renders effort-weighted bars, fairness %, streak badges (T02)
- ✅ RPC stamps correct effort_points: verified by reading migration logic

## Diagnostics

- `SELECT effort_points FROM chore_completions LIMIT 5;` — confirms column exists post-migration
- Migration file is self-documenting: `grep -n effort_points supabase/migrations/20260316000017_effort_on_completions.sql`
- If effort_points shows as NULL or missing in queries, migration hasn't been applied

## Deviations

- Fixed `app/(app)/chores/dispute.tsx` — not in the task plan but required to pass tsc. The file constructs a ChoreCompletion literal that needed the new field.

## Known Issues

None.

## Files Created/Modified

- `supabase/migrations/20260316000017_effort_on_completions.sql` — new migration: ALTER TABLE + CREATE OR REPLACE FUNCTION
- `lib/types/database.ts` — ChoreCompletion gains effort_points, Insert type gains optional effort_points
- `app/(app)/chores/dispute.tsx` — added effort_points to hardcoded completion object
