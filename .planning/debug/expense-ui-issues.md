---
status: resolved
trigger: "Investigate two issues: Venmo note URL encoding/content, and dollar sign alignment in add expense form"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: Both issues have clear root causes identified
test: n/a
expecting: n/a
next_action: Apply fixes

## Symptoms

expected:
  1. Venmo note should show expense description + date (e.g. "Water Bill - 03/11/26")
  2. "$" prefix and entered amount text should be vertically aligned in the input row
actual:
  1. Venmo note shows "RoomY:+Sttement+for+Clowns" with URL encoding artifacts and typo
  2. "$" sits slightly higher than the entered amount value
errors: none
reproduction:
  1. Open settle screen, tap "Request via Venmo" — observe note in Venmo
  2. Open add expense form, type a dollar amount — observe "$" vs number alignment
started: Since initial implementation

## Eliminated

(none needed — root causes found on first inspection)

## Evidence

- timestamp: 2026-03-11
  checked: settle.tsx line 140
  found: Note is hardcoded as `RoomY: Settlement for ${household?.name ?? "household"}` — it uses household name, not expense description or date
  implication: The "Sttement" typo is NOT in the code — the user likely misread "Settlement" in the URL-encoded form. The real issue is the note content itself (generic settlement message vs. expense description + date). The "+" signs the user sees are because Venmo's web URL query params display spaces as "+", which is standard URL encoding — not a bug per se, but the content is wrong regardless.

- timestamp: 2026-03-11
  checked: settle.tsx line 140-142
  found: The settle screen receives only `userId`, `amount`, and `direction` as search params — it has NO access to expense description or date
  implication: To show "Description - MM/DD/YY" in the Venmo note, the caller must pass description and date as params, OR the settle screen must receive an expense_id and fetch the data

- timestamp: 2026-03-11
  checked: add.tsx lines 289-298
  found: The "$" is a `<Text>` with className `text-lg font-semibold text-gray-400` and the TextInput has className `flex-1 text-lg text-gray-800`. Font sizes match (text-lg) but the Text has `font-semibold` while TextInput does not. More importantly, React Native TextInput has internal vertical padding/alignment that differs from a Text component, causing the baseline mismatch.
  implication: The misalignment is due to differing font weights AND React Native TextInput's default internal padding not matching a plain Text baseline

## Resolution

root_cause:
  Issue 1: settle.tsx line 140 — the Venmo note uses a generic hardcoded string ("RoomY: Settlement for {household name}") instead of the expense description and date. Additionally, the settle screen's route params don't include description or date, so even if the format string were changed, the data isn't available.
  Issue 2: add.tsx lines 289-298 — the "$" Text element and the TextInput have different font-weight (font-semibold vs default) and React Native TextInput has internal padding that doesn't match plain Text baseline alignment.

fix: See recommendations below
verification: n/a (diagnosis only)
files_changed: []
