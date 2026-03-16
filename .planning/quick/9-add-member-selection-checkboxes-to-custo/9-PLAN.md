---
phase: quick-9
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/expenses/add.tsx
  - app/(app)/groceries/complete-trip.tsx
autonomous: true
requirements: [QUICK-9]
must_haves:
  truths:
    - "Custom mode rows show checkboxes identical to even mode"
    - "Unchecking a member in custom mode hides their amount input and clears their amount"
    - "customTotal only sums amounts for selected (checked) members"
    - "Submission only includes splits for selected members with amounts > 0"
    - "Switching to custom mode pre-fills amounts only for selected members"
  artifacts:
    - path: "app/(app)/expenses/add.tsx"
      provides: "Custom mode with member checkboxes"
      contains: "toggleMember"
    - path: "app/(app)/groceries/complete-trip.tsx"
      provides: "Custom mode with member checkboxes"
      contains: "toggleMember"
  key_links:
    - from: "custom mode checkbox"
      to: "selectedMemberIds"
      via: "toggleMember function call"
      pattern: "toggleMember\\(member\\.user_id\\)"
    - from: "customTotal calculation"
      to: "selectedMemberIds"
      via: "filter on selectedMemberIds.has"
      pattern: "selectedMemberIds\\.has"
---

<objective>
Add member selection checkboxes to custom split mode in both the Add Expense and Complete Trip screens, matching the existing even mode checkbox pattern.

Purpose: Users currently cannot exclude members from a custom split — all members always appear with amount inputs. This adds the same checkbox UX that even mode has.
Output: Both screens have checkboxes in custom mode rows; unchecked members are excluded from the split.
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
  <name>Task 1: Add checkboxes to custom mode in expenses/add.tsx</name>
  <files>app/(app)/expenses/add.tsx</files>
  <action>
In the custom mode branch of the member list rendering (line ~478-516), make these changes:

1. **Wrap custom row in Pressable** (replace the outer `View` with `Pressable` that calls `toggleMember(member.user_id)`) so tapping the row toggles selection, same as even mode.

2. **Add checkbox before Avatar** — copy the exact checkbox pattern from even mode (lines 438-448):
   ```
   <View className={`mr-3 h-6 w-6 items-center justify-center rounded-md ${isChecked ? "bg-brand" : "border-2 border-gray-300 bg-white"}`}>
     {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
   </View>
   ```
   Add `const isChecked = selectedMemberIds.has(member.user_id);` at the top of the custom mode block.

3. **Conditionally show amount input** — only render the TextInput amount box when `isChecked` is true. When unchecked, show nothing in that spot (member row just has checkbox + avatar + name).

4. **Update `handleSplitModeChange`** (line ~178-202): When switching to custom mode, only pre-fill amounts for members in `selectedMemberIds`, not all members. Change the `members.forEach` to check `selectedMemberIds.has(m.user_id)` — if not selected, set amount to ''.

5. **Update `customTotal` calculation** (line ~145-150): Filter to only sum amounts for members in `selectedMemberIds`:
   ```
   const customTotal = splitMode === 'custom'
     ? members.reduce((sum, m) => {
         if (!selectedMemberIds.has(m.user_id)) return sum;
         const val = parseFloat(customAmounts[m.user_id] || '0');
         return sum + (isNaN(val) ? 0 : val);
       }, 0)
     : 0;
   ```

6. **Clear custom amount when unchecking** — update `toggleMember` to also clear the custom amount when deselecting in custom mode:
   After the existing `toggleMember` logic, add: if removing a member and splitMode is 'custom', clear their customAmounts entry:
   ```
   function toggleMember(userId: string) {
     setSelectedMemberIds((prev) => {
       const next = new Set(prev);
       if (next.has(userId)) {
         if (next.size <= 1) return prev;
         next.delete(userId);
       } else {
         next.add(userId);
       }
       return next;
     });
     // Clear custom amount when unchecking in custom mode
     if (splitMode === 'custom' && selectedMemberIds.has(userId)) {
       setCustomAmounts((prev) => ({ ...prev, [userId]: '' }));
     }
   }
   ```

7. **Update `canSubmit` for custom mode** — add check that at least one member is selected in custom mode too. Change the custom branch from just `customSplitsValid` to `selectedMembers.length > 0 && customSplitsValid`.
  </action>
  <verify>
    npx tsc --noEmit --pretty 2>&1 | head -20
  </verify>
  <done>Custom mode rows in Add Expense show checkboxes, unchecked members hide their amount input, customTotal only sums selected members, submission excludes unselected members</done>
</task>

<task type="auto">
  <name>Task 2: Add checkboxes to custom mode in groceries/complete-trip.tsx</name>
  <files>app/(app)/groceries/complete-trip.tsx</files>
  <action>
Apply the exact same 7 changes from Task 1 to `complete-trip.tsx`. The code structure is identical. Specifically:

1. **Custom mode row** (line ~483-520): Replace outer `View` with `Pressable` calling `toggleMember`, add `isChecked` variable, add checkbox View before Avatar, conditionally show amount input only when `isChecked`.

2. **`handleSplitModeChange`** (line ~167-191): Only pre-fill amounts for members in `selectedMemberIds`.

3. **`customTotal`** (line ~135-140): Filter to only sum selected members.

4. **`toggleMember`** (line ~193-205): Clear custom amount on deselect when in custom mode.

5. **`canSubmit`** (line ~144-148): Add `selectedMembers.length > 0` to custom mode check.

All patterns identical to Task 1 — use the same checkbox markup, same conditional rendering, same state management.
  </action>
  <verify>
    npx tsc --noEmit --pretty 2>&1 | head -20
  </verify>
  <done>Custom mode rows in Complete Trip show checkboxes, unchecked members hide their amount input, customTotal only sums selected members, submission excludes unselected members</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Both files have checkbox markup in custom mode (grep for `toggleMember` in custom mode blocks)
- `customTotal` calculation filters by `selectedMemberIds.has` in both files
</verification>

<success_criteria>
- Custom mode in both screens shows checkboxes matching even mode visual style
- Unchecking a member hides their amount input and clears their amount
- Only selected members' amounts count toward the total
- Only selected members with amount > 0 are included in submission
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/9-add-member-selection-checkboxes-to-custo/9-SUMMARY.md`
</output>
