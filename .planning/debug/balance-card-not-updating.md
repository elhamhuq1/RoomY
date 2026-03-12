---
status: diagnosed
trigger: "Balance Summary Card on home screen does not update when another user adds an expense the current user owes. Even pull-to-refresh doesn't update."
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: myNetAmount always resolves to 0 because it looks for balances.find(b => b.user_id === user?.id), but get_household_balances() never returns a row for the current user -- it only returns rows for OTHER users
test: Read the SQL function to confirm it filters out auth.uid() from results
expecting: The SQL function explicitly excludes the current user from output rows
next_action: Confirm by reading the SQL WHERE clause

## Symptoms

expected: When another household member adds an expense that the current user owes, the Balance Summary Card on the home screen should show the updated net balance
actual: The Balance Summary Card always shows "All settled up" ($0) regardless of actual balances
errors: No error messages
reproduction: Have another user add an expense splitting with the current user; check home screen balance card
started: Likely since the home screen dashboard was built

## Eliminated

## Evidence

- timestamp: 2026-03-12
  checked: get_household_balances() SQL function in supabase/migrations/00002_expenses.sql (lines 57-107)
  found: The function returns "SELECT other_user AS user_id, SUM(amount) AS net_amount ... WHERE other_user != auth.uid() GROUP BY other_user". It explicitly excludes auth.uid() from the result set. Each row represents the net balance between the current user and one other household member.
  implication: The function never returns a row with user_id = current user. It returns rows keyed by OTHER users.

- timestamp: 2026-03-12
  checked: myNetAmount computation in app/(app)/(tabs)/index.tsx (lines 170-173)
  found: "const myBalance = balances.find((b) => b.user_id === user?.id)" -- this looks for a row where user_id matches the CURRENT user's ID. But the RPC function never returns such a row.
  implication: myBalance will ALWAYS be undefined, so myNetAmount will ALWAYS be 0. The BalanceSummaryCard always shows "All settled up".

- timestamp: 2026-03-12
  checked: How the expenses tab (expenses.tsx) uses the same RPC function
  found: The expenses tab correctly treats each returned row as "another user" and displays the net_amount directly (positive = they owe you, negative = you owe them). It does NOT try to find a row for the current user.
  implication: The expenses tab works correctly. The home screen has a different (incorrect) interpretation of the RPC return data.

- timestamp: 2026-03-12
  checked: unsettledBalances computation in index.tsx (lines 176-194)
  found: This correctly filters for user_id !== user?.id, meaning it processes the OTHER users' rows. But it's used for the AttentionFeed, not the BalanceSummaryCard's headline number.
  implication: The unsettledBalances logic is correct but myNetAmount is wrong.

## Resolution

root_cause: "The home screen computes myNetAmount by searching for balances.find(b => b.user_id === user?.id) -- looking for a row matching the CURRENT user's ID. But get_household_balances() only returns rows for OTHER users (WHERE other_user != auth.uid()). The current user's ID is never in the result set. So myBalance is always undefined, myNetAmount is always 0, and the BalanceSummaryCard permanently shows 'All settled up' regardless of actual balances."
fix: "myNetAmount should be computed by summing the net_amount of all returned balance rows (each row is a pairwise balance with another user). For example: balances.reduce((sum, b) => sum + Number(b.net_amount), 0). Positive sum = net owed to you, negative sum = net you owe."
verification:
files_changed: [app/(app)/(tabs)/index.tsx]
