---
phase: quick-9
plan: 01
subsystem: expenses, groceries
tags: [ui, split-mode, checkboxes]
dependency-graph:
  requires: [quick-8]
  provides: [custom-split-member-selection]
  affects: [expenses/add, groceries/complete-trip]
tech-stack:
  patterns: [checkbox-toggle, conditional-rendering, state-filtering]
key-files:
  modified:
    - app/(app)/expenses/add.tsx
    - app/(app)/groceries/complete-trip.tsx
decisions:
  - Reused exact checkbox markup from even mode for visual consistency
  - Clear custom amount on deselect to prevent stale values in submission
metrics:
  duration: 2min
  completed: 2026-03-15
---

# Quick Task 9: Add Member Selection Checkboxes to Custom Split Mode

Custom split mode now shows member checkboxes identical to even mode, allowing users to exclude members from custom splits.

## Changes Made

### Task 1: Add Expense Screen (21e3b24)

Updated `app/(app)/expenses/add.tsx` with 5 changes:
- Custom mode rows wrapped in `Pressable` with `toggleMember` call and checkbox UI matching even mode
- Amount input conditionally rendered only when member is checked
- `customTotal` calculation filters by `selectedMemberIds.has()`
- `handleSplitModeChange` pre-fills amounts only for selected members when switching to custom
- `toggleMember` clears custom amount entry when deselecting in custom mode
- `canSubmit` requires `selectedMembers.length > 0` in custom mode

### Task 2: Complete Trip Screen (a499fe9)

Applied identical 5 changes to `app/(app)/groceries/complete-trip.tsx` -- same checkbox markup, same conditional rendering, same state management logic.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED (only pre-existing Deno edge function errors)
- Both files contain `toggleMember` in custom mode blocks: CONFIRMED
- Both files filter `customTotal` by `selectedMemberIds.has`: CONFIRMED

## Self-Check: PASSED

- [x] app/(app)/expenses/add.tsx -- modified, committed at 21e3b24
- [x] app/(app)/groceries/complete-trip.tsx -- modified, committed at a499fe9
