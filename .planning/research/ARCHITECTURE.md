# Architecture: UI Redesign Integration

**Domain:** UI/UX redesign of existing Expo React Native app (RoomY)
**Researched:** 2026-03-11
**Confidence:** HIGH (verified against NativeWind docs, Expo docs, codebase analysis)

## Current State Analysis

The existing codebase has **no shared component library**. UI code is duplicated across screens:
- `AVATAR_COLORS` array is copy-pasted into `index.tsx`, `expenses.tsx`, `chores.tsx`
- `getInitials()` helper is duplicated in 3 files
- Card styling patterns (`rounded-2xl bg-white shadow-sm`) repeated ad-hoc across all screens
- Colors are hardcoded hex values (`#f9a825`, `#9ca3af`, `#fefdfb`) inline throughout
- Shadows use a mix of NativeWind `shadow-sm` and inline `style={{ shadowColor, shadowOffset }}` objects

The app uses **NativeWind v4 with Tailwind CSS v3** (`tailwindcss: ^3.4.19`, `nativewind: ^4.2.2`). The existing `tailwind.config.js` defines an orange primary palette and surface neutrals that will be replaced entirely.

### File-to-Screen Mapping (What Gets Touched)

| Screen | Current File | Change Type |
|--------|-------------|-------------|
| Welcome carousel | `app/(auth)/welcome.tsx` | REWRITE -- gradient hero, glass-morphism, new layout |
| Sign up | `app/(auth)/sign-up.tsx` | MODIFY -- new colors, back button, styling updates |
| Sign in | `app/(auth)/sign-in.tsx` | MODIFY -- same pattern as sign-up |
| Display name | `app/(onboarding)/profile.tsx` | REWRITE -- gradient avatar preview, step bar, new layout |
| Setup choice | `app/(onboarding)/household-choice.tsx` | REWRITE -- gradient icon cards, step bar |
| Create household | `app/(onboarding)/create-household.tsx` | MODIFY -- gradient house icon, new styling |
| Invite code | `app/(onboarding)/member-welcome.tsx` | REWRITE -- celebration layout, code card, share button |
| Module selection | `app/(onboarding)/module-quiz.tsx` | REWRITE -- toggle cards, step bar, new layout |
| Home tab | `app/(app)/(tabs)/index.tsx` | REWRITE -- week strip calendar, balance card, attention feed |
| Expenses tab | `app/(app)/(tabs)/expenses.tsx` | REWRITE -- balance cards, history with icon containers |
| Groceries tab | `app/(app)/(tabs)/groceries.tsx` | MODIFY -- checkbox circles, member avatars, sections |
| Chores tab | `app/(app)/(tabs)/chores.tsx` | REWRITE -- emoji icons, stats row, dispute styling |
| Tab bar | `app/(app)/(tabs)/_layout.tsx` | MODIFY -- new colors, sizing, active states |
| App layout | `app/(app)/_layout.tsx` | MODIFY -- header colors |
| Root layout | `app/_layout.tsx` | MODIFY -- loading indicator color |

**Screens NOT touched:** `expenses/add.tsx`, `expenses/[id].tsx`, `expenses/settle.tsx`, `chores/add.tsx`, `chores/dashboard.tsx`, `chores/swap-request.tsx`, `groceries/complete-trip.tsx`, `groceries/trip-history.tsx`, `settings/*`. These retain existing styling -- the design spec covers only the four tabs and onboarding.

## Recommended Architecture

### Component Boundaries

```
components/
  ui/
    Avatar.tsx            -- Gradient circle with initial, 6 sizes
    Badge.tsx             -- Semantic pill (frequency, status, category)
    Card.tsx              -- White card with border + shadow
    IconContainer.tsx     -- 40px semantic-colored square icon holder
    Button.tsx            -- Primary (solid brand) and Outline variants
    FAB.tsx               -- Floating action button (52px, bottom-right)
    StepProgressBar.tsx   -- 3-segment onboarding progress indicator
    ToggleSwitch.tsx      -- Custom 48x28 toggle with brand color
    SectionHeader.tsx     -- Overline text ("TO GET", "MY CHORES")
    BackButton.tsx        -- 40px square back navigation button
    Divider.tsx           -- Horizontal line divider
    GradientBackground.tsx -- LinearGradient wrapper for hero sections
  layout/
    ScreenWrapper.tsx     -- SafeAreaView + bg color + scroll behavior

lib/
  theme/
    colors.ts             -- Design token constants (exported for inline styles)
    typography.ts          -- Font size/weight constants
    shadows.ts             -- Shadow style objects
    member-colors.ts       -- Per-member gradient assignments + rotation pool

global.css                -- CSS variable definitions for NativeWind theming
tailwind.config.js        -- Theme extension referencing CSS variables
```

