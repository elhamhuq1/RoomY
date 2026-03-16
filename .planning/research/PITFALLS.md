# Pitfalls Research

**Domain:** Adding profile picture uploads, Google OAuth, empty state illustrations, and wintergreen palette shift to an existing Expo React Native app (NativeWind v4, TW3, Supabase, Expo SDK 54)
**Researched:** 2026-03-13
**Confidence:** HIGH (pitfalls verified through Supabase official docs, Expo official docs, codebase analysis of 49 files with 163 hardcoded brand color references, 11 Avatar import sites, 8 duplicated AVATAR_COLORS arrays, and the existing auth-utils.ts Google Sign-In implementation)

## Critical Pitfalls

### Pitfall 1: Google Sign-In Native Module Crashes Expo Go at Import Time

**What goes wrong:**
The `@react-native-google-signin/google-signin` package contains a native module that does not exist in Expo Go. If imported at the top level of any file, the entire app crashes on launch with a "Native module not found" error. The app already has a lazy import workaround in `lib/auth-utils.ts` (line 20: `await import(...)` inside the function body), but the Google Sign-In button on the auth screens must also handle this gracefully. If a developer adds a "Sign in with Google" button that eagerly calls `GoogleSignin.configure()` on mount or renders a `GoogleSigninButton` component from the library, Expo Go crashes immediately.

**Why it happens:**
`@react-native-google-signin/google-signin` is a native module that requires a custom development build. Expo Go ships with a fixed set of native modules and this library is not one of them. The app.json already lists the config plugin (line 33), which is correct for production builds but does nothing in Expo Go. The existing code correctly lazy-imports inside `signInWithGoogle()`, but any new code touching this library must follow the same pattern.

**How to avoid:**
- Never import `@react-native-google-signin/google-signin` at the top of any file. Always use dynamic `await import()` inside the function that needs it.
- Never render the library's `GoogleSigninButton` component -- build a custom button that calls the lazy-imported `signInWithGoogle()` function.
- Add a try/catch around the dynamic import itself, and if it fails, show a user-friendly message like "Google Sign-In requires a development build" or hide the button entirely when running in Expo Go.
- Detect Expo Go at runtime using `Constants.executionEnvironment === 'storeClient'` from `expo-constants` to conditionally show/hide the Google button.
- For v1.2 development, accept that Google Sign-In will only work in development builds. Email/password auth remains the Expo Go testing path.

**Warning signs:**
- App crashes on launch in Expo Go after adding Google Sign-In UI.
- `GoogleSigninButton` component appearing in any import statement.
- Top-level `import { GoogleSignin } from '@react-native-google-signin/google-signin'` in any file other than inside an async function body.

**Phase to address:**
Google OAuth phase -- implement the button with runtime detection and lazy import. Test in Expo Go to verify the button gracefully degrades.

---

### Pitfall 2: Supabase Storage Upload Produces 0-Byte or Corrupted Files from React Native

**What goes wrong:**
The standard web approach of uploading a `File` or `Blob` object to Supabase Storage does not work in React Native. `fetch(uri).then(r => r.blob())` produces a blob that Supabase's upload method either rejects or stores as a 0-byte file. This is a well-documented issue across Supabase GitHub discussions (#1268, #2336, #7252). The upload appears to succeed (no error), the file path is returned, but the stored file is empty or corrupted. The avatar URL works (no 404), but the image displays as a broken/blank element.

**Why it happens:**
React Native's `fetch` and `Blob` implementations differ from the browser. The Supabase JS client's `storage.upload()` expects either an `ArrayBuffer`, `File` (web File API), or `FormData`. In React Native, `Blob` objects created from `fetch` do not serialize correctly for the upload endpoint. The React Native runtime does not have the same File API as browsers.

**How to avoid:**
- Use the `base64-arraybuffer` library (install: `npm install base64-arraybuffer`).
- Get the image as base64 from expo-image-picker by passing `options: { base64: true }` to `launchImageLibraryAsync` or `launchCameraAsync`.
- Convert base64 to ArrayBuffer using `decode()` from `base64-arraybuffer`.
- Upload the ArrayBuffer with explicit `contentType`:
  ```typescript
  import { decode } from 'base64-arraybuffer';

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,  // CRITICAL: request base64 encoding
  });

  if (!result.canceled && result.assets[0].base64) {
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(result.assets[0].base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });
  }
  ```
