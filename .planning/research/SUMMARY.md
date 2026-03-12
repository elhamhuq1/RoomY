# Project Research Summary

**Project:** RoomY v1.1 UI Redesign
**Domain:** Mobile UI/UX redesign — Expo React Native, presentation layer only
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

RoomY v1.1 is a presentation-layer-only visual redesign of an existing Expo React Native household management app. The core challenge is migrating a working codebase from an ad-hoc orange color system with 74 hardcoded hex values and zero shared components to a cohesive green-based design token system with a reusable component library — while preserving all existing data fetching, business logic, navigation, and realtime behaviors. This is not a feature build; it is a systematic visual overhaul of 13 screens and their shared infrastructure.

The recommended approach is strictly dependency-ordered: design tokens first, then shared components, then navigation chrome, then main tab screens, then onboarding. Every subsequent phase depends on the phase before it. Skipping ahead or working in parallel across phases risks visual incoherence (old orange mixing with new green), component availability gaps, and broken interactive behaviors that are hard to trace back to a cause. Two new Expo-native dependencies are required — `expo-linear-gradient` for gradient avatars, cards, and hero sections, and `expo-blur` (or a simulated semi-transparent fallback) for the glassmorphism onboarding carousel. No other new libraries are needed.

The key risks are all migration risks, not build risks. The codebase has 74 hardcoded color references, 76 inline style objects that conflict with NativeWind className specificity rules, platform-divergent shadow rendering on iOS vs Android, and a CSS `backdrop-filter` requirement that has no direct React Native equivalent. All of these are manageable with a strict phase-first, verify-before-proceeding discipline. The design spec's own 12-point verification checklist must gate every screen delivery.

---

## Key Findings

### Recommended Stack

The existing stack (Expo SDK 54, NativeWind v4.2.2, Tailwind CSS 3.4.19, react-native-reanimated 4.1.1, react-native-gesture-handler) handles everything the redesign requires. No major stack changes are needed. The only additions are two Expo-native packages: `expo-linear-gradient ~15.0.8` and `expo-blur ~15.0.8` — both part of the Expo SDK, both Expo Go compatible with no dev build required. `react-native-svg 15.12.1` is an optional addition for complex gradient avatar clipping, but `expo-linear-gradient` with `borderRadius` is sufficient for the standard round avatar case.

NativeWind v4 must NOT be upgraded to v5 mid-project. v5 requires Tailwind CSS v4.1+ and `react-native-css` — a breaking change that would consume the entire project scope. The existing v4 setup fully supports the design spec's token system, typography scale, shadow classes, and letter-spacing. The `tailwind.config.js` requires a full replacement of the color palette (orange to green), and the `fontSize` extension should be populated with the 8 named type presets from the design spec.

**Core technologies:**
- `expo-linear-gradient ~15.0.8`: Gradient backgrounds for avatars, balance card, hero sections, icon containers — the only way to render CSS-style linear gradients in React Native. Expo Go compatible.
- `expo-blur ~15.0.8`: BlurView for glassmorphism containers on the onboarding welcome carousel. Expo Go compatible. Semi-transparent overlay fallback recommended for Android SDK 54 stability.
- `react-native-reanimated ~4.1.1` (already installed): Calendar collapse/expand animation, toggle switch knob, carousel gradient transitions.
- NativeWind v4 + Tailwind CSS 3 (already installed): All NativeWind className-based styling; requires replacing the existing orange palette with the new green design token system in `tailwind.config.js`.
- `lib/theme/colors.ts` (new file): Hex constant exports for use in inline style props where NativeWind cannot reach — gradient arrays, colored shadows, Ionicons `color=` props, react-native-calendars theme object.

### Expected Features

