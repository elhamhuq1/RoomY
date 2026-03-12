# Technology Stack: UI Redesign Additions

**Project:** RoomY v1.1 UI Redesign
**Researched:** 2026-03-11
**Scope:** New libraries and configuration changes needed for the visual redesign. This does NOT cover the existing stack (Expo SDK 54, NativeWind v4, Supabase, expo-router) -- only what must be ADDED or CHANGED.

---

## Existing Stack (DO NOT CHANGE)

These are already installed and working. Listed for reference only.

| Technology | Version | Status |
|------------|---------|--------|
| Expo SDK | 54 | Installed |
| React Native | 0.81.5 | Installed |
| NativeWind | 4.2.2 | Installed |
| Tailwind CSS | 3.4.19 | Installed |
| react-native-reanimated | ~4.1.1 | Installed |
| react-native-gesture-handler | ~2.28.0 | Installed |
| react-native-calendars | ^1.1314.0 | Installed |
| @expo/vector-icons | ^15.0.2 | Installed |

**Architecture note:** SDK 54 runs the New Architecture by default (React Native 0.81). This means the `boxShadow` style property works cross-platform (iOS and Android) without needing legacy `shadowColor`/`shadowOffset`/`elevation` hacks. NativeWind v4's `shadow-*` classes use the legacy shadow props internally, but we can use `style` prop for custom colored shadows where needed.

---

## New Dependencies to Install

### Required Libraries

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| expo-linear-gradient | ~15.0.8 | Gradient backgrounds on avatar circles, hero sections, balance card, setup choice cards | First-party Expo package. Included in Expo Go (no dev build needed). Provides `LinearGradient` component with `colors`, `start`, `end` props. The design spec calls for gradients in 8+ places -- avatars, carousel hero, balance card, icon containers, option cards, house icon. |
| expo-blur | ~15.0.8 | Glass-morphism effect on onboarding welcome carousel (logo container, emoji badge) | First-party Expo package. Included in Expo Go. Provides `BlurView` with `intensity` (1-100) and `tint` props. The design spec requires `backdrop-filter: blur(12px)` on two glass containers in the welcome carousel. `BlurView` is the React Native equivalent. |
| react-native-svg | 15.12.1 | SVG-based gradient avatars with precise circular clipping | Already a transitive dependency via other packages but needs explicit install for direct import. Enables `<Circle>` + `<LinearGradient>` + `<Defs>` for per-member gradient avatars that are true circles with gradient fills. Alternative: use `expo-linear-gradient` with `borderRadius` and `overflow: hidden` for simpler cases. |

### Installation Command

```bash
npx expo install expo-linear-gradient expo-blur react-native-svg
```

This resolves compatible versions automatically via `bundledNativeModules.json`. All three are included in Expo Go -- no development build required.

---

## NativeWind Theme Configuration Changes

The existing `tailwind.config.js` has the old orange-based color palette. Replace it entirely with the design spec's green-based token system.

