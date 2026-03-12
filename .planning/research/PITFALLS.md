# Pitfalls Research

**Domain:** UI/UX redesign of an existing Expo React Native app (NativeWind v4, Tailwind 3, Expo SDK 54)
**Researched:** 2026-03-11
**Confidence:** HIGH (pitfalls verified through NativeWind official docs, React Native official docs, expo documentation, and codebase analysis of 30 existing screen files with 74 hardcoded color references and 76 inline style objects)

## Critical Pitfalls

### Pitfall 1: Hardcoded Color Values Scattered Across 25+ Files

**What goes wrong:**
The existing codebase has 74 instances of the old orange primary color (`#f9a825`, `#f59b20`, etc.) hardcoded directly in JSX -- in `color=` props on Ionicons, in `style={{ backgroundColor: }}` objects, in NativeWind arbitrary values like `bg-[#3b82f6]`, and in third-party component theme configs (react-native-calendars). Changing the tailwind.config.js color tokens only updates NativeWind className references (`bg-primary-500`). It does NOT touch any of these hardcoded values. The result: a half-migrated app where some elements are green and others are still orange, creating visual incoherence that is worse than not redesigning at all.

**Why it happens:**
During v1.0 development, inline `color=` props were used liberally because Ionicons and other components require string color values, not className props. The Calendar component theme object uses hardcoded hex strings. These bypass the NativeWind theme system entirely.

**How to avoid:**
- Create a `lib/colors.ts` constants file exporting the new design token values FIRST, before touching any screen.
- Use grep/search to identify every hardcoded color reference: `#f9a825`, `#f59b20`, `#ef8a19`, `#e97a13`, `#66bb6a`, `#9ca3af`, `#374151`, `#d1d5db`, and gray-* references.
- Replace Ionicons `color=` props with references to the constants file: `color={colors.brand}` instead of `color="#f9a825"`.
- Replace the Calendar theme object to reference the same constants.
- Do the color constants file as the VERY FIRST task before any screen redesign begins.

**Warning signs:**
- Any screen showing a mix of orange and green elements.
- Calendar still showing orange highlights after other screens are green.
- Loading spinners still orange (`ActivityIndicator color="#f9a825"`).

**Phase to address:**
Phase 1 (Design System Foundation) -- create color constants and update tailwind.config.js. Must be complete before ANY screen work begins.

---

### Pitfall 2: NativeWind className and Inline style Specificity Conflicts

**What goes wrong:**
NativeWind v4 has a defined specificity order: (1) `!important` styles, (2) inline `style={}` props, (3) `className` props. When you add new NativeWind classes to a component that already has an inline `style` prop, the inline style WINS for any overlapping properties. The redesign adds `className="bg-card rounded-2xl shadow"` to a View that already has `style={{ backgroundColor: '#fff', borderRadius: 16 }}` -- the inline style silently overrides the className, and the developer does not realize the NativeWind values are being ignored.

The existing codebase has 76 `style={` occurrences across 19 files. Each is a potential conflict during the redesign.

**Why it happens:**
In standard CSS, later declarations override earlier ones. NativeWind v4 reverses this intuition: inline styles have HIGHER specificity than className. Developers accustomed to web Tailwind expect className to be the primary styling mechanism, but inline styles silently win.

**How to avoid:**
- When redesigning a component, REMOVE all inline `style` props that set visual properties (colors, borders, padding, margins, borderRadius).
- Keep inline styles ONLY for values that cannot be expressed in NativeWind (dynamic values computed at runtime, like `style={{ width: calculatedWidth }}`).
- Never mix `className` and `style` for the same property on the same element.
- If you must override a className from a style prop, use the `!important` modifier: `className="!text-red-500"`.

**Warning signs:**
- Styles not updating despite correct className values.
- Different visual results on iOS vs Android for the same component.
- Border radius appearing wrong despite correct `rounded-*` classes.

**Phase to address:**
Every phase -- but establish the rule in Phase 1 (Design System Foundation) and enforce it as each screen is redesigned.

---

### Pitfall 3: Shadow Rendering Differences Between iOS and Android

