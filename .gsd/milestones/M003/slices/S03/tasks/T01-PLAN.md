---
estimated_steps: 5
estimated_files: 2
---

# T01: Migration & Types — effort_points on chore_completions + RPC update

**Slice:** S03 — Effort-Weighted Dashboard, Leaderboard, Fairness & Badges
**Milestone:** M003

## Description

Add `effort_points` column to `chore_completions` table and modify the `complete_chore` RPC to stamp the chore's effort_points onto each completion record at insert time. Update TypeScript types to match. This is the data foundation — the dashboard (T02) depends on completions carrying effort values.

## Steps

1. Create migration file `supabase/migrations/20260316000017_effort_on_completions.sql`:
   - `ALTER TABLE public.chore_completions ADD COLUMN effort_points INT NOT NULL DEFAULT 1;` — the DEFAULT 1 backfills all existing rows automatically.
   - `CREATE OR REPLACE FUNCTION public.complete_chore(p_chore_id UUID, p_completed_by UUID) RETURNS JSON` — must match the **exact** existing signature. Keep `LANGUAGE plpgsql`, `SECURITY DEFINER`, `SET search_path = ''`. The body is identical to the original except the INSERT statement changes from:
     ```sql
     INSERT INTO public.chore_completions (chore_id, completed_by)
     VALUES (p_chore_id, p_completed_by)
     ```
     to:
     ```sql
     INSERT INTO public.chore_completions (chore_id, completed_by, effort_points)
     VALUES (p_chore_id, p_completed_by, v_chore.effort_points)
     ```
     `v_chore` is already populated by `SELECT * INTO v_chore FROM public.chores WHERE id = p_chore_id` earlier in the function, so `v_chore.effort_points` is available (added by S01 migration). The rest of the function (rotation, next_due, UPDATE, RETURN) stays identical.

2. Update `lib/types/database.ts`:
   - Add `effort_points: number;` to the `ChoreCompletion` interface (after `reverted_at`).
   - In the Database type's `chore_completions.Insert` type, add `effort_points?: number;` (optional because it has a DEFAULT).
   - In the Database type's `chore_completions.Update` type — already `Partial<Omit<ChoreCompletion, "id">>`, so it auto-includes the new field. No change needed.

3. Run `npx tsc --noEmit` to verify zero new errors.

## Must-Haves

- [ ] Migration adds `effort_points INT NOT NULL DEFAULT 1` to `chore_completions`
- [ ] `complete_chore` replaced with exact same signature — only change is effort_points in INSERT
- [ ] `ChoreCompletion` interface has `effort_points: number`
- [ ] Database Insert type has `effort_points?: number`
- [ ] `SECURITY DEFINER` and `SET search_path = ''` preserved on RPC
- [ ] All table references in RPC are fully qualified (`public.chores`, `public.chore_completions`)

## Verification

- `npx tsc --noEmit` — zero new errors
- `grep 'effort_points' supabase/migrations/20260316000017_effort_on_completions.sql` — shows column addition and INSERT usage
- `grep 'effort_points' lib/types/database.ts` — shows the field in ChoreCompletion

## Observability Impact

- **New signal:** `chore_completions.effort_points` column — queryable via `SELECT effort_points FROM chore_completions LIMIT 5;` to confirm column exists and carries values post-migration.
- **RPC change:** `complete_chore` now stamps `v_chore.effort_points` into the INSERT. If effort_points appears as DEFAULT 1 on new completions when the chore has a different weight, the RPC replacement did not apply — check migration order.
- **Failure shape:** If downstream dashboard shows NaN or undefined in fairness %, the likely cause is missing effort_points on completion rows (migration not applied) or division by zero (guarded in T02).
- **Inspection:** `grep -n effort_points supabase/migrations/20260316000017_effort_on_completions.sql` shows both the ALTER TABLE and INSERT usage in one file.

## Inputs

- `supabase/migrations/20260311000004_chores.sql` — contains the original `complete_chore` RPC (lines 126-180) that must be replicated with one change. The original INSERT is `INSERT INTO public.chore_completions (chore_id, completed_by) VALUES (p_chore_id, p_completed_by)`.
- `supabase/migrations/20260316000016_chore_rooms.sql` — S01 migration that added `effort_points` to `chores` table, confirming `v_chore.effort_points` is available.
- `lib/types/database.ts` — `ChoreCompletion` interface at line 115 (11 fields currently), Database type `chore_completions` entries at lines 272-284.

## Expected Output

- `supabase/migrations/20260316000017_effort_on_completions.sql` — new migration with ALTER TABLE + CREATE OR REPLACE FUNCTION
- `lib/types/database.ts` — ChoreCompletion gains `effort_points: number`, Insert type gains `effort_points?: number`
