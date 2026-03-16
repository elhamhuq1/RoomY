---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(auth)/welcome.tsx
  - app/(auth)/sign-in.tsx
  - app/(auth)/sign-up.tsx
  - app/(auth)/forgot-password.tsx
  - app/(onboarding)/profile.tsx
  - app/(onboarding)/join-household.tsx
  - app/(onboarding)/member-welcome.tsx
  - app/(onboarding)/household-choice.tsx
  - app/(onboarding)/module-quiz.tsx
  - app/(onboarding)/create-household.tsx
  - app/(app)/expenses/add.tsx
  - app/(app)/expenses/settle.tsx
  - app/(app)/expenses/[id].tsx
  - app/(app)/expenses/member-history.tsx
  - app/(app)/(tabs)/expenses.tsx
  - app/(app)/(tabs)/groceries.tsx
  - app/(app)/(tabs)/chores.tsx
  - app/(app)/(tabs)/index.tsx
  - app/(app)/chores/add.tsx
  - app/(app)/chores/dashboard.tsx
  - app/(app)/chores/dispute.tsx
  - app/(app)/chores/swap-request.tsx
  - app/(app)/groceries/complete-trip.tsx
  - app/(app)/groceries/trip-history.tsx
  - app/(app)/settings/index.tsx
  - app/(app)/settings/profile.tsx
  - app/(app)/settings/members.tsx
  - app/(app)/settings/notifications.tsx
  - app/(app)/settings/modules.tsx
  - components/ui/Button.tsx
  - components/ui/Badge.tsx
  - components/ui/Toggle.tsx
  - components/ui/StepProgressBar.tsx
  - components/home/CalendarSection.tsx
  - components/home/MembersCard.tsx
  - components/home/BalanceSummaryCard.tsx
  - components/home/WeeklyTimeline.tsx
  - components/home/AttentionFeed.tsx
  - components/home/GreetingHeader.tsx
  - components/expenses/BalanceSection.tsx
  - components/expenses/BalanceMemberRow.tsx
  - components/expenses/SettlementRow.tsx
  - components/expenses/ExpenseRow.tsx
  - components/expenses/RoommateSection.tsx
  - components/expenses/HistorySection.tsx
  - components/expenses/EmptyState.tsx
  - components/groceries/EmptyState.tsx
  - components/groceries/GroceryItemRow.tsx
  - components/groceries/SectionHeader.tsx
  - components/groceries/QuickAddInput.tsx
  - components/chores/StatsRow.tsx
  - components/chores/EmptyState.tsx
  - components/chores/ChoreRow.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Every visible Text element in the app renders in Space Grotesk, not system font"
    - "Headings use SpaceGrotesk_700Bold or SpaceGrotesk_600SemiBold"
    - "Body text uses SpaceGrotesk_400Regular"
    - "Medium-weight labels use SpaceGrotesk_500Medium"
  artifacts:
    - path: "app/(auth)/welcome.tsx"
      provides: "Welcome screen with Space Grotesk on all Text"
    - path: "app/(onboarding)/profile.tsx"
      provides: "Profile setup with Space Grotesk on all Text"
    - path: "components/ui/Button.tsx"
      provides: "Button component with font-sans font-semibold"
  key_links:
    - from: "tailwind.config.js"
      to: "all Text components"
      via: "font-sans, font-medium, font-heading-semi, font-heading classes"
      pattern: "font-sans|font-heading"
---

<objective>
Apply Space Grotesk font consistently across the entire app. Currently, font families are loaded and configured in tailwind but most Text components don't have explicit font-family classes, causing them to render in the system font.

Purpose: Visual consistency -- the app should use Space Grotesk everywhere, not a mix of Space Grotesk and system font.
Output: All Text components across auth, onboarding, app screens, and shared components render in Space Grotesk.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tailwind.config.js
@global.css
@app/_layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Space Grotesk font-family to auth and onboarding screens</name>
  <files>
    app/(auth)/welcome.tsx
    app/(auth)/sign-in.tsx
    app/(auth)/sign-up.tsx
    app/(auth)/forgot-password.tsx
    app/(onboarding)/profile.tsx
    app/(onboarding)/join-household.tsx
    app/(onboarding)/member-welcome.tsx
    app/(onboarding)/household-choice.tsx
    app/(onboarding)/module-quiz.tsx
    app/(onboarding)/create-household.tsx
  </files>
  <action>
