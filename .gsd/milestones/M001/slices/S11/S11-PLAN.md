# S11: Visual Foundation

**Goal:** Update the two token source-of-truth files (colors.
**Demo:** Update the two token source-of-truth files (colors.

## Must-Haves


## Tasks

- [x] **T01: 11-visual-foundation 01** `est:1min`
  - Update the two token source-of-truth files (colors.ts and tailwind.config.js) to the wintergreen palette, add the shared AVATAR_COLORS export, and update the Card and Avatar components to match the new visual identity.

Purpose: This is the foundation for the entire visual migration. ~90% of the app's color usage is via token references (NativeWind classes or colors.* imports), so updating these 2 token files propagates changes app-wide. The Card and Avatar components are shared UI primitives that cascade to every screen.

Output: Updated token files, redesigned Card component, earth-tone Avatar gradients, exported AVATAR_COLORS constant.
- [x] **T02: 11-visual-foundation 02** `est:3min`
  - Replace all hardcoded emerald hex values and local AVATAR_COLORS duplicates across the entire app, consolidating to shared imports. Then audit and restyle all non-Card containers to use outline-only styling, ensuring no container has both shadow and outline.

Purpose: Plan 01 updated the token definitions and shared components. This plan propagates those changes to the ~17 hardcoded hex occurrences and ~11 non-Card containers that bypass the token system, ensuring visual consistency throughout the app.

Output: Zero hardcoded emerald hex values, all AVATAR_COLORS arrays consolidated, all containers using consistent outline-only styling.
- [x] **T03: 11-visual-foundation 03** `est:2min`
  - Update all system chrome (tab bar, headers, status bar, splash screen) to match the cream background with wintergreen accents, then verify the entire phase visually on device.

Purpose: System chrome is the "frame" around the app content. Even if all content uses cream and wintergreen, a mismatched tab bar, header, or status bar creates a visible seam. This plan ensures the entire visual experience is seamless from splash to every screen.

Output: Unified cream system chrome, dark status bar content, wintergreen tab active states, visual verification checkpoint.

## Files Likely Touched

- `lib/theme/colors.ts`
- `tailwind.config.js`
- `components/ui/Card.tsx`
- `components/ui/Avatar.tsx`
- `app/(app)/expenses/settle.tsx`
- `app/(app)/expenses/add.tsx`
- `app/(app)/expenses/[id].tsx`
- `app/(app)/chores/swap-request.tsx`
- `app/(app)/chores/dashboard.tsx`
- `app/(app)/chores/add.tsx`
- `app/(app)/groceries/complete-trip.tsx`
- `app/(app)/settings/members.tsx`
- `app/(auth)/welcome.tsx`
- `components/ui/Toggle.tsx`
- `components/chores/ChoreRow.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/notifications.tsx`
- `app/(app)/settings/modules.tsx`
- `app/(app)/groceries/trip-history.tsx`
- `components/home/CalendarSection.tsx`
- `app/(app)/groceries.tsx`
- `app/(app)/chores/add.tsx`
- `app/_layout.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app.json`