**What goes wrong:**
The design spec calls for `shadow` and `shadowMd` elevation tokens with CSS-style box-shadow values (`0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`). In NativeWind v4, shadow classes (`shadow`, `shadow-sm`, `shadow-md`) are compiled to iOS `shadowOffset`/`shadowOpacity`/`shadowRadius` properties AND Android `elevation`. These produce visually different results: iOS shadows are soft and directional, Android elevation shadows are uniform and baked into the system. The card designs from the mockup will look different on each platform. Additionally, shadows on Android will NOT render at all if the component has no `backgroundColor` set.

**Why it happens:**
React Native does not have a unified shadow model. iOS and Android use fundamentally different rendering approaches. NativeWind v4 translates Tailwind shadow classes into the platform-specific equivalents, but the visual output differs. The design spec was created in a web context (JSX/HTML mockup) where `box-shadow` renders identically across browsers.

**How to avoid:**
- Always set `backgroundColor` on any element that needs a shadow (use `bg-card` or `bg-white`).
- Accept that shadows will look slightly different on iOS vs Android. Do NOT try to make them pixel-identical.
- Use only the built-in NativeWind shadow scale (`shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`) rather than arbitrary shadow values (`shadow-[...]`), since arbitrary values are web-only in NativeWind v4.
- Test every shadow on both iOS and Android physical devices. Shadows can look fine in iOS Simulator but wrong on Android emulator.
- For the colored shadow on the FAB button (`0 4px 16px {brand}55`), this is NOT achievable with NativeWind shadow classes. Use an inline style with `Platform.select()` to set `shadowColor` on iOS and accept that Android elevation shadows are always dark gray.

**Warning signs:**
- Cards appearing "flat" on Android (no visible shadow) despite correct className.
- Colored shadows rendering on iOS but showing as default dark gray on Android.
- Shadow clipping or being cut off by parent container `overflow: hidden`.

**Phase to address:**
Phase 1 (Design System Foundation) -- define shadow utility approach. Phase 2+ (screen rebuilds) -- verify per-screen on both platforms.

---

### Pitfall 4: Glassmorphism / backdrop-filter Does Not Exist in React Native

**What goes wrong:**
The design spec explicitly calls for a "glass-morphism container" on the onboarding welcome carousel with `backdrop-filter: blur(12px)`, `rgba(255,255,255,0.15)` background, and translucent borders. The CSS `backdrop-filter` property does not exist in React Native. There is no equivalent style prop. The design as specified is impossible to implement with standard React Native components.

**Why it happens:**
The design spec was created as a web mockup (JSX/HTML) where `backdrop-filter` is a standard CSS property. The designer/spec author did not account for React Native rendering limitations.

**How to avoid:**
- Use `expo-blur` (`BlurView`) to approximate the effect. It supports `intensity` and `tint` props. On Expo SDK 54, `expo-blur` is included in Expo Go, so no custom dev build is needed.
- Wrap the content area in a `BlurView` positioned absolutely over the gradient background.
- Accept visual differences: `expo-blur` produces a system-level blur that varies between iOS (very smooth, gaussian) and Android (less refined, especially below API 31).
- Alternative approach: skip true blur entirely and use a semi-transparent white overlay (`rgba(255,255,255,0.2)`) with a subtle border. This is visually "close enough" on mobile screens where the effect is subtle, and avoids platform inconsistency and performance overhead.
- Do NOT use `react-native-skia` for this single effect -- it is a heavy dependency (adds ~2MB to bundle) and is overkill for one decorative element.

**Warning signs:**
- `backdrop-filter` appearing in any style prop (it will be silently ignored).
- Onboarding hero section looking flat/opaque instead of translucent on either platform.
- Performance issues (dropped frames) when blurring animated content beneath the overlay.

**Phase to address:**
Phase 3 or whichever phase handles onboarding carousel rebuild -- decide the blur approach BEFORE building the carousel.

---

### Pitfall 5: Breaking Existing Functionality During Visual-Only Changes

**What goes wrong:**
The project scope explicitly says "presentation layer only, all data models and APIs stay untouched." But visual redesigns routinely break functionality in subtle ways: restructuring a `Pressable` wrapper changes the touch target, moving elements inside a `ScrollView` breaks scroll behavior, changing a `View` hierarchy around a form input breaks keyboard avoidance, and renaming or restructuring components breaks expo-router navigation. The most dangerous pattern is when a screen "looks correct" in a static screenshot but interactive behaviors (pull-to-refresh, swipe-to-delete, keyboard dismiss, deep link navigation) are broken.

