---
id: T03
parent: S01
milestone: M002
provides:
  - receipt image capture utility (camera + gallery, 1200px resize, base64 output)
  - scan-receipt review screen with capture → scanning → error → review phases
  - inline item editing (name, quantity stepper, price), swipe-to-delete, add item
  - confirmed items passed to complete-trip via serialized route params
key_files:
  - lib/receipt-capture.ts
  - app/(app)/groceries/scan-receipt.tsx
  - app/(app)/_layout.tsx
key_decisions:
  - Price stored as editable string in review state, parsed to number only on confirm — avoids float formatting issues during editing
  - Items with empty name or zero price silently filtered on confirm (not individually validated during editing) — lets users freely edit without blocking
  - No Storage upload in capture utility — base64 goes directly to Edge Function. Storage upload deferred to trip completion if needed.
patterns_established:
  - Phase-based screen state machine (capture/scanning/error/review) with explicit ScreenPhase type union
  - ReanimatedSwipeable delete pattern reused from GroceryItemRow for receipt item rows
  - captureReceiptImage utility mirrors avatar-upload pattern but returns base64 instead of uploading
observability_surfaces:
  - Camera permission denial surfaces as native Alert with actionable message
  - Edge Function error message (with phase context from T02) displayed in red card on error phase
  - Item validation alert on confirm when all items filtered out
duration: 25m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T03: Build receipt capture utility and scan-receipt review screen

**Created receipt capture utility and scan-receipt screen with four-phase state machine (capture → scanning → error → review), inline item editing, swipe-to-delete, and route-param handoff to complete-trip.**

## What Happened

Built `lib/receipt-capture.ts` following the `avatar-upload.ts` pattern — requests camera permissions when source is camera (throws `CAMERA_PERMISSION_DENIED` on denial), launches picker/camera with `base64: true`, resizes to 1200px width via `expo-image-manipulator`, returns `{ base64, mimeType }`.

Built `app/(app)/groceries/scan-receipt.tsx` as a phase-based screen:
- **Capture**: Two outlined buttons (Take Photo / Choose from Gallery) centered on cream background with receipt icon hero.
- **Scanning**: ActivityIndicator with "Scanning receipt..." text while Edge Function processes.
- **Error**: Red card showing Edge Function error message with "Try Again" button resetting to capture phase.
- **Review**: Editable item list with each row showing name TextInput, quantity stepper (−/+), price TextInput with $ prefix. Items are swipe-to-delete using the same ReanimatedSwipeable pattern from GroceryItemRow. "Add Item" button appends a blank row. Header shows computed total (sum of price × quantity). "Confirm Items" navigates to complete-trip with `receiptItems` (JSON) and `receiptTotal` as route params.

Registered the screen in `app/(app)/_layout.tsx` with cream header, matching existing grocery screen patterns.

## Verification

- `npx tsc --noEmit` — passes (no new errors from added files; only pre-existing Deno/font errors)
- Code review: `captureReceiptImage` handles both camera and gallery sources ✓
- Code review: Camera permission denial throws typed error ✓
- Code review: Screen implements all four phases (capture/scanning/error/review) ✓
- Code review: Items are individually editable (name, quantity, price) ✓
- Code review: Swipe-to-delete via ReanimatedSwipeable ✓
- Code review: "Add Item" button appends new blank row ✓
- Code review: Edge Function error displayed in red card with retry ✓
- Code review: Confirmed items passed via `router.navigate` with serialized JSON params ✓
- Code review: Screen registered in navigator with cream header ✓

### Slice-level verification (intermediate — T03 of 4):
- ✅ `npx tsc --noEmit` passes with updated types
- ⏳ Full Expo Go flow — requires T04 (complete-trip wiring with "Scan Receipt" button)
- ⏳ `curl` Edge Function — tested in T02, deployment not this task's scope
- ⏳ Receipt Storage upload — deferred; capture returns base64 directly to Edge Function

## Diagnostics

- **Camera permission denied**: Screen catches `CAMERA_PERMISSION_DENIED` error and shows native Alert directing user to device Settings.
- **Edge Function errors**: Error phase displays the `error` message from the Edge Function response. The `phase` field from T02's structured errors provides context (config/gemini-call/parse).
- **Empty confirm**: Alert fires if user tries to confirm with no valid items (all filtered by empty name or zero price).
- **Debug**: In Expo Go, check console for `supabase.functions.invoke` network calls. Response shape: success `{ items, total }`, failure `{ error, phase }`.

## Deviations

- Plan mentioned `captureAndUploadReceipt(userId, householdId, source)` with Storage upload. Implemented as `captureReceiptImage(source)` returning base64 only — Storage upload is not needed since the Edge Function receives base64 directly. This aligns with T02's Edge Function interface (`{ imageBase64, mimeType }` body).

## Known Issues

None.

## Files Created/Modified

- `lib/receipt-capture.ts` — receipt image capture + resize utility (camera/gallery → 1200px JPEG → base64)
- `app/(app)/groceries/scan-receipt.tsx` — full scan receipt screen with capture/scanning/error/review phases
- `app/(app)/_layout.tsx` — added scan-receipt screen registration in Stack navigator
- `.gsd/milestones/M002/slices/S01/tasks/T03-PLAN.md` — added Observability Impact section (pre-flight fix)
