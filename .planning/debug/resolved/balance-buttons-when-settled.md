---
status: resolved
trigger: "BalanceSummaryCard shows Settle Up and Request buttons even when All settled up (zero balance). Tapping Settle Up causes forever loading."
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: Buttons are always rendered regardless of isSettled state; only opacity is reduced, not visibility
test: Read BalanceSummaryCard.tsx and check conditional rendering of buttons
expecting: Buttons are rendered unconditionally
next_action: Return diagnosis

## Symptoms

expected: When balance is zero ("All settled up"), Settle Up and Request buttons should be hidden
actual: Buttons remain visible (at 0.7 opacity) and are tappable; tapping Settle Up navigates to settle screen which shows forever loading because there's nothing to settle
errors: No error — just UX bug (infinite loading on settle screen)
reproduction: Have zero balance, observe buttons still present, tap Settle Up
started: Since component was created

## Eliminated

(none needed — root cause found on first pass)

## Evidence

- timestamp: 2026-03-12T00:00:00Z
  checked: BalanceSummaryCard.tsx lines 72-89
  found: The action buttons View wrapper uses `isSettled ? { opacity: 0.7 } : undefined` — it dims the buttons to 70% opacity when settled, but never hides them. No conditional rendering (`{!isSettled && ...}`) is used.
  implication: Buttons are always rendered and always tappable regardless of balance state.

- timestamp: 2026-03-12T00:00:00Z
  checked: BalanceSummaryCard.tsx lines 7-12 (props interface)
  found: The component only receives `netAmount`, `onSettleUp`, `onRequest`, `onCardPress`. There is no prop to disable buttons or control their visibility externally.
  implication: The fix must be internal to this component — either hide buttons when isSettled is true, or disable them.

- timestamp: 2026-03-12T00:00:00Z
  checked: index.tsx lines 271-273 (handleSettleUp)
  found: handleSettleUp unconditionally navigates to `/(app)/expenses/settle`. No guard for zero balance.
  implication: Even if buttons were theoretically OK, the navigation handler has no protection against the zero-balance case.

## Resolution

root_cause: BalanceSummaryCard.tsx line 73-89 renders Settle Up and Request buttons unconditionally. When `isSettled` is true (netAmount === 0), the buttons wrapper only reduces opacity to 0.7 instead of being hidden or disabled. The buttons remain fully tappable, and the onSettleUp handler navigates to the settle screen without checking for zero balance, causing an infinite loading state on that screen.
fix: (not applied — diagnosis only)
verification: (not applied — diagnosis only)
files_changed: []