### Component Responsibility Matrix

| Component | Responsibility | Used By |
|-----------|---------------|---------|
| `Avatar` | Render member gradient circle with initial letter; accept size prop | Home (members row, timeline), Expenses (balance, history), Groceries (item attribution), Chores (assignee) |
| `Badge` | Render colored pill with text; accept variant (danger, warning, success, brand, neutral) | Chores (frequency, disputed, overdue), Expenses (category) |
| `Card` | White surface with border and shadow; accept children and optional dispute variant | Every screen section (balances, history groups, calendar, stats) |
| `IconContainer` | Colored square with icon/emoji; accept color variant and size | Expenses (history rows), Chores (emoji icons), Home (attention items) |
| `Button` | Full-width tap target; accept variant (primary, outline, ghost) | All CTAs across onboarding and main app |
| `FAB` | Absolute-positioned add button | Expenses, Chores (possibly Groceries) |
| `StepProgressBar` | 3 horizontal bars, filled count prop | Onboarding: display name (1/3), setup choice (2/3), modules (3/3) |
| `ToggleSwitch` | Animated toggle; accept value, onChange, locked | Module selection screen |
| `SectionHeader` | Uppercase overline label with optional right action | Groceries sections, Chores sections, Home sections |
| `BackButton` | Navigate back with styled container | All onboarding screens |
| `GradientBackground` | `expo-linear-gradient` wrapper for hero sections | Welcome carousel, balance summary card, avatar backgrounds |

### Data Flow (Unchanged)

The UI redesign is **presentation-layer only**. All data fetching, Supabase queries, RLS policies, real-time subscriptions, and business logic remain untouched. Components receive data via props from existing screen-level state/hooks.

```
Existing data flow (UNCHANGED):
  Screen state (useState/useCallback) --> Supabase queries --> setState

New presentation flow (ADDED):
  Screen state --> Shared components (Avatar, Card, Badge, etc.) --> Rendered UI
```

## Design Token Strategy

### Where Tokens Live

Use **two complementary approaches**:

1. **`tailwind.config.js` theme extension** -- for values used via NativeWind `className` props (colors, border-radius, spacing). This is the primary mechanism.

2. **`lib/theme/colors.ts` constants** -- for values needed in inline `style` props where NativeWind cannot reach (gradient `colors` arrays, `shadowColor` for colored shadows, dynamic avatar colors). Export raw hex values.

The design spec defines 18 color tokens. Map them into `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2D6A4F",
          light: "#D8F3DC",
          muted: "#95D5B2",
          dark: "#1B4332",
        },
        danger: {
          DEFAULT: "#E5383B",
          light: "#FFE5E5",
        },
        warning: {
          DEFAULT: "#F4A261",
          light: "#FFF3E0",
        },
        success: {
          DEFAULT: "#40916C",
          light: "#E8F5E9",
        },
        bg: "#FAFAF8",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#1A1A1A",
          secondary: "#8E8E93",
          tertiary: "#AEAEB2",
        },
        border: "#F0EFEB",
      },
      borderRadius: {
        card: "14px",
        "card-lg": "16px",
        button: "14px",
      },
    },
  },
  plugins: [],
};
```

