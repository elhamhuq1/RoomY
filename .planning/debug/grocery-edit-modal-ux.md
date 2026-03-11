---
status: diagnosed
trigger: "Edit item modal: keyboard covers modal, no visual affordance for tap-to-edit"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — two root causes identified
test: Code analysis complete
expecting: N/A
next_action: Return diagnosis

## Symptoms

expected: (1) Editing item name in modal should keep input visible above keyboard. (2) Users should understand items are tappable for editing.
actual: (1) Keyboard covers bottom portion of modal including quantity stepper and buttons. (2) No visual cue that items are editable — users don't discover the feature.
errors: None (UX issues, not crashes)
reproduction: (1) Tap any grocery item, modal opens, tap the name TextInput — keyboard rises and covers lower modal content. (2) New users see item rows but have no reason to tap them.
started: Since initial implementation

## Eliminated

## Evidence

- timestamp: 2026-03-11T00:01:00Z
  checked: Modal structure (lines 564-650)
  found: Modal renders in separate native view hierarchy. The outer KeyboardAvoidingView (line 449) wraps the screen but has NO effect on Modal content. Inside the Modal, the card is vertically centered with flex-1+justify-center but has no KAV or keyboard-aware wrapper. The TextInput at line 586 has autoFocus=true, so keyboard opens immediately and covers the quantity stepper (line 601) and Save/Cancel buttons (line 632).
  implication: Need a KeyboardAvoidingView INSIDE the Modal to shift content when keyboard appears.

- timestamp: 2026-03-11T00:02:00Z
  checked: Item row rendering (lines 370-430, renderItemRow function)
  found: Row contains checkbox (left), item name (center), quantity stepper (right). The entire Pressable row (line 378) opens edit modal on tap. But there is ZERO visual indicator — no chevron, no edit icon, no hint text. The only visual interactive elements are the checkbox and +/- stepper buttons.
  implication: Users have no way to discover tap-to-edit. Need a visual affordance like a chevron-forward icon or pencil icon on the row.

- timestamp: 2026-03-11T00:03:00Z
  checked: Other screens in the app for comparison patterns
  found: (1) Expense detail [id].tsx uses full-screen KAV+ScrollView for editing, not a modal — avoids keyboard issue entirely. (2) Settings and home screen use chevron-forward icons (Ionicons "chevron-forward" size=20 color="#d1d5db") as tap affordances. (3) Expense detail uses "pencil-outline" icon for edit action.
  implication: Established patterns exist in the codebase: chevron-forward for navigable rows, pencil-outline for edit actions.

## Resolution

root_cause: |
  TWO ISSUES:
  1. KEYBOARD COVERAGE: React Native <Modal> renders in a separate native view hierarchy, so the screen-level KeyboardAvoidingView (line 449) has no effect on modal content. The modal's inner content (lines 570-649) has no keyboard-aware wrapper. When the TextInput (line 586, autoFocus=true) receives focus, the keyboard rises and occludes the quantity stepper and action buttons.
  2. DISCOVERABILITY: The renderItemRow function (lines 370-430) attaches an onPress handler to the row Pressable but renders no visual indicator (no icon, chevron, or hint text) that the row is tappable for editing.
fix:
verification:
files_changed: []
