# Phase 6: Design System + Components - Research

**Researched:** 2026-03-12
**Domain:** Design tokens, reusable UI components, navigation chrome (NativeWind/TailwindCSS + React Native)
**Confidence:** HIGH

## Summary

Phase 6 establishes the foundational design system for the v1.1 UI redesign. The existing codebase uses an orange/warm palette (`primary-500: #f9a825`) with 74 hardcoded orange hex occurrences across 25 files, plus 186 Tailwind class references to the old `primary-*`, `surface-*`, and `accent-*` tokens. All of these must be replaced with the new emerald green brand palette.

The project runs Expo SDK 54 (React Native 0.81.5) with NativeWind v4.2.2 and TailwindCSS 3.4.19. New Architecture is enabled by default in SDK 54, which means the `boxShadow` style property is available natively. However, NativeWind v4 shadow classes still emit the legacy `shadowColor/shadowOffset/shadowOpacity/shadowRadius` properties (not `boxShadow`). These legacy props still work on RN 0.81 (they are NOT deprecated per official docs) but only fully apply on iOS; Android needs `elevation` for shadows. For the two-tier elevation system, use NativeWind's built-in `shadow` and `shadow-md` classes with custom theme values.

**Primary recommendation:** Define all design tokens in `tailwind.config.js` theme extension, create 6 shared components in a new `components/` directory using NativeWind classes, install `expo-linear-gradient` for avatar gradients (included in Expo Go), and use `react-native-reanimated` (already installed) for toggle/FAB animations.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Primary brand green: Emerald family -- #10B981 (primary), #059669 (dark), #D1FAE5 (light)
- Semantic colors are SEPARATE from brand: success #22C55E, warning #F59E0B, error #EF4444, info #3B82F6
- Brand green is for primary actions/accents; success green is a different shade so they're visually distinct
- Neutral scale: Cool slate grays -- text #0F172A, secondary #64748B, border #E2E8F0, background #F8FAFC
- Light mode only -- token architecture should support dark mode later but no dark values defined now
- Cards: Soft & elevated -- subtle box-shadow, 12-16px rounded corners, white background on #F8FAFC page bg. Linear/Notion aesthetic
- Avatars: Gradient circle with white initials, gradient derived from user ID for unique-per-member consistency, colored shadow underneath
- Buttons: Fully rounded pill shape (border-radius 9999px), friendly and approachable feel
- Badges: Subtle tinted pills -- soft colored background with darker text of same hue
- Tab bar: Icons + text labels (icon above, short label below), outlined icons inactive / filled icons active, active color brand emerald green, inactive color tertiary slate gray, white background, top border, 84px height
- FAB: Bottom-right, contextual per active screen, 52px rounded square with 16px radius, brand background, colored shadow, scale bounce press animation (scale 0.92 -> 1.0, ~200ms spring)
- Typography: System fonts (SF Pro/Roboto), 8 presets with specific sizes/weights per CONTEXT.md
- Three-tier weight system: Bold (700), Semibold (600), Regular (400)

