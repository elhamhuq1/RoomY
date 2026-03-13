# Feature Landscape: RoomY v1.2 Polish & Identity

**Domain:** Mobile household management app -- profile pictures, Google OAuth, empty states, visual identity shift
**Researched:** 2026-03-13
**Confidence:** HIGH (official Expo/Supabase docs verified, existing codebase fully inspected)

---

## Table Stakes

Features users expect. Missing any of these makes v1.2 feel half-done.

### Profile Picture Uploads

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Pick from photo library | Every app with profiles lets you pick a photo. This is the baseline. | Low | `expo-image-picker` `launchImageLibraryAsync()`. Already compatible with Expo Go (no native module needed). Permissions handled automatically by Expo. |
| Take photo with camera | Users expect to snap a selfie as an alternative to gallery. | Low | `expo-image-picker` `launchCameraAsync()`. Same library, same permissions flow. Requires `NSCameraUsageDescription` on iOS (Expo handles via config plugin). |
| Square crop before upload | Profile pictures are always circular in display. Crop to 1:1 ensures no awkward framing. | Low | `allowsEditing: true` + `aspect: [1, 1]` on the picker options. iOS always crops as square when editing is enabled. Android respects the aspect ratio. Built-in to expo-image-picker, zero extra code. |
| Resize before upload | Full-resolution phone photos are 4-12MB. Uploading raw images wastes bandwidth and storage. | Low | Two options: (1) `quality: 0.7` on the picker itself, or (2) `expo-image-manipulator` `manipulateAsync()` with `resize: { width: 400 }` + JPEG compress at 0.8. Recommend option 2 for explicit size control -- avatar images should never exceed ~100KB. |
| Upload to Supabase Storage | The image needs to persist server-side, not just locally. | Med | Create an `avatars` storage bucket. Upload using `base64-arraybuffer` decode pattern (the only reliable method in React Native -- Blob/FormData do NOT work correctly). Store resulting public URL in `profiles.avatar_url`. |
| Display uploaded photo in Avatar component | The existing Avatar shows initials over a gradient. When a photo exists, it should replace the initials but keep the gradient as a loading fallback. | Med | Modify `Avatar.tsx` to accept optional `avatarUrl` prop. Use `expo-image` or RN `Image` with the Supabase public URL. Fall back to current gradient+initials when no URL or while loading. Circular clip via `borderRadius: dim/2` (already in place). |
| Loading and error states during upload | Users need feedback: spinner while uploading, error toast if it fails, success indicator when done. | Low | Show `ActivityIndicator` overlay on the avatar during upload. Display error in the existing error banner pattern. Profile screen already has `saved`/`error` state management. |
| Permission denial handling | iOS and Android can deny camera/gallery access. App must handle gracefully. | Low | `expo-image-picker` returns `{ canceled: true }` when denied. Show a prompt explaining why the permission is needed and link to Settings. Standard pattern. |

