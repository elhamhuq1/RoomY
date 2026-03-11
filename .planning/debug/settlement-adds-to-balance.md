---
status: investigating
trigger: "settlement ADDS to balance instead of REDUCING it — $40 becomes $78 after settling $38"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: The settlement_credits CTE in get_household_balances() has the signs inverted in the combined CTE — settlements that should reduce a debt are instead increasing it
test: Trace through a concrete scenario with the SQL logic
expecting: The sign on the settlement rows in the combined CTE is backwards
next_action: Walk through scenario manually with real values

## Symptoms

expected: Settling $38 against a $40 balance should reduce it to $2
actual: Settling $38 against a $40 balance increases it to $78 ($40 + $38)
errors: No error messages — just wrong arithmetic
reproduction: Record a settlement for any balance — it doubles instead of reducing
started: Since settlements were implemented

## Eliminated

## Evidence

- timestamp: 2026-03-11
  checked: Traced settlement insert logic in settle.tsx (lines 106-107) for "owed_to_you" direction
  found: paid_by/paid_to assignment is correct. When someone owes you, paid_by=otherUser, paid_to=me. This is semantically right.
  implication: The settle screen is not the source of the bug.

- timestamp: 2026-03-11
  checked: Traced settlement_credits CTE aliases (lines 75-82) in 00002_expenses.sql
  found: paid_by aliased as debtor, paid_to aliased as creditor. Semantically correct — the person who paid_by was the debtor settling their debt.
  implication: CTE aliases are fine.

- timestamp: 2026-03-11
  checked: Traced combined CTE settlement rows (lines 94-100) with concrete scenario
  found: |
    BOTH settlement sign directions are inverted.
    Line 99: "They settled (paid me)" uses +amount, but should use -amount to REDUCE what they owe me.
    Line 95: "I settled (paid them)" uses -amount, but should use +amount to REDUCE what I owe them.
    Concrete proof: balance of +40 (they owe me) + settlement +38 = +78. Should be +40 + (-38) = +2.
    Verified both directions are wrong.
  implication: This is the root cause. The two settlement lines in the combined CTE have their signs swapped.

## Resolution

root_cause: "The two settlement rows in the combined CTE of get_household_balances() have their signs swapped. Line 95 uses -amount (should be +amount) and line 99 uses +amount (should be -amount). Settlements double the debt instead of reducing it."
fix: "Swap the signs on lines 95 and 99 of supabase/migrations/00002_expenses.sql"
verification:
files_changed: [supabase/migrations/00002_expenses.sql]
