# S01: Receipt Scanning

**Goal:** Users can photograph a grocery receipt, have it OCR-processed by Gemini Vision via an Edge Function, review/edit extracted line items (name, quantity, price), and complete a trip with per-item costs visible in trip history.
**Demo:** From the complete-trip screen, tap "Scan Receipt" → photograph a grocery receipt → see extracted items with prices → edit any incorrect items → confirm → total auto-populates, trip completes with per-item cost splitting visible when expanding the trip in history.

## Must-Haves

- Receipt photo capture from complete-trip screen (GROC-01)
- Edge Function calling Gemini Vision to extract structured line items from receipt image (GROC-02)
- Review screen showing extracted items with ability to edit name/quantity/price before confirming (GROC-03)
- Receipt total auto-populates the trip amount field (GROC-04)
- Per-item prices stored with trip and visible in trip history (GROC-05)
- Graceful error handling for Gemini API failures (rate limits, bad images) with user-facing messages

## Proof Level

- This slice proves: integration
- Real runtime required: yes (deployed Edge Function calling Gemini Vision with a real receipt photo)
- Human/UAT required: yes (user photographs a real receipt and confirms extraction accuracy)

## Verification

- `curl` the deployed `scan-receipt` Edge Function with a base64 receipt image → returns valid JSON `{ items: [{ name, quantity, price }], total }`
- `npx tsc --noEmit` passes with updated types
- In Expo Go: navigate to complete-trip → tap "Scan Receipt" → capture photo → see extracted items → edit an item → confirm → total auto-populates → complete trip → trip appears in history with per-item prices shown when expanded
- Edge Function returns structured error JSON (not crash) when given a non-receipt image or when Gemini API key is invalid
- Receipt photo uploads to Supabase Storage `receipts` bucket successfully

## Observability / Diagnostics

- Runtime signals: Edge Function logs structured JSON with `phase` (upload/gemini-call/parse), `item_count`, `total`, `error` on each invocation. Console.error on Gemini API failures with status code and response body.
- Inspection surfaces: Supabase Dashboard → Edge Function logs for `scan-receipt`; Storage browser for `receipts` bucket; `grocery_items` table for `unit_price` and `source` columns
- Failure visibility: Edge Function returns `{ error: string, phase: string }` on failure — client displays the error message. Gemini 429 returns `{ error: "Rate limit exceeded. Please try again in a moment.", phase: "gemini-call" }`
- Redaction constraints: `GEMINI_API_KEY` never logged. Receipt images contain PII (store location, payment info) — stored in user-scoped Storage path, not logged.

## Integration Closure

- Upstream surfaces consumed: `supabase/functions/push-expense/index.ts` (Edge Function pattern), `lib/avatar-upload.ts` (image capture + Storage upload pattern), `app/(app)/groceries/complete-trip.tsx` (trip completion flow), `supabase/migrations/00003_groceries.sql` (grocery schema), `lib/types/database.ts` (TypeScript types)
- New wiring introduced in this slice: `scan-receipt` Edge Function endpoint, `receipts` Storage bucket, `lib/receipt-capture.ts` utility, `app/(app)/groceries/scan-receipt.tsx` screen, updated `complete-trip.tsx` accepting receipt items, new/updated RPC `complete_grocery_trip_with_receipt` for per-item price storage
- What remains before the milestone is truly usable end-to-end: S02 (recipe import), S03 (category organization), S04 (Kroger search)

## Tasks

- [x] **T01: Add receipt schema migration, Storage bucket, and TypeScript types** `est:45m`
  - Why: All downstream tasks depend on the `unit_price` and `source` columns on `grocery_items`, the `receipts` Storage bucket, and a new RPC that accepts per-item prices. This must land first.
  - Files: `supabase/migrations/00010_receipt_scanning.sql`, `lib/types/database.ts`
  - Do: Create migration adding `unit_price NUMERIC(10,2)` and `source TEXT DEFAULT 'manual'` to `grocery_items`. Create `receipts` Storage bucket with RLS policies (household members can upload/read, user-scoped paths). Create `complete_grocery_trip_with_receipt` RPC that accepts a `p_item_prices JSONB` parameter (array of `{name, quantity, price}`) — it does everything the existing RPC does plus updates archived items with `unit_price` and sets `source = 'receipt'`. Update TypeScript types for `GroceryItem` (add `unit_price`, `source`), update table operation types.
  - Verify: `npx tsc --noEmit` passes. Migration SQL is syntactically valid (`grep` for required columns, RPC signature, bucket creation, RLS policies).
  - Done when: Migration file exists with all schema changes, TypeScript types compile, new RPC signature accepts per-item prices.

