---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/expenses/add.tsx
  - app/(app)/groceries/complete-trip.tsx
autonomous: true
requirements: [QUICK-10]

must_haves:
  truths:
    - "Tapping a custom split amount input scrolls it above the keyboard"
    - "User can see and edit custom split amounts without keyboard obstruction"
  artifacts:
    - path: "app/(app)/expenses/add.tsx"
      provides: "ScrollView with automaticallyAdjustKeyboardInsets"
      contains: "automaticallyAdjustKeyboardInsets"
    - path: "app/(app)/groceries/complete-trip.tsx"
      provides: "ScrollView with automaticallyAdjustKeyboardInsets"
      contains: "automaticallyAdjustKeyboardInsets"
  key_links: []
---

<objective>
Fix keyboard covering custom split amount inputs on Add Expense and Complete Trip screens.

Purpose: Users cannot see what they type in custom split amount fields because the keyboard covers them.
Output: Both screens auto-scroll focused inputs above the keyboard.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/expenses/add.tsx
@app/(app)/groceries/complete-trip.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add automaticallyAdjustKeyboardInsets to both ScrollViews</name>
  <files>app/(app)/expenses/add.tsx, app/(app)/groceries/complete-trip.tsx</files>
  <action>
In both files, add `automaticallyAdjustKeyboardInsets={true}` to the main ScrollView component (the one inside KeyboardAvoidingView).

For `app/(app)/expenses/add.tsx` — the ScrollView at line ~305:
```
<ScrollView
  className="flex-1"
  contentContainerClassName="px-6 py-6 pb-12"
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={false}
  automaticallyAdjustKeyboardInsets={true}
>
```

For `app/(app)/groceries/complete-trip.tsx` — the ScrollView at line ~329:
```
<ScrollView
  className="flex-1"
  contentContainerClassName="px-6 py-6 pb-12"
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={false}
  automaticallyAdjustKeyboardInsets={true}
>
```

This is a built-in React Native ScrollView prop (available since RN 0.73, Expo SDK 54 uses RN 0.76) that automatically adjusts the scroll view's content insets and scroll position when the keyboard appears, ensuring the focused input is visible.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && grep -n "automaticallyAdjustKeyboardInsets" app/\(app\)/expenses/add.tsx app/\(app\)/groceries/complete-trip.tsx</automated>
    <manual>Open both screens, switch to Custom split, tap a custom amount input — the ScrollView should auto-scroll so the input is visible above the keyboard.</manual>
  </verify>
  <done>Both ScrollViews have automaticallyAdjustKeyboardInsets={true} and custom split inputs are visible when keyboard appears.</done>
</task>

</tasks>

<verification>
- grep confirms `automaticallyAdjustKeyboardInsets` present in both files
- App compiles without errors (npx expo start)
</verification>

<success_criteria>
Custom split amount TextInputs on both Add Expense and Complete Trip screens are visible above the keyboard when focused.
</success_criteria>

<output>
After completion, create `.planning/quick/10-fix-keyboard-hiding-custom-split-amount-/10-SUMMARY.md`
</output>
