# Technology Stack: v1.2 Polish & Identity Additions

**Project:** RoomY v1.2 Polish & Identity
**Researched:** 2026-03-13
**Scope:** New libraries and backend changes needed for profile picture uploads (camera + gallery), Google OAuth in Expo Go, empty state image display, and design palette shift. This does NOT re-cover the existing stack -- only what must be ADDED or CHANGED.

---

## Existing Stack (DO NOT CHANGE)

Already installed and working. Listed for reference only.

| Technology | Version | Status |
|------------|---------|--------|
| Expo SDK | 54 | Installed |
| React Native | 0.81.5 | Installed |
| NativeWind | 4.2.2 | Installed |
| Tailwind CSS | 3.4.19 | Installed |
| @supabase/supabase-js | ^2.99.0 | Installed |
| expo-linear-gradient | ~15.0.8 | Installed |
| expo-blur | ~15.0.8 | Installed |
| react-native-reanimated | ~4.1.1 | Installed |
| @react-native-google-signin/google-signin | ^16.1.2 | Installed (lazy import, crashes Expo Go) |

**Key existing fact:** The `profiles` table already has an `avatar_url TEXT` column. The auth trigger already captures `avatar_url` from Google/Apple auth metadata on sign-up. The `Avatar` component currently renders gradient initials only -- it has no image display path yet.

---

## New Dependencies to Install

### 1. expo-image-picker (~17.0.10) -- Image Selection

**Purpose:** Let users select a profile photo from their gallery or take one with the camera.

**Why this one:** First-party Expo package. Included in Expo Go (no dev build needed). Provides both `launchImageLibraryAsync` and `launchCameraAsync` with built-in permission handling. The `allowsEditing: true` option gives users a square crop UI natively on both platforms -- sufficient for avatar photos without a third-party cropper.

**Key API for avatar use case:**

```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,   // enables square crop UI
  aspect: [1, 1],        // square aspect (Android only; iOS always square when editing)
  quality: 0.8,          // slight compression, still high quality
  base64: true,          // returns base64 string for Supabase upload
});
```

**Permissions:** Camera permission requested automatically on first `launchCameraAsync` call. Media library permission requested automatically on first `launchImageLibraryAsync` call. No manual `requestPermissionsAsync` needed unless you want to check permission status in advance.

**What it does NOT do:** Circular crop preview (iOS/Android native pickers show square crop only). The circular masking is visual -- apply `borderRadius: size/2` on the `Image` component when displaying. This is standard practice for avatars and does not require a cropping library.

### 2. expo-file-system (~19.0.21) -- Read Image Data for Upload

**Purpose:** Read the picked image file as base64 for upload to Supabase Storage.

**Why this one:** First-party Expo package. Included in Expo Go. While `expo-image-picker` has a `base64: true` option, it has known reliability issues on Android (line breaks in base64 string, inconsistent behavior). Using `expo-file-system`'s `readAsStringAsync` with `EncodingType.Base64` is the more reliable cross-platform pattern recommended by Supabase's own React Native storage guide.

**Key API:**

```typescript
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(imageUri, {
  encoding: FileSystem.EncodingType.Base64,
});
```

### 3. base64-arraybuffer (^1.0.2) -- Base64 to ArrayBuffer Conversion

**Purpose:** Convert base64 image data to ArrayBuffer for Supabase Storage upload.

**Why this one:** Supabase's official React Native guide explicitly recommends this library. In React Native, `Blob`, `File`, and `FormData` upload methods do not work correctly with Supabase Storage. The `decode()` function from this library converts the base64 string to an `ArrayBuffer` that Supabase's `storage.from().upload()` accepts. Pure JavaScript, no native code, works everywhere.

**Key API:**

```typescript
import { decode } from 'base64-arraybuffer';

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}.jpg`, decode(base64), {
    contentType: 'image/jpeg',
    upsert: true,  // overwrite previous avatar
  });
```

### 4. expo-web-browser (~15.0.10) -- Google OAuth in Expo Go

**Purpose:** Open Google's OAuth consent screen in an in-app browser for authentication, replacing the native `@react-native-google-signin/google-signin` approach that crashes in Expo Go.

**Why this one:** First-party Expo package. Included in Expo Go. The `openAuthSessionAsync` method opens a browser that handles the OAuth redirect flow, then returns the redirect URL with tokens back to the app. This is the ONLY way to do Google OAuth in Expo Go -- the native `@react-native-google-signin/google-signin` library requires a development build because it uses native modules not available in Expo Go.

**The complete Google OAuth flow for Expo Go:**

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

async function signInWithGoogleWeb() {
  // 1. Get the OAuth URL from Supabase (don't let it redirect automatically)
  const redirectTo = Linking.createURL('/auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error;

  // 2. Open the OAuth URL in an in-app browser
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo,
  );

  // 3. Extract tokens from the redirect URL
  if (result.type === 'success') {
    const url = result.url;
    // Supabase returns tokens in the URL fragment (#access_token=...&refresh_token=...)
    const params = new URLSearchParams(url.split('#')[1]);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}
```