```typescript
// lib/theme/colors.ts
// For use in inline style props (gradients, colored shadows, dynamic values)
export const colors = {
  brand: "#2D6A4F",
  brandLight: "#D8F3DC",
  brandMuted: "#95D5B2",
  brandDark: "#1B4332",
  danger: "#E5383B",
  dangerLight: "#FFE5E5",
  warning: "#F4A261",
  warningLight: "#FFF3E0",
  success: "#40916C",
  successLight: "#E8F5E9",
  bg: "#FAFAF8",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#8E8E93",
  textTertiary: "#AEAEB2",
  border: "#F0EFEB",
} as const;

// Gradient pairs for LinearGradient components
export const gradients = {
  brand: ["#2D6A4F", "#1B4332"] as const,
  purple: ["#7209B7", "#B5179E"] as const,
  orange: ["#E76F51", "#F4A261"] as const,
} as const;
```

```typescript
// lib/theme/member-colors.ts
export type MemberColorSet = {
  primary: string;
  gradient: [string, string];
};

// Fixed assignments for known members (from design spec)
const ASSIGNED_COLORS: Record<string, MemberColorSet> = {
  // These could be stored in DB per-household; hardcoded for v1
};

// Pool of visually distinct gradients for dynamic assignment
const COLOR_POOL: MemberColorSet[] = [
  { primary: "#E76F51", gradient: ["#E76F51", "#F4A261"] },
  { primary: "#264653", gradient: ["#264653", "#2A9D8F"] },
  { primary: "#7209B7", gradient: ["#7209B7", "#B5179E"] },
  { primary: "#0077B6", gradient: ["#0077B6", "#00B4D8"] },
  { primary: "#E63946", gradient: ["#E63946", "#F4845F"] },
  { primary: "#2D6A4F", gradient: ["#2D6A4F", "#40916C"] },
  { primary: "#6D597A", gradient: ["#6D597A", "#B56576"] },
  { primary: "#BC6C25", gradient: ["#BC6C25", "#DDA15E"] },
];

// Deterministic color assignment based on user_id hash
export function getMemberColor(userId: string, index: number): MemberColorSet {
  return COLOR_POOL[index % COLOR_POOL.length];
}
```

### Why This Split (Not CSS Variables Alone)

NativeWind v4 supports CSS variables for theming, but this project has no dark mode requirement and the design spec defines a single fixed palette. Using `tailwind.config.js` theme extension is simpler:
- No CSS variable plumbing needed
- Direct `className="bg-brand text-white"` usage
- Tailwind intellisense works in the editor
- `lib/theme/colors.ts` only needed for the few cases NativeWind cannot handle (gradient arrays, colored shadows)

CSS variables would add complexity with no benefit for a single-theme app.

## Handling NativeWind Limitations

### Gradients

**Problem:** NativeWind v4 does NOT support `bg-gradient-to-*`, `from-*`, `via-*`, `to-*` on native. These are web-only.

**Solution:** Use `expo-linear-gradient` (already available in Expo SDK 54) with `cssInterop` for NativeWind className support on non-gradient styles, and pass gradient `colors` via the component's own props.

```typescript
// components/ui/GradientBackground.tsx
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

// Allow NativeWind className to control padding, border-radius, etc.
cssInterop(LinearGradient, { className: "style" });

type Props = {
  colors: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
  children: React.ReactNode;
};

export function GradientBackground({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  className,
  children,
}: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      className={className}
    >
      {children}
    </LinearGradient>
  );
}
```

**Usage in balance card:**
```tsx
<GradientBackground
  colors={gradients.brand}
  className="rounded-card-lg p-4"
>
  <Text className="text-[34px] font-bold text-white">$42.50</Text>
</GradientBackground>
```

**Usage in Avatar:**
```tsx
<GradientBackground
  colors={memberColor.gradient}
  className="h-9 w-9 items-center justify-center rounded-full"
>
  <Text className="text-xs font-bold text-white">{initial}</Text>
</GradientBackground>
```

**Install requirement:**
```bash
npx expo install expo-linear-gradient
```

This package is part of the Expo SDK and works in Expo Go without a custom dev build.

### Shadows

**Problem:** NativeWind v4 `shadow-sm`, `shadow-md`, `shadow-lg` work on native but use the react-native-shadow-generator scaling system, which differs from CSS box-shadow. The design spec defines custom shadow tokens with specific offsets and blur values. Colored shadows (e.g., brand-colored FAB shadow) require inline styles.

**Solution:** Use NativeWind `shadow` / `shadow-md` for standard card elevation. Use inline `style` objects for colored shadows and precise spec-matching.

