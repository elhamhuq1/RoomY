---
status: investigating
trigger: "keyboard cannot be dismissed on the Add Expense form"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: The form has KeyboardAvoidingView + ScrollView with keyboardShouldPersistTaps="handled", but there is NO mechanism to dismiss the keyboard when tapping outside input fields. The decimal-pad keyboard type has no "Done" button on iOS, compounding the problem.
test: Code review of add.tsx component structure
expecting: No TouchableWithoutFeedback/Keyboard.dismiss wrapper, and no returnKeyType or toolbar on the numeric input
next_action: Confirm root cause and document fix approach

## Symptoms

expected: User should be able to dismiss keyboard by tapping outside input fields, or form should scroll so submit button is accessible
actual: Keyboard stays open and blocks submit button, no way to dismiss it
errors: None (UX issue, not crash)
reproduction: Open add expense screen, tap amount field, keyboard appears and cannot be dismissed
started: Since form was created

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-11T00:01:00Z
  checked: app/(app)/expenses/add.tsx full file (444 lines)
  found: |
    1. KeyboardAvoidingView wraps the entire screen (line 243-246) with behavior="padding" on iOS - GOOD
    2. ScrollView has keyboardShouldPersistTaps="handled" (line 250) - this means taps on Pressable children are handled, but tapping on blank space does NOT dismiss keyboard
    3. No TouchableWithoutFeedback or Pressable wrapper that calls Keyboard.dismiss() - ROOT CAUSE
    4. Amount field uses keyboardType="decimal-pad" (line 295) which on iOS has NO "return" or "Done" key to dismiss
    5. Description field has no returnKeyType or onSubmitEditing to advance to next field
    6. No keyboard dismiss on form submission (handleSubmit doesn't call Keyboard.dismiss())
  implication: |
    Two overlapping issues:
    (a) No tap-outside-to-dismiss behavior anywhere in the component
    (b) decimal-pad keyboard has no built-in dismiss mechanism on iOS
    Together these mean once the amount field is focused, the user is completely stuck.

## Resolution

root_cause: |
  The component lacks any mechanism to dismiss the keyboard when tapping outside input fields.
  The ScrollView uses keyboardShouldPersistTaps="handled" which correctly allows button presses
  while the keyboard is open, but does NOT dismiss the keyboard on blank-area taps.
  Additionally, the amount field uses keyboardType="decimal-pad" which provides no "Done" or
  "Return" key on iOS, so once focused there is literally no way to close the keyboard.
fix: (pending)
verification: (pending)
files_changed: []
