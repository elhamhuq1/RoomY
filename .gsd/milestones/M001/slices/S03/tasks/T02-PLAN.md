# T02: 03-groceries 02

**Slice:** S03 — **Milestone:** M001

## Description

Build the "Complete Trip" expense conversion flow and trip history archive screen.

Purpose: Enables users to convert a shopping trip into a split expense with one tap, completing the grocery-to-expense pipeline. Trip history provides a lightweight record of past shopping runs.
Output: Complete Trip screen (amount + payer + member split), trip history view, and wiring from the grocery list's "Complete Trip" button.

## Must-Haves

- [x] "User can enter a receipt total, select who paid, and select which members to split between"
- [x] "Tapping 'Complete Trip' creates a standard expense via the existing Phase 2 expense system"
- [x] "After trip completion, checked items are archived and the active list resets to empty"
- [x] "User can view past shopping trips with their totals and item lists"

## Files

- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/groceries/trip-history.tsx`
- `app/(app)/(tabs)/groceries.tsx`
