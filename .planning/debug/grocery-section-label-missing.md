---
status: diagnosed
trigger: "Grocery list has two sections but only 'Completed' has a label. Unchecked section needs a label."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: The unchecked items section is rendered without a heading Text element, while the checked section has one
test: Read the JSX for both sections and compare
expecting: Checked section has a <Text> label, unchecked section does not
next_action: Return diagnosis

## Symptoms

expected: Both the unchecked (active/shopping) section and the checked (completed) section should have visible section labels so the user understands the two-part list structure
actual: Only the "Completed" section (checked items) has a label; the unchecked items section at the top has no label
errors: N/A (visual/UX issue, not a crash)
reproduction: Open groceries tab with at least one unchecked and one checked item
started: Always been this way — the label was never added for the unchecked section

## Eliminated

(none — diagnosis was immediate from code reading)

## Evidence

- timestamp: 2026-03-11T00:00:00Z
  checked: Lines 502-518 — unchecked items rendering block
  found: The unchecked section is wrapped in a plain <View className="mt-3 mx-4 overflow-hidden rounded-xl"> with NO <Text> label element before the .map() call. It jumps straight from the container View into mapping item rows.
  implication: This is the missing label.

- timestamp: 2026-03-11T00:00:00Z
  checked: Lines 520-541 — checked items rendering block
  found: The checked section has an explicit label on line 523: <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">Completed</Text>. This label sits inside a wrapper View with mt-6, above the rounded-xl card containing the items.
  implication: The "Completed" section uses a consistent pattern (wrapper View > Text label > card View > items). The unchecked section is missing the Text label step.

## Resolution

root_cause: The unchecked items section (lines 503-518) renders directly into a card View without any section header Text element, while the checked items section (lines 521-541) includes an explicit "Completed" label. The asymmetry is simply that no label was ever added for the active/shopping section.
fix: (not applied — diagnosis only)
verification: (not applied — diagnosis only)
files_changed: []