**Why it happens:**
Visual redesigns feel "safe" because no business logic is changing. But in React Native, layout structure IS behavior -- the component tree determines touch handling, scroll behavior, keyboard interaction, and accessibility. Restructuring JSX for visual purposes silently changes all of these.

**How to avoid:**
- Follow a strict verification checklist after EVERY screen redesign (the design spec already includes one -- use it).
- Test each screen's interactive behaviors, not just its visual appearance: add an expense, complete a chore, check off a grocery item, pull-to-refresh, navigate via tab bar, navigate via deep link.
- Keep the screen's functional JSX structure intact when possible. Wrap existing components in new styled containers rather than rewriting the component tree.
- Do NOT combine visual redesign with functional changes or refactors. If a screen needs a bug fix AND a redesign, commit the bug fix first, then redesign.
- Redesign one screen at a time. Never redesign multiple screens in a single commit.

**Warning signs:**
- "It looks right" but no one has actually tapped the buttons.
- Pull-to-refresh stops working after wrapping content in a new parent View.
- Keyboard covers input fields after changing the scroll container.
- Tab bar icons stop navigating after changing the layout hierarchy.

**Phase to address:**
Every phase -- include the verification checklist as a gate for each screen delivery. Never skip it.

---

### Pitfall 6: Gradient Avatars Require LinearGradient, Not CSS

**What goes wrong:**
The design spec defines member avatars with `linear-gradient(135deg, #E76F51, #F4A261)` backgrounds. In React Native, `View` does not support `background: linear-gradient(...)` as a style prop. The gradient is silently ignored, producing an avatar with no background color -- a blank circle with white text on a white card, invisible to the user. Every avatar on every screen breaks.

**Why it happens:**
CSS gradients do not exist in React Native. React Native's style system only supports solid color `backgroundColor` values. Gradients require a dedicated `<LinearGradient>` component from `expo-linear-gradient`.

**How to avoid:**
- Install `expo-linear-gradient` (it is included in Expo Go SDK 54, no custom dev build needed).
- Build the Avatar component using `<LinearGradient colors={[startColor, endColor]} start={{x:0, y:0}} end={{x:1, y:1}}>` as the background.
- Define member gradient color pairs in the design token constants.
- The balance summary card also uses a gradient background (`#2D6A4F` to `#1B4332`) -- use `LinearGradient` there too.
- Each carousel slide uses a different gradient background -- same approach.

**Warning signs:**
- Avatars appearing as solid color circles instead of gradients.
- Attempting to set `background` or `backgroundImage` style props (these do not exist in React Native).

**Phase to address:**
Phase 1 (Design System Foundation) -- build the Avatar component with LinearGradient. It is used on nearly every screen, so it must exist before screen rebuilds begin.

---

### Pitfall 7: Carousel Swipe Gestures Conflicting with Tab Navigation

**What goes wrong:**
The onboarding welcome screen has a horizontal swipe carousel. The main app has a tab bar navigator. If the carousel is built inside a screen that also has horizontal swipe gesture handling (e.g., swipe-to-go-back on iOS stack navigator, or swipe between tabs), the gestures conflict. The user tries to swipe the carousel but triggers a navigation gesture instead, or vice versa. The current welcome screen uses a basic `ScrollView` with `horizontal pagingEnabled`, which mostly works but can conflict with stack navigator gestures.

**Why it happens:**
React Native Gesture Handler routes touch events through a gesture system that can only handle one gesture responder at a time. When multiple components (carousel `ScrollView`, stack navigator, tab navigator) all want horizontal swipe ownership, the first one to claim the gesture wins. The others are blocked.

**How to avoid:**
- The welcome carousel is inside the `(auth)` route group, which uses a stack navigator without tabs. This is inherently safer than putting a carousel inside a tabbed screen.
- Use `ScrollView` with `pagingEnabled` (the current approach) rather than introducing a third-party carousel library with custom gesture handling.
- On iOS, disable the stack navigator's `gestureEnabled` on the welcome screen specifically, since there is no screen to swipe back to.
- Do NOT use `react-native-snap-carousel` -- it is unmaintained and has known gesture conflicts. If a more advanced carousel is needed, use `react-native-reanimated-carousel`, which is built on Reanimated and works with the gesture handler system.
- Keep the home screen's week-strip calendar as a non-swipeable row, NOT a horizontal `ScrollView`, to avoid conflict with tab swipe gestures.