### Claude's Discretion
- Exact shadow values for the two-tier elevation system (shadow, shadowMd)
- Avatar gradient color palette and derivation algorithm
- Icon library choice for tab bar icons
- Toggle switch animation timing and spring parameters
- IconContainer color mapping to semantic categories
- Exact spacing/padding tokens

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSYS-01 | Color token system (brand green, semantic, neutrals) replacing all hardcoded orange | Tailwind theme extension in `tailwind.config.js` replaces `primary`, `surface`, `accent` scales with new palette; find-and-replace 74 orange hex values + 186 class references across 28 files |
| DSYS-02 | Typography scale with 8 presets | Tailwind fontSize tuple syntax supports fontSize + lineHeight + fontWeight + letterSpacing in config; map to `text-page-title`, `text-key-number`, etc. |
| DSYS-03 | Two-tier elevation system (shadow, shadowMd) | Custom `boxShadow` theme values in tailwind.config.js; NativeWind v4 converts to legacy shadow props which work on iOS; Android uses elevation |
| COMP-01 | Avatar with gradient circles, 6 sizes, colored shadow | `expo-linear-gradient` (included in Expo Go) for gradient background; deterministic color from user_id hash; 6 size variants via props |
| COMP-02 | Card component with consistent styling | NativeWind classes for white bg, border, rounded-xl, shadow, padding; single reusable component replacing inline card styles |
| COMP-03 | Badge with pill shape and semantic color variants | NativeWind classes with variant prop mapping to semantic color pairs (bg + text) |
| COMP-04 | Button with primary/outline variants and consistent sizing | Pressable with `rounded-full` (pill), variant prop for filled vs outline styling |
| COMP-05 | IconContainer 40x40 rounded squares with semantic bg | View wrapper with category-to-color mapping, Ionicons icon inside |
| COMP-06 | Toggle switch with animation and locked state | react-native-reanimated (already installed) for spring animation; custom Pressable-based switch |
| NAVG-01 | Branded tab bar (84px, white bg, green active, tertiary inactive) | expo-router Tabs `screenOptions.tabBarStyle` for height/colors; Ionicons `name` vs `name-outline` for filled/outlined icon switching |
| NAVG-02 | FAB rounded-square (52px, 16px radius, brand bg, colored shadow, scale bounce) | Reanimated `withSpring` for scale animation; absolute positioning above tab bar |

</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nativewind | 4.2.2 | Tailwind CSS for React Native | Already in project; design tokens defined via `tailwind.config.js` |
| tailwindcss | 3.4.19 | Utility CSS framework | Already in project; provides theme system for tokens |
| react-native-reanimated | 4.1.1 | Performant animations | Already installed; needed for toggle switch and FAB press animations |
| @expo/vector-icons (Ionicons) | 15.0.2 | Icon library | Already installed; Ionicons has outline/filled pairs needed for tab bar |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | ~15.0.2 | Gradient backgrounds | Avatar component gradient circles; included in Expo Go, no dev build needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-linear-gradient | SVG gradients via react-native-svg | Heavier dependency, overkill for simple linear gradients |
| Custom toggle | react-native-switch or @react-native-community/switch | Less control over brand colors and animation; custom build is small (~60 lines) |
| Custom avatar | react-native-user-avatar | Adds dependency for something simple; our gradient requirement is specific |

**Installation:**
```bash
npx expo install expo-linear-gradient
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  ui/
    Avatar.tsx          # COMP-01: Gradient circle with initials
    Card.tsx            # COMP-02: Consistent card container
    Badge.tsx           # COMP-03: Pill-shaped status indicator
    Button.tsx          # COMP-04: Primary/outline button
    IconContainer.tsx   # COMP-05: 40x40 rounded square icon wrapper
    Toggle.tsx          # COMP-06: Animated toggle switch
    FAB.tsx             # NAVG-02: Floating action button
  index.ts              # Barrel export
lib/
  theme/
    colors.ts           # Color constants for use outside Tailwind (inline styles, Reanimated)
tailwind.config.js      # All design tokens: colors, typography, shadows, spacing
```

### Pattern 1: Design Tokens in tailwind.config.js
**What:** All visual constants (colors, typography presets, shadows, radii) defined in a single Tailwind config file.
**When to use:** Always -- single source of truth for the design system.
**Example:**
```javascript
// tailwind.config.js - theme.extend section
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#D1FAE5',
        },
        semantic: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        neutral: {
          text: '#0F172A',
          secondary: '#64748B',
          tertiary: '#94A3B8',
          border: '#E2E8F0',
          surface: '#F1F5F9',
          bg: '#F8FAFC',
        },
      },
      fontSize: {
        'page-title': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'key-number': ['32px', { lineHeight: '38px', fontWeight: '700' }],
        'section-heading': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'card-title': ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'metadata': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'overline': ['11px', { lineHeight: '14px', fontWeight: '600', letterSpacing: '0.1em' }],
        'badge': ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      boxShadow: {
        DEFAULT: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '16px',
      },
    },
  },
};
```