These screens heavily use inline `style` objects instead of className for Text. Apply Space Grotesk by adding fontFamily to every Text's style:

**Font family mapping by weight:**
- `fontWeight: '400'` or no fontWeight -> add `fontFamily: 'SpaceGrotesk_400Regular'`
- `fontWeight: '500'` -> add `fontFamily: 'SpaceGrotesk_500Medium'`
- `fontWeight: '600'` -> add `fontFamily: 'SpaceGrotesk_600SemiBold'`
- `fontWeight: '700'` or `fontWeight: 'bold'` -> add `fontFamily: 'SpaceGrotesk_700Bold'`

For Text elements using className instead of style (e.g. error messages), add the appropriate font class:
- Body text / no weight class -> add `font-sans`
- `font-bold` or `font-semibold` used as weight -> also add `font-heading` or `font-heading-semi` respectively (these set fontFamily, unlike the weight-only utilities)

IMPORTANT: When adding fontFamily, REMOVE the corresponding fontWeight property. In React Native, setting both fontFamily (to a specific weight variant like SpaceGrotesk_700Bold) and fontWeight can cause conflicts. The weight is already embedded in the font variant name.

For TextInput elements: also add fontFamily: 'SpaceGrotesk_400Regular' to their style (or `font-sans` to className if using NativeWind classes).
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit 2>&1 | head -30</automated>
    <manual>Open the app, navigate through welcome -> sign-up -> sign-in screens and all onboarding screens. All text should be in Space Grotesk (rounder, wider letterforms than system font).</manual>
  </verify>
  <done>All Text elements in auth (welcome, sign-in, sign-up, forgot-password) and onboarding (profile, household-choice, create-household, join-household, module-quiz, member-welcome) screens have explicit Space Grotesk fontFamily set, with no fontWeight conflicts.</done>
</task>

<task type="auto">
  <name>Task 2: Add Space Grotesk font-family to app screens and shared components</name>
  <files>
    app/(app)/expenses/add.tsx
    app/(app)/expenses/settle.tsx
    app/(app)/expenses/[id].tsx
    app/(app)/expenses/member-history.tsx
    app/(app)/(tabs)/expenses.tsx
    app/(app)/(tabs)/groceries.tsx
    app/(app)/(tabs)/chores.tsx
    app/(app)/(tabs)/index.tsx
    app/(app)/chores/add.tsx
    app/(app)/chores/dashboard.tsx
    app/(app)/chores/dispute.tsx
    app/(app)/chores/swap-request.tsx
    app/(app)/groceries/complete-trip.tsx
    app/(app)/groceries/trip-history.tsx
    app/(app)/settings/index.tsx
    app/(app)/settings/profile.tsx
    app/(app)/settings/members.tsx
    app/(app)/settings/notifications.tsx
    app/(app)/settings/modules.tsx
    components/ui/Button.tsx
    components/ui/Badge.tsx
    components/ui/Toggle.tsx
    components/ui/StepProgressBar.tsx
    components/home/CalendarSection.tsx
    components/home/MembersCard.tsx
    components/home/BalanceSummaryCard.tsx
    components/home/WeeklyTimeline.tsx
    components/home/AttentionFeed.tsx
    components/home/GreetingHeader.tsx
    components/expenses/BalanceSection.tsx
    components/expenses/BalanceMemberRow.tsx
    components/expenses/SettlementRow.tsx
    components/expenses/ExpenseRow.tsx
    components/expenses/RoommateSection.tsx
    components/expenses/HistorySection.tsx
    components/expenses/EmptyState.tsx
    components/groceries/EmptyState.tsx
    components/groceries/GroceryItemRow.tsx
    components/groceries/SectionHeader.tsx
    components/groceries/QuickAddInput.tsx
    components/chores/StatsRow.tsx
    components/chores/EmptyState.tsx
    components/chores/ChoreRow.tsx
  </files>
  <action>
