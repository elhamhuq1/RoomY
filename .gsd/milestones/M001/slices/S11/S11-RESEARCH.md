# Phase 11: Visual Foundation - Research

**Researched:** 2026-03-13
**Domain:** Design token migration, NativeWind/TailwindCSS theming, React Native system chrome
**Confidence:** HIGH

## Summary

This phase is a pure visual identity migration with no new features. The codebase has two parallel color systems: (1) `lib/theme/colors.ts` for inline style references, and (2) `tailwind.config.js` brand tokens for NativeWind class usage. Both must be updated simultaneously. The current emerald palette (`#10B981` / `#059669` / `#D1FAE5`) appears in 17 hardcoded locations across `app/`, `components/`, and `lib/`, plus extensively via TailwindCSS class names like `bg-brand`, `text-brand-dark`, `bg-brand-light`, etc.

The Card component currently uses `bg-white`, `shadow`, `border border-neutral-border`, and Android `elevation: 2`. Two special cards (gradient balance card in `BalanceSummaryCard.tsx` and dark invite code card in `create-household.tsx`) use `LinearGradient` with dark slate colors and must be preserved. The `AVATAR_COLORS` array is duplicated across 8 files, and the Avatar component has its own `GRADIENT_PAIRS` array.

**Primary recommendation:** Update the two token files first (`colors.ts` and `tailwind.config.js`), which will propagate changes to ~90% of the app via class names and `colors.*` references. Then do targeted find-and-replace for the 17 hardcoded hex values, update Avatar gradients, consolidate AVATAR_COLORS, restyle Card.tsx, and update system chrome.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 5-step scale: #1B4332 (deep forest/pressed) -> #2D6A4F (primary) -> #52796F (mid-tone/secondary) -> #D8E8DC (sage-green wash/tint) -> #F5F0EB (cream/background)
- Deep forest (#1B4332) for pressed states and hover -- premium feel, high contrast
- Mid-tone (#52796F) for secondary buttons, selected list items, subtle active states
- Sage-green wash (#D8E8DC) for light badge backgrounds, subtle highlights -- muted, desaturated, blends with cream
- Text on wintergreen buttons/badges: pure white (#FFFFFF) -- maximum contrast, crisp
- 1px border weight -- standard, clean separation
- Warm gray outline color (#D6D0C8) -- warm undertone complements cream, feels integrated not clinical
- Moderately rounded corners (12-16px) -- friendly, modern, iOS native feel
- Transparent background (cream shows through) -- cards are outlined zones on cream, no layering, no shadows
- Earth tone mix avatar gradients: wintergreen, terracotta, amber, slate, plum, ocean, clay, sage -- each member clearly distinct
- Soft gradients -- gentle transitions between close tones, elegant and understated
- 8 gradient pairs total -- matches current count, wraps around if more
- Default/fallback: wintergreen gradient -- brand-consistent for unassigned users
- Tab bar: cream background (#F5F0EB) -- seamless with page, no visual break
- Active tab: wintergreen (#2D6A4F) icon and label, inactive tabs in warm gray
- Headers: cream background with dark text -- seamless with content
- Status bar: dark content (dark text/icons) on cream -- standard light theme treatment
- Goal: no visible color seam anywhere between content and system chrome

### Claude's Discretion
- Exact hex values for each earth-tone gradient pair (within the soft/muted direction)
- Specific border radius value within 12-16px range
- Loading state treatments during transition
- Exact warm gray inactive tab color
- How to handle the gradient balance card and dark invite code card special cases (per CARD-02)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | App background is cream (#F5F0EB) on all post-login screens | Update `neutral.bg` in both token files; affects ~50 `bg-neutral-bg` class usages and 14 `headerStyle` references in `_layout.tsx` |
| VIS-02 | Brand green shifted to wintergreen (#2D6A4F) across entire app | Update `brand.DEFAULT` in both token files; propagates via `bg-brand`, `text-brand`, `border-brand` classes and `colors.brand.DEFAULT` references |
| VIS-03 | All hardcoded emerald hex values replaced | 17 occurrences: 8 AVATAR_COLORS arrays, 3 in ChoreRow.tsx, 3 in welcome.tsx, 1 in Toggle.tsx, 1 in Avatar.tsx GRADIENT_PAIRS, 1 in colors.ts |
| VIS-04 | Duplicated AVATAR_COLORS consolidated into shared import | 8 files each define identical `const AVATAR_COLORS = [...]`; extract to `lib/theme/colors.ts` or new shared file |
| VIS-05 | Avatar gradient pairs updated to wintergreen palette | Replace 8 `GRADIENT_PAIRS` entries in `Avatar.tsx` with earth-tone mix per user decision |
| VIS-06 | System chrome matches cream background with no visible seams | Update tab bar background, header backgrounds, StatusBar style, and `app.json` splash background |
| CARD-01 | Card component uses transparent bg with gray outline, no shadow | Replace `bg-white shadow` with `bg-transparent border border-[#D6D0C8]`, remove Android `elevation` |
| CARD-02 | Gradient balance card and dark invite code card retain distinctive styling | Both use `LinearGradient` with `['#1E293B', '#0F172A']` -- they already don't use the Card component, so no changes needed |
| CARD-03 | No card displays both shadow and outline simultaneously | After Card.tsx change, audit remaining `bg-white shadow-sm` containers in settings, expenses, trip-history |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NativeWind | v4 (TW3) | Utility-first styling via TailwindCSS classes in React Native | Already in project; `tailwind.config.js` is the single source of truth for class-based tokens |
| tailwind.config.js | TW3 | Design token definitions (colors, borderRadius, fontSize, shadows) | Centralized; changing `brand.DEFAULT` propagates to all `bg-brand`, `text-brand`, `border-brand` usages |
| lib/theme/colors.ts | N/A | Inline style color constants for non-classname usage | Used by ~40 inline style references (`colors.brand.DEFAULT`, `colors.neutral.bg`, etc.) |
| expo-linear-gradient | SDK 54 | Gradient backgrounds for avatars and special cards | Already in project for Avatar and BalanceSummaryCard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-status-bar | SDK 54 | Control status bar appearance (light/dark content) | Add `<StatusBar style="dark" />` in root layout for cream background |

## Architecture Patterns

### Token Architecture (Two-File System)

The project has two parallel color definition files that MUST stay in sync:

```
lib/theme/colors.ts          # For inline styles: colors.brand.DEFAULT
tailwind.config.js            # For NativeWind classes: bg-brand, text-brand-dark
```

**Pattern:** Update both files atomically. The tailwind config defines `brand.DEFAULT`, `brand.dark`, `brand.light` which NativeWind resolves to utility classes. The `colors.ts` file is imported directly for `style={{}}` props.

**Current brand token mapping:**
```
brand.DEFAULT  #10B981 -> #2D6A4F  (primary wintergreen)
brand.dark     #059669 -> #1B4332  (deep forest / pressed)
brand.light    #D1FAE5 -> #D8E8DC  (sage-green wash / tint)
neutral.bg     #F8FAFC -> #F5F0EB  (cream background)
```

**New tokens to add (not currently in the system):**
```
brand.mid      (new)   #52796F  (mid-tone / secondary)
neutral.border #E2E8F0 -> #D6D0C8  (warm gray card outline)
```

### Shared Color Constants Pattern

Currently 8 files duplicate `AVATAR_COLORS`. The consolidation pattern:

```typescript
// lib/theme/colors.ts (add export)
export const AVATAR_COLORS = [
  '#2D6A4F', '#C17F59', '#D4A24E', '#5A6872',
  '#7B5E7B', '#3D7A8A', '#A0705A', '#8FA38B',
] as const;
```

Then each consumer file changes from:
```typescript
const AVATAR_COLORS = ['#10B981', ...]; // local duplicate
```
to:
```typescript
import { AVATAR_COLORS } from '@/lib/theme/colors';
```

### Card Redesign Pattern

**Current Card.tsx:**
```typescript
<View
  className={`bg-white rounded-card border border-neutral-border shadow p-4 ${className}`}
  style={Platform.OS === 'android' ? { elevation: 2 } : undefined}
>
```

**Target Card.tsx:**
```typescript
<View
  className={`bg-transparent rounded-card border border-neutral-border p-4 ${className}`}
>
```

Key changes:
- `bg-white` -> `bg-transparent` (cream shows through)
- Remove `shadow` class
- Remove Android `elevation` style entirely
- `border-neutral-border` stays but its color changes via token update to `#D6D0C8`

### Non-Card bg-white Containers

Many screens use `bg-white shadow-sm` or `bg-white` for containers that are not using the `<Card>` component. These need individual audit:

| Location | Current Pattern | Action |
|----------|----------------|--------|
| `expenses/settle.tsx` | `rounded-2xl bg-white p-6 shadow-sm` | Change to `rounded-card bg-transparent border border-neutral-border p-6` |
| `expenses/[id].tsx` | `rounded-2xl bg-white p-6 shadow-sm` | Same |
| `settings/index.tsx` | `rounded-2xl bg-white p-5 shadow-sm` | Same |
| `settings/notifications.tsx` | `rounded-2xl bg-white shadow-sm` | Same |
| `settings/members.tsx` | `rounded-2xl bg-white shadow-sm` | Same |
| `chores/dashboard.tsx` | `rounded-xl bg-white px-6 py-8` | Change to transparent + outline |
| `trip-history.tsx` | `rounded-xl bg-white p-4 shadow-sm` | Same |
| `groceries.tsx` bottom bar | `border-t border-neutral-border bg-white` | Change to `bg-[#F5F0EB]` (cream) for seamlessness |
| `chores.tsx` bottom sheets | `rounded-t-3xl bg-white` | Keep bg-white for modal sheets (overlay on cream) |
| `chores/add.tsx` bottom bar | `border-t border-gray-100 bg-white` | Change to cream |
| `modules.tsx` module cards | `bg-white p-5 shadow-sm` | Change to transparent + outline |

**Important exception:** Input fields (TextInput) that use `bg-white` with focused border states should KEEP `bg-white` -- they need visual distinction from the cream background to indicate interactivity.

**Important exception:** Bottom sheets / modals that overlay content should keep `bg-white` since they need visual separation from the cream surface beneath.

### System Chrome Pattern

**Tab bar** (in `app/(app)/(tabs)/_layout.tsx`):
```typescript
tabBarStyle: {
  backgroundColor: '#F5F0EB',   // was colors.white
  borderTopColor: '#D6D0C8',    // was colors.neutral.border (will auto-update)
  // ... rest unchanged
},
tabBarActiveTintColor: colors.brand.DEFAULT,  // auto-updates to #2D6A4F
tabBarInactiveTintColor: '#9C9590',           // warm gray (Claude's discretion)
```

**Headers** (in `app/(app)/_layout.tsx`):
All 14 `headerStyle` entries use `colors.neutral.bg` -- these will auto-update when `neutral.bg` changes to `#F5F0EB`.

**Tab bar header** (in `app/(app)/(tabs)/_layout.tsx`):
Currently `backgroundColor: colors.white` -- change to `colors.neutral.bg` so it auto-tracks.

**Status bar:** Currently no StatusBar component in the app. Add `<StatusBar style="dark" />` from `expo-status-bar` in root layout.

**Root layout loading screens** (`app/_layout.tsx`):
- Line 78: `bg-neutral-bg` class -- auto-updates
- Line 109: Hardcoded `backgroundColor: "#F8FAFC"` -- change to `colors.neutral.bg` reference

### Anti-Patterns to Avoid
- **Partial token update:** Changing `tailwind.config.js` but not `colors.ts` (or vice versa) creates visual inconsistency. Always update both atomically.
- **Replacing class names instead of token values:** Don't grep-replace `bg-brand` with `bg-[#2D6A4F]`. Change the token definition so all classes auto-update.
- **Forgetting pressed/active states:** The codebase uses `active:bg-brand-dark` for press feedback. Since `brand.dark` is being updated, these auto-propagate, but verify they still look correct.
- **Touching special cards:** The gradient balance card and dark invite code card already have their own styling and do NOT use the Card component. Don't modify them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color token propagation | Manual find-replace of every color usage | Change token definitions in 2 files | NativeWind resolves classes at build time; ~90% of usages are class-based |
| Card outline consistency | Per-screen card styling | Single Card.tsx component update | Card component is already used in many places |
| StatusBar styling | Manual per-screen StatusBar components | Single `<StatusBar style="dark" />` in root layout | expo-status-bar applies globally |

**Key insight:** The token architecture already exists. The majority of this phase is updating token definitions and handling the ~17 hardcoded hex outliers, NOT rewriting styling across 50+ files.

## Common Pitfalls

### Pitfall 1: Token Files Out of Sync
**What goes wrong:** Updating `tailwind.config.js` but forgetting `lib/theme/colors.ts` (or vice versa). Class-based styling shows wintergreen while inline styles show emerald.
**Why it happens:** Two separate files define the same conceptual tokens.
**How to avoid:** Update both files in the same task, in the same commit. Verify by searching for both old hex values.
**Warning signs:** Buttons show one green, activity indicators show another.

### Pitfall 2: Missing Hardcoded Hex Values
**What goes wrong:** Some `#10B981` values survive in files that weren't checked.
**How to avoid:** Run `grep -r '#10B981\|#059669\|#D1FAE5' --include='*.tsx' --include='*.ts' app/ components/ lib/` and verify zero results. The current count is 17 occurrences.
**Warning signs:** Stale emerald green appearing on specific screens.

### Pitfall 3: Card Background on Cream
**What goes wrong:** Making Card `bg-transparent` but some cards contain content that needs its own background (e.g., the calendar section uses `bg-white` independently).
**Why it happens:** Not all white containers are Card components.
**How to avoid:** After updating Card.tsx, visually audit each screen. Cards that are "outlined zones" should be transparent. Overlays/modals/inputs should remain white.
**Warning signs:** Content blending into cream with no visual boundary.

### Pitfall 4: Shadow + Outline Violation (CARD-03)
**What goes wrong:** Card.tsx is fixed but many non-Card containers still use `bg-white shadow-sm` with their own borders.
**Why it happens:** The codebase has ~25 non-Card containers with `bg-white shadow-sm` that are effectively acting as cards.
**How to avoid:** After the Card component update, grep for `shadow-sm` and `shadow` in component/app files, audit each one.
**Warning signs:** Some containers look raised while others look flat.

### Pitfall 5: Tab Bar Visual Seam
**What goes wrong:** Tab bar background doesn't exactly match page background, creating a visible line.
**Why it happens:** Tab bar uses `colors.white` while pages use `bg-neutral-bg`. Even after update, the `borderTopColor` creates a seam if it contrasts too strongly.
**How to avoid:** Set tab bar background to same cream `#F5F0EB`, use warm gray border `#D6D0C8` for subtle separation, verify on device.
**Warning signs:** Visible horizontal line between content scroll area and tab bar.

### Pitfall 6: Splash Screen Color Mismatch
**What goes wrong:** Splash screen uses `#fefdfb` (current app.json) but post-login screens use `#F5F0EB`, creating a flash.
**Why it happens:** Splash background is configured in `app.json`, separate from runtime tokens.
**How to avoid:** Either update `app.json` splash `backgroundColor` to `#F5F0EB`, or keep `#fefdfb` if it's close enough. The difference between `#fefdfb` and `#F5F0EB` is very subtle -- both are warm off-white/cream. The onboarding already uses `ONBOARDING_CREAM = '#F5F0EB'` which is the same as the new `neutral.bg`. The splash `#fefdfb` is slightly warmer/lighter.
**Warning signs:** Brief color flash when app loads.

## Code Examples

### Token Update (colors.ts)

```typescript
// lib/theme/colors.ts
export const colors = {
  brand: { DEFAULT: '#2D6A4F', dark: '#1B4332', mid: '#52796F', light: '#D8E8DC' },
  semantic: { success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
  neutral: { text: '#0F172A', secondary: '#64748B', tertiary: '#94A3B8', border: '#D6D0C8', surface: '#F1F5F9', bg: '#F5F0EB' },
  white: '#FFFFFF',
} as const;

export const AVATAR_COLORS = [
  '#2D6A4F', '#C17F59', '#D4A24E', '#5A6872',
  '#7B5E7B', '#3D7A8A', '#A0705A', '#8FA38B',
] as const;
```

### Token Update (tailwind.config.js)

```javascript
colors: {
  brand: {
    DEFAULT: "#2D6A4F",
    dark: "#1B4332",
    mid: "#52796F",  // NEW
    light: "#D8E8DC",
  },
  // semantic stays same
  neutral: {
    text: "#0F172A",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    border: "#D6D0C8",       // warm gray (was #E2E8F0)
    surface: "#F1F5F9",
    bg: "#F5F0EB",           // cream (was #F8FAFC)
  },
},
```

### Avatar Gradient Pairs (wintergreen earth tones)

```typescript
const GRADIENT_PAIRS: [string, string][] = [
  ['#2D6A4F', '#1B4332'], // wintergreen (default/fallback)
  ['#C17F59', '#A3654A'], // terracotta
  ['#D4A24E', '#B8893D'], // amber
  ['#5A6872', '#44535C'], // slate
  ['#7B5E7B', '#634B63'], // plum
  ['#3D7A8A', '#2E6270'], // ocean
  ['#A0705A', '#8A5E4A'], // clay
  ['#8FA38B', '#738A6F'], // sage
];
```

### Card.tsx Redesigned

```typescript
export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-transparent rounded-card border border-neutral-border p-4 ${className}`}>
      {children}
    </View>
  );
}
```

### StatusBar Addition (root layout)

```typescript
import { StatusBar } from 'expo-status-bar';
// In RootLayout return:
<GestureHandlerRootView style={{ flex: 1 }}>
  <StatusBar style="dark" />
  <AuthProvider>
    <RootNavigator />
  </AuthProvider>
</GestureHandlerRootView>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Emerald green (#10B981) brand | Wintergreen (#2D6A4F) brand | This phase | Warmer, more premium feel |
| White cards with shadow+border | Transparent cards with warm gray outline only | This phase | Flat, seamless surface design |
| Slate gray backgrounds (#F8FAFC) | Cream backgrounds (#F5F0EB) | This phase | Warmer overall tone |
| Cold gray borders (#E2E8F0) | Warm gray borders (#D6D0C8) | This phase | Complements cream |

## Open Questions

1. **`brand.mid` token: class name or inline only?**
   - What we know: The mid-tone `#52796F` is for secondary buttons, selected list items. Adding it to `tailwind.config.js` enables `bg-brand-mid`, `text-brand-mid` classes.
   - What's unclear: Whether any current UI elements need this class in this phase, or if it's prep for future phases.
   - Recommendation: Add the token now (zero cost) so it's available. If nothing currently uses it, that's fine -- it's forward-compatible.

2. **Splash background alignment**
   - What we know: Current splash uses `#fefdfb`, onboarding uses `#F5F0EB`, new neutral.bg will be `#F5F0EB`.
   - What's unclear: Whether `#fefdfb` vs `#F5F0EB` creates a visible flash on transition.
   - Recommendation: Update `app.json` splash `backgroundColor` to `#F5F0EB` for consistency. The difference is small but eliminating it costs nothing.

3. **`active:bg-emerald-200` in ChoreRow.tsx**
   - What we know: Line 177 uses Tailwind's default `emerald-200` class for pressed state.
   - What's unclear: What replacement class to use since there's no `emerald` in the custom config.
   - Recommendation: Replace with `active:bg-brand-light` which will resolve to `#D8E8DC` (sage-green wash). This is consistent with the rest of the design.

4. **Tab bar inactive color**
   - What we know: Currently `colors.neutral.tertiary` (`#94A3B8`) -- a cool slate gray.
   - What's unclear: Whether to keep this cool gray or shift to a warm gray to match the cream/warm palette.
   - Recommendation: Use `#9C9590` (warm gray) for inactive tabs. This complements the cream background and warm gray borders. The current `#94A3B8` has blue undertones that clash with the warm palette.

## Detailed File Impact Inventory

### Files with hardcoded `#10B981`, `#059669`, or `#D1FAE5` (17 occurrences)

| File | Hex | Line | Context |
|------|-----|------|---------|
| `lib/theme/colors.ts` | all 3 | 2 | Token definition (source of truth) |
| `app/(auth)/welcome.tsx` | `#10B981` | 186, 198 | Active dot, Get Started button bg |
| `app/(auth)/welcome.tsx` | `#059669` | 217 | "Log in" text color |
| `app/(app)/expenses/settle.tsx` | `#10B981` | 21 | AVATAR_COLORS array |
| `app/(app)/expenses/add.tsx` | `#10B981` | 21 | AVATAR_COLORS array |
| `app/(app)/expenses/[id].tsx` | `#10B981` | 20 | AVATAR_COLORS array |
| `app/(app)/chores/swap-request.tsx` | `#10B981` | 25 | AVATAR_COLORS array |
| `app/(app)/chores/dashboard.tsx` | `#10B981` | 20 | AVATAR_COLORS array |
| `app/(app)/chores/add.tsx` | `#10B981` | 31 | AVATAR_COLORS array |
| `app/(app)/groceries/complete-trip.tsx` | `#10B981` | 21 | AVATAR_COLORS array |
| `app/(app)/settings/members.tsx` | `#10B981` | 20 | AVATAR_COLORS array |
| `components/ui/Avatar.tsx` | `#10B981`, `#059669` | 26 | GRADIENT_PAIRS first entry |
| `components/ui/Toggle.tsx` | `#10B981` | 29 | interpolateColor active state |
| `components/chores/ChoreRow.tsx` | `#10B981` | 182, 184, 232 | ActivityIndicator + icon colors |

### Files with `bg-white shadow-sm` or `bg-white shadow` (non-Card containers needing audit for CARD-03)

| File | Line(s) | Description |
|------|---------|-------------|
| `app/(app)/expenses/settle.tsx` | 208 | Balance display card |
| `app/(app)/expenses/[id].tsx` | 392, 650, 678 | Expense detail cards |
| `app/(app)/settings/index.tsx` | 81, 96 | Profile card, settings list |
| `app/(app)/settings/notifications.tsx` | 89 | Notification toggles card |
| `app/(app)/settings/members.tsx` | 204, 269 | Members list, invite code section |
| `app/(app)/settings/modules.tsx` | 162 | Module toggle cards |
| `app/(app)/chores/dashboard.tsx` | 369, 398 | Stats and member cards |
| `app/(app)/groceries/trip-history.tsx` | 142 | Trip history cards |
| `components/home/CalendarSection.tsx` | 140 | Calendar container |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis via Read/Grep tools -- all file paths, line numbers, and patterns verified against actual source code
- `tailwind.config.js` and `lib/theme/colors.ts` read in full
- All components in `components/ui/` (Avatar, Card, Badge, Button, FAB, Toggle, IconContainer, StepProgressBar) read in full
- `app.json` read for splash/status bar configuration
- `app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx` read in full for navigation chrome

### Secondary (MEDIUM confidence)
- Avatar gradient pair hex values for earth tones are recommended values that should look good together but haven't been tested on device -- visual validation needed during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, purely updating existing token files and components
- Architecture: HIGH -- two-file token system is well-understood from direct code analysis; propagation path is clear
- Pitfalls: HIGH -- all file locations and line numbers verified; impact inventory is complete
- Avatar gradient colors: MEDIUM -- specific hex pairs are recommendations based on color theory, not tested

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no external dependencies changing)