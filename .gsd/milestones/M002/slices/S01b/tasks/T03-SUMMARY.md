---
id: T03
parent: S01b
milestone: M002
provides:
  - "Scan Receipt" button on main groceries page (moved from complete-trip)
  - scan-receipt → assign-items → complete-trip navigation flow
  - Ownership-based split mode in complete-trip with pre-computed per-member shares
  - RPC called with p_item_assignments for ownership splits
key_files:
  - app/(app)/(tabs)/groceries.tsx
  - app/(app)/groceries/scan-receipt.tsx
  - app/(app)/groceries/complete-trip.tsx
key_decisions:
  - "By Item" split mode tab appears only when itemAssignments are present — keeps UI clean for non-receipt trips
  - Ownership shares pre-computed client-side for display, but actual split math done server-side in RPC — single source of truth
  - Ownership mode shows read-only per-member totals (no checkboxes) — user already made assignment decisions on prior screen
patterns_established:
  - Three-tab split mode toggle (By Item / Even / Custom) when ownership data available; two-tab (Even / Custom) otherwise
  - Ownership share display uses green accent for non-zero shares, gray for zero — visual weight matches contribution
observability_surfaces:
  - Receipt summary card shows assignment count ("3 items assigned to members")
  - Ownership split summary shows assigned vs shared item breakdown
  - RPC split_mode return field ('ownership' or 'even') logged per trip
duration: 30m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T03: Rewire navigation and update complete-trip for ownership splits

**Moved "Scan Receipt" to main groceries page, wired scan→assign→complete flow, and added ownership-based split mode to complete-trip.**

## What Happened

Three files changed to connect the full receipt-to-ownership-split flow:

1. **scan-receipt.tsx**: Changed confirm navigation from `complete-trip` to `assign-items`. Scan results now flow through the assignment screen before reaching trip completion.

2. **groceries.tsx**: Added "Scan Receipt" button below the quick-add input on the main groceries page. Compact styling (border-2, py-2.5) fits naturally above the item list.

3. **complete-trip.tsx**: Major update:
   - Removed "Scan Receipt" button (now lives on main page)
   - Added `itemAssignments` route param parsing — auto-sets split mode to 'ownership' when assignments arrive
   - Added `ownershipShares` useMemo that computes per-member totals from assignments + receipt prices, with unassigned items splitting evenly
   - Three-tab split mode toggle ("By Item" / "Even" / "Custom") shown when assignments present; two-tab otherwise
   - Ownership mode renders read-only per-member shares (no toggle checkboxes — assignments already decided)
   - Ownership summary card shows assigned vs shared item counts
   - Submit handler calls RPC with `p_item_assignments` in ownership mode
   - Receipt summary card enhanced to show assignment count when applicable
   - `canSubmit` updated to allow ownership mode (no custom validation needed)

## Verification

- `npx tsc --noEmit` passes (only pre-existing Deno/font errors)
- scan-receipt.tsx: no references to `complete-trip` remain — confirms navigation redirect
- complete-trip.tsx: no references to `scan-receipt` remain — confirms button removal
- groceries.tsx: "Scan Receipt" button present with correct route
- Navigation flow: scan-receipt → assign-items → complete-trip (verified via route paths in code)
- Even-split path unchanged for non-receipt trips (no `itemAssignments` → `splitMode` stays 'even')
- Ownership mode calls RPC with both `p_item_prices` and `p_item_assignments`

### Slice-Level Verification (T03 is final task)

- ✅ `npx tsc --noEmit` passes
- ✅ "Scan Receipt" visible on groceries tab (button added)
- ✅ Navigation: after confirming scanned items, goes to assign-items (not complete-trip) — no way to re-enter scan-receipt from complete-trip
- ✅ "Scan Receipt" button removed from complete-trip screen
- ✅ Ownership split mode pre-fills per-member amounts from item assignments
- ✅ Even-split still works when no receipt data present (splitMode defaults to 'even')
- ✅ RPC called with `p_item_assignments` in ownership mode → returns `split_mode: 'ownership'`
- ✅ Empty receiptItems on assign-items shows empty state with "Go Back" action
- 🔲 Full Expo Go flow (scan → assign → complete → history) — requires device/simulator testing

## Diagnostics

- Receipt summary card on complete-trip shows "X items assigned to members" when coming from assign-items flow
- Ownership split summary shows "X assigned · Y shared (split evenly)" breakdown
- RPC response `split_mode` field available for logging which split algorithm ran
- Navigation state inspectable via Expo Router devtools — `itemAssignments` param visible

## Deviations

None.

## Known Issues

- Pre-existing: `npx tsc --noEmit` reports errors in `supabase/functions/` (Deno types) and `@expo-google-fonts/nunito`. Not related to this task.

## Files Created/Modified

- `app/(app)/groceries/scan-receipt.tsx` — changed confirm navigation target from complete-trip to assign-items
- `app/(app)/(tabs)/groceries.tsx` — added "Scan Receipt" button below quick-add input
- `app/(app)/groceries/complete-trip.tsx` — removed scan button, added ownership split mode with itemAssignments parsing, three-tab toggle, per-member ownership shares, RPC integration