**Warning signs:**
- Carousel swipe only works on one platform but not the other.
- Swiping the carousel triggers a navigation back gesture on iOS.
- Carousel "sticks" and does not snap to pages cleanly.

**Phase to address:**
Onboarding phase (carousel rebuild) -- test gesture isolation carefully. Home screen phase (calendar strip) -- avoid horizontal scroll for the week strip.

---

### Pitfall 8: NativeWind Tailwind Content Paths Missing New Component Directories

**What goes wrong:**
The current `tailwind.config.js` has `content` paths for `./app/**`, `./components/**`, and `./lib/**`. If the redesign creates shared components in a new directory (e.g., `./ui/**`, `./design-system/**`, or `./shared/**`), NativeWind will not scan those files for class names. Tailwind's purge step will strip out any classes that are only used in the unscanned directory. The result: components render with zero styling in production, but may appear to work in development due to caching.

**Why it happens:**
Tailwind CSS tree-shakes unused classes based on what it finds in the `content` paths. If a file using `bg-brand` is not in a scanned directory, that class gets purged from the output. NativeWind inherits this behavior. Developers create a new folder, use classes, and never update the config.

**How to avoid:**
- If creating a new shared component directory, immediately add it to `content` in `tailwind.config.js`.
- Better yet: put all shared UI components in the existing `./components/` directory (already in the content paths) rather than creating a new top-level folder.
- After any directory structure changes, clear the Metro cache (`npx expo start --clear`) and verify styles apply.

**Warning signs:**
- Components render unstyled (no colors, no padding, no borders) in production but work in dev.
- After a `--clear` restart, previously-working styles vanish.
- New custom Tailwind classes (e.g., `bg-brand`) not applying.