**Must have (table stakes):**
- Consistent green brand color token system replacing all orange — visual incoherence is worse than no redesign
- Shared component library (Avatar, Card, Badge, IconContainer, Button, FAB, SectionHeader, ToggleSwitch, StepProgressBar) — all screens depend on these
- Typography hierarchy with 8 named presets (page-title, key-number, section-heading, card-title, body, metadata, overline, badge)
- Gradient member avatars with deterministic (non-index-based) color assignment — currently duplicated in 3 files with position-dependent colors
- Balance summary card with dark gradient background on home screen — the single most important number has no visual prominence currently
- Branded tab bar (green active tint, correct sizing, white background with top border)
- Onboarding welcome carousel with gradient hero sections — first impression determines user trust

**Should have (differentiators):**
- Collapsible week-strip calendar on home screen (custom component + Reanimated animation)
- Glassmorphism logo container on onboarding hero (BlurView or semi-transparent fallback)
- Needs-attention feed on home screen (pending chores, disputes, grocery updates)
- Gradient color interpolation between carousel slides based on scroll offset
- Weekly timeline section on home screen
- Module toggle cards with visual active/inactive state changes (whole card as tap target)
- Dispute visual highlighting with full red-tinted card rows on chores screen
- Settlement visual de-emphasis (dimmed text) vs outstanding expense rows

**Defer to post-redesign:**
- Dark mode — doubles design surface, multiplies gradient/blur testing complexity
- History filter UI — feature addition, not visual redesign
- Skeleton loading states — ActivityIndicator color update is sufficient
- Custom pull-to-refresh animation — built-in RefreshControl with brand tintColor is correct
- Custom icon library — keep Ionicons, use emoji where the spec calls for it

### Architecture Approach

The architecture is a two-layer model: (1) a design token layer (`tailwind.config.js` for NativeWind classes + `lib/theme/` constants for inline styles) and (2) a shared component library under `components/ui/`. All screen rebuilds happen in-place (same file paths, no new route files) to avoid expo-router routing changes. Data fetching, Supabase queries, RLS policies, realtime subscriptions, and all business logic are completely untouched. The component tree restructuring must preserve existing scroll containers, gesture responders, keyboard avoidance wrappers, and Pressable touch targets.

**Major components:**
1. `tailwind.config.js` (full replacement) — NativeWind className token system with brand/danger/warning/success/text/border palette and 8 named font size presets
2. `lib/theme/` (colors.ts, shadows.ts, member-colors.ts, chore-emojis.ts) — design token constants for inline style props, gradient arrays, Ionicons props
3. `components/ui/` (12 shared components) — reusable visual building blocks consumed by all screens; Avatar is the most critical (used on every screen)
4. `components/ui/GradientBackground.tsx` — `expo-linear-gradient` wrapper with `cssInterop` for NativeWind className support on non-gradient styles
5. Custom `WeekStrip` component — 7-day horizontal row with Reanimated `useSharedValue` + `withTiming` accordion expand/collapse to react-native-calendars full month view
6. In-place screen rewrites — all JSX returns are replaced but file paths, imports, data hooks, and business logic at the top of each file remain untouched

### Critical Pitfalls

1. **Hardcoded color migration is incomplete** — 74 instances of `#f9a825` and related orange hex values across 25 files bypass NativeWind entirely (Ionicons `color=` props, Calendar theme object, ActivityIndicator, StatusBar). Create `lib/theme/colors.ts` FIRST, then grep-and-replace before any screen redesign begins.

2. **NativeWind className loses to inline style** — NativeWind v4 specificity: inline `style={}` beats `className`. The 76 existing inline style objects silently override new NativeWind classes added to the same element. Rule: remove all inline static-visual style props when redesigning a component; keep inline styles only for runtime-computed values.

3. **Shadows require background color on Android** — NativeWind shadow classes produce no visible shadow without `backgroundColor` on the element. Always pair with `bg-card` or `bg-white`. Colored shadows (FAB, avatars) require `Platform.select()` inline style objects — NativeWind shadow classes cannot express colored shadows.

4. **CSS `backdrop-filter` does not exist in React Native** — The design spec's glassmorphism containers cannot be implemented with standard React Native. Use `expo-blur` `BlurView` (intensity ~30) for iOS with a `Platform.OS === 'android'` fallback to `rgba(255,255,255,0.15)` semi-transparent overlay. Or use the overlay approach on both platforms — it achieves 90% of the visual effect with zero platform risk.