```typescript
// lib/theme/shadows.ts
import { Platform, ViewStyle } from "react-native";

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),
  cardMd: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
  }),
  fab: (color: string): ViewStyle =>
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.33,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }) ?? {},
  avatar: (color: string): ViewStyle =>
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }) ?? {},
} as const;
```

**Important:** On native, shadows ONLY appear if the component has a `backgroundColor` set. This is a React Native constraint. All Card components must have an explicit bg color.

### Glass-Morphism (Onboarding Hero)

**Problem:** The design spec calls for glass-morphism containers with `backdrop-filter: blur(12px)`. React Native does not support CSS `backdrop-filter`. `expo-blur` provides `BlurView` but has limited Android support on SDK 54.

**Solution:** Simulate glass-morphism with semi-transparent backgrounds and skip the blur effect. The visual effect is 90% achieved by the translucent white overlay against the gradient background. Real blur is a nice-to-have that is not worth the Android compatibility risk.

```tsx
// Glass-morphism container (onboarding hero)
<View
  className="rounded-3xl border border-white/20 p-6"
  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
>
  {/* Content */}
</View>
```

This approach:
- Works identically on iOS and Android
- Works in Expo Go (no native module needed)
- Looks nearly identical to the spec on gradient backgrounds
- Avoids the `expo-blur` dependency and its SDK 54 Android limitations

### Calendar: Week Strip with Collapse/Expand

**Problem:** The design spec calls for a calendar that defaults to a week strip (7 days in a row) with today highlighted, and can expand into a full month grid. The existing code uses `react-native-calendars` `Calendar` component which only shows the full month grid.

**Solution:** Build a custom week strip component and use Reanimated for the collapse/expand animation. Keep `react-native-calendars` for the expanded month view.

**Approach:**
1. **Collapsed state (default):** Custom `WeekStrip` component -- a horizontal `View` with 7 day cells. Today gets `bg-brand` fill with white text. Event dots rendered below each date (max 3 colored circles).
2. **Expanded state:** The existing `Calendar` from `react-native-calendars` with updated theme colors.
3. **Animation:** Reanimated `useSharedValue` for container height. `withTiming` animates between week-strip height (~70px) and month-grid height (~320px). A chevron indicator and pull-handle bar toggle the state.

```typescript
// Pseudocode for calendar collapse/expand
const isExpanded = useSharedValue(0); // 0 = collapsed, 1 = expanded
const WEEK_HEIGHT = 70;
const MONTH_HEIGHT = 320;

const animatedStyle = useAnimatedStyle(() => ({
  height: withTiming(
    isExpanded.value ? MONTH_HEIGHT : WEEK_HEIGHT,
    { duration: 300 }
  ),
  overflow: "hidden",
}));

function toggleCalendar() {
  isExpanded.value = isExpanded.value ? 0 : 1;
}
```

Reanimated v4 (`react-native-reanimated: ~4.1.1`) is already installed. The accordion pattern (measure content height, animate between 0 and measured) is well-documented in Reanimated's official examples.

### Onboarding Carousel

**Problem:** The welcome screen needs a horizontal carousel with 3 slides, each changing the hero gradient, emoji, title, and description.

**Solution:** Use the existing pattern from `app/(auth)/welcome.tsx` -- horizontal `ScrollView` with `pagingEnabled`. This already works correctly. The redesign replaces the content and adds the gradient hero section.

Key change: Instead of a flat white carousel, each slide now has a two-zone layout:
- **Top zone (hero):** `GradientBackground` component with the slide's gradient colors, containing glass-morphism logo and emoji badge
- **Bottom zone:** Title, description, dots, CTA button

The gradient color transition between slides happens naturally because each slide renders its own `GradientBackground`. With `pagingEnabled` scrolling, the gradient visually swaps as the user swipes.

**No new library needed.** `ScrollView` + `pagingEnabled` + `onScroll` for tracking active index is sufficient and already proven in the current codebase.

## Patterns to Follow

### Pattern 1: Shared Component with NativeWind className Forwarding

**What:** Every shared component accepts an optional `className` prop for layout overrides (margin, positioning) while encapsulating its own internal styling.

**When:** All `components/ui/*` components.

