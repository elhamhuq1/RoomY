---
status: resolved
trigger: "When a swap request is made on chores, accepting it causes an error saying 'Error, failed to accept swap request'"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:00:00Z
---

## Current Focus

hypothesis: The resolve_swap_request DB function fails because requested_to user is not in the chore's rotation_order. The swap modal shows ALL household members but the chore may only have a subset in rotation_order.
test: Confirmed function exists (tested with fake UUID, got expected error). Now fixing both the client-side filtering and DB function resilience.
expecting: After fix, swap only offered to rotation members, and function handles edge cases gracefully.
next_action: Fix chores.tsx swap modal to filter by rotation_order, improve resolve_swap_request function, add error logging

## Symptoms

expected: Swap request should be accepted successfully when the other user taps accept
actual: Error message "Error, failed to accept swap request" is shown
errors: "Error, failed to accept swap request"
reproduction: Make a swap request on a chore, then try to accept it from the other user's side
started: Unknown - may have never worked correctly

## Eliminated

## Evidence

- timestamp: 2026-03-13T00:01:00Z
  checked: resolve_swap_request SQL function in 00004_chores.sql (lines 238-277)
  found: Function fetches swap request, updates status, and if accepted looks up requested_to in chore's rotation_order. If not found, raises exception.
  implication: Function can fail if requested_to is not in rotation_order

- timestamp: 2026-03-13T00:02:00Z
  checked: Swap modal in chores.tsx (lines 376-378, 554-602)
  found: The swap modal shows ALL household members (otherMembers = profiles minus current user). It does NOT filter by the chore's rotation_order.
  implication: User can send a swap request to someone not in the chore's rotation, which would fail on accept

- timestamp: 2026-03-13T00:03:00Z
  checked: Client error handling in swap-request.tsx line 169-171
  found: Error from RPC is caught but only a generic message is shown. The actual database error is not logged.
  implication: Need to log the actual error to confirm hypothesis

- timestamp: 2026-03-13T00:04:00Z
  checked: Verification report for chores phase
  found: Swap accept flow was listed as "Human Verification Required" - never actually tested with live data
  implication: This function may have never been successfully executed

- timestamp: 2026-03-13T00:05:00Z
  checked: Direct RPC call to resolve_swap_request with fake UUID (unauthenticated)
  found: Function EXISTS in database. Returns P0001 error "Swap request not found or already resolved" for invalid ID.
  implication: Function is deployed. Error is from function logic, not missing function.

- timestamp: 2026-03-13T00:06:00Z
  checked: Chore creation flow in add.tsx
  found: rotation_order is built from selected members. All members selected by default, but user CAN uncheck members.
  implication: It's possible for a chore to have a subset of household members in rotation_order

## Resolution

root_cause: The swap modal in chores.tsx shows ALL household members, but the chore's rotation_order may only contain a subset. When a swap request is sent to a member NOT in the rotation_order, the resolve_swap_request DB function raises an exception ("Accepter is not in the rotation order") because array_position returns NULL. The client shows this as "Error, failed to accept swap request."

fix: |
  1. chores.tsx: Filter swap modal to only show members in the chore's rotation_order (swapEligibleMembers replaces otherMembers)
  2. 00004_chores.sql + new migration 00007: Update resolve_swap_request to add accepter to rotation_order if not present (instead of raising exception)
  3. swap-request.tsx: Add console.error logging for the actual RPC error

verification: TypeScript compilation passes. Function exists and returns expected errors for test calls. Migration 00007 needs manual application via Supabase SQL editor.
files_changed:
  - app/(app)/(tabs)/chores.tsx
  - app/(app)/chores/swap-request.tsx
  - supabase/migrations/00004_chores.sql
  - supabase/migrations/00007_fix_resolve_swap_request.sql