5. **Breaking existing functionality during visual-only changes** — JSX restructuring silently changes scroll behavior, touch handling, keyboard avoidance, and navigation. Run the 12-point verification checklist (pull-to-refresh, keyboard avoidance, every navigation tap, avatar gradients, shadows on Android) after EVERY screen delivery. Never batch multiple screen redesigns in one commit.

6. **NativeWind gradient classes silently do nothing on native** — `bg-gradient-to-r from-brand to-brand-dark` compiles to nothing on iOS/Android (web-only in NativeWind). Always use `expo-linear-gradient` via the `GradientBackground` wrapper. This is a silent failure — no error, just a missing gradient.

7. **Tailwind content path must cover all component directories** — Any shared component outside `./app/`, `./components/`, or `./lib/` gets its NativeWind classes purged. All new components go under `components/ui/` (already in content paths). Update `tailwind.config.js` immediately if any new top-level directory is added.

---

## Implications for Roadmap

The dependency graph forces a strict 5-phase sequence. Phases 4a–4d (tab screens) have no cross-dependencies and can be parallelized, but must not start before Phases 1–3 complete.

### Phase 1: Design System Foundation
**Rationale:** Every subsequent phase depends on this. Shared colors, typography, shadow approach, and component directory structure must be locked before any screen work begins. Without this, each screen rebuild makes independent token decisions and the codebase visually diverges.
**Delivers:** `tailwind.config.js` replacement (green palette + 8 font presets), `lib/theme/colors.ts`, `lib/theme/shadows.ts`, `lib/theme/member-colors.ts`, `lib/theme/chore-emojis.ts`, install `expo-linear-gradient` and `expo-blur`.
**Addresses:** Consistent color token system, typography hierarchy, shadow system (all Design Foundation table stakes)
**Avoids:** Pitfall #1 (hardcoded color migration), Pitfall #7 (content path configuration), Pitfall #6 (gradient avatars requiring LinearGradient)
**Research flag:** Standard patterns — NativeWind theme config extension is thoroughly documented. No deeper research needed.

### Phase 2: Shared Component Library
**Rationale:** All 13 screen rebuilds consume shared components. Avatar is the most critical (used on every main screen). Building components before screens means consistent implementation everywhere and faster per-screen delivery.
**Delivers:** `components/ui/` — GradientBackground, Avatar (gradient + 6 sizes + member color pool), Card, Badge, IconContainer, Button, FAB, SectionHeader, StepProgressBar, ToggleSwitch (Reanimated), BackButton, Divider.
**Addresses:** All "Shared Components" table stakes; Avatar differentiator (gradient + deterministic colors)
**Avoids:** Pitfall #2 (className vs inline style specificity), Pitfall #3 (shadow background color requirement)
**Research flag:** Standard patterns for most components. Toggle switch (Reanimated spring animation) and Avatar (LinearGradient + cssInterop) may warrant a quick implementation spike before committing to the full pattern.

### Phase 3: Navigation Chrome
**Rationale:** The tab bar is always visible. Updating it before screen rebuilds means developers see the new visual context immediately during development, rather than new green screens inside an old orange tab bar.
**Delivers:** `app/(app)/(tabs)/_layout.tsx` (tab bar: brand green active, textTertiary inactive, 84px height, card bg, top border), `app/(app)/_layout.tsx` (header colors), `app/_layout.tsx` (ActivityIndicator brand color).
**Addresses:** Tab bar table stakes (branded tab bar)
**Avoids:** Mixed old/new visual context creating confusion during development
**Research flag:** Standard patterns — React Navigation `tabBarStyle` and tintColor props are well-documented.