**Migration path:** The existing `lib/auth-utils.ts` has `signInWithGoogle()` using `@react-native-google-signin/google-signin` with lazy import. Replace this with the `expo-web-browser` approach above. The lazy import workaround was a band-aid -- the native module still could not actually function in Expo Go. The web browser approach actually works.

**Known issue:** `supabase.auth.setSession()` has been reported to occasionally hang. Mitigation: add a timeout wrapper (5 seconds) and retry once on failure.

**Supabase Dashboard config required:** Add the Expo redirect URL (`exp://...` for dev, `com.roomy://auth/callback` for production) to the "Redirect URLs" allowlist in Supabase Dashboard > Authentication > URL Configuration.

### 5. expo-image (~3.0.11) -- Display Avatar Images

**Purpose:** Display profile pictures and empty state illustrations with caching, placeholder support, and smooth transitions.

**Why this one over React Native's `<Image>`:** First-party Expo package. Included in Expo Go. Uses SDWebImage (iOS) and Glide (Android) under the hood for fast disk/memory caching. Supports placeholder (BlurHash/ThumbHash), transition animations between loading states, and content-fit modes. React Native's `<Image>` has no built-in disk caching -- every app restart re-downloads images. For user avatars that appear on every screen, caching is critical.

**Key API for avatars:**

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: avatarUrl }}
  style={{ width: 40, height: 40, borderRadius: 20 }}
  placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
  contentFit="cover"
  transition={200}
  cachePolicy="disk"
/>
```

**Integration with Avatar component:** The existing `Avatar` component shows gradient initials. When `avatar_url` is set on the profile, show the `expo-image` `<Image>` instead. When no URL is set, fall back to the current gradient initials. This is a conditional render, not a rewrite.

---

## No New Library Needed

### Image Cropping -- Built into expo-image-picker

`allowsEditing: true` with `aspect: [1, 1]` provides a native square crop UI. No need for `react-native-image-crop-picker` (requires native code, not in Expo Go), `expo-image-crop` (unmaintained), or `expo-image-manipulator` (useful for server-side resize but not needed when the picker handles cropping). The picked image is already cropped to square.

### Image Resizing -- Not Needed Client-Side

Avatars are small (max 256x256 display). Using `quality: 0.8` in the image picker and uploading the cropped square image directly is sufficient. Client-side resizing with `expo-image-manipulator` adds complexity without meaningful benefit -- the cropped square image from the picker at quality 0.8 is typically 50-150KB, well within acceptable upload size for a profile picture.

### Server-Side Image Transforms -- Supabase Pro Plan Only

Supabase Storage supports on-the-fly image transformations (resize, crop via URL parameters), but this is a **Pro Plan feature** ($25/month). The project is on the free tier. Resize client-side if needed (picker's quality setting is sufficient).

### Empty State Illustrations -- Static Assets

Empty state illustrations are static PNG/SVG files bundled with the app. No library needed beyond `expo-image` (for display) and React Native's `<Image>` with `require()` for local assets. Use `expo-image` for consistency, since it handles both local and remote images.

---

## What NOT to Install

| Library | Why It Seems Needed | Why It Is Not |
|---------|--------------------|--------------|
| `react-native-image-crop-picker` | Circular crop for avatars | Requires native code (not in Expo Go). Square crop from `expo-image-picker` + `borderRadius` display is the standard pattern. |
| `expo-image-manipulator` | Resize images before upload | Picker's `quality: 0.8` and crop produce small enough files. Adds unnecessary complexity. |
| `expo-camera` | Take profile photos | `expo-image-picker`'s `launchCameraAsync` already opens the system camera. No need for a custom camera UI for avatars. |
| `react-native-fast-image` | Image caching | Unmaintained. `expo-image` is the modern replacement, included in Expo Go, uses the same underlying native libraries (SDWebImage/Glide). |
| `expo-auth-session` | Google OAuth | Deprecated approach. `expo-web-browser` + `signInWithOAuth` is simpler and does not require the `expo-auth-session` request/response dance. |
| `@react-native-google-signin/google-signin` | Native Google Sign-In | Already installed but cannot run in Expo Go. The `expo-web-browser` approach replaces it entirely for Expo Go compatibility. Keep the package for future dev build support but do not use it as the primary auth path. |

---

## Backend Changes: Supabase Storage

### New Storage Bucket: `avatars`

Create a public storage bucket for profile pictures.

```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- RLS: Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can update (overwrite) their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**File path convention:** `{userId}/avatar.jpg` -- one file per user, upserted on each upload. This avoids orphaned files from previous uploads.

