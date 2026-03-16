---
id: T04
parent: S01
milestone: M002
provides:
  - Scan Receipt button on complete-trip screen with navigation to scan-receipt
  - Receipt route param parsing with auto-populated total amount
  - Receipt summary card showing scanned item count and total
  - Receipt-aware RPC call (complete_grocery_trip_with_receipt) on submission
  - Custom split mode receipt item price application via client-side updates
  - Per-item unit_price display in trip history with quantity formatting
key_files:
  - app/(app)/groceries/complete-trip.tsx
  - app/(app)/groceries/trip-history.tsx
key_decisions:
  - Custom split mode applies receipt item prices via individual ilike UPDATE queries after trip creation (mirrors RPC's LOWER() equality approach)
  - Invalid receipt route params silently ignored — user can always enter amount manually
patterns_established:
  - Route param handoff pattern: scan-receipt serializes items as JSON string, complete-trip deserializes on mount via useEffect
observability_surfaces:
  - Query `SELECT source, unit_price FROM grocery_items WHERE trip_id = '<id>'` to verify receipt prices were applied
  - Receipt summary card visible on complete-trip screen when receipt data present
  - Trip history shows unit_price per item when non-null
duration: 25m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T04: Wire receipt items into complete-trip flow and update trip history

**Wired receipt scan output into complete-trip submission flow and added per-item price display in trip history.**

## What Happened

Updated `complete-trip.tsx` to read `receiptItems` and `receiptTotal` route params from the scan-receipt screen. Added a `ReceiptData` state that gets populated on mount when those params are present, auto-filling the amount field. Added a "Scan Receipt" outline button above the amount input that navigates to the scan-receipt screen. When receipt data is present, a green summary card shows the scanned item count and total.

On submission: even-split mode calls `complete_grocery_trip_with_receipt` RPC with `p_item_prices` as a JSON string. Custom-split mode applies receipt item prices via individual `ilike` UPDATE queries against `grocery_items` after trip creation — matching the RPC's `LOWER()` equality pattern.

Updated `trip-history.tsx` to show `unit_price` next to each item in expanded trip view. For items with `quantity > 1` and a unit price, displays `x{quantity} · $X.XX each`. Items without unit_price continue to show quantity-only display (backward compatible).

## Verification

- `npx tsc --noEmit` — passes (no new errors; all existing errors are pre-existing Deno/font-related)
- Code review confirms: non-receipt flow path unchanged (same `complete_grocery_trip` RPC call when `receiptData` is null)
- Amount field remains a standard `TextInput` with `handleAmountChange` — editable regardless of auto-population

### Slice-level verification status (final task):
- ✅ `npx tsc --noEmit` passes with updated types
- ⬜ `curl` deployed `scan-receipt` Edge Function — requires deployed Supabase instance with GEMINI_API_KEY
- ⬜ Expo Go end-to-end flow — requires device/simulator runtime
- ⬜ Edge Function structured error handling — requires deployed function
- ⬜ Receipt photo upload to Storage — requires deployed Supabase instance

## Diagnostics

- **Receipt data flow**: When `receiptData` is non-null on submit, `complete_grocery_trip_with_receipt` is called with `p_item_prices`. Verify via: `SELECT source, unit_price FROM grocery_items WHERE trip_id = '<id>'` — matched items show `source = 'receipt'`.
- **Custom split receipt**: In custom mode, receipt prices applied via individual UPDATE queries. Same verification query works.
- **Trip history prices**: Expand any trip in history — items with `unit_price` show formatted currency, items without show quantity only.
- **Silent param failures**: If receipt params are malformed, `setReceiptData` is never called — screen falls back to manual entry. No error shown (intentional).

## Deviations

None.

## Known Issues

- Slice-level Expo Go verification and Edge Function curl tests require runtime environment (deployed Supabase, device/simulator) — cannot be verified in this execution context.

## Files Created/Modified

- `app/(app)/groceries/complete-trip.tsx` — Added receipt route param parsing, ReceiptData state, Scan Receipt button, receipt summary card, receipt-aware RPC branching in handleSubmit, custom split receipt price application
- `app/(app)/groceries/trip-history.tsx` — Updated expanded item rendering to show unit_price with currency formatting and quantity breakdown
- `.gsd/milestones/M002/slices/S01/tasks/T04-PLAN.md` — Added Observability Impact section (pre-flight fix)
