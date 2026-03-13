---
type: quick
task_id: 2
title: Change app font to SF Pro Rounded for bold headings
files_modified:
  - tailwind.config.js
  - components/home/GreetingHeader.tsx
  - components/home/BalanceSummaryCard.tsx
  - components/home/MembersCard.tsx
  - components/home/WeeklyTimeline.tsx
  - components/home/AttentionFeed.tsx
  - components/chores/StatsRow.tsx
  - components/chores/ChoreRow.tsx
  - components/chores/EmptyState.tsx
  - components/groceries/EmptyState.tsx
  - components/expenses/BalanceSection.tsx
  - components/expenses/BalanceMemberRow.tsx
  - components/expenses/RoommateSection.tsx
  - components/expenses/EmptyState.tsx
  - components/expenses/ExpenseRow.tsx
  - components/expenses/SettlementRow.tsx
autonomous: true

must_haves:
  truths:
    - "Bold heading text renders in SF Pro Rounded on iOS"
    - "Bold heading text renders in system default (Roboto) on Android"
    - "Body text remains the default system font on both platforms"
    - "No bundled font files -- SF Pro Rounded is a system font on iOS 13+"
  artifacts:
    - path: "tailwind.config.js"
      provides: "font-heading utility class via fontFamily.heading"
      contains: "platformSelect"
    - path: "components/home/GreetingHeader.tsx"
      provides: "Page title with font-heading class"
      contains: "font-heading"
  key_links:
    - from: "tailwind.config.js"
      to: "all heading components"
      via: "NativeWind font-heading class"
      pattern: "font-heading"
---

<objective>
Apply SF Pro Rounded as the heading font on iOS for all bold/semibold heading text, with system default fallback on Android.

Purpose: SF Pro Rounded gives headings a friendlier, more approachable feel that matches the RoomY brand personality. Body text stays in the default system font for readability.

Output: Updated tailwind.config.js with heading font family + all heading components using the new font-heading class.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tailwind.config.js
@components/home/GreetingHeader.tsx
@components/home/BalanceSummaryCard.tsx
@components/home/MembersCard.tsx
@components/home/WeeklyTimeline.tsx
@components/home/AttentionFeed.tsx
@components/chores/StatsRow.tsx
@components/chores/ChoreRow.tsx
@components/chores/EmptyState.tsx
@components/groceries/EmptyState.tsx
@components/expenses/BalanceSection.tsx
@components/expenses/BalanceMemberRow.tsx
@components/expenses/RoommateSection.tsx
@components/expenses/EmptyState.tsx
@components/expenses/ExpenseRow.tsx
@components/expenses/SettlementRow.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add heading font family to Tailwind config using NativeWind platformSelect</name>
  <files>tailwind.config.js</files>
  <action>
Import `platformSelect` from `nativewind/theme` at the top of tailwind.config.js:
```
const { platformSelect } = require("nativewind/theme");
```

Add a `fontFamily` section inside `theme.extend` with a `heading` key:
```
fontFamily: {
  heading: platformSelect({
    ios: "SF Pro Rounded",
    default: "system font",
  }),
},
```

This creates a `font-heading` utility class that resolves to "SF Pro Rounded" on iOS and falls back to the system font on Android/web. NativeWind's own preset uses this exact same `platformSelect` pattern for font-sans/serif/mono.

Do NOT modify fontSize entries -- they already include fontWeight and work independently.
Do NOT add any font loading code -- SF Pro Rounded is a system font on iOS 13+.
  </action>
  <verify>
    <automated>npx tailwindcss --content "components/**/*.tsx" --config tailwind.config.js 2>&1 | head -5</automated>
    <manual>Confirm tailwind.config.js has fontFamily.heading with platformSelect</manual>
  </verify>
  <done>tailwind.config.js contains fontFamily.heading using platformSelect, producing font-heading class that maps to "SF Pro Rounded" on iOS and system default elsewhere.</done>
</task>

<task type="auto">
  <name>Task 2: Apply font-heading class to all heading text elements across components</name>
  <files>
    components/home/GreetingHeader.tsx
    components/home/BalanceSummaryCard.tsx
    components/home/MembersCard.tsx
    components/home/WeeklyTimeline.tsx
    components/home/AttentionFeed.tsx
    components/chores/StatsRow.tsx
    components/chores/ChoreRow.tsx
    components/chores/EmptyState.tsx
    components/groceries/EmptyState.tsx
    components/expenses/BalanceSection.tsx
    components/expenses/BalanceMemberRow.tsx
    components/expenses/RoommateSection.tsx
    components/expenses/EmptyState.tsx
    components/expenses/ExpenseRow.tsx
    components/expenses/SettlementRow.tsx
  </files>
  <action>