### Pattern 2: Color Constants for Non-Tailwind Contexts
**What:** Export color hex values as JS constants for use in inline styles, Reanimated interpolations, and component props that don't accept Tailwind classes.
**When to use:** Tab bar `tabBarActiveTintColor`, `ActivityIndicator color`, Reanimated `interpolateColor`, `expo-linear-gradient` colors array, `boxShadow` inline styles.
**Example:**
```typescript
// lib/theme/colors.ts
export const colors = {
  brand: { DEFAULT: '#10B981', dark: '#059669', light: '#D1FAE5' },
  semantic: { success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
  neutral: { text: '#0F172A', secondary: '#64748B', tertiary: '#94A3B8', border: '#E2E8F0', bg: '#F8FAFC' },
} as const;
```

### Pattern 3: Component Props with Variant Pattern
**What:** Components accept a `variant` prop that maps to predefined style sets.
**When to use:** Badge, Button, IconContainer -- any component with semantic color variants.
**Example:**
```typescript
// Variant mapping pattern
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'neutral';
const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
  // ...
};
```

### Pattern 4: Deterministic Avatar Colors from User ID
**What:** Hash user_id string to consistently map each member to a gradient color pair.
**When to use:** Avatar component -- ensures same user always gets same color.
**Example:**
```typescript
// Simple hash function for deterministic color selection
const GRADIENT_PAIRS: [string, string][] = [
  ['#10B981', '#059669'],  // emerald
  ['#3B82F6', '#2563EB'],  // blue
  ['#8B5CF6', '#7C3AED'],  // violet
  ['#EC4899', '#DB2777'],  // pink
  ['#F59E0B', '#D97706'],  // amber
  ['#EF4444', '#DC2626'],  // red
  ['#06B6D4', '#0891B2'],  // cyan
  ['#84CC16', '#65A30D'],  // lime
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getGradientForUser(userId: string): [string, string] {
  return GRADIENT_PAIRS[hashString(userId) % GRADIENT_PAIRS.length];
}
```

### Anti-Patterns to Avoid
- **Inline hex values:** Never use `color="#10B981"` in JSX when a Tailwind class exists. Use `className="text-brand"` instead. Exception: props that require string values (tabBarActiveTintColor, ActivityIndicator color, LinearGradient colors).
- **Duplicating AVATAR_COLORS arrays:** Currently duplicated in 11 files. Centralize in the Avatar component.
- **Mixing old and new palette:** During migration, ensure no screen partially uses orange while another uses green. Atomic replacement per token.
- **Forgetting background on shadowed views:** NativeWind/React Native shadows require an explicit background color to render. Always pair `shadow` with `bg-white` or similar.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gradient backgrounds | Custom canvas/SVG drawing | `expo-linear-gradient` | Native performance, handles iOS/Android differences, included in Expo Go |
| Spring animations | Manual `Animated.spring()` calls | `react-native-reanimated` `withSpring` | Runs on UI thread, no JS bridge stuttering, already in project |
| Icon library | Custom SVG icon set | `@expo/vector-icons` Ionicons | 1300+ icons, outline/filled pairs, zero bundle size (loaded from cache), already in project |
| Shadow cross-platform | Manual platform checks for iOS shadow vs Android elevation | NativeWind `shadow` / `shadow-md` classes | Handles cross-platform conversion automatically via Babel plugin |
| Color hash algorithm | Complex hashing library | Simple `charCodeAt` loop with modulo | UUID strings have enough entropy; 8 gradient pairs is sufficient for household sizes (2-6 people) |

**Key insight:** The entire design system can be built with zero new npm dependencies beyond `expo-linear-gradient`. Everything else (animations, icons, shadows, styling) is already in the project.

## Common Pitfalls