### Phase 4a: Home Screen
**Rationale:** Daily landing screen; highest user visibility. The custom `WeekStrip` with Reanimated collapse/expand is the highest-complexity single UI element in the entire redesign. Home also requires data wiring for the balance summary card (`get_household_balances` RPC, already used by expenses.tsx) and the needs-attention feed (aggregates chores and disputes).
**Delivers:** Week-strip calendar (custom 7-day row, today highlight, event dots, Reanimated accordion expand/collapse to react-native-calendars month view), balance summary gradient card, members card with household label and invite link, needs-attention feed, date-aware greeting header, weekly timeline section.
**Addresses:** All Home screen table stakes + "Needs-attention feed", "Balance summary card", "Collapsible week-strip calendar" differentiators
**Avoids:** Pitfall #5 (must preserve pull-to-refresh and calendar navigation); week strip must NOT be a horizontal ScrollView — would conflict with tab swipe gestures
**Research flag:** NEEDS RESEARCH during planning — Reanimated accordion for the calendar has non-trivial implementation choices (fixed-height vs measured height approach). Needs-attention data aggregation query strategy needs design before implementation.

### Phase 4b: Expenses Screen
**Rationale:** Core money feature. After Home, the most frequently visited screen. Mostly component composition (Avatar, Card, Badge, IconContainer) with expense/settlement visual differentiation as the key design change.
**Delivers:** Balance cards restyled (Avatar, "owes you $X" in green text, Remind button), expense/settlement visual differentiation (warning icon container for expenses, success icon container for settlements, dimmed settlement row text), FAB restyled (52px rounded square, colored shadow), date-grouped overline headers updated to spec style.
**Addresses:** All Expenses screen table stakes
**Avoids:** Pitfall #5 (preserve Venmo deep link, settle navigation with params, date grouping logic, pull-to-refresh)
**Research flag:** Standard patterns — can skip deeper research.

### Phase 4c: Groceries Screen
**Rationale:** Fewest visual changes of the four tab screens. Mostly component adoption (SectionHeader, Card wrappers) plus two targeted additions: custom circular checkbox component and member attribution avatars on grocery item rows.
**Delivers:** TO GET / DONE section headers with item counts in Card wrappers, 22px circle checkboxes (brand fill when checked, textTertiary border when unchecked), member attribution 22px avatars on item rows (requires profiles fetch for item creators), styled quick-add input (44px brand square add button).
**Addresses:** All Groceries screen table stakes
**Avoids:** Pitfall #5 (preserve Supabase realtime subscription, swipe-to-delete, optimistic updates, quantity stepper)
**Research flag:** Standard patterns — can skip deeper research.

### Phase 4d: Chores Screen
**Rationale:** More redesign complexity than Groceries (emoji mapping, dispute card variant, stats row) but still primarily component composition. The Card `variant="dispute"` introduces the dangerLight background + danger border pattern used for dispute rows.
**Delivers:** Emoji icon containers via `getChoreEmoji()` string-matching map, stats row (Pending/Disputed/Streak) restyled with overline labels and semantic colors, dispute row highlighting (dangerLight bg tint on full row, dangerLight border on icon container), frequency Badge, checkmark completion button at 40px+ with brand colors.
**Addresses:** All Chores screen table stakes + "Dispute visual highlighting" and "Streak celebration with fire emoji" differentiators
**Avoids:** Pitfall #5 (preserve complete/claim/dispute/swap actions, Alert confirmations, swap member picker modal, stale dispute revert logic)
**Research flag:** Standard patterns — can skip deeper research.