- Never use `fetch(uri).then(r => r.blob())` for Supabase uploads in React Native.

**Warning signs:**
- Files appearing in Supabase Storage dashboard with 0 bytes size.
- Avatar images loading but displaying as blank/broken.
- Upload succeeding (no error) but image not rendering.
- Using `fetch()` + `.blob()` anywhere in the upload pipeline.

**Phase to address:**
Profile picture upload phase -- implement using base64-arraybuffer from the start. Do not prototype with blob/fetch.

---

### Pitfall 3: Supabase Storage RLS Policies Missing for Upload, Download, or Overwrite

**What goes wrong:**
Supabase Storage has its own RLS policies on the `storage.objects` table, separate from your database table RLS policies. By default, no operations are allowed. If you create an "avatars" bucket but forget RLS policies, every upload returns a "new row violates row-level security policy" error. If you add INSERT but forget SELECT, the upload succeeds but `getPublicUrl()` returns a URL that 403s. If you allow INSERT but not UPDATE, the first avatar upload works but updating the avatar (upsert) fails silently.

**Why it happens:**
Developers set up database RLS policies and assume storage works the same way. It does not. Storage RLS operates on the `storage.objects` table, not your custom tables. The bucket "public" setting only controls whether anonymous downloads are allowed -- it does not bypass RLS for uploads. The project already has experience with RLS recursion issues (`get_user_household_ids()` SECURITY DEFINER function), but storage RLS is a separate system with its own patterns.

**How to avoid:**
- Create three RLS policies on `storage.objects` for the "avatars" bucket:
  1. **INSERT**: Users can upload their own avatar -- `(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`
  2. **SELECT**: Anyone authenticated can view avatars -- `(bucket_id = 'avatars')`
  3. **UPDATE**: Users can overwrite their own avatar -- `(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`
- Structure file paths as `{user_id}/avatar.jpg` so the folder name matches the user ID for RLS enforcement.
- Make the bucket **public** for reads (so `getPublicUrl()` works without signed URLs) but RLS-protected for writes.
- Test the complete cycle: upload, retrieve URL, display image, upload replacement, verify replacement displays.

**Warning signs:**
- "new row violates row-level security policy" on upload attempts.
- Upload succeeds but image URL returns 403.
- First upload works, subsequent updates fail.
- Using `createSignedUrl()` when a public bucket URL would suffice (unnecessary complexity).

**Phase to address:**
Profile picture upload phase -- create the storage bucket and all three RLS policies BEFORE writing any client-side upload code. Test via Supabase dashboard first.

---

### Pitfall 4: Avatar Photo Cached by CDN/Browser After Update -- User Sees Old Photo

**What goes wrong:**
After a user uploads a new profile picture, the avatar URL points to the same path (`{user_id}/avatar.jpg`). Supabase's CDN and React Native's image cache both serve the old cached version. The user uploads a new photo, sees a success message, but the avatar still shows the old photo everywhere in the app. Refreshing the app does not help because the cache has not expired.

**Why it happens:**
Supabase Storage uses CDN caching with configurable cache-control headers. When a file is overwritten at the same path, the CDN may serve the cached version. React Native's `<Image>` component also caches images aggressively by URI. Even with Supabase's Smart CDN cache invalidation, the local React Native image cache is separate and will serve stale data.

**How to avoid:**
- Append a cache-busting query parameter to the avatar URL: `avatarUrl + '?v=' + Date.now()` or use the `updated_at` timestamp from the profiles table.
- Store the avatar URL in the `profiles.avatar_url` column WITH the cache-busting parameter, so all consumers automatically get the fresh version.
- After a successful upload, update the profiles table with the new URL (including version parameter), then call `refreshProfile()` from the auth context to propagate the change.
- The profile settings screen currently does not have avatar upload -- when adding it, ensure the auth context's `refreshProfile()` is called after upload to update the `profile.avatar_url` in state.
- Alternative: use unique filenames like `{user_id}/{timestamp}.jpg` instead of overwriting the same file. This avoids caching issues entirely but requires deleting old files.

