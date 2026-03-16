---
estimated_steps: 5
estimated_files: 2
---

# T04: Wire receipt items into complete-trip flow and update trip history

**Slice:** S01 — Receipt Scanning
**Milestone:** M002

## Description

Connect the scan-receipt output into the existing complete-trip screen: add a "Scan Receipt" entry point button, read receipt items from route params, auto-populate the total amount, show a receipt summary, and call the receipt-aware RPC on submission. Then update trip history to display per-item prices when available.

## Steps

1. Update `app/(app)/groceries/complete-trip.tsx`:
   - Read route params `receiptItems` and `receiptTotal` via `useLocalSearchParams()`. Parse `receiptItems` from JSON string if present.
   - Add state: `receiptData: { items: Array<{ name: string, quantity: number, price: number }>, total: number } | null`
   - On mount (or when params change): if `receiptItems` and `receiptTotal` are present, set `receiptData` and auto-populate the `amount` state with `receiptTotal`.
   - Add a "Scan Receipt" button above the "Receipt Total" text input. Style: wintergreen outline rounded-xl with camera icon + "Scan Receipt" label. On press: `router.push('/(app)/groceries/scan-receipt')`.
   - When `receiptData` is present, show a receipt summary card between the scan button and the amount input: light green card showing "📋 {n} items scanned" with the total. Make the amount input still editable (user can override).
   - In `handleSubmit`: if `receiptData` exists, call `supabase.rpc('complete_grocery_trip_with_receipt', { ...existing params, p_item_prices: JSON.stringify(receiptData.items) })` instead of the regular `complete_grocery_trip` RPC. The `p_item_prices` param is a JSON string that the RPC parses internally.
   - For custom split mode with receipt data: same approach — pass `p_item_prices` to the manual client-side flow by updating archived grocery_items with `unit_price` and `source = 'receipt'` after the trip is created.

2. Update `app/(app)/groceries/trip-history.tsx`:
   - In the `grocery_items` query (the batch fetch for all trips), add `unit_price` to the select fields. The current query uses `select("*")` which already returns all columns, but ensure the `GroceryItem` type now includes `unit_price` (from T01).
   - In the expanded item list rendering: when `item.unit_price` is present, show the price next to the item name. Layout: item name on the left, price on the right (same row). Format as currency using the existing `formatCurrency` helper.
   - If quantity > 1 and unit_price exists, show `x{quantity} · $X.XX each` to clarify the per-unit price.

3. Verify the end-to-end flow works:
   - Navigate to complete-trip → "Scan Receipt" visible → tap → scan-receipt screen opens → complete scan → return to complete-trip → total auto-populated → receipt summary shown → complete trip → trip in history shows per-item prices.

## Must-Haves

- [ ] "Scan Receipt" button on complete-trip screen navigates to scan-receipt
- [ ] Receipt items from route params auto-populate the total amount field
- [ ] Receipt summary card shows scanned item count when receipt data present
- [ ] Submission calls `complete_grocery_trip_with_receipt` RPC with item prices when receipt data present
- [ ] Trip history shows `unit_price` per item when available
- [ ] Amount field remains editable even when auto-populated from receipt
- [ ] Existing non-receipt trip completion flow continues to work unchanged (no regression)

## Verification

- `npx tsc --noEmit` passes
- In Expo Go: full flow from complete-trip → scan → review → confirm → auto-populated total → complete trip → history shows per-item prices
- Non-receipt trip completion still works: enter amount manually → complete trip → no regression

## Inputs

- `app/(app)/groceries/complete-trip.tsx` — existing trip completion screen (~400 LOC) with even/custom split modes
- `app/(app)/groceries/trip-history.tsx` — existing trip history with expandable item lists
- `supabase/migrations/00010_receipt_scanning.sql` — `complete_grocery_trip_with_receipt` RPC from T01
- `app/(app)/groceries/scan-receipt.tsx` — scan receipt screen from T03 that navigates back with `receiptItems` and `receiptTotal` params
- `lib/types/database.ts` — updated `GroceryItem` type with `unit_price` from T01

## Expected Output

- `app/(app)/groceries/complete-trip.tsx` — updated with scan receipt button, receipt item handling, receipt-aware RPC call
- `app/(app)/groceries/trip-history.tsx` — updated to display per-item prices in expanded trip view
