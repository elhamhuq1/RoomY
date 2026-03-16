---
estimated_steps: 6
estimated_files: 3
---

# T03: Build receipt capture utility and scan-receipt review screen

**Slice:** S01 — Receipt Scanning
**Milestone:** M002

## Description

Create the client-side receipt capture flow: a `lib/receipt-capture.ts` utility that captures/picks a receipt photo, resizes it to 1200px width for OCR readability, and converts to base64 for the Edge Function. Then build the `scan-receipt.tsx` screen that orchestrates the full flow: capture → call Edge Function → display extracted items with inline editing → confirm and pass items back to complete-trip.

## Steps

1. Create `lib/receipt-capture.ts`:
   - Export `captureReceiptImage(source: 'camera' | 'gallery'): Promise<{ base64: string, mimeType: string } | null>`
   - If `source === 'camera'`, request camera permissions via `ImagePicker.requestCameraPermissionsAsync()`. If denied, throw error with code `CAMERA_PERMISSION_DENIED` (same pattern as `avatar-upload.ts`).
   - Launch picker/camera via `ImagePicker.launchCameraAsync` or `ImagePicker.launchImageLibraryAsync` with `mediaTypes: ['images']`, `quality: 0.8`, `base64: true` (this makes expo-image-picker return base64 in the asset).
   - If cancelled, return null.
   - Resize to 1200px width using `expo-image-manipulator` `manipulateAsync(uri, [{ resize: { width: 1200 } }], { compress: 0.8, format: SaveFormat.JPEG, base64: true })`. Note: aspect ratio preserved automatically when only width is specified.
   - Return `{ base64: manipulated.base64, mimeType: 'image/jpeg' }`.

2. Create `app/(app)/groceries/scan-receipt.tsx`:
   - **Initial state**: Show two buttons — "Take Photo" (camera icon) and "Choose from Gallery" (image icon). Styled with wintergreen outline, centered on cream background. Follow app's existing button styling patterns.
   - **Scanning state**: After capture, show a loading indicator with "Scanning receipt..." text. Call the `scan-receipt` Edge Function via `supabase.functions.invoke('scan-receipt', { body: { imageBase64, mimeType } })`. Note: `supabase.functions.invoke` handles auth headers automatically.
   - **Error state**: If Edge Function returns an error, show the error message in a red card with a "Try Again" button that resets to initial state.
   - **Review state**: Show extracted items in an editable list:
     - Header showing computed total (sum of all item prices × quantities)
     - Each item row: editable name (TextInput), quantity stepper (- / number / +), editable price (TextInput with $ prefix, decimal-pad keyboard)
     - Swipe-to-delete on each item (use existing `ReanimatedSwipeable` pattern from `GroceryItemRow.tsx`)
     - "Add Item" button at bottom of list for manually adding missed items
     - "Confirm Items" button at bottom — navigates back to complete-trip passing items via `router.back()` after setting params, or use `router.navigate` to complete-trip with params.
   - Pass confirmed items as serialized JSON route param: `router.navigate({ pathname: '/(app)/groceries/complete-trip', params: { receiptItems: JSON.stringify(items), receiptTotal: total.toString() } })`

3. Register the screen in `app/(app)/_layout.tsx`:
   - Add `<Stack.Screen name="groceries/scan-receipt" options={{ title: 'Scan Receipt', headerStyle: { backgroundColor: colors.neutral.bg }, headerShadowVisible: false, headerTintColor: colors.neutral.text }} />`

## Must-Haves

- [ ] `captureReceiptImage` handles both camera and gallery, resizes to 1200px width, returns base64
- [ ] Camera permission denial throws typed error (matching avatar-upload pattern)
- [ ] Scan-receipt screen shows capture → scanning → review states
- [ ] Extracted items are individually editable (name, quantity, price)
- [ ] Items can be deleted and manually added
- [ ] Error from Edge Function is shown with retry option
- [ ] Confirmed items are passed back to complete-trip via route params
- [ ] Screen registered in navigator with cream header

## Verification

- `npx tsc --noEmit` passes
- In Expo Go: navigate to scan-receipt → "Take Photo" opens camera → photo captured → loading shows → items appear → can edit name/quantity/price → can delete an item → can add an item → "Confirm Items" navigates to complete-trip

## Inputs

- `lib/avatar-upload.ts` — image capture pattern (expo-image-picker + expo-image-manipulator). Receipt version uses 1200px width instead of 512px, returns base64 instead of uploading to Storage (Edge Function receives base64 directly).
- `supabase/functions/scan-receipt/index.ts` — Edge Function from T02 that this screen invokes
- `app/(app)/_layout.tsx` — Stack navigator where the new screen is registered
- `components/groceries/GroceryItemRow.tsx` — `ReanimatedSwipeable` pattern for swipe-to-delete reference
- Decision: "Receipt photos resized to 1200px width (not 512px like avatars) — OCR needs readable small text on receipts"
- Decision: "Receipt scan always requires user review/confirmation before committing items"

## Expected Output

- `lib/receipt-capture.ts` — receipt image capture + resize utility
- `app/(app)/groceries/scan-receipt.tsx` — full scan receipt screen with capture/scanning/review states
- `app/(app)/_layout.tsx` — updated with scan-receipt screen registration