**Phase to address:**
Phase 1 (Design System Foundation) -- decide the component directory structure and update tailwind.config.js content paths before creating any components.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping some inline `style={}` instead of converting to className | Faster per-screen migration | Mixed styling approaches make future changes harder; NativeWind v5 may break mixed styles entirely | Acceptable for truly dynamic runtime-computed values (animation interpolations, calculated widths), never for static visual properties |
| Using arbitrary NativeWind values like `text-[13px]` instead of extending the theme | Avoids touching tailwind.config.js | Arbitrary values bypass the design token system and cannot be centrally updated | Never -- extend the theme instead with custom values like `text-meta` |
| Hardcoding member gradient colors in each screen | Works for the current 3 members | Adding a 4th member requires updating every screen | Never -- define colors in a single constants file or database |
| Skipping the iOS-specific `Platform.select()` for shadows | Less code, shadows "work" on iOS | Android shadows look wrong or invisible | Never -- always test both platforms |
| Using `expo-blur` BlurView on Android SDK 54 for glassmorphism | Visual parity with iOS | Android blur performance is inconsistent below API 31; may cause dropped frames on older devices | Acceptable only if you add a `Platform.OS === 'android'` fallback to a solid semi-transparent background |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| react-native-calendars theme | Setting the Calendar `theme` prop once and forgetting to update it when the color system changes | Create a shared `calendarTheme` object that references the color constants file; import it in every screen that renders a Calendar |
| expo-linear-gradient with NativeWind | Trying to use `className` on `LinearGradient` -- it does not support className natively | Use `cssInterop` or `remapProps` from NativeWind to map `className` to `style`, OR just use inline `style` on LinearGradient components (since the gradient props like `colors` and `start`/`end` cannot be expressed in Tailwind anyway) |
| Ionicons color prop | Using className `text-brand` on the Ionicons component and expecting it to change the icon color | Ionicons requires a `color` prop (string). Use `color={colors.brand}` from the constants file. NativeWind className does NOT affect Ionicons color |
| Tab bar styling | Setting tab bar colors via NativeWind className on the Tabs component | Tab bar styling uses `tabBarStyle` and `tabBarActiveTintColor` props (React Navigation API), not NativeWind className. These must be updated with color constant references |
| expo-blur inside ScrollView | Wrapping content in BlurView inside a ScrollView and expecting it to blur the content behind it | BlurView blurs what is BEHIND the BlurView in the z-axis (the view beneath it), not the content inside it. Position BlurView absolutely over the gradient background, not around the content |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animating shadows on every frame | Frame drops visible during scroll, especially on Android | Apply shadows as static styles. Never animate shadow values. Use opacity animation on a pre-shadowed component instead | Immediately on mid-range Android devices |
| Re-rendering entire lists on color theme change | Noticeable jank when the screen first loads after a style change | Memoize list items with `React.memo()`. Use `useMemo()` for computed style objects that reference constants | When list exceeds ~20 items |
| Gradient components inside FlatList items | Each `LinearGradient` creates a native view; 50+ in a list causes memory pressure | Pre-render avatar components with `React.memo()`. For long lists, use a solid color fallback and only render gradients for visible items | Lists with 30+ gradient-containing items |
| BlurView in an animated carousel | Each carousel slide with a BlurView re-computes the blur effect during swipe animation | Apply BlurView only to the active/visible slide. Disable blur on off-screen slides. Or use a static semi-transparent overlay instead | Immediately on Android, noticeable on older iPhones |
| Using JS-thread Animated API for carousel transitions | Swipe animation stutters when JS thread is busy (e.g., fetching data) | Use `react-native-reanimated` for any user-facing gesture-driven animation. The built-in Animated API runs on the JS thread and competes with data fetching and rendering | Noticeable when network requests fire during animation |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Redesigning all screens at once, shipping a "big bang" update | Users lose their mental model of where things are; everything looks unfamiliar at once | Redesign screen-by-screen. Ship the design system and shared components first, then migrate one screen at a time so the visual language converges gradually |
| Over-designing empty states | Empty states with elaborate illustrations distract from the action the user needs to take (add first expense, invite roommate) | Keep empty states simple: one emoji or icon, one headline, one subtitle, one action button. The design spec already follows this pattern -- do not over-elaborate |
| Changing touch targets during visual redesign | Buttons or tappable areas become smaller or shift position; users miss taps | Maintain minimum 44x44pt touch targets on all interactive elements. When restructuring a card layout, ensure the Pressable wrapper covers the same area |
| Custom toggle switches that feel non-native | Toggles that do not have the right "snap" feel; users are unsure if the toggle registered | Use `react-native` `Switch` for native feel, or build custom toggles with Reanimated for smooth spring animation. Never use `Animated` from React Native core for toggle animations -- it is too slow |
| Calendar week strip that is hard to read | Tiny date numbers, no clear "today" indicator, event dots too small | Ensure today has a filled background (brand color) that is at least 32px diameter. Event dots must be at least 4px diameter. Past dates should be visually dimmed but still readable |

## "Looks Done But Isn't" Checklist