Add `font-heading` to the className of every Text element that uses one of the design system heading text sizes: `text-page-title`, `text-key-number`, `text-section-heading`, or `text-card-title`.

Here is the complete list of Text elements to update (add `font-heading` to existing className):

**components/home/GreetingHeader.tsx:**
- Line 19: `text-page-title` Text -- add `font-heading`

**components/home/BalanceSummaryCard.tsx:**
- Line 65: `text-key-number` Text -- add `font-heading`

**components/home/MembersCard.tsx:**
- Line 81: `text-section-heading` Text -- add `font-heading`

**components/home/WeeklyTimeline.tsx:**
- Line 69: `text-section-heading` Text -- add `font-heading`
- Line 125: `text-card-title` Text -- add `font-heading`

**components/home/AttentionFeed.tsx:**
- Line 117: `text-section-heading` Text -- add `font-heading`
- Line 128: `text-section-heading` Text -- add `font-heading`
- Line 146: `text-card-title` Text -- add `font-heading`

**components/chores/StatsRow.tsx:**
- Line 20: `text-key-number` Text -- add `font-heading`
- Line 26: `text-key-number` Text -- add `font-heading`
- Line 33: `text-key-number` Text -- add `font-heading`

**components/chores/ChoreRow.tsx:**
- Line 131: `text-card-title` Text -- add `font-heading`

**components/chores/EmptyState.tsx:**
- Line 36: `text-section-heading` Text -- add `font-heading`

**components/groceries/EmptyState.tsx:**
- Line 12: `text-section-heading` Text -- add `font-heading`

**components/expenses/BalanceSection.tsx:**
- Line 35: `text-section-heading` Text -- add `font-heading`

**components/expenses/BalanceMemberRow.tsx:**
- Line 32: `text-card-title` Text -- add `font-heading`

**components/expenses/RoommateSection.tsx:**
- Line 21: `text-section-heading` Text -- add `font-heading`
- Line 37: `text-card-title` Text -- add `font-heading`

**components/expenses/EmptyState.tsx:**
- Line 22: `text-section-heading` Text -- add `font-heading`

**components/expenses/ExpenseRow.tsx:**
- Line 61: `text-card-title` Text -- add `font-heading`

**components/expenses/SettlementRow.tsx:**
- Line 35: `text-card-title` Text -- add `font-heading`

Pattern: Insert `font-heading` right after the text size class. For example:
- Before: `className="text-section-heading text-neutral-text mb-3"`
- After: `className="text-section-heading font-heading text-neutral-text mb-3"`

Do NOT add font-heading to body text, metadata, badge, or overline text sizes.
Do NOT add font-heading to Text elements that only use font-bold/font-semibold without a heading text size class (e.g., button labels, inline bold text).
  </action>
  <verify>
    <automated>grep -r "font-heading" components/ --include="*.tsx" | wc -l</automated>
    <manual>Count should be approximately 21 occurrences across 15 files. Run the app on iOS simulator to visually confirm headings use the rounded variant.</manual>
  </verify>
  <done>All heading text elements (text-page-title, text-key-number, text-section-heading, text-card-title) across all component files include the font-heading class. Body and metadata text remain unchanged.</done>
</task>

</tasks>

<verification>
1. `grep -r "font-heading" components/ --include="*.tsx" | wc -l` returns ~21 matches
2. `grep "platformSelect" tailwind.config.js` returns a match
3. `grep "fontFamily" tailwind.config.js` returns a match
4. `npx expo start` launches without errors (no bundled fonts needed, no config plugin changes)
5. On iOS: heading text visually renders in SF Pro Rounded (slightly rounder letterforms than SF Pro)
6. On Android: heading text renders in system default Roboto (no change)
</verification>

<success_criteria>
- tailwind.config.js defines fontFamily.heading using platformSelect with "SF Pro Rounded" for iOS
- All 21 heading Text elements across 15 component files include font-heading class
- No font files bundled, no expo font loading, no app.json changes
- Body text (text-body, text-metadata, text-badge, text-overline) unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/2-change-app-font-to-sf-pro-rounded-for-bo/2-SUMMARY.md`
</output>
