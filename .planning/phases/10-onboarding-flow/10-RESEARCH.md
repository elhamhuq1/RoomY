# Phase 10: Onboarding Flow - Research

**Researched:** 2026-03-13
**Domain:** React Native onboarding UI redesign (Expo SDK 54, NativeWind v4, expo-router)
**Confidence:** HIGH

## Summary

Phase 10 is a visual redesign of 10 existing screens across two route groups: `(auth)` (welcome, sign-up, sign-in) and `(onboarding)` (profile, household-choice, create-household, join-household, member-welcome, module-quiz). All business logic, data flow, and navigation remain unchanged. The work involves: (1) adding illustration images to screens, (2) restyling backgrounds to cream, (3) implementing a glassmorphism logo container, (4) building a 3-segment progress bar, (5) restyling form inputs and social auth buttons, (6) replacing the invite code success state with a dark gradient card, and (7) renaming "Sign In" to "Log In" across the app.

The codebase already uses `expo-linear-gradient`, `react-native-reanimated` v4.1, and NativeWind v4 with a well-defined design token system. The onboarding illustrations are 7 JPGs in `docs/onboarding-images/` with a consistent off-white/cream background (~#F5F0EB). `expo-blur` is NOT installed, so glassmorphism must be achieved with opacity/shadow/backgroundColor tricks or by installing `expo-blur`. Given the project runs on Expo Go (SDK 54), installing `expo-blur` is safe -- it is a core Expo package included in the Expo Go client.

**Primary recommendation:** Install `expo-blur` for genuine glassmorphism. Move illustration images to `assets/onboarding/` for proper bundling. Build a reusable `StepProgressBar` component with Reanimated for the Instagram Stories-style segmented indicator.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed header above carousel: glassmorphism logo container + "RoomY" title + tagline stay pinned at top while slides swipe beneath
- Image hero layout: illustration takes ~50% of slide, title + subtitle below, emoji badge chips underneath
- Cream background (#F5F3EE or matched to illustration bg) -- same color throughout all 3 slides, no per-slide tints
- Image bg handling: match slide background to illustration background color so JPGs blend seamlessly (no transparency needed)
- Emoji feature badges: small pill-shaped chips below each slide's subtitle (e.g. "Fair splits" "One tap")
- 3 slides: split-expenses.jpg, shared-grocery.jpg, chore-rotation.jpg with existing VALUE_PROPS content
- Page indicator dots (current style: active = wide brand pill, inactive = small gray circle)
- Cream background on both sign-up and log-in screens for visual continuity with welcome
- Small glassmorphism logo container at top of each auth screen (smaller than welcome screen version)
- Sign-up and log-in screens mirror each other in layout -- same structure, only form fields and CTA text differ
- **Rename "Sign In" to "Log In"** throughout the app (button text, links, screen title)
- Form inputs: subtle inset style -- light gray fill (#F5F5F5) default, no border; on focus: white bg with brand-colored border
- Social auth buttons: full-width branded pill buttons -- Google gets white bg with colored G logo, Apple gets black bg with white logo
- Primary CTA: branded rounded button (existing style, no change needed)
- Replace green checkmark with celebration illustration (invite-code.jpg) as hero image at top
- Invite code displayed in a dark brand gradient card (similar to home screen balance card) with white text
- Code formatted with space for readability: "ABCD EFGH"
- Primary action: "Share with Roommates" button opens OS share sheet
- Secondary action: "Copy code" as a text link below share button
- "Continue Setup" button below both actions
- Instagram Stories-style: thin segmented bars at top of screen, below safe area
- 3 equal-width segments with small gaps between them
- Filled = brand color, unfilled = muted gray
- Segments: Profile (display name) -> Household (choice + create/join) -> Modules (quiz)
- Animated fill: current segment slides left-to-right on screen entry, previous segments stay filled
- Back button (left arrow) top-left, progress bar spans remaining width; hidden on first onboarding screen
- **Skip progress bar on invite code celebration screen** -- that's a celebration moment, bar feels out of place
- Show on: profile, household-choice, create-household, join-household, module-quiz
- Each onboarding screen uses its matching illustration from docs/onboarding-images/
- All images are JPGs with off-white/cream backgrounds -- use matching background colors to blend

### Claude's Discretion
- Exact cream hex value (match to illustration background)
- Glassmorphism blur intensity and opacity
- Emoji badge content per carousel slide
- Animation timing/easing for progress bar fill
- Spacing, typography sizing, and padding across screens
- How to style the module quiz screen (not discussed -- apply same cream bg + illustration patterns)

### Deferred Ideas (OUT OF SCOPE)
- **Global cream background** -- Change the entire app's neutral-bg token from current value to cream. Simple one-line design token change, could be done as a quick task anytime. User feels cream is easier on the eyes and more visually appealing.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | Welcome screen shows a 3-slide carousel with gradient hero sections, glassmorphism logo, and emoji feature badges | Carousel pattern using existing ScrollView + pagingEnabled; glassmorphism via expo-blur BlurView; emoji badges via Badge-like pill components; images from docs/onboarding-images/ |
| ONBD-02 | Sign up screen uses styled form inputs, branded primary button, and properly styled social auth buttons | Restyle existing sign-up.tsx: cream bg, inset inputs (#F5F5F5 fill, no border), branded pill social buttons, small glassmorphism logo |
| ONBD-03 | Display name screen shows a live avatar preview that updates as the user types | Enhance existing profile.tsx: use Avatar component (already exists in ui/) with live initial tracking, add display-name.jpg illustration |
| ONBD-04 | Setup choice screen presents create/join options as large cards with gradient icon containers | Restyle existing household-choice.tsx: use LinearGradient inside icon containers, add setup-home.jpg illustration |
| ONBD-05 | Household name screen shows a branded house icon and styled input | Restyle existing create-household.tsx name form: add name-household.jpg illustration, inset-style input |
| ONBD-06 | Invite code screen shows a celebration layout with prominent code display and share/continue buttons | Restyle invite code success state in create-household.tsx: invite-code.jpg hero, dark gradient card for code (LinearGradient pattern from BalanceSummaryCard), copy + share + continue actions |
| ONBD-07 | Module selection screen uses toggle cards with visual active/inactive states | Restyle existing module-quiz.tsx: replace native Switch with Toggle component, cream bg, illustration pattern |
| ONBD-08 | Onboarding flow shows a 3-segment step progress bar on applicable screens | New StepProgressBar component using Reanimated withTiming for fill animation, integrated into onboarding _layout or individual screens |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-linear-gradient | ~15.0.8 | Dark gradient card for invite code, gradient icon containers | Already used by BalanceSummaryCard and Avatar |
| react-native-reanimated | ~4.1.1 | Progress bar fill animation, focus state transitions | Already used by Toggle component |
| nativewind | ^4.2.2 | All styling via Tailwind classes | Project design system standard |
| @expo/vector-icons (Ionicons) | ^15.0.2 | Icons throughout onboarding | Project icon standard |

### New (needs installation)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-blur | ~14.0.1 (SDK 54 compatible) | Glassmorphism logo container with BlurView | Welcome screen large logo container, auth screen small logo container |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-blur (BlurView) | Semi-transparent View with rgba bg + shadow | Fake glassmorphism, doesn't blur content behind it, but avoids a new dependency |
| expo-blur (BlurView) | @react-native-community/blur | Not needed -- expo-blur is the Expo-maintained equivalent and works in Expo Go |

**Installation:**
```bash
npx expo install expo-blur
```

**Note:** `expo-blur` is part of the Expo SDK and is included in the Expo Go client binary. No custom dev client needed. Safe to install.

## Architecture Patterns

### Image Asset Organization
```
assets/
  onboarding/
    split-expenses.jpg      # Welcome slide 1
    shared-grocery.jpg      # Welcome slide 2
    chore-rotation.jpg      # Welcome slide 3
    display-name.jpg        # Profile screen
    setup-home.jpg          # Household choice screen
    name-household.jpg      # Create household screen
    invite-code.jpg         # Invite code celebration
```

Images should be moved from `docs/onboarding-images/` to `assets/onboarding/` for proper Metro bundler resolution. The `docs/` directory is a documentation reference location, not a bundling source. Use `require()` with static paths for React Native image bundling (dynamic require is not supported by Metro).

### Screen Structure Pattern
Every onboarding screen follows the same visual pattern:
```
[SafeArea padding]
[StepProgressBar + Back button]  <-- ONBD-08 (omitted on welcome/auth/celebration)
[Illustration Image ~40-50% height]
[Title + Subtitle]
[Screen-specific content (form, cards, etc.)]
[Primary CTA button]
```

### Cream Background Constant
All images have background color approximately `#F5F0EB`. The splash screen already uses `#fefdfb`. The CONTEXT.md mentions `#F5F3EE` as a suggestion.

**Recommendation:** Use `#F5F0EB` as the onboarding cream color. This closely matches the illustration backgrounds after visual inspection. Define as a constant:
```typescript
// In a shared constants file or inline
const ONBOARDING_CREAM = '#F5F0EB';
```

Do NOT change the global `neutral.bg` token (`#F8FAFC`) -- that is deferred per CONTEXT.md.

### Pattern 1: Glassmorphism Logo Container
**What:** Semi-transparent container with blur effect holding the RoomY logo
**When to use:** Welcome screen (large), sign-up/log-in screens (small)
**Example:**
```typescript
import { BlurView } from 'expo-blur';
import { Image, View, Platform } from 'react-native';

// Large version (welcome screen)
<BlurView
  intensity={25}
  tint="light"
  style={{
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <View style={{
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255,255,255,0.3)',
      },
      android: {
        backgroundColor: 'rgba(255,255,255,0.7)',
      },
    }),
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Image
      source={require('@/assets/icon.png')}
      style={{ width: 56, height: 56 }}
      resizeMode="contain"
    />
  </View>
</BlurView>
```

**Note on Android:** `expo-blur` uses a fallback semi-transparent view on Android (no native blur). The `intensity` prop is ignored. The `tint` prop affects the fallback color. This is acceptable -- the visual result is a frosted container that looks good on both platforms.

### Pattern 2: Inset-Style Form Input
**What:** Form inputs with light gray fill, no border by default; on focus: white bg + brand border
**When to use:** All auth and onboarding form inputs
**Example:**
```typescript
const [focused, setFocused] = useState(false);

<TextInput
  className={`rounded-2xl px-4 py-3.5 text-base text-neutral-text ${
    error
      ? 'border-2 border-semantic-error bg-white'
      : focused
        ? 'border-2 border-brand bg-white'
        : 'bg-[#F5F5F5]'
  }`}
  onFocus={() => setFocused(true)}
  onBlur={() => { setFocused(false); /* validate */ }}
  // ...
/>
```

### Pattern 3: StepProgressBar Component
**What:** Instagram Stories-style segmented thin bars at top of screen
**When to use:** Onboarding screens after auth (profile through module-quiz, excluding celebration)
**Example:**
```typescript
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface StepProgressBarProps {
  currentStep: number; // 0, 1, 2
  totalSteps: number;  // 3
  onBack?: () => void;
  showBack?: boolean;
}

// Each segment:
// - Previous steps: fully filled (brand color)
// - Current step: animated fill left-to-right
// - Future steps: muted gray

// Implementation approach:
// - Use Animated.View for each segment
// - withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }) for current segment fill
// - Previous segments: width = '100%', brand bg
// - Future segments: width = '100%', gray bg
// - Gap between segments: marginHorizontal: 2
```

### Pattern 4: Dark Gradient Invite Code Card
**What:** Dark gradient card displaying invite code prominently (mirrors BalanceSummaryCard pattern)
**When to use:** Invite code celebration screen
**Example:**
```typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#1E293B', '#0F172A']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ borderRadius: 16, padding: 24, alignItems: 'center' }}
>
  <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 1.1 }}>
    INVITE CODE
  </Text>
  <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '700', letterSpacing: 4, marginTop: 8 }}>
    {formattedCode}
  </Text>
</LinearGradient>
```

### Pattern 5: Emoji Feature Badge
**What:** Small pill-shaped chips with emoji + label text
**When to use:** Below each welcome carousel slide subtitle
**Example:**
```typescript
<View className="flex-row flex-wrap justify-center gap-2 mt-3">
  <View className="flex-row items-center rounded-full bg-white/80 px-3 py-1.5">
    <Text className="text-sm">Fair splits</Text>
  </View>
  <View className="flex-row items-center rounded-full bg-white/80 px-3 py-1.5">
    <Text className="text-sm">One tap</Text>
  </View>
</View>
```

### Anti-Patterns to Avoid
- **Dynamic require():** Metro bundler cannot resolve `require(variablePath)`. All image requires must be static. Use a map object with static requires.
- **Changing neutral.bg token:** The global background token is out of scope. Use an inline/local cream color for onboarding screens only.
- **Modifying business logic:** This is presentation-layer only. All Supabase calls, auth flows, navigation paths, and data models stay untouched.
- **Using `expo-image` for local assets:** Not installed and unnecessary. React Native's built-in `Image` component handles local `require()` assets well.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blur/glassmorphism | Custom opacity layers + shadow hacks | expo-blur BlurView | Native blur on iOS, acceptable fallback on Android; handles edge cases |
| Progress bar animation | Manual Animated.Value with timers | react-native-reanimated withTiming | Already in project, runs on UI thread, handles interruptions |
| Gradient backgrounds | Multiple layered Views with colors | expo-linear-gradient | Already in project, GPU-accelerated, consistent results |
| Carousel | FlatList with snap, manual gesture handling | ScrollView with pagingEnabled + horizontal | Already working in welcome.tsx, simpler for 3 fixed slides |
| Avatar with initials | Custom circle + text | Avatar component from ui/ | Already built in Phase 6 with gradient colors and size presets |
| Toggle switches | Native Switch | Toggle component from ui/ | Already built with brand styling and Reanimated animation |

**Key insight:** Nearly every UI primitive needed already exists in `components/ui/`. The phase is predominantly about restyling existing screens with new backgrounds, images, and spacing -- not building new interactive components. The only truly new component is StepProgressBar.

## Common Pitfalls

### Pitfall 1: Image Bundling with Metro
**What goes wrong:** Images referenced with dynamic `require()` or wrong paths fail silently or crash
**Why it happens:** Metro bundler resolves `require()` at compile time, not runtime
**How to avoid:** Create a static image map:
```typescript
const ONBOARDING_IMAGES = {
  'split-expenses': require('@/assets/onboarding/split-expenses.jpg'),
  'shared-grocery': require('@/assets/onboarding/shared-grocery.jpg'),
  'chore-rotation': require('@/assets/onboarding/chore-rotation.jpg'),
  'display-name': require('@/assets/onboarding/display-name.jpg'),
  'setup-home': require('@/assets/onboarding/setup-home.jpg'),
  'name-household': require('@/assets/onboarding/name-household.jpg'),
  'invite-code': require('@/assets/onboarding/invite-code.jpg'),
} as const;
```
**Warning signs:** White rectangle where image should be, red-box error about unresolved module

### Pitfall 2: expo-blur on Android
**What goes wrong:** Expecting iOS-quality blur effect on Android
**Why it happens:** Android lacks native blur API; expo-blur falls back to semi-transparent overlay
**How to avoid:** Design the glassmorphism container so it looks good with both real blur (iOS) AND flat semi-transparent bg (Android). Use `tint="light"` and a white-tinted inner view. Test on both platforms.
**Warning signs:** Container looks solid/opaque on Android instead of blurred

### Pitfall 3: ScrollView Carousel Dimension Calculation
**What goes wrong:** Slides don't snap to correct positions or overlap
**Why it happens:** `useWindowDimensions().width` changes on rotation or may not match container width exactly
**How to avoid:** The current welcome.tsx implementation already handles this correctly with `pagingEnabled` and `style={{ width }}` on each slide. Keep this pattern. Ensure the ScrollView parent does not have horizontal padding that changes the effective width.
**Warning signs:** Partial slide visible, jittery snapping

### Pitfall 4: "Sign In" Rename Scope
**What goes wrong:** Missing a "Sign In" reference somewhere in the app
**Why it happens:** The text appears in 5 files across auth screens and the forgot-password screen
**How to avoid:** Grep for all occurrences: `Sign In`, `Sign in`, `sign in`, `sign-in` in display text. The file `app/(auth)/sign-in.tsx` filename stays unchanged (it's a route, not user-facing text).
**Warning signs:** Inconsistent UI copy between screens
**Known locations (from grep):**
- `app/(auth)/welcome.tsx` line 125: "Sign in" link text
- `app/(auth)/sign-in.tsx` lines 122, 208: screen subtitle and button
- `app/(auth)/sign-up.tsx` line 275: "Sign in" link text
- `app/(auth)/forgot-password.tsx` line 75: "Back to Sign In" button

### Pitfall 5: Progress Bar Step Mapping Complexity
**What goes wrong:** Step number doesn't match screen because household path has branching
**Why it happens:** Step 2 (Household) covers 4 different screens: household-choice, create-household, join-household, member-welcome
**How to avoid:** Map step by screen name, not by sequential count:
```typescript
const STEP_MAP: Record<string, number> = {
  'profile': 0,
  'household-choice': 1,
  'create-household': 1,
  'join-household': 1,
  'member-welcome': 1,  // still step 2, or skip bar entirely here
  'module-quiz': 2,
};
```
**Warning signs:** Progress bar jumps or shows wrong step

### Pitfall 6: Clipboard API for Copy Code
**What goes wrong:** Using deprecated `Clipboard` from `react-native`
**Why it happens:** RN removed Clipboard from core; it moved to `@react-native-clipboard/clipboard` or `expo-clipboard`
**How to avoid:** Use `expo-clipboard` which is an Expo-maintained package available in Expo Go:
```bash
npx expo install expo-clipboard
```
Or use the simpler approach: `import * as Clipboard from 'expo-clipboard'; await Clipboard.setStringAsync(code);`
**Warning signs:** Runtime error about Clipboard.setString not being a function

## Code Examples

### Image Map Pattern (verified from React Native docs)
```typescript
// lib/onboarding-images.ts
// Static requires -- Metro resolves these at build time
export const ONBOARDING_IMAGES = {
  splitExpenses: require('@/assets/onboarding/split-expenses.jpg'),
  sharedGrocery: require('@/assets/onboarding/shared-grocery.jpg'),
  choreRotation: require('@/assets/onboarding/chore-rotation.jpg'),
  displayName: require('@/assets/onboarding/display-name.jpg'),
  setupHome: require('@/assets/onboarding/setup-home.jpg'),
  nameHousehold: require('@/assets/onboarding/name-household.jpg'),
  inviteCode: require('@/assets/onboarding/invite-code.jpg'),
} as const;
```

### RoomY Logo Reference
The logo is at `docs/RoomY-logo.jpg`. It's a house/Y icon on a cream background. For the glassmorphism container, either:
- Use the existing app icon at `assets/icon.png` (already processed for app icon)
- Or copy `docs/RoomY-logo.jpg` to `assets/onboarding/logo.jpg`

The app icon at `assets/icon.png` is already the correct logo and available for `require()`.

### Progress Bar Animation Pattern (Reanimated v4)
```typescript
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  useEffect as useReanimatedEffect,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function SegmentBar({ filled, active }: { filled: boolean; active: boolean }) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    } else {
      progress.value = withTiming(filled ? 1 : 0, { duration: 200 });
    }
  }, [filled, active]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ flex: 1, height: 3, backgroundColor: '#E2E8F0', borderRadius: 1.5, marginHorizontal: 2 }}>
      <Animated.View
        style={[{
          height: '100%',
          backgroundColor: '#10B981',
          borderRadius: 1.5,
        }, fillStyle]}
      />
    </View>
  );
}
```

### Invite Code Dark Gradient Card (adapting BalanceSummaryCard pattern)
```typescript
<LinearGradient
  colors={['#1E293B', '#0F172A']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ borderRadius: 16, padding: 24, alignItems: 'center' }}
>
  <Text className="text-overline uppercase" style={{ color: '#94A3B8' }}>
    INVITE CODE
  </Text>
  <Text
    className="mt-2"
    style={{
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: 4,
      fontVariant: ['tabular-nums'],
    }}
  >
    {formattedCode}
  </Text>
  <Text className="mt-3 text-xs" style={{ color: '#64748B' }}>
    Code expires in 7 days
  </Text>
</LinearGradient>
```

## State of the Art

| Old Approach (current) | New Approach (this phase) | Impact |
|------------------------|--------------------------|--------|
| Ionicon in colored circle for logo | Glassmorphism container with actual logo image | Premium first impression |
| White bg (`bg-neutral-bg`) on all screens | Cream bg (`#F5F0EB`) on onboarding only | Warm, inviting feel matching illustrations |
| No images in onboarding | Full illustration hero on each screen | Visual storytelling, professional look |
| Native Switch for module toggles | Toggle component from ui/ | Consistent brand styling |
| Green checkmark circle for invite success | Dark gradient card + celebration illustration | Celebratory moment, code prominence |
| Text "Sign In" everywhere | Text "Log In" everywhere | More casual/friendly tone |
| No progress indication in onboarding | 3-segment animated progress bar | User knows where they are and how many steps remain |
| White bg inputs with gray border | Inset gray fill inputs, white+brand on focus | Modern, less visually heavy form fields |

## Open Questions

1. **Cream hex precision**
   - What we know: Illustration backgrounds are approximately #F5F0EB. CONTEXT.md suggests #F5F3EE. Splash screen uses #fefdfb.
   - What's unclear: Exact hex that blends seamlessly with all 7 illustration JPGs
   - Recommendation: Use #F5F0EB (closest to illustration bg from visual inspection). Fine-tune during implementation if any image shows a visible edge. This is in Claude's discretion per CONTEXT.md.

2. **member-welcome.tsx progress bar treatment**
   - What we know: This is the "You're in!" celebration screen for users who JOIN. CONTEXT.md says skip progress bar on invite code celebration screen (for CREATORS).
   - What's unclear: Whether member-welcome also skips the bar
   - Recommendation: Skip the bar on member-welcome too -- it's also a celebration moment. User lands here after joining, then goes to module-quiz. The celebration break feels natural.

3. **Module quiz illustration**
   - What we know: No specific illustration was provided for module-quiz.tsx. CONTEXT.md says "apply same cream bg + illustration patterns" (Claude's discretion).
   - What's unclear: Which image to use
   - Recommendation: Module quiz does not need a hero illustration -- it has 3 toggle cards that take up the content area. Apply cream background, use the existing card-based layout with the Toggle component, add the progress bar (step 3 of 3). This keeps the screen functional without cramming in an unrelated image.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: All 10 existing screen files read and analyzed
- Codebase inspection: All 7 illustration JPGs visually inspected for background color
- Codebase inspection: package.json dependencies verified
- Codebase inspection: components/ui/ barrel exports and implementations reviewed
- Codebase inspection: BalanceSummaryCard.tsx gradient pattern analyzed
- Codebase inspection: app.json splash backgroundColor (#fefdfb) noted

### Secondary (MEDIUM confidence)
- expo-blur compatibility with Expo Go SDK 54: Based on Expo SDK documentation pattern (expo-blur is a first-party Expo package included in Expo Go)
- Reanimated v4 withTiming API: Based on project's existing Toggle.tsx usage of withSpring (same API surface)

### Tertiary (LOW confidence)
- Android expo-blur behavior: Training data indicates fallback to semi-transparent view; should be verified on physical device during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json or are known Expo SDK packages
- Architecture: HIGH - Patterns derived directly from existing codebase (BalanceSummaryCard, Toggle, Avatar)
- Pitfalls: HIGH - Based on codebase analysis (grep for "Sign In" locations, image bundling patterns, etc.)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- presentation-layer restyling of existing screens)