### Phase 5: Onboarding Flow
**Rationale:** Seen once per user; lower frequency than main screens. The welcome carousel is the highest-complexity single feature (gradient hero, glassmorphism, 3-slide carousel) but ships last because it has no impact on daily returning users. All shared components from Phase 2 must exist before this phase begins.
**Delivers:** Welcome carousel (GradientBackground hero sections, glassmorphism or semi-transparent overlay containers, page dots, scroll with pagingEnabled), sign-up/sign-in restyled (BackButton, social auth buttons, Divider), display name screen (StepProgressBar 1/3, gradient avatar preview), setup choice cards (gradient icon containers, StepProgressBar 2/3), create household (gradient house icon), invite code celebration screen (success icon, code card, share button), module selection (ToggleSwitch cards, StepProgressBar 3/3, locked Expenses toggle).
**Addresses:** All Onboarding Flow table stakes + "Glassmorphism onboarding hero" and "Gradient color transitions" differentiators
**Avoids:** Pitfall #4 (decide glassmorphism approach before starting — BlurView vs semi-transparent overlay), Pitfall #7 (carousel gesture isolation: welcome screen is in `(auth)` route group with no tab swipe conflict; disable stack back gesture on welcome screen)
**Research flag:** NEEDS RESEARCH during planning — gradient color interpolation across carousel slides using Reanimated `useAnimatedScrollHandler` is non-trivial. Decide before starting: per-slide static gradients (simpler, lower risk) vs interpolated transitions (differentiator, higher complexity). Glassmorphism approach decision (BlurView vs overlay) also needs finalizing in planning.

### Phase Ordering Rationale

- Phases 1 and 2 are strict prerequisites for all subsequent phases due to the design token and shared component dependencies.
- Phase 3 (nav chrome) is lightweight and should follow Phase 2 immediately to establish the visual context for development.
- Phases 4a–4d have no dependencies on each other and can be parallelized. Home (4a) is the most complex; Groceries (4c) is the simplest.
- Phase 5 (onboarding) comes last because it has the most novel components, is seen least frequently, and benefits from shared components being fully tested on main screens first.
- This order respects the primary pitfall: design tokens before any screen work prevents the half-migrated orange/green mix that is worse than the original state.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4a (Home Screen):** Calendar collapse/expand implementation choices — fixed vs measured heights in Reanimated accordion, interaction with react-native-calendars for the expanded month view, needs-attention data aggregation query design.
- **Phase 5 (Onboarding Welcome Carousel):** Gradient interpolation decision (static-per-slide vs scroll-handler-based), glassmorphism final decision (BlurView vs semi-transparent overlay), gesture isolation verification on both platforms.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Design Foundation):** NativeWind theme config extension is thoroughly documented.
- **Phase 2 (Components):** Standard React component extraction patterns; LinearGradient and cssInterop usage is documented.
- **Phase 3 (Navigation Chrome):** React Navigation tabBarStyle props are well-documented.
- **Phase 4b (Expenses):** Component composition, no novel patterns.
- **Phase 4c (Groceries):** Minor styling updates, standard component adoption.
- **Phase 4d (Chores):** Emoji mapping and Card variant are straightforward.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All new dependencies verified against `bundledNativeModules.json` in local node_modules/expo; Expo Go compatibility confirmed from official docs. NativeWind v4 feature coverage verified on official NativeWind docs. One LOW confidence item: expo-blur intensity-to-CSS-blur-px mapping requires visual tuning during implementation. |
| Features | HIGH | Source of truth is the project-internal design spec and reference mockups — not external research. Existing codebase fully inspected via direct file analysis. All "existing state" assessments are ground truth, not estimates. |
| Architecture | HIGH | Verified against NativeWind v4 docs (gradient limitations on native, className specificity, shadow class behavior). Expo LinearGradient cssInterop pattern is MEDIUM confidence — may need validation during Phase 2. Reanimated accordion/calendar pattern is HIGH confidence from official examples. |
| Pitfalls | HIGH | Quantified from direct codebase analysis: 74 hardcoded color instances across 25 files, 76 inline style objects across 19 files, 158 inline color prop references across 30 files. Platform-specific pitfalls (shadows, BlurView Android behavior) confirmed from official React Native and Expo docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **expo-blur intensity mapping:** Design spec says `blur(12px)`. Mapping to expo-blur `intensity` (scale 1–100) is estimated at 25–35. Requires visual tuning during Phase 5 (welcome carousel). If the result is unsatisfactory on Android, fall back to semi-transparent overlay immediately — this decision should be made at the start of Phase 5, not mid-implementation.
- **Colored shadow string format:** React Native 0.81 `boxShadow` style property with hex+alpha (`#2D6A4F55`) vs `rgba()` format — the exact supported format for the `boxShadow` style prop needs a quick test in Phase 1 before the shadows.ts file is finalized.
- **NativeWind fontSize tuple behavior:** `tailwind.config.js` `fontSize` tuples with `fontWeight` and `letterSpacing` inline. NativeWind v4 docs confirm support but exact tuple behavior with all three sub-properties not individually verified. Test `text-page-title` class in Phase 1 immediately after config update.
- **Deterministic member color assignment strategy:** Research defines a `COLOR_POOL[index % pool.length]` approach but the "index" source must be stable across re-fetches. Final decision (sort by `user_id` alphabetically, sort by `created_at`, or store color index in DB) needed at the start of Phase 2 (Avatar component build).
- **Gradient interpolation scope decision:** Whether to implement smooth gradient color interpolation between carousel slides (Reanimated scroll handler, differentiator) vs per-slide static gradients (simpler, lower risk). This gates Phase 5 complexity significantly. Decide during Phase 5 planning research.

