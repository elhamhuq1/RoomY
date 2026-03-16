# S01b: Receipt-Based Item Ownership & Smart Splitting — UAT

**Milestone:** M002
**Written:** 2026-03-15

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: This slice changes navigation flow, adds a new screen, and modifies RPC behavior — all require live Expo Go testing on a real device

## Preconditions

- Expo dev server running (`npx expo start`)
- App loaded in Expo Go on a real device or emulator
- User logged in with a household that has at least 2 members
- At least one grocery item on the list (for non-receipt trip regression)
- A grocery receipt photo available (can use a photo of any receipt with legible items/prices)
- Supabase migrations applied (including 00011, 00012, 00013)

## Smoke Test

From the groceries tab, confirm a "Scan Receipt" button is visible below the quick-add input. Tap it and verify the scan-receipt screen opens.

## Test Cases

### 1. Full scan → assign → complete flow (ownership split)

1. Navigate to the **Groceries** tab
2. Tap **"Scan Receipt"** button
3. Photograph or select a grocery receipt image
4. Wait for OCR processing — review extracted items on the review screen
5. Confirm the items (tap "Confirm" or equivalent)
6. **Expected:** Navigate to the **Assign Items** screen (not complete-trip)
7. Verify each item row shows the item name, price, and a horizontal row of household member avatars
8. Tap a member avatar on 2-3 items to assign them
9. **Expected:** Tapped avatar highlights, bottom bar updates per-member totals, unassigned items shown as "Shared"
10. Tap a previously-assigned avatar again on one item
11. **Expected:** Item becomes unassigned (returns to "Shared" bucket)
12. Tap **"Continue"**
13. **Expected:** Navigate to **complete-trip** screen with amount pre-filled from receipt total
14. Verify a **"By Item"** tab is visible in the split mode selector (alongside "Even" and "Custom")
15. Verify "By Item" is the active/selected tab
16. **Expected:** Per-member ownership shares displayed as read-only totals (no checkboxes)
17. Tap **"Complete Trip"**
18. **Expected:** Trip completes, navigates to **trip history**
19. Verify trip history shows the correct item count and individual items with prices

### 2. Even split still works for non-receipt trips

1. Navigate to the **Groceries** tab
2. Tap the **"Complete Trip"** button (the main one, not scan receipt)
3. Enter a trip amount manually
4. **Expected:** Only **"Even"** and **"Custom"** split tabs visible — no "By Item" tab
5. Select members and complete the trip
6. **Expected:** Trip completes with even split, navigates to trip history

### 3. Scan Receipt button location

1. Navigate to the **Groceries** tab
2. **Expected:** "Scan Receipt" button visible on the main groceries page (below the quick-add input area)
3. Tap "Complete Trip" to go to the complete-trip screen
4. **Expected:** No "Scan Receipt" button on the complete-trip screen

### 4. Navigation back-stack is clean

1. Complete the full scan → assign → complete → trip-history flow (test case 1)
2. From trip history, press the back button
3. **Expected:** Returns to the **Groceries** tab (not to assign-items or scan-receipt)
4. Press back again
5. **Expected:** Normal tab navigation behavior — does NOT return to any intermediate screen in the scan flow

### 5. Switch between split modes on complete-trip

1. Complete a receipt scan and item assignment (test case 1 steps 1-13)
2. On the complete-trip screen, verify "By Item" tab is active
3. Tap the **"Even"** tab
4. **Expected:** Split switches to even mode — all selected members get equal share
5. Tap the **"Custom"** tab
6. **Expected:** Custom split inputs appear for each member
7. Tap **"By Item"** tab again
8. **Expected:** Returns to ownership-based per-member totals

## Edge Cases

### Empty receipt items on assign-items screen

1. If possible, navigate directly to assign-items without receipt data (e.g., deep link or modified route params)
2. **Expected:** Empty state screen with a "Go Back" button — no crash, no blank screen

### All items left unassigned (shared)

1. Complete scan flow, reach assign-items screen
2. Do NOT assign any items to any member — leave all as "Shared"
3. Tap "Continue" to complete-trip
4. **Expected:** Complete-trip should handle this gracefully — split mode falls back to even split since no ownership data has associated prices

### Single household member

1. If household has only 1 member, complete the full scan → assign → complete flow
2. **Expected:** Entire amount assigned to the single member — no divide-by-zero or empty states

### Receipt with many items (10+)

1. Scan a receipt with 10 or more line items
2. **Expected:** Assign-items screen scrolls properly, bottom bar with per-member totals stays fixed/visible while scrolling

## Failure Signals

- "By Item" tab appears on complete-trip without going through the receipt scan flow
- Crash or blank screen when navigating to assign-items
- Per-member totals on assign-items don't add up to receipt total
- Back button from trip-history returns to scan-receipt or assign-items instead of groceries tab
- `split_mode` in RPC response is 'even' when items were assigned (check via Supabase logs)
- Trip history shows 0 items after completing a receipt-scanned trip
- "Scan Receipt" button still visible on the complete-trip screen
- TypeScript compilation errors (run `npx tsc --noEmit`)

## Requirements Proved By This UAT

- GROC-05 — Per-item prices with ownership (assigned_to) stored with trip, visible in trip history queries

## Not Proven By This UAT

- GROC-01 through GROC-04 — Receipt scanning core capability (proved by S01 UAT, not re-tested here beyond smoke test)
- Ownership split accuracy for complex edge cases (e.g., items with $0 price, negative prices from coupons) — not tested
- Multi-device realtime sync of ownership data — not tested

## Notes for Tester

- The "By Item" split mode only appears when you arrive at complete-trip through the scan→assign flow. If you navigate to complete-trip directly (non-receipt trip), you'll only see Even and Custom tabs — this is correct behavior.
- The assign-items screen uses member avatars from the household query. If avatars aren't loading, check that the household members query is working (same data source as complete-trip's member list).
- Receipt OCR accuracy is outside the scope of this slice — focus on the assignment and splitting flow, not whether Gemini extracted items correctly.
- Pre-existing tsc errors in `supabase/functions/` (Deno types) and `@expo-google-fonts/nunito` are known and unrelated.