### Pitfall 1: Shadow Not Appearing on Android
**What goes wrong:** NativeWind shadow classes render nothing on Android.
**Why it happens:** NativeWind v4 converts `shadow-*` to iOS `shadowColor/shadowOffset/shadowOpacity/shadowRadius`, which don't work on Android. Android requires `elevation`.
**How to avoid:** For Card and FAB components, add `style={{ elevation: 2 }}` (or `elevation: 4` for shadowMd) alongside the NativeWind shadow class. The class handles iOS; the inline style handles Android.
**Warning signs:** Shadows visible on iOS simulator but flat on Android.

### Pitfall 2: NativeWind fontSize Tuple with letterSpacing
**What goes wrong:** The `letterSpacing` value from fontSize tuple may not apply correctly in NativeWind v4 on React Native.
**Why it happens:** NativeWind v4 may not fully parse the letterSpacing from Tailwind's fontSize tuple syntax on native. The `overline` preset needs `letterSpacing: 0.1em` which translates to ~1.1px at 11px font size.
**How to avoid:** Test the overline preset early. If letterSpacing doesn't apply from the tuple, apply it separately using the `tracking-*` utility class (e.g., `tracking-widest`) or an inline style (`style={{ letterSpacing: 1.5 }}`).
**Warning signs:** Overline text looks identical to badge text despite different specs.

### Pitfall 3: Tab Bar Height on Different Devices
**What goes wrong:** Tab bar appears wrong height on devices with/without home indicator (notch vs button).
**Why it happens:** The 84px height includes padding for safe area. Setting `height: 84` without accounting for the safe area inset can cause double-padding or clipping.
**How to avoid:** Set `height: 84` in `tabBarStyle` and ensure `paddingBottom` accounts for the device's safe area. On notched iPhones, the system adds ~34px bottom inset automatically. Test with `paddingBottom: 0` if the tab bar appears too tall.
**Warning signs:** Tab bar is 84px + 34px = 118px on iPhone with notch.

### Pitfall 4: Colored Shadow on FAB
**What goes wrong:** Colored shadow (brand green tint) doesn't appear or looks wrong.
**Why it happens:** NativeWind's `shadow-*` classes use `rgba(0,0,0,...)` for shadow color. A colored shadow needs explicit `shadowColor` override.
**How to avoid:** For the FAB, apply the shadow via inline style: `style={{ shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}`. This gives a green-tinted shadow on iOS and elevation on Android.
**Warning signs:** FAB has a generic gray shadow instead of the specified green.

### Pitfall 5: Old Orange Values Remaining After Migration
**What goes wrong:** Some screens still show orange after "completing" the color migration.
**Why it happens:** Hardcoded hex values like `"#f9a825"` in inline styles, `AVATAR_COLORS` arrays, and `headerTintColor` props are not caught by Tailwind class replacement.
**How to avoid:** Do a comprehensive grep for all old hex values: `#f9a825`, `#fefdfb`, `#faf3e8`, `#fde4b9`, `#66bb6a`. There are 74 inline hex occurrences across 25 files. Replace each with the new color constant from `lib/theme/colors.ts`.
**Warning signs:** Any warm orange or cream color visible in the running app.

### Pitfall 6: Toggle Locked State UX
**What goes wrong:** Users try to toggle a locked switch and nothing happens -- no feedback.
**Why it happens:** Simply disabling the Pressable gives no visual indication.
**How to avoid:** When `locked`, show the toggle in a dimmed/grayed state with reduced opacity. On press, optionally show a subtle shake animation or tooltip explaining why it's locked.
**Warning signs:** Users confused about why a toggle doesn't respond.

## Code Examples

Verified patterns from official sources:

### Avatar Component with Gradient (expo-linear-gradient)
```typescript
// Source: Expo LinearGradient docs + deterministic hashing pattern
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text } from 'react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 72,
};
const FONT_MAP: Record<AvatarSize, number> = {
  xs: 10, sm: 12, md: 14, lg: 18, xl: 22, '2xl': 28,
};

export function Avatar({ userId, name, size = 'md' }: {
  userId: string; name: string; size?: AvatarSize;
}) {
  const [startColor, endColor] = getGradientForUser(userId);
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={{
      shadowColor: startColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: dim, height: dim,
          borderRadius: dim / 2,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize, fontWeight: '600' }}>
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
}
```