**Warning signs:**
- User uploads new photo, success shown, but old photo persists throughout app.
- Avatar updates visible only after clearing app data or reinstalling.
- Different avatars showing on different screens (some cached, some fresh).

**Phase to address:**
Profile picture upload phase -- implement cache-busting strategy from the start. Do not assume CDN invalidation handles this automatically.

---

### Pitfall 5: Wintergreen Palette Shift Requires Updating 163 Hardcoded Color References Across 49 Files

**What goes wrong:**
The palette shift from emerald green (#10B981 / #059669 / #D1FAE5) to dark wintergreen (~#2D6A4F) affects far more than just the `tailwind.config.js` and `lib/theme/colors.ts` files. The codebase has:
- **49 files** with NativeWind brand token usage (e.g., `bg-brand`, `text-brand`, `border-brand`)
- **15 hardcoded #10B981 references** in inline styles, `color=` props, and component constants
- **8 duplicated AVATAR_COLORS arrays** across 8 different files (settle.tsx, add.tsx, [id].tsx, members.tsx, complete-trip.tsx, swap-request.tsx, dashboard.tsx, chores/add.tsx), each containing `'#10B981'` as the first color
- **1 Avatar.tsx** component with hardcoded `['#10B981', '#059669']` gradient pair
- **1 Toggle.tsx** component with hardcoded `'#10B981'` as the active track color

Updating only `tailwind.config.js` and `colors.ts` changes the NativeWind token references but leaves all hardcoded hex values on the old emerald green. The result is a two-tone green app: some elements wintergreen, others still emerald.

**Why it happens:**
The v1.1 design system did not fully consolidate hardcoded colors. Components like Ionicons require string `color=` props, Calendar themes use hex strings, and the AVATAR_COLORS arrays were copy-pasted across files instead of imported from a shared constant. The v1.0 audit already flagged this ("AVATAR_COLORS and getInitials duplicated in 11 files"), but it was not resolved in v1.1.

**How to avoid:**
- Update the palette in THREE places simultaneously:
  1. `tailwind.config.js` -- brand token values
  2. `lib/theme/colors.ts` -- runtime color constants
  3. Every file with hardcoded `#10B981`, `#059669`, or `#D1FAE5`
- Before changing colors, consolidate the 8 duplicated AVATAR_COLORS arrays into a single export in `lib/theme/colors.ts` or a new `lib/ui-utils.ts`. Import it everywhere. Then the palette shift requires changing one file instead of eight.
- Run a grep for the old hex values after migration: `grep -r '#10B981\|#059669\|#D1FAE5' --include='*.tsx' --include='*.ts'`. Zero results means success.
- The Avatar component's GRADIENT_PAIRS should also reference the colors constant, not hardcode hex values.

**Warning signs:**
- Two different shades of green visible on the same screen.
- Toggle switches showing old green when active but new green elsewhere.
- Avatar gradient starting with old emerald but surrounding UI in wintergreen.
- `welcome.tsx` auth screen still showing old green dots and buttons.

**Phase to address:**
Palette shift phase -- this MUST be the first task, before any feature work begins. Consolidate AVATAR_COLORS first, then update the three color source files, then grep for stragglers.

---

### Pitfall 6: Avatar Component API Change Breaks 11 Consumer Files

**What goes wrong:**
The current `Avatar` component (in `components/ui/Avatar.tsx`) takes `{ userId, name, size }` props and renders a gradient circle with initials. Adding profile picture support means the component needs a new `avatarUrl` prop. If the API change is not backward-compatible, all 11 files importing Avatar break simultaneously. If the `avatarUrl` prop is added but the fallback (initials on gradient) is not preserved, users without photos see a broken or blank avatar.

**Why it happens:**
The Avatar component is the most widely-used UI component in the codebase, imported in: `BalanceMemberRow`, `GroceryItemRow`, `RoommateSection`, `ExpenseRow`, `MembersCard`, `WeeklyTimeline`, `member-welcome.tsx`, `dispute.tsx`, and `chores.tsx` (tab). Each consumer passes `userId` and `name`. None pass an `avatarUrl` because it does not exist yet. A breaking API change ripples through the entire app.

Additionally, the profile settings screen (`settings/profile.tsx` line 94) renders its OWN avatar using a simple `View` with `bg-brand` and initials text -- it does not use the shared Avatar component at all. This creates a second avatar implementation that must also be updated.

**How to avoid:**
- Make `avatarUrl` an optional prop with `undefined` default. When `avatarUrl` is provided and non-empty, render an `<Image>` inside the circle. When absent, fall back to the existing gradient + initials behavior.
- Do NOT change the existing required props (`userId`, `name`, `size`). Keep the API additive-only.
- Add an `onLoadError` handler on the Image that falls back to the gradient initials if the URL is broken/expired.
- Update `settings/profile.tsx` to use the shared Avatar component instead of its inline implementation.
- The component currently exports `getGradientForUser()` -- keep this exported for any consumer that needs the gradient color without rendering the full component.

**Warning signs:**
- TypeScript errors in 11+ files after modifying Avatar props.
- Users without profile photos seeing blank circles instead of initials.
- Profile settings screen showing a different avatar style than the rest of the app.
- No error handling for broken avatar URLs (image loads forever or shows broken icon).

**Phase to address:**
Profile picture upload phase -- modify Avatar component FIRST with backward-compatible API, then update the profile settings screen to use it, then add upload functionality.

---

### Pitfall 7: expo-image-picker Camera Permission Denied Silently on Android

**What goes wrong:**
`expo-image-picker` requires camera and media library permissions. On iOS, the system automatically prompts the user. On Android, `launchCameraAsync()` may silently fail or return `canceled: true` if camera permission was not requested beforehand. The developer tests on iOS, sees the permission prompt, and assumes it works on Android. On Android, the camera opens but the captured image is not returned, or the function throws a generic error.

**Why it happens:**
On Android 13+ (API 33), the permission model changed. `READ_EXTERNAL_STORAGE` was replaced with `READ_MEDIA_IMAGES`. `expo-image-picker` handles this internally, but the camera permission (`CAMERA`) must still be requested explicitly using `ImagePicker.requestCameraPermissionsAsync()` before calling `launchCameraAsync()`. Gallery access (`launchImageLibraryAsync()`) does not require explicit permission on newer Android versions but does on older ones.

**How to avoid:**
- Always call `ImagePicker.requestCameraPermissionsAsync()` before `launchCameraAsync()`. Check the result and show a user-friendly message if denied.
- For gallery: call `ImagePicker.requestMediaLibraryPermissionsAsync()` before `launchImageLibraryAsync()` on Android.
- Handle the "permission denied permanently" case: if `canAskAgain` is false, direct the user to Settings to grant the permission manually.
- `expo-image-picker` works in Expo Go without a development build -- this is confirmed in official Expo docs. No config plugin is needed for basic usage.
- Test on both a physical iOS device and a physical Android device. Emulators often auto-grant permissions and hide this bug.

**Warning signs:**
- Camera feature works on iOS but not Android.
- `launchCameraAsync()` returning `canceled: true` without the camera ever opening.
- No permission prompt appearing on Android.
- Crash or unhandled promise rejection on Android when opening camera.

**Phase to address:**
Profile picture upload phase -- implement permission checks with proper error handling before any camera/gallery calls.

---

### Pitfall 8: Empty State Images Increase Bundle Size and Slow Cold Start

**What goes wrong:**
Adding illustration images for empty states (expenses, groceries, chores, home) as static assets via `require('./assets/empty-expenses.png')` bundles them into the JS bundle. If the illustrations are high-resolution (e.g., 3x at 600x600px each), four illustrations can add 200KB-1MB to the bundle size. React Native's asset system includes @1x, @2x, @3x variants, tripling the storage. Since empty states are only shown when there is no data (brief moment during onboarding), these assets are loaded eagerly but displayed rarely.

**Why it happens:**
Static `require()` assets are bundled at build time regardless of whether they are displayed. The Metro bundler includes them in the JavaScript bundle. For development in Expo Go, this increases the initial JS bundle download time over the local network. For production, it increases app binary size.

**How to avoid:**
- Keep empty state illustrations small: use SVG-style illustrations at a max of 200x200px rendered size. Export at 2x (400x400px) maximum.
- Use PNG with proper compression. Run through a tool like `pngquant` or `tinypng` before committing.
- Consider using vector illustrations via `react-native-svg` instead of raster images. SVGs are typically 5-20KB vs 50-200KB for PNGs.
- The current empty states use Ionicons (vector icons) inside colored circles. This is already lightweight. If the v1.2 goal is to add custom illustrations, keep them as simple, flat-color PNGs to minimize file size.
- Do NOT use animated Lottie files for empty states -- `lottie-react-native` is a native module that does not work in Expo Go without a development build.
- Alternative: keep the current Ionicons-based empty states and just restyle them with the new wintergreen palette. No additional assets needed.

**Warning signs:**
- JS bundle size increasing by more than 500KB after adding illustrations.
- Expo Go taking noticeably longer to load the bundle over WiFi.
- Images looking blurry on high-DPI screens (under-resolution) or unnecessarily large files (over-resolution).

**Phase to address:**
Empty state phase -- decide the illustration approach (keep icons vs. add images vs. SVGs) before creating any assets. If using images, establish a file size budget (e.g., max 50KB per illustration).

---

### Pitfall 9: Cream Background Color Requires Updating Safe Area and System Chrome

**What goes wrong:**
Shifting the app background from `#F8FAFC` (neutral-bg, blue-gray) to cream (e.g., `#FEFDFB` or similar) is not just a `bg-neutral-bg` token change. The safe area insets (status bar area, home indicator area), the splash screen background, the keyboard appearance, and the navigation bar must all match the cream color. If only the screen content background changes but the status bar area stays blue-gray, there is a visible color seam at the top of every screen. The splash screen (`app.json` line 14) already uses `#fefdfb`, which is good -- but other system chrome may not match.

**Why it happens:**
React Native screens render inside safe area boundaries. The area behind the status bar and below the home indicator is controlled by the root view's background color, the `StatusBar` component's `backgroundColor` (Android only), and the navigation bar theme. These are set in different places: `app.json`, `_layout.tsx`, and individual screen wrappers. A background color change in the Tailwind config does not propagate to these system chrome areas.

**How to avoid:**
- Update the cream color in ALL locations simultaneously:
  1. `tailwind.config.js` -- `neutral.bg` token
  2. `lib/theme/colors.ts` -- `neutral.bg` value
  3. `app.json` -- `splash.backgroundColor` (already `#fefdfb`)
  4. Root `_layout.tsx` -- any `backgroundColor` on the root View
  5. Tab navigator -- `tabBarStyle.backgroundColor` and `sceneContainerStyle`
  6. Stack navigator -- `screenOptions.contentStyle.backgroundColor`
- On Android, set `StatusBar.setBackgroundColor()` or use the `StatusBar` component with `backgroundColor` to match the cream.
- Test on devices with notches/dynamic islands and on devices without to verify no color seam appears.

**Warning signs:**
- White/gray band visible at the top of the screen above the content area.
- Splash screen color not matching the post-load app background.
- Tab bar background color mismatching the screen background.
- Pull-to-refresh revealing a different color behind the content.

**Phase to address:**
Cream background phase -- update all system chrome locations as a single atomic change. Test on multiple device form factors.

---

### Pitfall 10: Card Style Change from Shadow to Outline Requires Removing Existing Shadows

**What goes wrong:**
The v1.2 design changes the Card component from an elevated style (white background + shadow) to an outlined style (transparent background + gray border). If the Card component is updated but screens that apply additional shadow styling to cards are not updated, the cards show BOTH an outline AND a shadow -- a visual contradiction. Some screens may apply shadow styles directly (not through the Card component) via `style={{ shadowColor, shadowOffset }}` or NativeWind `shadow` class.

**Why it happens:**
The v1.1 design system added shadows to cards as a design pattern. Some screens may layer additional shadows on top of the Card component's built-in shadow. When the Card component drops its shadow, these extra shadow layers remain, creating unexpected visual artifacts.

**How to avoid:**
- Search for all shadow-related styles that are applied to Card wrappers or card-like containers: `shadow`, `shadow-md`, `shadowColor`, `shadowOffset`, `shadowOpacity`, `elevation`.
- Update the Card component to use `border border-neutral-border bg-transparent` (or whatever the outline spec calls for), removing all shadow styles.
- Grep for `<Card` across the codebase and verify that no parent or wrapper applies additional shadows.
- The BalanceCard (gradient card on home screen) may need to keep its shadow/gradient style even if regular cards become outlined. Clarify whether gradient cards are exempt from the outline treatment.

**Warning signs:**
- Cards showing both a border and a shadow simultaneously.
- Card backgrounds not being transparent (old `bg-white` still applied).
- Inconsistent card styles across different screens.
- The home screen gradient balance card losing its visual prominence because it was also flattened.

**Phase to address:**
Card redesign phase -- update Card component, then search all consumers for shadow overrides. Decide which special cards (gradient balance card) keep elevated styling.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 8 duplicated AVATAR_COLORS arrays instead of shared import | Quick copy-paste during v1.0 | Every palette change requires 8 file edits; easy to miss one | Never -- consolidate before palette shift |
| Storing avatar URL without cache-busting parameter | Simpler URL handling | Users see stale avatars after update until cache expires | Never -- cache busting is essential for mutable images |
| Using `fetch().blob()` for upload instead of base64-arraybuffer | Familiar web pattern | Silently produces 0-byte files in React Native | Never in React Native -- always use base64-arraybuffer |
| Skipping permission checks before camera/gallery access | Works on iOS (auto-prompts) | Silent failure on Android, no error feedback to user | Never -- always request permissions explicitly |
| High-resolution empty state PNGs (600x600 @3x) | Sharp illustrations | 200KB+ per image, slower bundle load | Acceptable only for a production build with OTA updates; never for Expo Go development |
| Public storage bucket without RLS on writes | Upload "just works" | Any authenticated user can overwrite any other user's avatar | Never -- always use path-based RLS policies |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage + React Native | Using `fetch(uri).then(r => r.blob())` for uploads | Use `base64: true` option in image picker, then `decode()` from `base64-arraybuffer` to create ArrayBuffer for upload |
| Supabase Storage RLS | Creating bucket but no RLS policies (all operations blocked by default) | Create INSERT, SELECT, and UPDATE policies on `storage.objects` before writing client code. Use `storage.foldername()` helper for path-based access control |
| Supabase Storage + CDN caching | Overwriting avatar at same path and expecting immediate update | Append version/timestamp query parameter to avatar URL, or use unique filenames per upload |
| Google Sign-In + Expo Go | Top-level import of `@react-native-google-signin/google-signin` | Dynamic `await import()` inside the function body; detect Expo Go at runtime to hide/disable the button |
| expo-image-picker + Android permissions | Assuming iOS-style auto-prompting works on Android | Call `requestCameraPermissionsAsync()` and `requestMediaLibraryPermissionsAsync()` explicitly; handle "denied permanently" case |
| NativeWind tokens + inline color props | Updating tailwind.config.js and expecting Ionicons `color=` props to change | Update `lib/theme/colors.ts` alongside tailwind.config.js; all inline `color=` props must reference the constants file |
| Profile picture + auth context | Uploading avatar but not refreshing the auth context profile state | Call `refreshProfile()` after successful upload+DB update so all screens show the new avatar immediately |
| Card component + consumer overrides | Changing Card style but not checking for shadow overrides on Card wrappers | Grep for shadow styles applied to Card parents and remove them |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Large base64 strings in memory during avatar upload | Memory spike during upload, potential crash on low-RAM devices | Resize images before upload: set `quality: 0.7` and use `allowsEditing: true` with `aspect: [1, 1]` to crop to square. Max 500x500px output | Images over 2MB on devices with less than 2GB RAM |
| Uncached avatar image downloads on every render | Avatars flicker or show loading state each time a list re-renders | Use a consistent URL (with version param) so React Native's built-in image cache can work. Consider `expo-image` for better caching control | Any list with 5+ avatar images |
| Multiple image downloads for the same user across screens | Same avatar downloaded separately on Home, Expenses, Groceries, and Chores tabs | Store the avatar URL in the auth context (via `profile.avatar_url`) and pass it through props, so the same URL is used everywhere and cached once | Immediately on any household with 3+ members |
| Static require for empty state images loaded at JS bundle parse time | Slower initial app load, wasted memory for screens user may never visit in that session | Use dynamic `require()` or lazy loading if images are large. Better: use SVGs or keep the current icon-based approach | When total image assets exceed 500KB |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public storage bucket with no write-side RLS | Any authenticated user can upload files to any path, overwriting other users' avatars | Use path-based RLS: `auth.uid()::text = (storage.foldername(name))[1]` ensures users can only write to their own folder |
| Storing unvalidated file types in avatar bucket | Users could upload non-image files (HTML, SVG with scripts, executables) to storage | Validate file type on client side (only allow `image/jpeg` and `image/png`). Set explicit `contentType` on upload. Consider server-side validation via Supabase Edge Function |
| Avatar URL exposing user UUIDs in public URLs | User IDs visible in storage URLs like `avatars/{user-uuid}/avatar.jpg` | Acceptable for this personal project (UUIDs are not secret, RLS protects all data access). For a public app, consider hashing the user ID in the file path |
| Google OAuth token handling in client code | ID token exposed in client memory | The existing `signInWithIdToken()` pattern is correct -- the token is passed directly to Supabase and not stored. Do not log tokens or store them in AsyncStorage |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading indicator during avatar upload | User taps "upload," nothing visibly happens for 2-5 seconds, they tap again and trigger a duplicate upload | Show an immediate loading spinner overlaid on the avatar circle. Disable the upload button during upload. Show success/error feedback |
| Crop square not enforced, avatar stretched | Rectangular photos squeezed into circle avatars, faces distorted | Use `allowsEditing: true, aspect: [1, 1]` in image picker options to force square crop before upload |
| Google Sign-In button visible but non-functional in Expo Go | User taps "Sign in with Google," gets a cryptic error or crash | Either hide the Google button in Expo Go entirely, or show a clear message: "Available in the full app" |
| Empty states showing on first load before data arrives | User sees "No expenses yet" for 500ms while data loads, then content appears. Feels buggy | Distinguish between "loading" (show skeleton/spinner) and "truly empty" (show empty state). Only show empty state after data has loaded and the list is actually empty |
| Palette shift making existing avatar gradients clash with new UI | The Avatar gradient pairs include the old emerald green which may clash with wintergreen UI elements | Update the first gradient pair in GRADIENT_PAIRS from `['#10B981', '#059669']` to the new wintergreen values. Other gradient pairs (blue, violet, pink, etc.) should remain as-is for visual variety |

## "Looks Done But Isn't" Checklist

- [x] **Avatar upload:** Verify the uploaded image displays correctly on ALL screens that show avatars (Home MembersCard, Expenses rows, Groceries item rows, Chores assignee, Settings members, WeeklyTimeline) -- not just the upload screen
- [x] **Avatar fallback:** Verify users WITHOUT a profile picture still show gradient initials (the fallback). Test by creating a new account and checking all avatar-displaying screens
- [x] **Avatar cache busting:** Upload a new photo, verify the old photo is NOT still showing on any screen. Test without killing the app
- [x] **Storage RLS:** Try uploading an avatar for a different user's path via the Supabase client -- verify it is rejected by RLS
- [x] **Google Sign-In in Expo Go:** Launch the app in Expo Go and verify it does not crash. Verify the Google button is either hidden or shows a graceful message
- [x] **Google Sign-In in dev build:** If testing in a development build, verify the full Google OAuth flow: button tap, Google account picker, redirect back, user session established, profile created/updated
- [x] **Palette grep:** Run `grep -r '#10B981\|#059669\|#D1FAE5' --include='*.tsx' --include='*.ts' app/ components/ lib/` -- zero results means the palette migration is complete
- [x] **Empty state distinction:** Navigate to each module with no data and verify the empty state displays. Then add one item and verify the empty state disappears and content renders
- [x] **Cream background seams:** Check the top of the screen (status bar area), bottom (home indicator area), tab bar background, and pull-to-refresh background all match the cream color
- [x] **Card outlines:** Verify NO card shows both an outline border AND a shadow. Cards should be flat with border only
- [x] **Android permissions:** On a physical Android device, test camera and gallery access for avatar upload. Verify permission prompt appears and denial is handled gracefully

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 0-byte file uploads from blob approach | LOW | Switch to base64-arraybuffer approach. Delete 0-byte files from storage bucket. Re-upload |
| Missing storage RLS policies | LOW | Add policies via Supabase dashboard or migration. No code changes needed |
| Cached stale avatars | LOW | Add cache-busting query param to avatar URL in profiles table. Call refreshProfile() to propagate |
| Expo Go crash from Google Sign-In import | LOW | Move import to lazy `await import()` inside function body. Remove any GoogleSigninButton component usage |
| Half-migrated palette (two greens) | MEDIUM | Grep for old hex values, update each file. Takes 1-2 hours with the color constants as source of truth |
| Avatar component API break (11 files) | MEDIUM | Make avatarUrl prop optional with gradient fallback default. Fix TypeScript errors in each consumer |
| Empty state images too large | LOW | Re-export at lower resolution or replace with SVG/icon approach. Update require() references |
| Android camera permission denied silently | LOW | Add permission request calls before camera/gallery launch. Handle denied case with user-facing message |
| Card style mixed (shadow + outline) | LOW | Grep for shadow styles on Card wrappers, remove them. Update Card component to remove built-in shadow |
| Cream background color seam at status bar | LOW | Update backgroundColor in root layout, tab navigator sceneContainerStyle, and StatusBar component |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Google Sign-In Expo Go crash (#1) | Google OAuth phase | App launches in Expo Go without crash. Google button hidden or shows fallback message |
| 0-byte storage uploads (#2) | Profile picture upload phase | Avatar uploaded via image picker displays correctly in Supabase dashboard and in app |
| Missing storage RLS (#3) | Profile picture upload phase (first task) | Upload succeeds for own path, fails for other users' paths. Public URL returns image, not 403 |
| Cached stale avatars (#4) | Profile picture upload phase | Upload new photo, all screens show new photo without app restart |
| Hardcoded palette values (#5) | Palette shift phase (first task) | Grep for old hex values returns zero results across all .ts/.tsx files |
| Avatar API break (#6) | Profile picture upload phase (first task) | All 11 Avatar consumers render without TypeScript errors. Users with and without photos display correctly |
| Android camera permissions (#7) | Profile picture upload phase | Camera and gallery work on physical Android device with proper permission prompts |
| Empty state bundle size (#8) | Empty state phase | Total added image assets under 200KB. Bundle load time not noticeably slower |
| Cream background seams (#9) | Cream background phase | No visible color boundary between content and system chrome on any device form factor |
| Card shadow/outline conflict (#10) | Card redesign phase | No card displays both shadow and border simultaneously |

## Sources

- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policy requirements, helper functions, public vs private buckets (HIGH confidence)
- [Supabase React Native file upload blog post](https://supabase.com/blog/react-native-storage) -- ArrayBuffer upload pattern, base64-arraybuffer requirement (HIGH confidence)
- [Supabase CDN cache busting discussion #5737](https://github.com/orgs/supabase/discussions/5737) -- version query parameter for cache invalidation (MEDIUM confidence)
- [Supabase image upload discussion #1268](https://github.com/orgs/supabase/discussions/1268) -- 0-byte file and blob conversion issues in React Native (HIGH confidence)
- [Supabase Smart CDN docs](https://supabase.com/docs/guides/storage/cdn/smart-cdn) -- CDN invalidation behavior for updated files (HIGH confidence)
- [expo-image-picker documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- Expo Go compatibility confirmed, base64 option, permissions API (HIGH confidence)
- [Expo Google Authentication guide](https://docs.expo.dev/guides/google-authentication/) -- native SDK limitations in Expo Go (HIGH confidence)
- [React Native Google Sign-In Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo) -- config plugin requirements, Expo Go incompatibility (HIGH confidence)
- [Google Sign-In Expo Go limitations blog](https://www.amanmaharshi.com/blog/google-login-expo-react-native) -- workarounds for Expo Go development (MEDIUM confidence)
- [React Native Images documentation](https://reactnative.dev/docs/images) -- static require vs URI, bundle size implications (HIGH confidence)
- [Expo Assets documentation](https://docs.expo.dev/develop/user-interface/assets/) -- asset bundling and performance (HIGH confidence)
- Codebase analysis: 163 brand color references across 49 files, 8 duplicated AVATAR_COLORS arrays, 11 Avatar import sites, inline avatar in settings/profile.tsx (direct observation, HIGH confidence)

---
*Pitfalls research for: RoomY v1.2 Polish & Identity (Expo/Supabase/NativeWind)*
*Researched: 2026-03-13*