### Updated tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
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
        // Brand
        brand: {
          DEFAULT: "#2D6A4F",
          light: "#D8F3DC",
          muted: "#95D5B2",
          dark: "#1B4332",
        },
        // Semantic
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
        // Neutral (override defaults)
        bg: "#FAFAF8",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#1A1A1A",
          secondary: "#8E8E93",
          tertiary: "#AEAEB2",
        },
        border: "#F0EFEB",
        // Member colors (for avatar JS logic, not usually in classes)
        member: {
          elham: "#E76F51",
          tk: "#264653",
          elham3: "#7209B7",
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "30px",
      },
      fontSize: {
        // Design spec typography scale
        "page-title": ["26px", { lineHeight: "32px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "key-number": ["34px", { lineHeight: "40px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "section-heading": ["18px", { lineHeight: "24px", fontWeight: "700", letterSpacing: "-0.01em" }],
        "card-title": ["16px", { lineHeight: "22px", fontWeight: "700" }],
        "body": ["15px", { lineHeight: "22px", fontWeight: "600" }],
        "metadata": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "overline": ["11px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.06em" }],
        "badge": ["11px", { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.02em" }],
      },
    },
  },
  plugins: [],
};
```

**Key decisions in this config:**

1. **Flat semantic names** (`brand`, `danger`, `warning`, `success`) instead of numbered scales (no `brand-50` through `brand-900`). The design spec defines exactly 2-4 shades per semantic group -- a numbered scale would create unused utilities and confuse implementation.

2. **`text` as a color group** maps to NativeWind classes like `text-text` (primary), `text-text-secondary`, `text-text-tertiary`. Slightly awkward naming but avoids collision with Tailwind's built-in `text-*` utilities.

3. **`fontSize` with full tuples** including lineHeight, fontWeight, and letterSpacing. NativeWind v4 supports the Tailwind CSS fontSize tuple syntax `[size, { lineHeight, fontWeight, letterSpacing }]`. This means `text-page-title` applies size, weight, height, AND spacing in one class. HIGH confidence -- verified on NativeWind docs.

4. **`member` colors** are included for programmatic access via `resolveConfig` but avatars use `expo-linear-gradient` directly with hex values since gradients cannot be expressed in Tailwind classes.

### What the Config Does NOT Need

- **CSS variables / `vars()` function**: The design spec has one theme (light mode only, no dark mode). CSS variable indirection adds complexity without benefit. Use static hex values.
- **`platformColor()` / `platformSelect()`**: No platform-specific colors in the design spec. All colors are identical on iOS and Android.
- **Custom `boxShadow` theme values**: NativeWind v4 shadow classes (`shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`) use legacy shadow props. For the design spec's exact shadow tokens, use inline `style` props with the `boxShadow` property (React Native 0.81 supports this natively on New Architecture). See Shadows section below.

---

## Shadows Strategy

The design spec defines two shadow tokens:

| Token | Value |
|-------|-------|
| `shadow` | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` |
| `shadowMd` | `0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)` |

Plus colored shadows on avatars: `0 2px 8px {memberColor}33` and on brand buttons: `0 4px 16px {brand}55`.

### Approach: Hybrid (NativeWind classes + inline boxShadow)

**For standard shadows:** Use NativeWind's built-in `shadow-sm` and `shadow-md` classes. They are close enough to the spec tokens and work cross-platform. NativeWind v4 maps these to the legacy shadow* props which produce visually similar results. Always pair with a background color (`bg-card`, `bg-white`) -- shadows are invisible without one on native.

**For colored shadows (avatars, brand buttons):** Use React Native 0.81's `boxShadow` style property directly. This is the only way to get colored shadows cross-platform. Example:

```tsx
// Avatar with colored shadow
<View
  className="rounded-full bg-white"
  style={{
    boxShadow: "0 2px 8px #E76F5133",
  }}
>
  {/* avatar content */}
</View>

// Brand button with colored shadow
<Pressable
  className="bg-brand rounded-[14px]"
  style={{
    boxShadow: "0 4px 16px #2D6A4F55",
  }}
>
  {/* button content */}
</Pressable>
```

**Why not put custom shadows in Tailwind theme?** NativeWind v4 converts shadow classes to legacy `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` props. It does NOT use the `boxShadow` property. Custom multi-layer shadows or colored shadows defined in the theme would be converted to legacy props, losing the multi-layer aspect and color precision. Using `style={{ boxShadow }}` directly bypasses this limitation.

---

## Gradients Strategy

React Native has no CSS gradient support. Every gradient in the design spec requires the `LinearGradient` component.

### Gradient Usage Map

| Location | Colors | Direction | Component |
|----------|--------|-----------|-----------|
| Avatar circles | Per-member (see spec) | 135deg (diagonal) | `expo-linear-gradient` or `react-native-svg` |
| Carousel hero bg | Per-slide (3 variants) | Top-to-bottom | `expo-linear-gradient` |
| Balance summary card | `#2D6A4F` to `#1B4332` | Top-to-bottom | `expo-linear-gradient` |
| Setup choice icon containers | Brand gradient + purple gradient | 135deg | `expo-linear-gradient` |
| House icon (name household) | Brand gradient | 135deg | `expo-linear-gradient` |

### Implementation Pattern

