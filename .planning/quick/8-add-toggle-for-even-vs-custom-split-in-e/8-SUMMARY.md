---
phase: quick-8
plan: 1
subsystem: expenses, groceries
tags: [split-toggle, custom-splits, ui-enhancement]
key-files:
  created: []
  modified:
    - app/(app)/expenses/add.tsx
    - app/(app)/groceries/complete-trip.tsx
decisions:
  - "Custom mode bypasses complete_grocery_trip RPC with client-side inserts (trip + items update + expense + splits)"
  - "Segmented pill toggle with rounded-full container, brand bg for active state"
  - "Float comparison uses Math.abs(remaining) < 0.01 for safety"
metrics:
  duration: 3min
  completed: 2026-03-15
---

# Quick Task 8: Even/Custom Split Toggle Summary

Even/Custom segmented toggle on Add Expense and Complete Trip screens with editable per-member amount inputs and real-time remaining/over validation.

## What Changed

### Task 1: Add Expense - Even/Custom split toggle (38c1491)
- Added `splitMode` state (`'even' | 'custom'`) and `customAmounts` record
- Segmented pill toggle above member list: rounded-full container with brand-colored active pill
- Even mode: completely unchanged (checkboxes, equal split calculation, toggle members)
- Custom mode: all members listed with editable TextInput for each amount (no checkboxes)
- Pre-fills custom amounts with even split values when switching from even mode
- Validation line: "Splits add up" (green), "Remaining: $X.XX" (amber), "Over by: $X.XX" (red)
- Submit disabled until custom amounts sum to total (float-safe comparison)
- Custom splits saved to expense_splits with parsed amounts, zero amounts filtered out

### Task 2: Complete Trip - Even/Custom split toggle (9bdf640)
- Same toggle UI and state pattern as Add Expense
- Even mode: unchanged, still uses `complete_grocery_trip` RPC
- Custom mode: bypasses RPC with 4-step client-side flow:
  1. Insert grocery_trips row
  2. Update checked grocery_items with trip_id
  3. Insert expenses row
  4. Insert expense_splits from custom amounts
- Per-person split summary ("$X split N ways = $Y each") only shown in even mode
- Same validation and submit gating as Add Expense

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] app/(app)/expenses/add.tsx - modified with split toggle
- [x] app/(app)/groceries/complete-trip.tsx - modified with split toggle
- [x] Commit 38c1491 exists
- [x] Commit 9bdf640 exists
- [x] TypeScript compiles (only pre-existing Deno errors in supabase/functions)