**Example:**
```typescript
// components/ui/Card.tsx
import { View, type ViewProps } from "react-native";
import { shadows } from "@/lib/theme/shadows";

type CardProps = ViewProps & {
  variant?: "default" | "dispute";
};

export function Card({ variant = "default", className, style, children, ...props }: CardProps) {
  const disputeClasses = variant === "dispute"
    ? "border-danger-light"
    : "border-border";

  return (
    <View
      className={`rounded-card-lg border bg-card p-4 ${disputeClasses} ${className ?? ""}`}
      style={[shadows.card, style]}
      {...props}
    >
      {children}
    </View>
  );
}
```

**Rationale:** Consumers can add `className="mt-4 mx-4"` for layout without touching internal styles. The component owns its own visual identity.

### Pattern 2: Screen Rebuild as Swap-In Replacement

**What:** Rebuild each screen in-place (same file path) so expo-router routing does not change. All imports, data fetching, and business logic stay at the top of the file. Only the JSX return and helper render functions change.

**When:** Every screen being redesigned.

**Example transformation:**
```typescript
// BEFORE (expenses.tsx):
<View className="mr-3 h-10 w-10 items-center justify-center rounded-full"
  style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
>
  <Text className="text-xs font-bold text-white">{getInitials(name)}</Text>
</View>

// AFTER (expenses.tsx):
<Avatar name={name} index={index} size="sm" />
```

**Rationale:** No routing changes, no new files added to `app/`, no layout restructuring. The expo-router file structure is stable. Only presentation code changes within each file.

### Pattern 3: Eliminate Inline Color Duplication

**What:** Replace every hardcoded hex value with either a NativeWind class or a theme constant.

**When:** During each screen rebuild.

**Checklist for each screen:**
- `#f9a825` (old primary) --> `bg-brand` / `text-brand` / `colors.brand`
- `#fefdfb` (old surface) --> `bg-bg`
- `#9ca3af` (old inactive) --> `text-text-tertiary`
- `#374151` (old header text) --> `text-text`
- Inline `style={{ backgroundColor }}` for avatars --> `<Avatar>` component

### Pattern 4: Chore Emoji Mapping as Constant

**What:** Define chore-to-emoji mapping in a shared constants file rather than inline.

```typescript
// lib/theme/chore-emojis.ts
export const CHORE_EMOJI: Record<string, string> = {
  dishes: "🍽️",
  laundry: "🧺",
  vacuum: "🧹",
  "folding clothes": "👕",
  trash: "🗑️",
  bathroom: "🚿",
  cooking: "🍳",
};

export const DEFAULT_CHORE_EMOJI = "✅";

export function getChoreEmoji(choreName: string): string {
  const key = choreName.toLowerCase();
  for (const [pattern, emoji] of Object.entries(CHORE_EMOJI)) {
    if (key.includes(pattern)) return emoji;
  }
  return DEFAULT_CHORE_EMOJI;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating New Route Files for Redesigned Screens

**What:** Adding new files like `app/(app)/(tabs)/home-v2.tsx` alongside existing screens.
**Why bad:** Expo-router creates routes from file names. Duplicate files create duplicate routes, confuse navigation, and leave dead code.
**Instead:** Edit screens in-place. The same file at `app/(app)/(tabs)/index.tsx` gets its JSX rewritten, not duplicated.

### Anti-Pattern 2: Using expo-blur for Glass-Morphism on SDK 54

**What:** Installing `expo-blur` and using `BlurView` for the onboarding glass effect.
**Why bad:** On SDK 54, `expo-blur` has limited and unstable Android support. The blur effect is purely decorative. If it fails on one platform, it creates a degraded experience.
**Instead:** Use semi-transparent `rgba(255,255,255,0.15)` backgrounds against gradients. Achieves 90% of the visual effect with 0% of the risk.

### Anti-Pattern 3: NativeWind Gradient Classes on Native

**What:** Using `bg-gradient-to-r from-brand to-brand-dark` in className props.
**Why bad:** These classes are web-only in NativeWind. They compile to nothing on iOS/Android. The screen will render with no gradient and no error -- a silent visual bug.
**Instead:** Always use `expo-linear-gradient` via the `GradientBackground` wrapper component.

### Anti-Pattern 4: Rebuilding All Screens Simultaneously

**What:** Changing all screens at once in a single development pass.
**Why bad:** Impossible to test incrementally. A bug in the shared components breaks everything. Merge conflicts if two devs touch the same files. No rollback point.
**Instead:** Follow the phased build order below. Complete and verify each phase before starting the next.

### Anti-Pattern 5: Mixing Old and New Color Tokens Within a Single Screen

**What:** A screen uses `bg-brand` in some places and `bg-primary-500` (old token) in others.
**Why bad:** Visual inconsistency. Confusing for future maintenance. The old tokens will be removed from tailwind.config.js.
**Instead:** When rebuilding a screen, replace ALL color references in that file. No screen should reference both the old `primary` palette and the new `brand` palette.

## Build Order (Dependency-Aware)

The build order is driven by component dependencies. Shared components must exist before screens can consume them.

```
Phase 1: Design Foundation (no screen changes yet)
  tailwind.config.js theme replacement
  global.css updates (if needed)
  lib/theme/colors.ts
  lib/theme/shadows.ts
  lib/theme/typography.ts
  lib/theme/member-colors.ts
  lib/theme/chore-emojis.ts
  Install expo-linear-gradient
      |
      v