---

## Sources

### Primary (HIGH confidence)
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/DESIGN_SPEC.md` — authoritative visual specification, all design token values
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/reference-mockup.jsx` — visual target for main screens
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/onboarding-mockup.jsx` — visual target for onboarding flow
- Direct codebase analysis (all 4 tab screens, 6 onboarding screens, package.json, tailwind.config.js) — existing state, 74 hardcoded colors, 76 inline style objects
- `node_modules/expo/bundledNativeModules.json` — verified version numbers for expo-linear-gradient, expo-blur, react-native-svg
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) — New Architecture default, React Native 0.81
- [Expo LinearGradient Docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) — API, Expo Go compatibility
- [Expo BlurView Docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) — intensity, tint, Android platform limitations on SDK 54
- [NativeWind v4 Box Shadow](https://www.nativewind.dev/docs/tailwind/effects/box-shadow) — shadow class support, background color requirement on native
- [NativeWind v4 Style Specificity](https://www.nativewind.dev/docs/core-concepts/style-specificity) — className vs inline style precedence
- [NativeWind v4 Custom Colors](https://www.nativewind.dev/docs/customization/colors) — theme extension pattern
- [NativeWind v4 Gradient Color Stops](https://www.nativewind.dev/docs/tailwind/backgrounds/gradient-color-stops) — confirmed web-only, not supported on native
- [NativeWind v4 Letter Spacing](https://www.nativewind.dev/docs/tailwind/typography/letter-spacing) — tracking class support including arbitrary values
- [React Native 0.81 View Style Props](https://reactnative.dev/docs/0.81/view-style-props) — boxShadow property on New Architecture
- [Reanimated Layout Transitions](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/) — LinearTransition API
- [Reanimated Accordion Example](https://docs.swmansion.com/react-native-reanimated/examples/accordion/) — collapse/expand with withTiming
- [NativeWind v4 to v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4) — why NOT to upgrade mid-project

### Secondary (MEDIUM confidence)
- [NativeWind cssInterop for LinearGradient](https://gluestack.io/ui/docs/guides/recipes/linear-gradient) — cssInterop pattern for className support on third-party components
- [NativeWind GitHub #1442](https://github.com/nativewind/nativewind/issues/1442) — boxShadow vs legacy shadow props discussion
- [NativeWind GitHub #665](https://github.com/nativewind/nativewind/issues/665) — style merging inconsistency reports
- [react-native-calendars ExpandableCalendar](https://wix.github.io/react-native-calendars/docs/Components/ExpandableCalendar) — existing expandable calendar has reported animation issues; custom WeekStrip + static calendar hybrid is preferred
- [NativeWind v4 + Expo SDK 54 compatibility](https://medium.com/@matthitachi/nativewind-styling-not-working-with-expo-sdk-54-54488c07c20d) — NativeWind v4.2.0+ required for SDK 54

### Tertiary (LOW confidence)
- expo-blur intensity mapping to CSS `blur(12px)`: estimated at intensity 25–35; requires visual tuning during Phase 5 implementation

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
