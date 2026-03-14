---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/home/AttentionFeed.tsx
  - components/expenses/BalanceSection.tsx
  - components/expenses/EmptyState.tsx
  - components/groceries/EmptyState.tsx
  - components/chores/EmptyState.tsx
  - app/(app)/chores/dashboard.tsx
  - app/(app)/chores/swap-request.tsx
  - app/(app)/expenses/member-history.tsx
  - app/(app)/groceries/trip-history.tsx
autonomous: true
requirements: [QUICK-3]

must_haves:
  truths:
    - "All 9 empty states show their corresponding illustration image instead of an Ionicons icon"
    - "Existing text, buttons, and interactive elements remain unchanged"
    - "Images are consistently sized and centered within each empty state"
  artifacts:
    - path: "components/home/AttentionFeed.tsx"
      provides: "Attention feed caught-up state with image"
      contains: "attention-feed-all-caught-up.png"
    - path: "components/expenses/BalanceSection.tsx"
      provides: "Balance settled state with image"
      contains: "balance-all-settled.png"
    - path: "components/expenses/EmptyState.tsx"
      provides: "Expenses empty state with image"
      contains: "expense-main-empty-state.png"
    - path: "components/groceries/EmptyState.tsx"
      provides: "Grocery empty state with image"
      contains: "grocery-empty-list.png"
    - path: "components/chores/EmptyState.tsx"
      provides: "Chores empty state with image"
      contains: "chore-main-empty-state.png"
    - path: "app/(app)/chores/dashboard.tsx"
      provides: "Chore dashboard stats empty with image"
      contains: "chore-dashboard-stats.png"
    - path: "app/(app)/chores/swap-request.tsx"
      provides: "Swap request empty with image"
      contains: "chore-swap-request.png"
    - path: "app/(app)/expenses/member-history.tsx"
      provides: "Member history empty with image"
      contains: "expense-member-history.png"
    - path: "app/(app)/groceries/trip-history.tsx"
      provides: "Trip history empty with image"
      contains: "grocery-trip-history.png"
  key_links: []
---

<objective>
Replace all 9 empty state icons with their corresponding illustration images from docs/empty-state-images/.

Purpose: Give each empty state a polished, custom illustration instead of generic Ionicons.
Output: 9 updated files, each showing an Image instead of an icon in their empty state.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/empty-state-images/ (9 PNG illustrations)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace icons with images in standalone component empty states (5 files)</name>
  <files>
    components/home/AttentionFeed.tsx
    components/expenses/BalanceSection.tsx
    components/expenses/EmptyState.tsx
    components/groceries/EmptyState.tsx
    components/chores/EmptyState.tsx
  </files>
  <action>
For each of these 5 component files, apply the same pattern:

1. Add `Image` to the `react-native` import (alongside existing View, Text, etc.)
2. Replace the Ionicons icon element AND its circular background wrapper View (if present) with an Image component
3. Remove `Ionicons` import and `colors` import IF they are no longer used elsewhere in the file. Check carefully before removing — some files use Ionicons or colors in other parts of the component.

Image component pattern (use consistently across all files):
```tsx
<Image
  source={require('@/docs/empty-state-images/FILENAME.png')}
  style={{ width: 140, height: 140 }}
  resizeMode="contain"
/>
```

File-specific mapping:

**components/home/AttentionFeed.tsx** (lines ~121-134):
- Image: `attention-feed-all-caught-up.png`
- Replace the `<Ionicons name="checkmark-circle" size={48} .../>` (no wrapper View around it)
- Keep the surrounding `<View className="items-center py-6">`, the "All caught up!" Text, and the subtitle Text
- KEEP the Ionicons import and colors import — they are likely used elsewhere in this component

**components/expenses/BalanceSection.tsx** (lines ~39-52):
- Image: `balance-all-settled.png`
- Replace the `<Ionicons name="checkmark-circle" size={48} .../>` (no wrapper View)
- Keep the "All settled up!" and subtitle Text elements
- Check if Ionicons/colors used elsewhere in this file before removing imports

**components/expenses/EmptyState.tsx** (lines ~14-21):
- Image: `expense-main-empty-state.png`
- Replace the entire wrapper `<View className="mb-4 h-20 w-20 ...">` containing the Ionicons icon
- Add `mb-4` to the Image's container or style to maintain spacing
- Keep "No expenses yet" text, subtitle, and the "Add Expense" Button
- Safe to remove Ionicons and colors imports (only used for the icon)