### FAB with Scale Bounce Animation (react-native-reanimated)
```typescript
// Source: React Native Reanimated withSpring docs
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FAB({ icon, onPress }: { icon: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[{
        position: 'absolute', bottom: 100, right: 20,
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
      }, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={24} color="#fff" />
    </AnimatedPressable>
  );
}
```

### Toggle Switch with Reanimated
```typescript
// Source: React Native Reanimated Switch example docs
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolateColor,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

export function Toggle({ value, onChange, locked = false }: {
  value: boolean; onChange: (v: boolean) => void; locked?: boolean;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value, [0, 1],
      ['#E2E8F0', '#10B981']  // neutral.border -> brand
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(progress.value * 20, { damping: 15, stiffness: 300 }) }],
  }));

  const handlePress = () => {
    if (locked) return;
    const newValue = !value;
    progress.value = withSpring(newValue ? 1 : 0, { damping: 15, stiffness: 300 });
    onChange(newValue);
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: locked ? 0.5 : 1 }}>
      <Animated.View style={[{ width: 48, height: 28, borderRadius: 14, justifyContent: 'center', padding: 2 }, trackStyle]}>
        <Animated.View style={[{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}
```

### Tab Bar Configuration (expo-router)
```typescript
// Source: expo-router Tabs docs + Ionicons naming convention
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

<Tabs screenOptions={{
  tabBarActiveTintColor: '#10B981',    // brand green
  tabBarInactiveTintColor: '#94A3B8',  // neutral.tertiary
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',  // neutral.border
    borderTopWidth: 1,
    height: 84,
    paddingTop: 8,
    paddingBottom: 28,  // Adjust for safe area -- test on device
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '500',
  },
}}>
  <Tabs.Screen name="index" options={{
    title: 'Home',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
    ),
  }} />
  {/* ... other tabs */}
</Tabs>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| iOS `shadowColor/shadowOffset/shadowOpacity/shadowRadius` + Android `elevation` | `boxShadow` prop (CSS-like, cross-platform) | RN 0.76+ (New Arch) | Cross-platform shadows in one prop; NativeWind v5 will use this; v4 still uses legacy props which still work |
| Per-file AVATAR_COLORS arrays | Centralized Avatar component with deterministic gradient | This phase | Eliminates 11 duplicate color arrays |
| Inline `color="#f9a825"` everywhere | Theme tokens via `tailwind.config.js` + `colors.ts` | This phase | Single source of truth for all colors |
| `rounded-full` circles for FABs | Rounded square FAB (16px radius) | This phase | More distinctive, modern look per spec |

**Note on NativeWind v5:** NativeWind v5 is available and uses Tailwind CSS v4 with native `boxShadow` support. However, migrating to v5 is a significant change (new config format, potential breaking changes) and is out of scope for this phase. The v4 shadow classes work correctly on the current setup.

## Open Questions

1. **NativeWind fontSize tuple with letterSpacing on native**
   - What we know: Tailwind CSS v3 supports `[size, { letterSpacing, fontWeight }]` tuple syntax. NativeWind v4 documentation references Tailwind CSS docs for fontSize.
   - What's unclear: Whether NativeWind v4.2.2 fully parses `letterSpacing` from the tuple on React Native (not web). The overline preset needs `letterSpacing: 1.5px`.
   - Recommendation: Define the tuples in config. Test the overline preset first. If letterSpacing doesn't apply, use a companion `tracking-*` class or add `uppercase tracking-[1.5px]` separately. This is a LOW-risk issue with an easy fallback.

2. **Tab bar safe area padding on 84px height**
   - What we know: iOS devices with home indicator add ~34px safe area inset at bottom. The Tabs component from expo-router may auto-apply this.
   - What's unclear: Whether `height: 84` in `tabBarStyle` includes or excludes the safe area inset.
   - Recommendation: Start with `height: 84` and test on a physical iPhone. If too tall, the 84px likely already includes the inset. Adjust `paddingBottom` accordingly.

3. **Colored shadow rendering on Android**
   - What we know: Android `elevation` produces a gray shadow; `shadowColor` is not supported on Android via legacy props. The native `boxShadow` prop does support color on Android 9+.
   - What's unclear: Whether the colored shadow on the FAB and Avatar will be visible on Android with NativeWind v4's legacy shadow approach.
   - Recommendation: For FAB and Avatar, use inline `boxShadow` style string directly (bypassing NativeWind) on components where colored shadows are critical: `style={{ boxShadow: '0px 4px 8px rgba(16, 185, 129, 0.35)' }}`. This leverages RN 0.81's native boxShadow which works cross-platform on New Arch.

## Codebase Migration Scope

### Files Requiring Orange Hex Replacement (74 occurrences in 25 files)
The following files contain hardcoded `#f9a825` or related orange palette values that must be replaced:
- `app/_layout.tsx` (1 occurrence: ActivityIndicator)
- `app/(app)/_layout.tsx` (12 occurrences: all `headerTintColor` and `headerStyle`)
- `app/(app)/(tabs)/_layout.tsx` (1 occurrence: tabBarActiveTintColor)
- `app/(app)/(tabs)/index.tsx` (9 occurrences: AVATAR_COLORS, Pressable colors)
- `app/(app)/(tabs)/expenses.tsx` (5 occurrences: AVATAR_COLORS, FAB shadow)
- `app/(app)/(tabs)/groceries.tsx` (4 occurrences: AVATAR_COLORS)
- `app/(app)/(tabs)/chores.tsx` (4 occurrences: AVATAR_COLORS)
- `app/(auth)/welcome.tsx` (2 occurrences: Ionicons color)
- `app/(auth)/forgot-password.tsx` (1 occurrence: Ionicons color)
- Plus 16 more files with 1-3 occurrences each