- [x] **T02: Build scan-receipt Edge Function with Gemini Vision** `est:1h`
  - Why: This is the highest-risk item — proves Gemini Vision works from Deno Edge Functions and returns structured receipt data. Must be verified independently before building UI around it.
  - Files: `supabase/functions/scan-receipt/index.ts`
  - Do: Create Edge Function that receives `{ imageBase64: string, mimeType: string }` POST body, calls Gemini `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` with the image as inline data and a structured prompt requesting JSON output `{ items: [{ name, quantity, price }], total }`. Strip markdown code fences from Gemini response before parsing. Prompt must instruct Gemini to expand receipt abbreviations into human-readable names. Handle errors: missing/invalid API key → 500 with `{ error, phase: "config" }`, Gemini 429 → 429 with `{ error: "Rate limit exceeded...", phase: "gemini-call" }`, non-receipt image / parse failure → 400 with `{ error, phase: "parse" }`. Add CORS headers for Expo Go requests. Follow the `push-expense` Edge Function pattern for structure.
  - Verify: `npx tsc --noEmit` on the function file (Deno types). Curl test with a base64 receipt image returns valid structured JSON. Curl with a non-receipt image returns an error with `phase` field.
  - Done when: Edge Function file exists, compiles, handles happy path and 3 error cases (bad config, rate limit, bad image/parse failure).

- [x] **T03: Build receipt capture utility and scan-receipt review screen** `est:1h30m`
  - Why: Delivers GROC-01 (photograph receipt) and GROC-03 (review extracted items). The capture utility follows the avatar-upload.ts pattern but resizes to 1200px. The review screen shows extracted items with inline editing before confirmation.
  - Files: `lib/receipt-capture.ts`, `app/(app)/groceries/scan-receipt.tsx`, `app/(app)/_layout.tsx`
  - Do: Create `lib/receipt-capture.ts` — function `captureAndUploadReceipt(userId, householdId, source: 'camera'|'gallery')` that uses expo-image-picker → expo-image-manipulator (resize to 1200px width, JPEG 0.8) → upload to `receipts` bucket at `{householdId}/{timestamp}.jpeg` → return `{ storageUrl, base64 }`. Create `app/(app)/groceries/scan-receipt.tsx` — screen with: (1) capture button calling the utility, (2) loading state while Edge Function processes, (3) extracted items list with editable name/quantity/price fields, (4) computed total shown at top, (5) "Confirm" button that navigates back to complete-trip with items as route params. Register the screen in `app/(app)/_layout.tsx` with cream header styling.
  - Verify: `npx tsc --noEmit` passes. Screen renders in Expo Go — capture button opens camera, scan returns items, items are editable, confirm navigates back.
  - Done when: Receipt capture utility exists following avatar-upload pattern, scan-receipt screen shows extracted items with editing, screen is registered in the navigator.

- [x] **T04: Wire receipt items into complete-trip flow and update trip history** `est:1h`
  - Why: Delivers GROC-04 (auto-populate total) and GROC-05 (per-item prices in history). Connects the scan-receipt screen output into the existing complete-trip flow and updates trip history to show itemized costs.
  - Files: `app/(app)/groceries/complete-trip.tsx`, `app/(app)/groceries/trip-history.tsx`
  - Do: Update `complete-trip.tsx` — add "Scan Receipt" button that navigates to `scan-receipt` screen. Read receipt items from route params on return. When receipt items are present: auto-populate the amount field with receipt total, show a receipt items summary section (item count + total), use the new `complete_grocery_trip_with_receipt` RPC passing `p_item_prices` JSONB. Update `trip-history.tsx` — in the expanded trip item list, show `unit_price` next to each item name when available (formatted as currency). Query `unit_price` in the items fetch.
  - Verify: `npx tsc --noEmit` passes. In Expo Go: complete-trip shows "Scan Receipt" button → navigating to scan and back auto-fills the total → completing trip calls the receipt RPC → trip appears in history with per-item prices.
  - Done when: Complete-trip accepts and displays receipt data, auto-populates total, calls receipt-aware RPC, trip history shows per-item prices.

## Files Likely Touched

- `supabase/migrations/00010_receipt_scanning.sql`
- `supabase/functions/scan-receipt/index.ts`
- `lib/receipt-capture.ts`
- `lib/types/database.ts`
- `app/(app)/groceries/scan-receipt.tsx`
- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/groceries/trip-history.tsx`
- `app/(app)/_layout.tsx`
