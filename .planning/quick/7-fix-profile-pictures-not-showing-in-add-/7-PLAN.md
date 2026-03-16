---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/expenses/add.tsx
  - app/(app)/groceries/complete-trip.tsx
autonomous: true
requirements: [QUICK-7]
must_haves:
  truths:
    - "Profile pictures display in payer selection on Add Expense screen"
    - "Profile pictures display in split member list on Add Expense screen"
    - "Profile pictures display in payer selection on Complete Trip screen"
    - "Profile pictures display in split member list on Complete Trip screen"
    - "Users without profile pictures show gradient + initials fallback via Avatar component"
  artifacts:
    - path: "app/(app)/expenses/add.tsx"
      provides: "Add expense screen with Avatar component for member rendering"
      contains: "Avatar"
    - path: "app/(app)/groceries/complete-trip.tsx"
      provides: "Complete trip screen with Avatar component for member rendering"
      contains: "Avatar"
  key_links:
    - from: "app/(app)/expenses/add.tsx"
      to: "components/ui/Avatar.tsx"
      via: "import { Avatar }"
      pattern: "Avatar.*userId.*avatarUrl"
    - from: "app/(app)/groceries/complete-trip.tsx"
      to: "components/ui/Avatar.tsx"
      via: "import { Avatar }"
      pattern: "Avatar.*userId.*avatarUrl"
---

<objective>
Replace inline initials-only avatar rendering with the proper Avatar component in both the Add Expense and Complete Grocery Trip screens, so profile pictures are displayed when available.

Purpose: Profile pictures were added in Phase 13 but these two screens still use the old inline pattern (colored circle + initials). The data (avatar_url) is already fetched.
Output: Both screens render the Avatar component with profile picture support.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/ui/Avatar.tsx
@app/(app)/expenses/add.tsx
@app/(app)/groceries/complete-trip.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace inline avatars with Avatar component in expenses/add.tsx</name>
  <files>app/(app)/expenses/add.tsx</files>
  <action>
1. Add import: `import { Avatar } from "@/components/ui/Avatar";`
2. In the "Paid by" horizontal ScrollView (line ~315-325), replace the inline View+Text avatar with:
   `<Avatar userId={member.user_id} name={member.profile.display_name} size="lg" avatarUrl={member.profile.avatar_url} />`
   (size="lg" = 48px, matches the current h-12 w-12)
3. In the "Split between" member list (line ~376-386), replace the inline View+Text avatar with:
   `<Avatar userId={member.user_id} name={member.profile.display_name} size="md" avatarUrl={member.profile.avatar_url} />`
   Keep the `mr-3` wrapper or add a wrapping View with `className="mr-3"` around the Avatar.
4. Remove the `AVATAR_COLORS` import from the colors import (keep `colors` if still used).
5. Remove the `getInitials` function since Avatar handles initials internally.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit app/\(app\)/expenses/add.tsx 2>&1 | head -20</automated>
    <manual>Open Add Expense screen, verify avatars show profile pictures in both payer and split sections</manual>
  </verify>
  <done>Add Expense screen uses Avatar component in both payer selection and split member list. No inline initials rendering remains. AVATAR_COLORS and getInitials removed from file.</done>
</task>

<task type="auto">
  <name>Task 2: Replace inline avatars with Avatar component in groceries/complete-trip.tsx</name>
  <files>app/(app)/groceries/complete-trip.tsx</files>
  <action>
1. Add import: `import { Avatar } from "@/components/ui/Avatar";`
2. In the "Paid by" horizontal ScrollView (line ~263-273), replace the inline View+Text avatar with:
   `<Avatar userId={member.user_id} name={member.profile.display_name} size="lg" avatarUrl={member.profile.avatar_url} />`
3. In the "Split between" member list (line ~325-335), replace the inline View+Text avatar with:
   `<Avatar userId={member.user_id} name={member.profile.display_name} size="md" avatarUrl={member.profile.avatar_url} />`
   Keep the `mr-3` spacing by wrapping Avatar in a View with `className="mr-3"`.
4. Remove the `AVATAR_COLORS` import from the colors import (keep `colors` if still used).
5. Remove the `getInitials` function since Avatar handles initials internally.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit app/\(app\)/groceries/complete-trip.tsx 2>&1 | head -20</automated>
    <manual>Open Complete Trip screen, verify avatars show profile pictures in both payer and split sections</manual>
  </verify>
  <done>Complete Trip screen uses Avatar component in both payer selection and split member list. No inline initials rendering remains. AVATAR_COLORS and getInitials removed from file.</done>
</task>

</tasks>

<verification>
- Both files compile without TypeScript errors
- No references to AVATAR_COLORS or getInitials remain in either file
- Avatar component imported and used in all 4 avatar locations (2 per file)
</verification>

<success_criteria>
- Profile pictures render correctly in Add Expense payer selection and split list
- Profile pictures render correctly in Complete Trip payer selection and split list
- Fallback to gradient + initials works for users without profile pictures
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/7-fix-profile-pictures-not-showing-in-add-/7-SUMMARY.md`
</output>