```tsx
import { LinearGradient } from "expo-linear-gradient";

// 135-degree diagonal gradient (design spec default)
<LinearGradient
  colors={["#E76F51", "#F4A261"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ width: 36, height: 36, borderRadius: 18 }}
>
  <Text className="text-white text-center">E</Text>
</LinearGradient>
```

**expo-linear-gradient vs react-native-svg for avatars:** Use `expo-linear-gradient` with `borderRadius` and `overflow: hidden` for the standard round avatars. It is simpler and performs better. Only reach for `react-native-svg` if you need complex clipping paths or masking that `borderRadius` cannot achieve. For this design spec, `expo-linear-gradient` is sufficient for all gradient needs.

---

## Glass-Morphism Strategy

The design spec uses glass-morphism in exactly two places on the welcome carousel:
1. Logo container (80px, rounded 24px)
2. Feature emoji badge (72px rounded container)

Both use: `background: rgba(255,255,255,0.15)`, `border: 1px solid rgba(255,255,255,0.2)`, `backdrop-filter: blur(12px)`.

### Implementation

```tsx
import { BlurView } from "expo-blur";

<BlurView
  intensity={30}
  tint="light"
  style={{
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Text style={{ fontSize: 40 }}>house emoji</Text>
</BlurView>
```

**intensity mapping:** The design spec says `blur(12px)`. `expo-blur`'s `intensity` is 1-100, not px. An `intensity` of 25-35 produces a visual effect comparable to `blur(12px)`. This requires visual tuning during implementation.

**Android behavior:** On Android SDK 31+, `expo-blur` uses the native `BlurView` (dimezisBlurViewSdk31Plus method). On older Android, it falls back to a semi-transparent overlay (no actual blur). This is acceptable -- the glass-morphism is decorative, not functional.

---

## Animation Strategy

The design spec requires these animations:
1. **Carousel swipe** (welcome screen) -- horizontal paging
2. **Calendar collapse/expand** -- height transition between week strip and month grid
3. **Toggle switches** -- knob slide + background color transition
4. **Avatar preview** -- real-time update as user types display name

### Already Installed: react-native-reanimated 4.1.1

No new animation library needed. Reanimated 4 provides:

- **Layout animations** for the calendar collapse/expand (`LinearTransition.duration(300)`)
- **`useSharedValue` + `useAnimatedStyle`** for toggle switch knob position
- **`withTiming` / `withSpring`** for smooth easing

### Carousel: Use ScrollView, Not a Library

The welcome carousel is 3 static slides with paging. Use React Native's built-in `ScrollView` with `pagingEnabled` and `horizontal` props. Track the active page index with `onMomentumScrollEnd`. No carousel library needed -- adding one for 3 slides is unnecessary dependency weight.

```tsx
<ScrollView
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onMomentumScrollEnd={(e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActivePage(page);
  }}
>
  {slides.map((slide) => (
    <View key={slide.id} style={{ width: screenWidth }}>
      {/* slide content */}
    </View>
  ))}
</ScrollView>
```

### Calendar Collapse/Expand

Use Reanimated's layout transitions on the `Animated.View` wrapper:

```tsx
import Animated, { LinearTransition } from "react-native-reanimated";

<Animated.View layout={LinearTransition.duration(300)}>
  {isExpanded ? <MonthGrid /> : <WeekStrip />}
</Animated.View>
```

### NativeWind Animation Classes

NativeWind v4 has **experimental** support for Tailwind animation classes (`animate-spin`, `animate-bounce`, etc.) powered by Reanimated. These are fine for simple looping animations but are not suitable for the gesture-driven or state-driven animations in this design spec. Use Reanimated's imperative API directly for all animations in this project.

---

## Typography Strategy

The design spec uses system fonts with specific weights and letter-spacing values.

### System Font Stack

React Native uses the platform system font by default (`-apple-system` on iOS, `Roboto` on Android). No custom fonts need to be loaded. The `expo-font` package is already installed but is not needed for this redesign.

### Letter-Spacing Support

