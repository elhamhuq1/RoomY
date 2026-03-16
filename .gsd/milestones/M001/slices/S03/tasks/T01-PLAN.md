# T01: 03-groceries 01

**Slice:** S03 — **Milestone:** M001

## Description

Create the grocery list database schema and build the real-time collaborative grocery list screen.

Purpose: Enables household members to maintain a shared grocery list that updates instantly across all devices -- the foundation for the complete grocery workflow.
Output: Working grocery list with add, edit, check off, swipe-to-delete, and real-time sync between household members.

## Must-Haves

- [x] "User can add an item (name + quantity) to the shared grocery list"
- [x] "Added items appear at the top of the list for all household members in real-time"
- [x] "User can check off an item and it slides to a Completed section at the bottom, grayed out"
- [x] "User can swipe left on an item to delete it"
- [x] "User can tap an item to edit its name or quantity"
- [x] "Real-time updates are instant and silent (no toasts, no reload)"

## Files

- `supabase/migrations/00003_groceries.sql`
- `lib/types/database.ts`
- `app/(app)/(tabs)/groceries.tsx`
