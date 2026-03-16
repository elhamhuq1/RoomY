---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(auth)/sign-up.tsx
  - app/(auth)/sign-in.tsx
autonomous: true
requirements: [QUICK-5]

must_haves:
  truths:
    - "After successful email signup, user is redirected to the sign-in page"
    - "User sees a success message on the sign-in page confirming account creation"
  artifacts:
    - path: "app/(auth)/sign-up.tsx"
      provides: "Redirect to sign-in after successful signUp call"
    - path: "app/(auth)/sign-in.tsx"
      provides: "Displays success banner when navigated to from sign-up"
  key_links:
    - from: "app/(auth)/sign-up.tsx"
      to: "app/(auth)/sign-in.tsx"
      via: "router.replace with query param"
      pattern: "router\\.replace.*sign-in"
---

<objective>
Redirect users to the login page after successful email/password account creation, showing a success message.

Purpose: Currently after sign-up, the user stays on the create account page with no feedback. The user should be sent to the sign-in page so they can log in (especially important if email confirmation is enabled in Supabase).
Output: Updated sign-up.tsx with redirect and sign-in.tsx with success banner.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(auth)/sign-up.tsx
@app/(auth)/sign-in.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redirect to sign-in after signup and show success message</name>
  <files>app/(auth)/sign-up.tsx, app/(auth)/sign-in.tsx</files>
  <action>
In `app/(auth)/sign-up.tsx` — `handleSignUp` function:
- After a successful `supabase.auth.signUp()` call (no error), add `router.replace("/(auth)/sign-in?registered=true")` to redirect the user to the sign-in page.
- This goes inside the `if (error)` block's else branch (i.e., when there is no error), before the `finally` block.

In `app/(auth)/sign-in.tsx`:
- Import `useLocalSearchParams` from `expo-router`.
- Read the `registered` query param: `const { registered } = useLocalSearchParams<{ registered?: string }>()`.
- Above the existing `generalError` banner, render a success banner when `registered === "true"`:
  A green-tinted banner (bg-green-50, text-green-700) with rounded-xl styling matching the error banner pattern, displaying "Account created successfully! Please log in."
- Use the same spacing (mb-4) as the error banner.
  </action>
  <verify>
    npx tsc --noEmit --pretty 2>&1 | head -30
  </verify>
  <done>
After clicking "Create Account" with valid credentials, user is redirected to the sign-in page which shows a green success banner reading "Account created successfully! Please log in." The email field is empty and ready for the user to type their credentials.
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Sign-up page redirects to sign-in on success
- Sign-in page shows success banner when `?registered=true` is present
- Sign-in page works normally (no banner) when accessed directly
</verification>

<success_criteria>
- Successful email signup redirects to sign-in page
- Green success banner visible on sign-in page after redirect
- No regression in normal sign-in flow
</success_criteria>

<output>
After completion, create `.planning/quick/5-redirect-to-login-after-email-signup/5-SUMMARY.md`
</output>
