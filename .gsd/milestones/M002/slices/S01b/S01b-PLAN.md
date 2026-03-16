# S01b: Receipt-Based Item Ownership & Smart Splitting

**Goal:** Rework the groceries flow so users can scan a receipt from the main groceries page, assign scanned items to household members, and complete the trip with splits calculated from item ownership — while keeping even-split as a fallback.
**Demo:** From the groceries tab, tap "Scan Receipt" → photograph receipt → review/edit items → confirm → assign each item to a household member → complete trip with splits auto-calculated from ownership → trip history shows who got what.

## Must-Haves

- "Scan Receipt" button on main groceries page (not buried in complete-trip)
- After confirming scanned items, users can assign each item to a household member
- Complete-trip auto-calculates splits from item assignments when receipt data present
- Even-split option remains available as a toggle
- "Scan Receipt" button removed from complete-trip screen (it lives on the main page now)
- Navigating back from complete-trip does NOT return to scan-receipt (clean navigation)

## Proof Level

- This slice proves: UX integration
- Real runtime required: yes (item assignment, smart splits, navigation changes)
- Human/UAT required: yes (user tests full scan → assign → split flow)

## Verification

- `npx tsc --noEmit` passes
- In Expo Go: groceries tab → "Scan Receipt" visible → full scan flow → assign items → complete trip with ownership-based splits → trip history shows assignments
- Even-split still works when no receipt data present (regression check)
- Navigation: after confirming scanned items, no way to re-enter scan-receipt from complete-trip

## Tasks

- [ ] **T01: Add assigned_to column and update RPC for ownership-based splits** `est:45m`
  - Why: Downstream screens need `assigned_to` on `grocery_items` and an RPC that calculates splits from item ownership. Schema first.
  - Files: `supabase/migrations/00011_item_ownership.sql`, `lib/types/database.ts`
  - Do: Add `assigned_to UUID REFERENCES auth.users` column to `grocery_items` (nullable — unassigned items split evenly). Create or update the `complete_grocery_trip_with_receipt` RPC to accept `p_item_assignments JSONB` (array of `{ name: string, assigned_to: string }`) — when provided, calculate each member's share by summing the `unit_price` of items assigned to them. Unassigned items split evenly across all split members. Update TypeScript `GroceryItem` type with `assigned_to`.
  - Verify: `npx tsc --noEmit` passes. Migration SQL is syntactically valid.
  - Done when: Migration exists, RPC handles ownership-based split calculation, types updated.

- [ ] **T02: Build item assignment screen** `est:1h15m`
  - Why: Core new UX — users need to assign scanned items to household members before completing the trip. This is the screen between scan-receipt confirm and complete-trip.
  - Files: `app/(app)/groceries/assign-items.tsx`, `app/(app)/_layout.tsx`
  - Do: Create `assign-items.tsx` — receives `receiptItems` and `receiptTotal` as route params. Shows each item with a member picker (avatar row tap-to-select). Default: all items unassigned (shared). Running total per member shown at bottom. "Continue" button navigates to complete-trip with `receiptItems`, `receiptTotal`, AND `itemAssignments` (JSON-encoded assignments). Register in `_layout.tsx`.
  - Verify: `npx tsc --noEmit` passes. Screen renders and allows item-to-member assignment.
  - Done when: Assignment screen exists with member pickers per item and per-member totals.

- [ ] **T03: Rewire navigation and update complete-trip for ownership splits** `est:1h`
  - Why: Connects everything — move "Scan Receipt" to main page, remove it from complete-trip, wire assign-items into the flow, update complete-trip to use ownership-based splits.
  - Files: `app/(app)/(tabs)/groceries.tsx`, `app/(app)/groceries/complete-trip.tsx`, `app/(app)/groceries/scan-receipt.tsx`
  - Do: Add "Scan Receipt" button on main groceries page (above the list or as a secondary action). Remove "Scan Receipt" button from complete-trip. Update scan-receipt confirm to navigate to assign-items instead of complete-trip. Update complete-trip to read `itemAssignments` from route params and auto-calculate per-member splits (pre-filling custom split amounts from ownership totals). Show split breakdown summary. Call updated RPC with assignments.
  - Verify: `npx tsc --noEmit` passes. Full flow in Expo Go: main page → scan → assign → complete with ownership splits. Non-receipt flow unchanged.
  - Done when: Full receipt-to-ownership-split flow works end-to-end, no scan button on complete-trip, even-split still works for non-receipt trips.

## Files Likely Touched

- `supabase/migrations/00011_item_ownership.sql`
- `lib/types/database.ts`
- `app/(app)/groceries/assign-items.tsx` (new)
- `app/(app)/_layout.tsx`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/groceries/scan-receipt.tsx`