NativeWind v4 supports all tracking classes (`tracking-tighter` through `tracking-widest`) plus arbitrary values (`tracking-[0.06em]`). HIGH confidence -- verified on NativeWind docs.

The design spec's letter-spacing values map to:

| Spec Value | NativeWind Class | Usage |
|------------|-----------------|-------|
| `-0.02em` | `tracking-tight` (close enough at -0.025em) or `tracking-[-0.02em]` | Page titles, key numbers |
| `-0.01em` | `tracking-[-0.01em]` | Section headings |
| `0` | `tracking-normal` | Card titles, body text |
| `0.02em` | `tracking-[0.02em]` | Badge text |
| `0.06em` | `tracking-[0.06em]` | Overline labels |

### Font Weight Support

NativeWind supports `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800). All weights in the design spec are covered.

---

## Emoji Rendering

The design spec uses emoji extensively (chore icons, onboarding elements, carousel badges). React Native renders emoji natively via the platform's emoji font. No library needed.

For emoji in icon containers (40x40px box with background), use a simple `View` + `Text`:

```tsx
<View className="w-10 h-10 rounded-xl bg-warning-light items-center justify-center">
  <Text style={{ fontSize: 20 }}>plate emoji</Text>
</View>
```

The `fontSize` on the emoji `Text` controls the emoji size. Use `style` prop rather than NativeWind `text-*` class because emoji sizing is more predictable with explicit pixel values.

---

## What NOT to Install

| Library | Why It Seems Needed | Why It Is Not |
|---------|--------------------|--------------|
| `react-native-linear-gradient` (non-Expo) | Gradients | Use `expo-linear-gradient` instead. The non-Expo version requires native linking and a dev build. The Expo version works in Expo Go. |
| `react-native-shadow-2` | Custom shadows | React Native 0.81 (New Architecture) supports `boxShadow` style natively. No third-party shadow library needed. |
| `@gorhom/bottom-sheet` | Modals/sheets | Not in the design spec. No bottom sheets in the UI redesign. |
| `react-native-pager-view` or `react-native-snap-carousel` | Welcome carousel | 3-slide carousel does not need a library. `ScrollView` with `pagingEnabled` is sufficient. |
| `expo-font` / custom fonts | Typography | Already installed but unused. Design spec uses system fonts only. |
| `react-native-skia` | Advanced graphics/blur | Massively over-powered for this use case. `expo-blur` handles the two glass-morphism containers. Skia adds ~3MB to bundle size. |
| `tailwindcss-animate` | Tailwind animation utilities | NativeWind v4 has its own experimental animation support. But we are using Reanimated directly for all animations, so neither is needed. |
| `nativewind@preview` (v5) | Latest NativeWind | The app runs NativeWind v4.2.2 on Tailwind CSS 3.4.19. Upgrading to v5 mid-project is a breaking change (v5 requires Tailwind CSS v4.1+ and `react-native-css`). The existing v4 setup handles everything in this design spec. Do not upgrade. |
| CSS variables / `vars()` | Design tokens | The app has one theme (light mode only). Static hex values in `tailwind.config.js` are simpler and sufficient. CSS variables add indirection without benefit. |

---

## Version Compatibility Matrix (New Dependencies Only)

| Package | SDK 54 Compatible Version | In Expo Go? | New Architecture Required? |
|---------|--------------------------|-------------|---------------------------|
| expo-linear-gradient | ~15.0.8 | Yes | No |
| expo-blur | ~15.0.8 | Yes | No |
| react-native-svg | 15.12.1 | Yes | No |

All versions verified from `bundledNativeModules.json` in the installed `expo@54` package. HIGH confidence.

---

## Integration Points with Existing Setup

### babel.config.js -- NO CHANGES
The existing config with `nativewind/babel` preset and `jsxImportSource: "nativewind"` is correct.

### metro.config.js -- NO CHANGES
The existing `withNativeWind(config, { input: "./global.css" })` wrapper is correct.

### global.css -- NO CHANGES
The existing `@tailwind base/components/utilities` directives are correct.

### app.json -- NO CHANGES
No new config plugins needed. `expo-linear-gradient`, `expo-blur`, and `react-native-svg` do not require Expo config plugins.

### tailwind.config.js -- FULL REPLACEMENT
Replace the existing orange color palette with the green-based design token system (see NativeWind Theme Configuration section above). The `content` paths and `presets` stay the same.

---

## Confidence Assessment

| Decision | Confidence | Reasoning |
|----------|------------|-----------|
| expo-linear-gradient ~15.0.8 | HIGH | Version from bundledNativeModules.json, Expo Go compatible, first-party package |
| expo-blur ~15.0.8 | HIGH | Version from bundledNativeModules.json, Expo Go compatible, verified on Expo docs |
| react-native-svg 15.12.1 | HIGH | Version from bundledNativeModules.json, widely used with Expo |
| NativeWind v4 color token config | HIGH | Standard tailwind.config.js extend pattern, verified on NativeWind docs |
| NativeWind v4 fontSize tuples | MEDIUM | Tailwind CSS 3 supports this syntax; NativeWind v4 docs confirm typography support but exact tuple behavior not individually verified. Test during implementation. |
| boxShadow style on RN 0.81 | HIGH | React Native 0.81 docs confirm boxShadow property on New Architecture. SDK 54 uses New Architecture by default. |
| NativeWind shadow-* classes for standard shadows | HIGH | Verified on NativeWind docs. Requires background color on native. |
| Colored shadows via style prop | MEDIUM | boxShadow with color values confirmed in RN 0.81 docs. Exact color string format (hex with alpha like `#2D6A4F55`) needs testing -- may need `rgba()` format instead. |
| expo-blur intensity mapping | LOW | The mapping between `blur(12px)` CSS and `intensity={30}` is an estimate. Requires visual tuning. |
| ScrollView carousel approach | HIGH | Standard React Native pattern for fixed-count horizontal paging. |
| Reanimated layout transitions | HIGH | Layout transitions verified in Reanimated 4 docs. `LinearTransition.duration()` confirmed. |
| No NativeWind upgrade needed | HIGH | v4.2.2 on TW3 handles all required features (colors, shadows, typography, letter-spacing). v5 upgrade would be a breaking change with no benefit for this scope. |