### Google OAuth Sign-In

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Google sign-in button on auth screens | Already present in the UI (sign-in.tsx and sign-up.tsx have "Continue with Google" buttons). The code calls `signInWithGoogle()` from `auth-utils.ts`. Currently crashes in Expo Go because `@react-native-google-signin/google-signin` is a native module. | Med | **Requires switching from Expo Go to a development build.** This is the single biggest complexity in v1.2. The native module cannot run in Expo Go -- period. Must set up `expo-dev-client`, configure the config plugin in `app.json`, and build via `npx expo run:android` / `npx expo run:ios` or EAS Build. |
| Google Cloud OAuth credentials | The Google Web Client ID is already in `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. But Android needs a separate SHA-1 fingerprint registered in Google Cloud Console, and iOS needs an `iosUrlScheme`. | Med | Without Firebase: add `iosUrlScheme` to the config plugin in app.json. For Android: generate SHA-1 from debug keystore, add to Google Cloud Console credentials. Both devs (Linux + macOS) need matching configurations. |
| Seamless onboarding after OAuth | When a user signs in with Google for the first time, they need to flow into profile setup (display name) and household creation. The auth-context already handles this by checking `profile.display_name` existence. | Low | Already implemented. `auth-context.tsx` fetches profile after `SIGNED_IN` event. If no profile/household exists, the root layout routes to onboarding. No new code needed. |

### Empty State Illustrations

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Expenses empty state illustration | Current: Ionicons `wallet-outline` icon in a brand-light circle. Functional but feels like a placeholder, not a designed product. | Med | Replace icon-in-circle with an actual illustration. Recommended approach: use a flat illustration matching the wintergreen palette. Source from unDraw, ManyPixels, or DrawKit (all free, commercial-use, customizable colors). Export as PNG at 2x/3x for retina. |
| Groceries empty state illustration | Current: Ionicons `cart` icon in a brand-light circle. Same pattern as expenses -- needs visual upgrade. | Med | Same approach. The groceries empty state is simple (no CTA button, just "Add items above to get started"). Replace the icon circle with an illustration. |
| Chores empty state illustration | Current: Ionicons `checkbox` icon in a brand-light circle, plus a suggested chores grid below. The grid is valuable -- keep it. Only the hero illustration needs upgrading. | Med | Replace only the top icon-circle with an illustration. Keep the suggested chores grid and "Create custom chore" button intact. |
| Home screen empty state (solo creator) | When a household has only one member, the home screen should guide them to invite roommates. | Low | This is an attention feed item already. May benefit from a more prominent illustration but is lower priority than the three module empty states. |
| Consistent illustration style | All illustrations must look like they belong to the same product. Mixing styles (flat + 3D + hand-drawn) looks amateur. | Low | Pick ONE illustration source/style and use it for all empty states. Flat vector with the wintergreen brand color as the primary hue. Match the onboarding illustration style already established (the cream-background PNGs in `assets/onboarding/`). |

### Visual Identity Shift (Palette + Card Style)

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Cream background throughout app | Currently post-login screens use `bg-neutral-bg` (#F8FAFC, a cool blue-gray). Onboarding already uses `ONBOARDING_CREAM` (#F5F0EB, warm cream). The mismatch makes the transition from onboarding to app feel jarring. | Med | Change `neutral.bg` in tailwind.config.js and `colors.ts` from `#F8FAFC` to `#F5F0EB`. Every screen using `bg-neutral-bg` automatically picks up the change. Also audit inline `backgroundColor` styles (e.g., welcome.tsx, profile.tsx use inline styles). |
| Card style to outline (no fill, no shadow) | Current Card: `bg-white rounded-card border border-neutral-border shadow p-4` with Android elevation. The new direction is transparent background, gray outline border, no shadow -- a flatter, more modern look on cream. | Low | Modify `Card.tsx`: remove `bg-white`, remove `shadow`, remove Android elevation, keep `border border-neutral-border` (or slightly stronger border). All 15+ Card usages across the app update automatically. |
| Green palette shift to wintergreen | Current brand: `#10B981` (Tailwind emerald-500). Target: `~#2D6A4F` (dark wintergreen matching the logo). This affects buttons, badges, active states, gradients, avatar fallbacks, FAB, tab bar active color, and every `colors.brand.DEFAULT` reference. | High | **This is the highest-impact change in v1.2.** Update `brand.DEFAULT` in tailwind.config.js and colors.ts. Also update `brand.dark` and `brand.light` to new values derived from wintergreen. Audit all hardcoded hex values: `#10B981` appears in Avatar.tsx gradient pairs, welcome.tsx dot indicator, onboarding button inline styles, etc. The `GRADIENT_PAIRS` in Avatar.tsx need updating since the first pair is currently emerald. |
| Semantic color preservation | Success, warning, error, info colors should NOT change. They are distinct from brand. | Low | Verify semantic tokens are not accidentally impacted by the palette shift. Currently `semantic.success` is `#22C55E` (close to old brand) -- may need to shift slightly to avoid confusion with wintergreen. |
| Hardcoded color audit | Several files use inline hex values instead of design tokens. These will NOT auto-update when tokens change. | Med | Known hardcoded colors: `#10B981` in Avatar.tsx (gradient pairs), `#059669` in Avatar.tsx (gradient pairs), `#10B981` in welcome.tsx (dot indicator bg), `#059669` in welcome.tsx (log in link), inline `backgroundColor` in onboarding screens. Must find and replace all. |

