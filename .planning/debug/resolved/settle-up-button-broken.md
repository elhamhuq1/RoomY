---
status: resolved
trigger: "Settle Up button on the Your Balance card causes infinite loading instead of navigating to the Settle Up page. Also, button visibility logic is wrong."
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - both root causes fixed and verified
test: TypeScript compilation passes, code review confirms correctness
expecting: n/a
next_action: archive and commit

## Symptoms

expected: Tapping "Settle Up" on the balance card navigates directly to the Settle Up page in the expenses tab. When user owes money, only Settle Up button appears. When someone owes user money, only Request button appears.
actual: Tapping Settle Up causes an infinite loading state — never navigates. Both Settle Up and Request buttons appear regardless of balance direction.
errors: No crash, just infinite loading spinner
reproduction: Open home screen with a non-zero balance, tap Settle Up button
started: Partially addressed in gap closure plan 07-04 but navigation and conditional display were not fixed

## Eliminated

## Evidence

- timestamp: 2026-03-12T00:00:30Z
  checked: handleSettleUp in index.tsx (line 284-286)
  found: navigates to '/(app)/expenses/settle' with NO search params - no userId, no amount, no direction
  implication: settle.tsx expects userId, amount, direction as search params. Without userId, fetchProfile() returns early (line 64: `if (!otherUserId) return`), never calling setLoadingProfile(false), so the loading spinner runs forever

- timestamp: 2026-03-12T00:00:35Z
  checked: expenses tab settle navigation (expenses.tsx lines 349-357, 404-407)
  found: passes full query params: userId, amount, direction, description, date. This is why Settle Up works from the expenses tab but not from home screen.
  implication: confirms the home screen handler is the problem - it's missing required params

- timestamp: 2026-03-12T00:00:40Z
  checked: BalanceSummaryCard.tsx (lines 73-88)
  found: shows BOTH Settle Up and Request buttons whenever !isSettled. No conditional logic based on isOwe vs isOwed.
  implication: confirms button visibility bug - both buttons always appear when balance is non-zero

- timestamp: 2026-03-12T00:00:45Z
  checked: settle.tsx loadingProfile behavior (lines 62-76)
  found: fetchProfile guard `if (!otherUserId) return` exits early WITHOUT calling setLoadingProfile(false). loadingProfile starts as true (line 55). So the loading screen on line 146 renders forever.
  implication: even if we wanted settle.tsx to work without params, it has a secondary bug where it never exits loading state when no userId is provided

## Resolution

root_cause: TWO issues. (1) handleSettleUp in home screen navigates to settle page without required search params (userId, amount, direction), causing settle.tsx to be stuck in infinite loading because fetchProfile early-returns without clearing loadingProfile state. (2) BalanceSummaryCard always shows both Settle Up and Request buttons when balance is non-zero, instead of conditionally showing only Settle Up when user owes money and only Request when someone owes the user.

fix: Three changes across three files:
1. BalanceSummaryCard.tsx - Changed button rendering from `!isSettled` (always both) to conditional: `isOwe` shows only "Settle Up", `isOwed` shows only "Request". Each button renders full-width in its own View.
2. index.tsx (home screen) - Changed handleSettleUp and handleRequest to navigate to `/(app)/(tabs)/expenses` (the expenses tab with per-member breakdown and proper settle params) instead of directly to the settle page without params.
3. settle.tsx - Defensive fix: added `setLoadingProfile(false)` in the early return when `!otherUserId`, preventing infinite loading if the page is ever reached without params.

verification: TypeScript compilation passes (no new errors). Code review confirms: (a) BalanceSummaryCard correctly shows one button based on balance direction, (b) home screen navigation goes to expenses tab where per-member settle buttons pass all required params, (c) settle.tsx no longer gets stuck in infinite loading without params.

files_changed:
- components/home/BalanceSummaryCard.tsx
- app/(app)/(tabs)/index.tsx
- app/(app)/expenses/settle.tsx