Phase 2: Shared Component Library
  components/ui/GradientBackground.tsx   (needed by Avatar, cards, onboarding)
  components/ui/Avatar.tsx               (needed by every main screen)
  components/ui/Card.tsx                 (needed by every main screen)
  components/ui/Badge.tsx                (needed by Chores, Expenses)
  components/ui/IconContainer.tsx        (needed by Expenses, Chores, Home)
  components/ui/Button.tsx               (needed by all onboarding + FAB)
  components/ui/FAB.tsx                  (needed by Expenses, Chores)
  components/ui/SectionHeader.tsx        (needed by all tab screens)
  components/ui/StepProgressBar.tsx      (needed by onboarding)
  components/ui/ToggleSwitch.tsx         (needed by module selection)
  components/ui/BackButton.tsx           (needed by onboarding)
  components/ui/Divider.tsx              (needed by sign-up, expenses)
      |
      v
Phase 3: Tab Bar + Navigation Chrome
  app/(app)/(tabs)/_layout.tsx           (new colors, sizing, active states)
  app/(app)/_layout.tsx                  (header color updates)
  app/_layout.tsx                        (loading indicator color)
      |
      v
Phase 4: Main App Screens (can be done in parallel per screen)
  4a: Home screen     (app/(app)/(tabs)/index.tsx)
      - Custom WeekStrip component (new)
      - Calendar collapse/expand with Reanimated
      - Balance summary gradient card
      - Attention feed with IconContainers
      - Timeline section
  4b: Expenses screen (app/(app)/(tabs)/expenses.tsx)
      - Balance cards with Avatar + Badge
      - History with IconContainer differentiation
      - Settlement row dimming
      - FAB with colored shadow
  4c: Groceries screen (app/(app)/(tabs)/groceries.tsx)
      - Checkbox circles (unchecked/checked styling)
      - Member avatar attribution (22px)
      - SectionHeader ("TO GET", "DONE")
  4d: Chores screen   (app/(app)/(tabs)/chores.tsx)
      - Emoji IconContainers
      - Stats row (3 cards)
      - Dispute card variant (red border, tinted bg)
      - Badge for frequency and disputed status
      |
      v
Phase 5: Onboarding Flow
  5a: Welcome carousel (app/(auth)/welcome.tsx)
      - GradientBackground hero section
      - Glass-morphism containers
      - Carousel with 3 gradient slides
      - Page dots (pill active, circle inactive)
  5b: Sign up / Sign in (app/(auth)/sign-up.tsx, sign-in.tsx)
      - BackButton, new styling
      - Updated input styling
      - Social auth buttons (Google/Apple)
  5c: Display name    (app/(onboarding)/profile.tsx)
      - StepProgressBar (1/3)
      - Gradient avatar preview
  5d: Setup choice    (app/(onboarding)/household-choice.tsx)
      - StepProgressBar (2/3)
      - Gradient icon option cards
  5e: Name household  (app/(onboarding)/create-household.tsx)
      - Gradient house icon
  5f: Invite code     (app/(onboarding)/member-welcome.tsx)
      - Code card with overline
      - Share + Continue buttons
  5g: Module selection (app/(onboarding)/module-quiz.tsx)
      - StepProgressBar (3/3)
      - ToggleSwitch cards
      - Locked state for Expenses