- [ ] **Color migration:** Search for `#f9a825`, `#f59b20`, `#66bb6a`, `#9ca3af`, `#374151` across all files -- any remaining instances mean the migration is incomplete
- [ ] **Tab bar colors:** Verify `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle.backgroundColor`, and `tabBarStyle.borderTopColor` in `_layout.tsx` are updated to the new palette
- [ ] **ActivityIndicator colors:** Search for `<ActivityIndicator` and verify every instance uses the new brand color, not hardcoded orange
- [ ] **StatusBar style:** Verify `app.json` splash `backgroundColor` and any `<StatusBar>` components use the new `bg` color (`#FAFAF8`)
- [ ] **Shadows on Android:** Load every card-containing screen on a physical Android device and verify shadows are visible (not invisible due to missing background color)
- [ ] **Calendar theme:** Open the home screen calendar and verify selected day color, today text color, and arrow colors all match the new brand green
- [ ] **Ionicons color props:** Spot-check at least 5 screens that use Ionicons and verify icon colors match the new design system (not old orange or hardcoded gray)
- [ ] **Pull-to-refresh:** Test pull-to-refresh on home, expenses, groceries, and chores screens -- verify it still works after layout restructuring
- [ ] **Keyboard avoidance:** Open the add-expense, add-chore, and sign-up screens and verify the keyboard does not cover input fields
- [ ] **Navigation:** Tap every tab, navigate to every settings sub-screen, and verify no navigation regressions
- [ ] **Avatar gradients:** Verify member avatars show gradient backgrounds (not solid colors or blank circles) on both iOS and Android
- [ ] **Safe area:** Verify content does not overlap the notch/status bar or home indicator on iPhone and Android devices with cutouts

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Half-migrated colors (orange + green mix) | LOW | Run a project-wide search-and-replace for old hex values. Takes 1-2 hours with the color constants file as the source of truth |
| Inline style overriding className | LOW | Remove the conflicting inline style prop from the element. Takes minutes per component once identified |
| Broken shadows on Android | LOW | Add `bg-white` or `bg-card` className to every shadowed element. Batch fix across all screens |
| Glassmorphism not rendering | MEDIUM | Replace `backdrop-filter` approach with `expo-blur` BlurView or a semi-transparent overlay. Requires restructuring the component tree |
| Carousel gesture conflict | MEDIUM | Disable stack navigator gesture on the carousel screen. If carousel library conflicts, replace with ScrollView + pagingEnabled (the current working approach) |
| Broken pull-to-refresh or keyboard avoidance | LOW-MEDIUM | Undo the JSX restructuring that broke it. Keep the outer ScrollView/KeyboardAvoidingView structure from the working v1.0 screen |
| NativeWind styles not applying (content path issue) | LOW | Add the missing directory to `tailwind.config.js` content array. Clear Metro cache. Restart |
| LinearGradient not rendering (component not imported) | LOW | Install expo-linear-gradient, import the component, replace the View with LinearGradient |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hardcoded color values (#1) | Phase 1: Design System Foundation | Grep for old hex values returns zero results |
| className vs style conflicts (#2) | Phase 1 + every subsequent phase | No inline `style` props for static visual properties in redesigned components |
| Shadow rendering differences (#3) | Phase 1: define approach; Phase 2+: verify per screen | Load each screen on both iOS simulator and Android device/emulator |
| Glassmorphism impossibility (#4) | Onboarding phase (carousel build) | BlurView or semi-transparent overlay renders correctly on both platforms |
| Breaking existing functionality (#5) | Every phase | Run the 12-point verification checklist from the design spec after every screen |
| Gradient avatars (#6) | Phase 1: build Avatar component | Avatars render with gradient backgrounds on both platforms |
| Carousel gesture conflicts (#7) | Onboarding phase | Carousel swipes cleanly without triggering navigation gestures on both platforms |
| Content path configuration (#8) | Phase 1: finalize directory structure | All components in new directories render with correct NativeWind styles |

## Sources

- [NativeWind Style Specificity](https://www.nativewind.dev/docs/core-concepts/style-specificity) -- className vs inline style precedence rules (HIGH confidence)
- [NativeWind Box Shadow](https://www.nativewind.dev/docs/tailwind/effects/box-shadow) -- shadow class support and Android background requirement (HIGH confidence)
- [NativeWind Third-Party Components](https://www.nativewind.dev/docs/guides/third-party-components) -- cssInterop and remapProps for non-className components (HIGH confidence)
- [NativeWind Troubleshooting](https://www.nativewind.dev/docs/getting-started/troubleshooting) -- content path and caching issues (HIGH confidence)
- [NativeWind v4 + Expo SDK 54 compatibility](https://medium.com/@matthitachi/nativewind-styling-not-working-with-expo-sdk-54-54488c07c20d) -- NativeWind v4.2.0+ required for SDK 54 (MEDIUM confidence)
- [React Native Shadow Props](https://reactnative.dev/docs/shadow-props) -- platform differences in shadow rendering (HIGH confidence)
- [BlurView - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/) -- expo-blur API and platform support (HIGH confidence)
- [LinearGradient - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- gradient component for React Native (HIGH confidence)
- [React Native Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) -- UI thread vs JS thread animation (HIGH confidence)
- [NativeWind className and style conflict Issue #665](https://github.com/nativewind/nativewind/issues/665) -- inconsistent style merging reports (MEDIUM confidence)
- [NativeWind className and style conflict Issue #1018](https://github.com/nativewind/nativewind/issues/1018) -- styles not working in className but working in style prop (MEDIUM confidence)
- [Expo Fonts Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- font loading and cross-platform differences (HIGH confidence)
- Codebase analysis: 74 hardcoded primary color references across 25 files, 76 inline style objects across 19 files, 158 inline color prop references across 30 files (direct observation, HIGH confidence)

---
*Pitfalls research for: RoomY v1.1 UI Redesign (Expo/NativeWind/React Native)*
*Researched: 2026-03-11*