### Files Requiring Tailwind Class Replacement (186 references in 28 files)
All `primary-*`, `surface-*`, and `accent-*` class usages must be updated to use the new token names (`brand`, `neutral-bg`, etc.).

## Sources

### Primary (HIGH confidence)
- React Native 0.81 View Style Props docs -- boxShadow format, shadow props still supported
- Expo LinearGradient docs -- confirmed included in Expo Go, props API
- NativeWind v4 Box Shadow docs -- shadow class support, theme customization
- Tailwind CSS v3 fontSize docs -- tuple syntax with letterSpacing and fontWeight
- Ionicons glyphmap (local node_modules) -- verified outline/filled naming convention

### Secondary (MEDIUM confidence)
- NativeWind GitHub Discussion #1512 -- v4 shadow classes use legacy props, v5 will use boxShadow
- React Native Reanimated Switch example docs -- withSpring, interpolateColor patterns
- Expo SDK 54 changelog -- New Architecture enabled by default

### Tertiary (LOW confidence)
- NativeWind fontSize tuple letterSpacing on native -- not explicitly documented for RN; verified for web Tailwind only. Needs testing.
- Android colored shadow via inline boxShadow -- documented for RN 0.81 New Arch but untested with NativeWind v4 coexistence

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified, versions confirmed from node_modules
- Architecture: HIGH -- patterns are standard React Native / NativeWind; variant pattern is established
- Color migration scope: HIGH -- exact file counts and locations verified via grep
- Typography tuples: MEDIUM -- Tailwind v3 supports it, NativeWind v4 likely does, but letterSpacing needs testing
- Shadow behavior: MEDIUM -- legacy props work on iOS confirmed; Android elevation works; colored shadows via inline boxShadow is the best approach but needs testing
- Pitfalls: HIGH -- based on verified platform differences and NativeWind v4 known limitations

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, no fast-moving dependencies)