**components/groceries/EmptyState.tsx** (lines ~9-11):
- Image: `grocery-empty-list.png`
- Replace the entire wrapper `<View className="h-24 w-24 rounded-full bg-brand-light ...">` containing the Ionicons icon
- Add `mb-6` to the Image's container or style to maintain spacing
- Keep "Your grocery list is empty" text and subtitle
- Safe to remove Ionicons and colors imports (only used for the icon)

**components/chores/EmptyState.tsx** (lines ~33-35):
- Image: `chore-main-empty-state.png`
- Replace the entire wrapper `<View className="mb-4 h-20 w-20 ...">` containing the Ionicons icon
- Keep `mb-4` spacing before the text below
- Keep "No chores yet!" text, subtitle, suggested chores grid, and custom chore button — ALL of that stays
- Check if Ionicons/colors are used elsewhere in the file (the "add" icon on line ~72 uses Ionicons) — if so, KEEP the Ionicons import. Only remove if truly unused.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Visually check each empty state in the app to confirm images appear correctly</manual>
  </verify>
  <done>5 component files show illustration images instead of Ionicons in their empty states. All existing text, buttons, and interactive elements remain unchanged. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Replace icons with images in route-level empty states (4 files)</name>
  <files>
    app/(app)/chores/dashboard.tsx
    app/(app)/chores/swap-request.tsx
    app/(app)/expenses/member-history.tsx
    app/(app)/groceries/trip-history.tsx
  </files>
  <action>
For each of these 4 route files, apply the same pattern:

1. Add `Image` to the `react-native` import
2. Replace the Ionicons icon element AND its circular background wrapper View (if present) with the Image component
3. Only remove Ionicons/colors imports if they are not used elsewhere in the file. These are large route files — they almost certainly use Ionicons and colors in other parts. Check before removing.

Image component pattern (same as Task 1):
```tsx
<Image
  source={require('@/docs/empty-state-images/FILENAME.png')}
  style={{ width: 140, height: 140 }}
  resizeMode="contain"
/>
```

File-specific mapping:

**app/(app)/chores/dashboard.tsx** (lines ~366-379):
- Image: `chore-dashboard-stats.png`
- Replace the wrapper `<View className="mb-3 h-14 w-14 ...">` containing `<Ionicons name="bar-chart-outline" .../>` with the Image
- Add `mb-3` to Image style or wrap in a View with `mb-3` for spacing
- Keep "No chores completed this {periodLabel}" text and subtitle
- DO NOT remove Ionicons or colors — used extensively elsewhere in this file

**app/(app)/chores/swap-request.tsx** (lines ~224-238):
- Image: `chore-swap-request.png`
- Replace the wrapper `<View className="mb-4 h-16 w-16 ...">` containing `<Ionicons name="swap-horizontal" .../>` with the Image
- Add `mb-4` to Image style or wrap for spacing
- Keep "No swap requests" text and subtitle
- Check if Ionicons/colors used elsewhere before removing

**app/(app)/expenses/member-history.tsx** (lines ~309-314):
- Image: `expense-member-history.png`
- This one currently has NO icon — only text "No expenses with {memberName} yet"
- Add the Image ABOVE the existing Text, inside the existing `<View className="items-center justify-center py-20">`
- Add `mb-4` spacing between image and text
- Do NOT remove any existing imports

**app/(app)/groceries/trip-history.tsx** (lines ~114-128):
- Image: `grocery-trip-history.png`
- Replace the wrapper `<View className="mb-6 h-24 w-24 ...">` containing `<Ionicons name="time-outline" .../>` with the Image
- Add `mb-6` to Image style or wrap for spacing
- Keep "No completed trips yet" text and subtitle
- Check if Ionicons/colors used elsewhere before removing
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
    <manual>Visually check each route-level empty state in the app</manual>
  </verify>
  <done>4 route files show illustration images instead of Ionicons (or in addition to text for member-history) in their empty states. All existing text and interactive elements remain unchanged. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- All 9 files contain a `require('@/docs/empty-state-images/...')` call
- No empty state still renders an Ionicons icon for its primary illustration
- Existing text, buttons, suggested chores grid, and interactive elements are unchanged
</verification>

<success_criteria>
All 9 empty states across the app display their corresponding PNG illustration from docs/empty-state-images/ instead of Ionicons icons, with consistent 140x140 sizing and contain resize mode. TypeScript compiles cleanly.
</success_criteria>

<output>
After completion, create `.planning/quick/3-update-all-empty-states-with-images-from/3-SUMMARY.md`
</output>