---

## Sources

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- SDK features, React Native 0.81, New Architecture default (HIGH)
- [Expo LinearGradient Docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- API, installation, props (HIGH)
- [Expo BlurView Docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) -- API, intensity, tint, Expo Go support (HIGH)
- [NativeWind Box Shadow Docs](https://www.nativewind.dev/docs/tailwind/effects/box-shadow) -- shadow class support, background color requirement (HIGH)
- [NativeWind Box Shadow Color Docs](https://www.nativewind.dev/docs/tailwind/effects/box-shadow-color) -- arbitrary color shadow support (HIGH)
- [NativeWind Colors Docs](https://www.nativewind.dev/docs/customization/colors) -- custom color config pattern (HIGH)
- [NativeWind Themes Guide](https://www.nativewind.dev/docs/guides/themes) -- CSS variables, vars() function, dynamic theming (HIGH)
- [NativeWind Letter Spacing Docs](https://www.nativewind.dev/docs/tailwind/typography/letter-spacing) -- tracking class support (HIGH)
- [NativeWind Animation Docs](https://www.nativewind.dev/docs/tailwind/transitions-animation/animation) -- experimental animation class support (HIGH)
- [React Native 0.81 View Style Props](https://reactnative.dev/docs/0.81/view-style-props) -- boxShadow property documentation (HIGH)
- [Reanimated Layout Transitions Docs](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/) -- LinearTransition, CurvedTransition API (HIGH)
- [NativeWind v4 to v5 Migration](https://www.nativewind.dev/v5/guides/migrate-from-v4) -- breaking changes, why NOT to upgrade mid-project (HIGH)
- `bundledNativeModules.json` in local `node_modules/expo/` -- exact compatible version numbers (HIGH)
- [NativeWind GitHub #1442](https://github.com/nativewind/nativewind/issues/1442) -- boxShadow vs legacy shadow props discussion (MEDIUM)

---
*Stack research for: RoomY v1.1 UI Redesign*
*Researched: 2026-03-11*
