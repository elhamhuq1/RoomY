# S04: Chores

**Goal:** Create the chores database schema and build the main chore list with create/complete/claim functionality.
**Demo:** Create the chores database schema and build the main chore list with create/complete/claim functionality.

## Must-Haves


## Tasks

- [x] **T01: 03.1-chores 01** `est:4min`
  - Create the chores database schema and build the main chore list with create/complete/claim functionality.

Purpose: Establish the full chore data model (tables, RLS, rotation RPC, dispute auto-revert) and deliver the core chore management UI -- users can create chores, see them grouped and sorted, mark them complete with rotation, and claim others' chores.

Output: Migration file, updated TypeScript types, functional chore list screen, create chore screen.
- [x] **T02: 03.1-chores 02** `est:4min`
  - Add swap requests, dispute system, and contribution dashboard to complete the chore management feature.

Purpose: Complete the chore lifecycle -- users can negotiate swaps, dispute questionable completions (with 24h auto-revert), and view a fairness dashboard showing who's doing their share. This delivers the full promise of fair, transparent chore rotation.

Output: Swap request screen, contribution dashboard screen, updated chore list with dispute and swap UI.

## Files Likely Touched

- `supabase/migrations/00004_chores.sql`
- `lib/types/database.ts`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/chores/add.tsx`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/chores/dashboard.tsx`
- `app/(app)/chores/swap-request.tsx`
