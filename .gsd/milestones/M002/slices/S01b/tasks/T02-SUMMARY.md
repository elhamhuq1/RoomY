---
id: T02
parent: S01b
milestone: M002
provides:
  - assign-items screen for per-item member assignment between scan-receipt and complete-trip
  - itemAssignments route param forwarded to complete-trip for RPC consumption
key_files:
  - app/(app)/groceries/assign-items.tsx
  - app/(app)/_layout.tsx
key_decisions:
  - Assignments keyed by item name (string) matching the RPC's p_item_assignments format — no extra ID layer needed
  - Unassigned items shown as "Shared" with a distinct icon in the bottom summary bar — communicates the even-split fallback clearly
  - Bottom bar is position:absolute to stay visible while scrolling items — long receipts don't bury the totals
patterns_established:
  - Tap-to-toggle assignment pattern — tap member to assign, tap again to unassign — single-tap instead of dropdown
  - Per-item horizontal member picker using Avatar component at 'sm' size — compact enough for 4+ members
observability_surfaces:
  - Empty-state screen when receiptItems param is missing/empty — prevents silent blank screen
  - Per-member running totals visible in bottom bar — user can verify assignment math before continuing
  - Unassigned count and total displayed — makes "shared" bucket visible
duration: 20m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Build item assignment screen

**Created `assign-items.tsx` screen with per-item member pickers, running per-member totals, and "Continue" navigation to complete-trip with assignment data.**

## What Happened

Built the item assignment screen that sits between scan-receipt confirm and complete-trip. The screen:

1. **Receives** `receiptItems` and `receiptTotal` as route params (same format scan-receipt produces)
2. **Shows each item** with name, price, quantity, and a horizontal row of household member avatars as tap-to-toggle selectors
3. **Tracks assignments** as a `Record<string, string | null>` — item name → user_id, null for shared
4. **Displays running totals** in a fixed bottom bar: per-member subtotals plus a "Shared" bucket for unassigned items
5. **Navigates to complete-trip** with `receiptItems`, `receiptTotal`, and `itemAssignments` JSON — the assignment payload matches the RPC's `p_item_assignments` shape (`{ name, assigned_to }[]`)

Registered the route in `_layout.tsx` with header "Assign Items" and back button.

Also added two verification lines to the slice plan per pre-flight: diagnostic check for `split_mode` return value, and failure-path check for empty receiptItems.

## Verification

- `npx tsc --noEmit` passes (only pre-existing Deno/font errors remain)
- Screen registered in layout with correct header styling matching existing screens
- Empty-state renders with "Go Back" when no receiptItems provided
- Route params match scan-receipt output format and complete-trip expected input format
- `itemAssignments` JSON shape matches RPC `p_item_assignments` parameter (`{ name, assigned_to }[]`)

### Slice-level verification (partial — T02 is intermediate):
- ✅ `npx tsc --noEmit` passes
- ⬜ Full Expo Go flow (requires T03 to wire navigation)
- ⬜ Even-split regression (requires T03)
- ⬜ Navigation cleanup (requires T03)
- ⬜ Diagnostic: split_mode field check (requires T03 end-to-end)
- ✅ Failure path: empty receiptItems shows empty state

## Diagnostics

- Screen logs no errors to console on mount — member loading follows the established pattern from complete-trip
- Assignments state is inspectable via React DevTools: `assignments` object shows current item→user mapping
- `itemAssignments` param is JSON-encoded and passed as route param — visible in Expo Router navigation state

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/(app)/groceries/assign-items.tsx` — new screen: item assignment with member pickers and per-member totals
- `app/(app)/_layout.tsx` — registered assign-items route with header
- `.gsd/milestones/M002/slices/S01b/S01b-PLAN.md` — added diagnostic/failure-path verification steps, marked T02 done
