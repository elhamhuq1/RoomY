---
status: resolved
trigger: "When a user owes money, clicking Settle Up shows Request via Venmo instead of Pay via Venmo — direction is inverted"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - settle.tsx hardcodes txn=charge and "Request via Venmo" regardless of direction param
test: Read settle.tsx line 139 and line 282
expecting: Confirmed both the Venmo URL and button label ignore direction
next_action: Apply fix - make txn type and button label conditional on direction

## Symptoms

expected: When a user owes money and clicks "Settle Up", they should be directed to make a Venmo payment to the person they owe money to.
actual: The button says "Request via Venmo" and creates a Venmo money request FROM the person they owe, which is backwards.
errors: No crash/error — the logic is just inverted. The Venmo deep link or action type is wrong.
reproduction: 1. Be a user who owes money. 2. Click "Settle Up". 3. Observe "Request via Venmo" instead of "Pay via Venmo".
started: Likely always been this way since settle-up was implemented.

## Eliminated

## Evidence

- timestamp: 2026-03-13T00:01:00Z
  checked: settle.tsx handleRequestVenmo function (line 131-143)
  found: Venmo URL hardcodes `txn=charge` on line 139 regardless of `direction` param. `charge` = request money FROM the other user. When direction is `you_owe`, it should be `txn=pay` to send money TO the other user.
  implication: This is the root cause of the wrong Venmo action type.

- timestamp: 2026-03-13T00:01:00Z
  checked: settle.tsx button label (line 282)
  found: Button always says "Request via Venmo" regardless of direction. When direction is `you_owe`, it should say "Pay via Venmo".
  implication: This is why the button text is misleading.

- timestamp: 2026-03-13T00:02:00Z
  checked: Callers of settle screen (index.tsx handleSettleUp, expenses.tsx handleSettle)
  found: Both correctly pass `direction: 'you_owe'` when user owes money. The direction param is correct coming in; settle.tsx just ignores it for the Venmo action.
  implication: Fix is entirely within settle.tsx.

## Resolution

root_cause: settle.tsx hardcodes `txn=charge` (Venmo request) and "Request via Venmo" button text regardless of the `direction` parameter. When `direction === "you_owe"`, it should use `txn=pay` and say "Pay via Venmo". When `direction === "owed_to_you"`, `txn=charge` and "Request via Venmo" is correct.
fix: Made Venmo txn type conditional (`direction === "you_owe"` -> `txn=pay`, else `txn=charge`). Made button label conditional ("Pay via Venmo" vs "Request via Venmo"). Renamed function from `handleRequestVenmo` to `handleVenmo` to reflect dual purpose.
verification: Verified only one Venmo URL in codebase (settle.tsx). Verified callers (index.tsx handleSettleUp, expenses.tsx handleSettle) correctly pass direction param. Verified no other references to old function name in executable code. Confirmed the record-payment logic (paid_by/paid_to) was already correct for both directions.
files_changed: [app/(app)/expenses/settle.tsx]