```

### Build Order Rationale

1. **Foundation first** (Phase 1-2): Every screen depends on design tokens and shared components. Building these first means every subsequent screen rebuild is faster and consistent.

2. **Tab bar before screens** (Phase 3): Updating nav chrome first means screens open in the new visual context. Without this, you'd see new green screens inside an old orange tab bar -- jarring during development.

3. **Main screens before onboarding** (Phase 4 before 5): Main screens are used daily and are the core value. Onboarding is seen once per user. Prioritize the screens users see most.

4. **Phase 4 screens are parallel**: Home, Expenses, Groceries, Chores have no dependencies on each other. Two developers can split these. Home is the most complex (calendar animation). Groceries is the simplest (mostly styling changes).

5. **Onboarding last** (Phase 5): Onboarding has the most novel components (gradient hero, glass-morphism, carousel) and is seen least often. If it ships slightly later, no user impact.

### Estimated Complexity

| Phase | Effort | Risk | Notes |
|-------|--------|------|-------|
| 1. Foundation | Low | Low | Config changes, constant files |
| 2. Components | Medium | Low | Standard React component extraction |
| 3. Navigation | Low | Low | Color/sizing updates in layout files |
| 4a. Home | High | Medium | Calendar animation is the hardest single feature |
| 4b. Expenses | Medium | Low | Mostly component composition |
| 4c. Groceries | Low | Low | Minimal changes from current |
| 4d. Chores | Medium | Low | Emoji mapping, dispute variant |
| 5a. Welcome | High | Medium | Gradient carousel, glass effect |
| 5b. Auth screens | Low | Low | Styling updates |
| 5c-g. Onboarding | Medium | Low | Component composition, step bar |

## Sources

- [NativeWind v4 Gradient Color Stops](https://www.nativewind.dev/docs/tailwind/backgrounds/gradient-color-stops) -- web-only, confirmed not supported on native (HIGH confidence)
- [NativeWind v4 Box Shadow](https://www.nativewind.dev/docs/tailwind/effects/box-shadow) -- shadow classes supported, arbitrary values web-only (HIGH confidence)
- [NativeWind v4 Platform Differences](https://www.nativewind.dev/docs/core-concepts/differences) -- opacity plugins disabled, unit differences (HIGH confidence)
- [NativeWind v4 Themes](https://www.nativewind.dev/docs/guides/themes) -- CSS variable theming approach (HIGH confidence)
- [NativeWind v4 Custom Colors](https://www.nativewind.dev/docs/customization/colors) -- theme extension in tailwind.config.js (HIGH confidence)
- [Expo LinearGradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- part of Expo SDK, works in Expo Go (HIGH confidence)
- [NativeWind cssInterop for LinearGradient](https://gluestack.io/ui/docs/guides/recipes/linear-gradient) -- cssInterop pattern for className support (MEDIUM confidence)
- [Reanimated Accordion Example](https://docs.swmansion.com/react-native-reanimated/examples/accordion/) -- useSharedValue + withTiming for collapse/expand (HIGH confidence)
- [react-native-calendars ExpandableCalendar](https://wix.github.io/react-native-calendars/docs/Components/ExpandableCalendar) -- existing but animation issues reported (MEDIUM confidence)
- [Expo BlurView](https://docs.expo.dev/versions/latest/sdk/blur-view/) -- SDK 55+ for stable Android, SDK 54 limited (HIGH confidence)
- [Expo App Folder Structure](https://expo.dev/blog/expo-app-folder-structure-best-practices) -- components outside app/ directory (HIGH confidence)
- [Collapsible Card with Reanimated](https://dev.to/dimaportenko/collapsible-card-with-react-native-reanimated-495a) -- practical implementation pattern (MEDIUM confidence)

---
*Architecture research for: RoomY UI Redesign (v1.1)*
*Researched: 2026-03-11*
