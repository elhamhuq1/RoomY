---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/expenses/add.tsx
  - app/(app)/groceries/complete-trip.tsx
autonomous: true
requirements: [QUICK-8]
must_haves:
  truths:
    - "User can toggle between Even and Custom split modes on both expense and grocery trip screens"
    - "Even mode works exactly as before (checkboxes, equal split calculation)"
    - "Custom mode shows editable amount inputs for each member"
    - "Custom mode validates that amounts sum to total before allowing submit"
    - "Custom splits are saved correctly to expense_splits table"
  artifacts:
    - path: "app/(app)/expenses/add.tsx"
      provides: "Even/Custom split toggle for expenses"
    - path: "app/(app)/groceries/complete-trip.tsx"
      provides: "Even/Custom split toggle for grocery trips"
  key_links:
    - from: "app/(app)/expenses/add.tsx"
      to: "supabase expense_splits table"
      via: "splitRows uses customAmounts when in custom mode"
    - from: "app/(app)/groceries/complete-trip.tsx"
      to: "supabase expenses + expense_splits tables"
      via: "client-side inserts bypass RPC when custom mode active"
---

<objective>
Add an Even/Custom split toggle to both the Add Expense and Complete Grocery Trip screens, allowing users to either split evenly (current behavior) or enter custom amounts per member.

Purpose: Users often split expenses unevenly (e.g., one person ate more, or bought personal items). The DB already supports arbitrary split amounts — this surfaces that capability in the UI.
Output: Both screens updated with toggle and custom split input UI.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/expenses/add.tsx
@app/(app)/groceries/complete-trip.tsx
@lib/theme/colors.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Even/Custom split toggle to expenses/add.tsx</name>
  <files>app/(app)/expenses/add.tsx</files>
  <action>
Add split mode state and custom amounts state:
- `splitMode: 'even' | 'custom'` (default: `'even'`)
- `customAmounts: Record<string, string>` — keyed by user_id, string values for TextInput binding (same pattern as `amount` state)

Add a segmented toggle control above the member list in the "Split between" section. Two pill buttons side by side: "Even" and "Custom". Style: rounded-full pills in a row with border border-gray-200 bg-white container. Active pill gets bg-brand text-white, inactive gets transparent text-gray-600. Use the app's existing Pressable pattern. Font: font-sans text-sm.

In Even mode: Keep current behavior exactly as-is (checkboxes, calculateEqualSplits, toggleMember).

In Custom mode:
- Show ALL members (no checkboxes — everyone is listed)
- Replace the read-only share amount text with an editable TextInput (same decimal-pad pattern as the main amount input). Style: w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm
- Initialize customAmounts when switching to custom: pre-fill with even split values if amount is valid, otherwise empty strings
- When switching back to even: clear customAmounts, restore selectedMemberIds to all members

Add validation line below the member list (only in custom mode when amount is valid):
- Calculate `remaining = parsedAmount - sum(customAmounts)`
- If remaining === 0: show "Splits add up" in text-brand (wintergreen)
- If remaining > 0: show "Remaining: $X.XX" in text-amber-500
- If remaining < 0: show "Over by: $X.XX" in text-red-500

Update canSubmit: in custom mode, require remaining === 0 (use Math.abs(remaining) < 0.01 for float safety).

Update handleSubmit: in custom mode, build splitRows from customAmounts instead of calculateEqualSplits. Map over all members, parse each customAmount to float, filter out zero amounts, create split rows with those amounts. Keep the existing expense insert + expense_splits insert pattern.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Open Add Expense screen, verify toggle appears, test even mode unchanged, test custom mode with editable inputs and validation</manual>
  </verify>
  <done>Add Expense screen has working Even/Custom toggle. Even mode unchanged. Custom mode shows editable inputs per member with remaining/over validation. Submit disabled until custom amounts sum to total. Custom splits saved correctly.</done>
</task>

<task type="auto">
  <name>Task 2: Add Even/Custom split toggle to groceries/complete-trip.tsx</name>
  <files>app/(app)/groceries/complete-trip.tsx</files>
  <action>
Apply the same split toggle pattern from Task 1 to the Complete Trip screen. Same state additions (splitMode, customAmounts), same toggle UI, same custom mode member rows with editable inputs, same validation line.

Key difference for submission in custom mode: bypass the `complete_grocery_trip` RPC and do client-side inserts instead (the RPC only handles even splits). The client-side approach:

1. Create a grocery trip: insert into `grocery_trips` table with `{ household_id, total_amount: parsedAmount, paid_by: payerId, created_by: user.id }`
2. Update checked grocery items: update `grocery_items` where `household_id = household.id AND is_checked = true AND trip_id IS NULL` to set `trip_id = newTrip.id`
3. Create expense: insert into `expenses` with `{ household_id, description: 'Grocery Trip', amount: parsedAmount, paid_by: payerId, created_by: user.id }`
4. Create expense_splits: insert rows from customAmounts (parse each, filter zeros)

Wrap all 4 operations in sequence. If any fails, show error.

For Even mode: keep using the existing `complete_grocery_trip` RPC exactly as-is (no changes to even mode behavior).

Also update the per-person split summary section (lines 341-352): only show this summary in even mode. In custom mode the validation line serves this purpose.

Update canSubmit the same way as Task 1 (custom mode requires amounts to sum to total).
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Open Complete Trip screen, verify toggle appears, test even mode uses RPC as before, test custom mode with manual amounts and validation</manual>
  </verify>
  <done>Complete Trip screen has working Even/Custom toggle. Even mode unchanged (uses RPC). Custom mode shows editable inputs, validates sum, and submits via client-side inserts (trip + items update + expense + splits).</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `npx tsc --noEmit`
- Both screens render without crashes in Expo Go
- Even mode on both screens works identically to before
- Custom mode allows entering per-member amounts
- Validation prevents submit when custom amounts don't sum to total
- Custom splits are saved correctly (check expense_splits table in Supabase)
</verification>

<success_criteria>
Both Add Expense and Complete Grocery Trip screens have a working Even/Custom split toggle. Even mode is unchanged. Custom mode allows per-member editable amount inputs with real-time validation showing remaining/over amounts. Submit is disabled until custom amounts match the total. Custom splits are persisted correctly to the database.
</success_criteria>

<output>
After completion, create `.planning/quick/8-add-toggle-for-even-vs-custom-split-in-e/8-SUMMARY.md`
</output>
