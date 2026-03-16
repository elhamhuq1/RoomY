# S03: Groceries

**Goal:** Create the grocery list database schema and build the real-time collaborative grocery list screen.
**Demo:** Create the grocery list database schema and build the real-time collaborative grocery list screen.

## Must-Haves


## Tasks

- [x] **T01: 03-groceries 01** `est:4min`
  - Create the grocery list database schema and build the real-time collaborative grocery list screen.

Purpose: Enables household members to maintain a shared grocery list that updates instantly across all devices -- the foundation for the complete grocery workflow.
Output: Working grocery list with add, edit, check off, swipe-to-delete, and real-time sync between household members.
- [x] **T02: 03-groceries 02** `est:5min`
  - Build the "Complete Trip" expense conversion flow and trip history archive screen.

Purpose: Enables users to convert a shopping trip into a split expense with one tap, completing the grocery-to-expense pipeline. Trip history provides a lightweight record of past shopping runs.
Output: Complete Trip screen (amount + payer + member split), trip history view, and wiring from the grocery list's "Complete Trip" button.
- [x] **T03: 03-groceries 03** `est:4min`
  - Fix three UX gaps identified during grocery list UAT: (1) edit modal keyboard coverage, (2) missing section label for unchecked items, and (3) swipe-to-delete auto-fires without letting user tap the delete button.

Purpose: Close all UAT gaps so Phase 3 groceries passes user acceptance testing.
Output: Updated groceries.tsx with all three fixes applied.

## Files Likely Touched

- `supabase/migrations/00003_groceries.sql`
- `lib/types/database.ts`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/groceries/trip-history.tsx`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/(tabs)/groceries.tsx`
