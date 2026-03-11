---
status: resolved
trigger: "The chores tab shows a spinner that never resolves — stuck on loading screen forever."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: TypeScript compilation passes with zero errors
expecting: Chores tab loads data correctly
next_action: Archive session

## Symptoms

expected: Chores tab loads and displays the user's chore list
actual: Spinner shows indefinitely, never resolves to content
errors: No error messages displayed. date-fns dependency already fixed.
reproduction: Navigate to the Chores tab in the app
started: After partner executed phase 3.1 plans (chores feature). First time used.

## Eliminated

## Evidence

- timestamp: 2026-03-11T00:00:30Z
  checked: auth-context.tsx AuthContextType definition
  found: Context exposes { session, user, profile, household, householdSettings, loading, signOut, refreshProfile }. No `householdId` property.
  implication: Any screen destructuring `householdId` from useSession() gets undefined.

- timestamp: 2026-03-11T00:00:45Z
  checked: chores.tsx line 29 - `const { session, householdId } = useSession();`
  found: Destructures `householdId` which does not exist on the context type. Line 45: `if (!householdId || !session?.user?.id) return;` — always returns early because householdId is undefined. setLoading(false) in finally block never runs.
  implication: Loading spinner shows indefinitely. fetchData() never executes any queries.

- timestamp: 2026-03-11T00:01:00Z
  checked: All app files for householdId vs household.id usage
  found: 4 chore files use broken `householdId` pattern: chores.tsx, chores/add.tsx, chores/dashboard.tsx, chores/swap-request.tsx. All other screens (expenses, groceries, index, settings) correctly use `household` and `household.id`.
  implication: All 4 chore screens are broken with the same root cause. The partner who implemented phase 3.1 assumed a `householdId` convenience property existed.

- timestamp: 2026-03-11T00:02:00Z
  checked: TypeScript compilation after fix applied
  found: `npx tsc --noEmit` passes with zero errors. All 4 files updated. No remaining `householdId` references in app/(app)/.
  implication: Fix is type-safe and complete.

## Resolution

root_cause: All chore-related screens destructure `householdId` from useSession(), but the auth context only exposes `household` (full Household object). `householdId` is always `undefined`, causing the guard clause to return early before any data fetching or loading state reset occurs. The `fetchData` function exits at the guard check, the `try/finally` block never executes, and `setLoading(false)` is never called -- so the loading spinner spins forever.
fix: Changed all 4 chore files to destructure `household` from useSession() and use `household?.id` in guards and `household.id` in queries, matching the pattern used by all working screens (expenses, groceries, settings).
verification: TypeScript compilation passes with zero errors. No remaining `householdId` references in app/(app)/. Pattern now matches all other working screens.
files_changed: [app/(app)/(tabs)/chores.tsx, app/(app)/chores/add.tsx, app/(app)/chores/dashboard.tsx, app/(app)/chores/swap-request.tsx]