---

## Differentiators

Features that go beyond table stakes and make RoomY feel polished. Not expected, but appreciated.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Avatar photo edit overlay | A camera icon overlay on the avatar in profile settings, signaling "tap to change photo." Industry standard (WhatsApp, Instagram, Slack). | Low | Small camera icon badge positioned at bottom-right of the avatar circle. Uses absolute positioning with a small white circle background. |
| Photo removal option | Let users go back to initials-only avatar if they want. Not everyone wants a photo. | Low | ActionSheet with "Take Photo", "Choose from Library", "Remove Photo" options. "Remove" sets `avatar_url` to null in profiles table. |
| Optimistic avatar update | Show the new photo immediately in the UI while the upload happens in the background. If upload fails, revert. | Med | Set local state with the file URI immediately. Upload in background. On success, update to public URL. On failure, revert to previous state and show error. Avoids the "uploaded but I can't see it yet" lag. |
| Animated empty state transitions | When the first item is added to an empty list, animate the illustration out and the list in. | Med | Use `react-native-reanimated` (already installed) for a fade-out/slide-up animation on the empty state, with the new content fading in. Delightful but not critical. |
| Wintergreen gradient refinement | Instead of flat wintergreen buttons, use a subtle gradient from wintergreen to a slightly lighter shade. Adds depth without feeling dated. | Low | `LinearGradient` is already installed (`expo-linear-gradient`). Apply to primary buttons and the FAB. Colors: `['#2D6A4F', '#3A7D5C']` or similar. |
| Photo in onboarding profile step | Let users upload a photo during onboarding (profile.tsx step), not just in settings. First-time setup is where most users set their photo. | Med | Add an optional "Add photo" tap target above the display name input on the onboarding profile screen. Tapping opens the image picker. The display name step becomes the profile setup step. |
| Cached avatar images | Once downloaded, avatar images should not re-fetch on every render. | Low | Use `expo-image` (Expo's optimized Image component) which has built-in disk caching. Or use RN Image with `cache: 'force-cache'` header. The Supabase public URL is stable so caching is safe. |

---

## Anti-Features

Features to explicitly NOT build. Each has caused problems in similar projects.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom crop UI | Building a custom crop/rotate interface is a multi-week rabbit hole (gesture handling, transform math, performance). | Use expo-image-picker's built-in `allowsEditing: true` which delegates to the OS crop UI. It works, it's familiar, and it's free. |
| Image filters/effects | Instagram-style filters on profile photos add zero value to a roommate management app. | Upload the photo as-is after crop and resize. |
| Animated/video avatars | GIF/video profile pictures are a social media feature that adds complexity (storage, bandwidth, performance) with no benefit here. | Static JPEG images only. |
| Cloud-based image processing | Lambda/Edge functions for server-side resizing, watermarking, CDN transformation. Overkill for a 2-person household app. | Resize on-device before upload using `expo-image-manipulator`. The client does the work. |
| Multi-photo profiles | Photo albums or multiple profile pictures. Not a dating app. | Single avatar image per user. One upload, one URL in `profiles.avatar_url`. |
| Dark mode palette | Doubles the design surface area. The token system supports it structurally, but implementing dark mode now delays v1.2 significantly. | Keep light mode only. The token architecture allows adding dark mode later without rewrites. Already in PROJECT.md out-of-scope. |
| Lottie/animated illustrations for empty states | Lottie animations are delightful but `lottie-react-native` is another native dependency, and finding/creating custom Lottie files matching the brand is time-consuming. | Static PNG illustrations. Same visual impact, zero additional dependencies, simpler to create/source. |
| Firebase for Google Auth | Firebase adds SDK bloat, another console to manage, and another set of credentials. The project already uses Supabase for everything. | Use `@react-native-google-signin/google-signin` with Google Cloud Console directly + `signInWithIdToken` to Supabase. Already implemented in `auth-utils.ts`. No Firebase needed. |

---

## Feature Dependencies

```
Expo Go -> Development Build Migration (BLOCKS Google OAuth)
  |
  +-> Google OAuth sign-in works
  +-> All existing features must still work in dev build

Supabase Storage Bucket Setup (BLOCKS Profile Picture Upload)
  |
  +-> Create 'avatars' bucket
  +-> Configure RLS policies (user can upload/read/update own avatar)
  +-> Profile picture upload works

expo-image-picker + expo-image-manipulator (BLOCKS Profile Picture Upload)
  |
  +-> Pick from gallery
  +-> Take with camera
  +-> Crop to 1:1
  +-> Resize to 400x400
  +-> base64 encode -> arraybuffer -> Supabase upload

Avatar.tsx Modification (DEPENDS ON profile picture upload)
  |
  +-> Accept avatarUrl prop
  +-> Show image when URL exists
  +-> Fall back to gradient+initials when no URL
  +-> All Avatar usages across app automatically show photos

Wintergreen Palette Tokens (BLOCKS everything visual)
  |
  +-> Update tailwind.config.js brand colors
  +-> Update lib/theme/colors.ts
  +-> Audit + replace all hardcoded hex values
  +-> Avatar.tsx GRADIENT_PAIRS needs updating
  +-> Welcome screen hardcoded colors need updating

Card.tsx Style Change (INDEPENDENT)
  |
  +-> Modify Card component (remove bg, shadow)
  +-> All 15+ usages update automatically

Cream Background (INDEPENDENT, small)
  |
  +-> Change neutral.bg token value
  +-> Audit inline backgroundColor styles

Empty State Illustrations (DEPENDS ON palette being finalized)
  |
  +-> Source/create illustrations in wintergreen palette
  +-> Replace icon-circles in 3 EmptyState components
  +-> Keep existing CTA buttons and suggestion grids
```

---

## Complexity Assessment by Feature Area

### 1. Profile Picture Upload Pipeline

**Overall: Medium**

The pipeline has 5 steps, each individually simple but together requiring careful integration:

1. **Image selection** (Low) -- expo-image-picker, 10 lines of config
2. **Crop + resize** (Low) -- built-in crop, expo-image-manipulator for resize
3. **Upload to Supabase** (Med) -- base64-arraybuffer conversion, storage bucket setup, RLS policies
4. **Store URL in profile** (Low) -- single column update
5. **Display in Avatar** (Med) -- modify shared component, handle loading/error/fallback across all usages

Key gotcha: React Native cannot use Blob/FormData for Supabase Storage uploads. Must use the `base64-arraybuffer` library to convert base64 string to ArrayBuffer. This is well-documented but trips up every first-time implementer.

### 2. Google OAuth

**Overall: High (due to Expo Go -> Dev Build migration)**

The auth code is already written and working (`auth-utils.ts`). The blocker is infrastructure:

- Must switch both developers from Expo Go to development builds
- Requires `npx expo prebuild` (generates `ios/` and `android/` directories)
- Linux dev cannot build iOS (no Xcode) -- must use EAS Build cloud service
- macOS dev can build both locally
- Android debug SHA-1 fingerprint must be registered in Google Cloud Console
- iOS needs `iosUrlScheme` in app.json config plugin

This is a workflow migration, not a code change. Budget time for debugging build issues.

### 3. Empty State Illustrations

**Overall: Low-Medium**

Three components to update, each a straightforward image swap. The complexity is in sourcing/creating illustrations that:
- Match each other stylistically
- Use the new wintergreen palette
- Match the existing onboarding illustration style
- Are appropriately sized (transparent PNG, ~600x400px at 2x)

### 4. Visual Identity Shift

**Overall: High (due to blast radius)**

The token system makes the palette swap technically simple (change 3 values in 2 files). But:
- Hardcoded hex values bypass the token system (Avatar.tsx, welcome.tsx, onboarding screens)
- `brand.light` must be recalculated for wintergreen (current `#D1FAE5` is emerald-based)
- Semantic success color (`#22C55E`) is visually close to old brand -- may cause confusion alongside wintergreen
- Every screen needs visual QA after the swap
- The Card style change (removing bg/shadow) compounds with the background change -- double visual shift

---

## MVP Recommendation

**Phase the work in this order:**

### Phase A: Visual Foundation (do first)
1. **Wintergreen palette swap** -- Update tokens in tailwind.config.js and colors.ts, audit hardcoded values
2. **Cream background** -- Change neutral.bg token
3. **Card outline style** -- Modify Card.tsx

Rationale: Everything else builds on top of the new visual identity. Empty state illustrations need the finalized palette. Profile picture avatar styling needs to match the new look.

### Phase B: Profile Pictures (do second)
4. **Supabase Storage bucket + RLS** -- Backend setup
5. **Image picker + resize pipeline** -- `expo-image-picker` + `expo-image-manipulator` + `base64-arraybuffer`
6. **Avatar.tsx upgrade** -- Add photo display with gradient fallback
7. **Profile settings photo upload** -- Camera icon overlay, ActionSheet, upload flow
8. **Onboarding profile photo** (optional) -- Add photo picker to profile setup step

Rationale: Self-contained feature. Does not require dev build. Works in Expo Go.

### Phase C: Empty State Illustrations (do third)
9. **Source/create illustrations** -- 3 illustrations in wintergreen palette
10. **Replace EmptyState components** -- Swap icon-circles for illustrations

Rationale: Depends on finalized palette. Purely visual, no backend.

### Phase D: Google OAuth (do last)
11. **Expo Go -> Development build migration** -- Biggest workflow disruption
12. **Google Cloud Console configuration** -- SHA-1, iosUrlScheme
13. **Test Google sign-in end-to-end** -- Both platforms

Rationale: This changes the entire development workflow (no more Expo Go QR scanning). Do it last so all other features can be developed and tested in the familiar Expo Go environment. The auth code is already written -- this phase is purely infrastructure.

**Defer:**
- Animated empty state transitions (nice-to-have, not MVP)
- Wintergreen gradient buttons (can be done anytime, very small change)

---

## Sources

### Profile Picture Uploads
- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- official API reference, HIGH confidence
- [Expo ImageManipulator Documentation](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) -- resize/compress API, HIGH confidence
- [Supabase React Native Storage Upload](https://supabase.com/blog/react-native-storage) -- official blog post on RN upload pattern, HIGH confidence
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policies for storage, HIGH confidence
- [Supabase Expo Tutorial (User Management)](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) -- avatar bucket setup, HIGH confidence

### Google OAuth
- [React Native Google Sign-In Expo Setup](https://react-native-google-signin.github.io/docs/setting-up/expo) -- config plugin docs, HIGH confidence
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/) -- official Expo guide, HIGH confidence
- [Expo Go vs Development Builds](https://expo.dev/blog/expo-go-vs-development-builds) -- official Expo blog on limitations, HIGH confidence
- [Expo Development Build Migration](https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/) -- migration guide, HIGH confidence

### Empty State Design
- [Empty State UX Examples and Design Rules](https://www.eleken.co/blog-posts/empty-state-ux) -- best practices, MEDIUM confidence
- [Empty States: The Most Overlooked Aspect of UX (Toptal)](https://www.toptal.com/designers/ux/empty-state-ux-design) -- design patterns, MEDIUM confidence
- [unDraw](https://undraw.co/) -- free customizable illustrations, HIGH confidence
- [ManyPixels Illustrations](https://www.manypixels.co/gallery) -- free illustrations with color picker, HIGH confidence

### Design System Migration
- [Carbon Design System Migration Guide](https://carbondesignsystem.com/migrating/guide/design/) -- token migration strategy, MEDIUM confidence
- [Implementing Color Design Tokens (Medium)](https://medium.com/@slava.karablikov/implementing-color-design-tokens-practical-guide-2ee1d46a1392) -- practical token guide, LOW confidence