**Public URL pattern:** After upload, construct the public URL as:
```
https://{project-ref}.supabase.co/storage/v1/object/public/avatars/{userId}/avatar.jpg
```

Or use the SDK:
```typescript
const { data } = supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`);
const publicUrl = data.publicUrl;
```

**Cache busting:** Append `?t={timestamp}` to the URL after upload to bust CDN and `expo-image` disk cache. Store the full URL with timestamp in `profiles.avatar_url`.

### Profile Update After Upload

After uploading the image to storage, update the `profiles.avatar_url` column:

```typescript
await supabase
  .from('profiles')
  .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
  .eq('id', userId);
```

---

## Supabase Dashboard Configuration: Google OAuth

### Required changes for expo-web-browser flow

1. **Redirect URLs:** In Supabase Dashboard > Authentication > URL Configuration > Redirect URLs, add:
   - `com.roomy://auth/callback` (production deep link)
   - `exp://192.168.x.x:8081/--/auth/callback` (dev, use actual local IP)

2. **Google provider settings:** In Authentication > Providers > Google:
   - Ensure "Skip nonce checks" is enabled (required for web OAuth flow)
   - Verify Web Client ID matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

3. **Google Cloud Console:** In the OAuth consent screen, add the Supabase callback URL (`https://{project-ref}.supabase.co/auth/v1/callback`) as an authorized redirect URI. This should already be configured from the existing Google OAuth setup.

---

## Design Token Changes (tailwind.config.js)

### Wintergreen Palette Shift

The v1.1 research already established the green palette in `tailwind.config.js`. The v1.2 changes are:

| Change | Current | New | Impact |
|--------|---------|-----|--------|
| Background color | `bg: "#FAFAF8"` | `bg: "#FEFDFB"` (cream) | All screens, consistent warm tone |
| Card style | White fill + shadow | Transparent + gray outline border | Card component CSS change, no library |
| Brand green | `#2D6A4F` (already wintergreen) | No change needed | Already set in v1.1 |

The palette shift is a config/CSS change, not a library addition. No new dependencies needed.

---

## Installation Command

```bash
npx expo install expo-image-picker expo-file-system expo-web-browser expo-image && npm install base64-arraybuffer
```

Use `npx expo install` for Expo packages (resolves SDK 54 compatible versions from `bundledNativeModules.json`). Use `npm install` for pure JS packages (`base64-arraybuffer`).

---

## Version Compatibility Matrix (New Dependencies Only)

| Package | SDK 54 Compatible Version | In Expo Go? | Native Code? | Purpose |
|---------|--------------------------|-------------|--------------|---------|
| expo-image-picker | ~17.0.10 | Yes | Yes (bundled) | Camera + gallery picker |
| expo-file-system | ~19.0.21 | Yes | Yes (bundled) | Read image as base64 |
| expo-web-browser | ~15.0.10 | Yes | Yes (bundled) | Google OAuth browser flow |
| expo-image | ~3.0.11 | Yes | Yes (bundled) | Display avatars + illustrations |
| base64-arraybuffer | ^1.0.2 | N/A (pure JS) | No | Base64 to ArrayBuffer for upload |

All Expo package versions verified from `bundledNativeModules.json` in the installed `expo@54` package. HIGH confidence.

---

## Complete Upload Flow: Profile Picture

```
1. User taps avatar in settings/onboarding
2. Show ActionSheet: "Take Photo" / "Choose from Library" / "Cancel"
3. Call launchCameraAsync or launchImageLibraryAsync
   - allowsEditing: true, aspect: [1,1], quality: 0.8
4. If not canceled:
   a. Read image as base64 via expo-file-system
   b. Convert to ArrayBuffer via base64-arraybuffer decode()
   c. Upload to Supabase Storage: avatars/{userId}/avatar.jpg (upsert)
   d. Get public URL, append cache-bust timestamp
   e. Update profiles.avatar_url with new URL
   f. Update local state to show new avatar immediately
5. Avatar component detects avatar_url is set, shows <Image> instead of gradient initials
```

---

## Complete Auth Flow: Google OAuth (Expo Go)