These files use NativeWind className for Text styling. The problem: `font-medium`, `font-semibold`, `font-bold` are Tailwind WEIGHT utilities (they set fontWeight, NOT fontFamily). Only `font-sans`, `font-heading-semi`, and `font-heading` set fontFamily to Space Grotesk variants.

For every Text component in these files, add the appropriate font-family class:

**Class mapping:**
- Text with NO font class or only `font-medium` -> add `font-sans` (sets SpaceGrotesk_400Regular). Keep `font-medium` if present since it will need the weight still, BUT note that `font-sans font-medium` sets family to Regular but weight to 500 which conflicts. Instead: replace `font-medium` with `font-medium` (the custom family class that maps to SpaceGrotesk_500Medium from tailwind config). WAIT -- `font-medium` in the tailwind config IS the family class for 500 weight. So `font-medium` already maps to `fontFamily: SpaceGrotesk_500Medium`. This is actually correct as-is because the tailwind config overrides font-medium to be a fontFamily utility, not the default fontWeight utility.

CORRECTION on class mapping -- re-read tailwind.config.js:
```
fontFamily: {
  sans: ["SpaceGrotesk_400Regular"],       // -> className="font-sans"
  medium: ["SpaceGrotesk_500Medium"],      // -> className="font-medium"
  "heading-semi": ["SpaceGrotesk_600SemiBold"], // -> className="font-heading-semi"
  heading: ["SpaceGrotesk_700Bold"],       // -> className="font-heading"
}
```

In NativeWind, `font-medium` from fontFamily config generates `fontFamily: SpaceGrotesk_500Medium`. This OVERRIDES the default Tailwind `font-medium` (which would be `fontWeight: 500`). So `font-medium` in className actually DOES set the right font family already.

Similarly `font-bold` in default Tailwind = `fontWeight: 700` (NOT fontFamily). There is no `bold` key in fontFamily config, so `font-bold` does NOT set Space Grotesk.

**Actual fix needed per Text element:**
1. Text with `font-heading` or `font-heading-semi` -> ALREADY CORRECT, no change needed
2. Text with `font-medium` -> ALREADY CORRECT (config overrides to fontFamily), no change needed
3. Text with `font-semibold` (no fontFamily equivalent in config) -> replace with `font-heading-semi` (sets fontFamily to SemiBold variant)
4. Text with `font-bold` (no fontFamily equivalent in config) -> replace with `font-heading` (sets fontFamily to Bold variant)
5. Text with NO font class at all -> add `font-sans` (Regular weight body text)
6. Text with only size/color classes but no font-family class -> add `font-sans`

For TextInput components: add `font-sans` to className (or `fontFamily: 'SpaceGrotesk_400Regular'` to style if inline-styled).

IMPORTANT: For components/ui/Button.tsx specifically, the Text has `font-semibold` -- replace with `font-heading-semi` to get SpaceGrotesk_600SemiBold.

Go through EVERY file listed, read it, and fix ALL Text elements. Do not skip any file.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit 2>&1 | head -30</automated>
    <manual>Open the app, navigate through home, expenses, groceries, chores, and settings tabs. All text should consistently use Space Grotesk. Compare with system font (Space Grotesk has distinctive wider, rounder letterforms).</manual>
  </verify>
  <done>All Text and TextInput elements across app screens and shared components have explicit Space Grotesk font-family classes. No Text element relies on system font fallback. font-semibold replaced with font-heading-semi, font-bold replaced with font-heading, bare Text elements get font-sans.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Grep audit -- no Text elements without font-family class:
   - `grep -rn '<Text' app/ components/ | grep -v 'font-sans\|font-medium\|font-heading\|fontFamily' | head -20` should return zero matches (excluding non-visible Text like error boundary text)
3. Visual check: app renders all text in Space Grotesk across auth, onboarding, and main app screens
</verification>

<success_criteria>
- Every Text component in the app has an explicit Space Grotesk font-family (via className or inline fontFamily)
- No screen falls back to system font for any visible text
- TypeScript compiles cleanly
- No fontWeight + fontFamily conflicts in inline styles
</success_criteria>

<output>
After completion, create `.planning/quick/6-apply-space-grotesk-font-to-all-onboardi/6-SUMMARY.md`
</output>