```
1. User taps "Continue with Google" button
2. Call supabase.auth.signInWithOAuth({ provider: 'google', skipBrowserRedirect: true })
3. Open returned URL via WebBrowser.openAuthSessionAsync()
4. User completes Google consent in browser
5. Browser redirects to com.roomy://auth/callback#access_token=...&refresh_token=...
6. Extract tokens from URL fragment
7. Call supabase.auth.setSession({ access_token, refresh_token })
8. Auth state listener triggers navigation to onboarding/home
```

---

## Integration Points with Existing Code

### lib/auth-utils.ts -- MODIFY signInWithGoogle()

Replace the `@react-native-google-signin/google-signin` lazy import approach with the `expo-web-browser` flow. The function signature stays the same (`async function signInWithGoogle()` returning `{ data, error }`), so callers don't need changes.

### components/ui/Avatar.tsx -- ADD image display path

Add an optional `avatarUrl` prop. When set and non-empty, render `expo-image` `<Image>` instead of `LinearGradient` initials. Keep the gradient as fallback.

### app.json -- NO CHANGES for new packages

`expo-image-picker`, `expo-file-system`, `expo-web-browser`, and `expo-image` do not require Expo config plugins in app.json. They work out of the box.

### tailwind.config.js -- MINOR color tweak

Update `bg` color from `#FAFAF8` to `#FEFDFB` for cream background. Add any new tokens needed for outline card borders.

---

## Confidence Assessment

| Decision | Confidence | Reasoning |
|----------|------------|-----------|
| expo-image-picker ~17.0.10 for avatar photos | HIGH | Version from bundledNativeModules.json. Included in Expo Go. Square crop via allowsEditing is documented in official Expo docs. |
| expo-file-system ~19.0.21 for base64 read | HIGH | Version from bundledNativeModules.json. Included in Expo Go. Standard pattern from Supabase's official React Native guide. |
| base64-arraybuffer for upload | HIGH | Explicitly recommended by Supabase's official React Native storage documentation. 1.0.2 is stable (517 dependents). |
| expo-web-browser for Google OAuth in Expo Go | MEDIUM | Multiple community guides confirm this pattern works. Official Supabase docs mention signInWithOAuth + skipBrowserRedirect. Known issue: setSession can hang -- needs timeout handling. The redirect URL parsing (fragment vs query params) varies and needs testing. |
| expo-image for avatar display | HIGH | Version from bundledNativeModules.json. Included in Expo Go. Official Expo recommendation over react-native-fast-image. |
| Supabase Storage public bucket for avatars | HIGH | Standard pattern from Supabase's official Expo tutorial. RLS policies follow official docs. |
| No expo-image-manipulator needed | MEDIUM | Picker's quality + crop should produce small files, but untested. If files are too large (>500KB), add expo-image-manipulator resize step. Flag for testing. |
| setSession hang issue with web OAuth | MEDIUM | Reported in GitHub issue #1429 on supabase-js. May be fixed in @supabase/supabase-js 2.99.0. Needs testing with timeout wrapper as safety net. |

---

## Sources

- [Expo ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- API, allowsEditing, permissions, Expo Go support (HIGH)
- [Expo ImageManipulator Docs](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) -- resize/crop API, why NOT needed here (HIGH)
- [Expo Image Docs](https://docs.expo.dev/versions/latest/sdk/image/) -- caching, placeholder, transition, Expo Go support (HIGH)
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/) -- confirms @react-native-google-signin requires dev build (HIGH)
- [Supabase React Native Storage Blog](https://supabase.com/blog/react-native-storage) -- ArrayBuffer upload pattern, base64-arraybuffer recommendation (HIGH)
- [Supabase Expo Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) -- avatar bucket setup, RLS policies (HIGH)
- [Supabase Google Login Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) -- signInWithOAuth, signInWithIdToken, skip nonce (HIGH)
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) -- Pro plan only, why client-side resize instead (HIGH)
- [Erdem Gonul Blog: Google Sign In with Supabase + Expo](https://www.erdemgonul.com/blog/google-signin-supabase-expo-react-native) -- expo-web-browser OAuth flow (MEDIUM)
- [supabase-js Issue #1429: setSession hangs](https://github.com/supabase/supabase-js/issues/1429) -- known issue with web OAuth flow (MEDIUM)
- [base64-arraybuffer npm](https://www.npmjs.com/package/base64-arraybuffer) -- version 1.0.2, usage (HIGH)
- `bundledNativeModules.json` in local `node_modules/expo/` -- exact compatible version numbers for SDK 54 (HIGH)

---
*Stack research for: RoomY v1.2 Polish & Identity*
*Researched: 2026-03-13*
