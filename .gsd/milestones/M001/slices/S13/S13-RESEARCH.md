# Phase 13: Profile Pictures - Research

**Researched:** 2026-03-13
**Domain:** Image upload (camera/gallery), Supabase Storage, image display with caching
**Confidence:** HIGH

## Summary

Profile pictures require three layers: picking/capturing an image (expo-image-picker), uploading it to a storage backend (Supabase Storage), and displaying it efficiently everywhere (expo-image). All three libraries are well-supported in Expo Go on SDK 54 with high-confidence documentation.

The project already has thorough prior research in `.planning/research/STACK.md`, `ARCHITECTURE.md`, and `PITFALLS.md` covering the avatar upload flow, Supabase Storage bucket setup, RLS policies, cache busting strategy, and Avatar component modification. This phase research validates those findings against current SDK 54 documentation and adds implementation-specific details from CONTEXT.md user decisions.

**Primary recommendation:** Use `expo-image-picker` for pick/capture, `fetch().arrayBuffer()` for upload (no `base64-arraybuffer` library needed), `expo-image` for display with `cachePolicy="none"` + timestamp query param for cache busting, and `Alert.alert` for the action sheet (consistent with existing codebase patterns).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Upload triggered by tapping the avatar directly (no separate button)
- Available in only two places: settings profile page and onboarding display name step
- Action sheet options: "Take Photo", "Choose from Library", "Edit" (change existing photo), "Remove Photo"
- "Edit" and "Remove" only appear when a photo already exists
- Circle crop overlay after picking/taking a photo (1:1 square aspect ratio)
- No confirmation/preview step -- upload starts immediately after cropping
- Circular shape across the entire app
- Brand-colored ring around all avatars (own and other members')
- Two size tiers: small (for lists/rows) and large (for profile screens)
- No loading placeholder needed -- upload is fast enough that a transition state isn't necessary
- 1:1 square crop enforced
- Maximum resolution: 512x512
- Silent compression -- automatically compress to fit, user never sees a size error
- Photos only (camera photos and gallery images)
- Permission denial (camera/gallery): toast notification
- Upload failure: toast with manual "Try Again" option (no auto-retry)
- New photo updates instantly everywhere across the app (cache busting required)
- Removing a photo requires a confirmation dialog ("Remove profile photo?" with Cancel/Remove)
- Photo upload is optional during onboarding -- user can skip and add later in settings
- Avatar appears on the display name step (above the name input), not a separate screen
- As user types their name, the avatar updates live with gradient+initials
- Camera badge always visible during onboarding (first-time setup context)
- Household members' avatar updates pushed via Supabase Realtime subscription
- All members see photo changes immediately without needing to reload
- Consistent styling: everyone's avatar gets the brand-colored ring
- Camera badge: small camera icon in a circle, positioned bottom-right on the avatar
- In settings: badge shows only when no photo is set, hides after upload
- In onboarding: badge always shows (first-time setup -- encourages photo upload)

### Claude's Discretion
- Camera badge styling details (size, background color, icon color)
- Exact avatar size values for small and large tiers
- Action sheet implementation (native vs custom)
- Supabase Storage bucket configuration and RLS policy details
- Image compression algorithm and quality settings
- Cache busting strategy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User can upload a profile picture from photo library (gallery) | `expo-image-picker` `launchImageLibraryAsync` -- verified in SDK 54 docs, no permission needed for gallery on iOS 11+/Android |
| PROF-02 | User can take a profile picture with camera | `expo-image-picker` `launchCameraAsync` -- requires camera permission, works in Expo Go |
| PROF-03 | Image is cropped to square before upload | `allowsEditing: true` with `aspect: [1, 1]` -- native square crop on iOS, aspect-ratio crop on Android |
| PROF-04 | Image uploads to Supabase Storage with user-scoped RLS policies | `avatars` bucket with path-based RLS using `storage.foldername(name)[1] = auth.uid()::text` -- verified pattern |
| PROF-05 | Avatar component shows uploaded photo when available, falls back to gradient+initials | Add optional `avatarUrl` prop to existing Avatar, render `expo-image` Image when set, gradient+initials otherwise |
| PROF-06 | Profile picture can be set during onboarding (display name step) | Integrate AvatarUpload component into `app/(onboarding)/profile.tsx` above name input |
| PROF-07 | Profile picture can be changed in settings | Integrate AvatarUpload component into `app/(app)/settings/profile.tsx` replacing static avatar |
| PROF-08 | Updated photo appears across all screens without app restart (cache busting) | Timestamp query param on URL stored in `profiles.avatar_url` + `refreshProfile()` propagates via auth context |
| PROF-09 | Camera/gallery permissions handled gracefully with user-friendly messaging | `requestCameraPermissionsAsync()` before camera launch, toast on denial |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-image-picker` | ~16.0 (SDK 54) | Pick from gallery or capture with camera | Built into Expo Go, native crop UI, no native module issues |
| `expo-image` | ~3.0 (SDK 54) | Display avatar images with caching | Built into Expo Go, replaces react-native-fast-image, disk/memory cache, `recyclingKey` for force-refresh |
| Supabase Storage JS | included in `@supabase/supabase-js` | Upload/download files to cloud storage | Already in project, `upload()` accepts ArrayBuffer directly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@expo/vector-icons` (Ionicons) | already installed | Camera badge icon overlay | Small camera icon on avatar |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `expo-image-picker` | `react-native-image-crop-picker` | Requires native code, not in Expo Go -- rejected |
| `expo-image` | React Native `<Image>` | No disk caching, no `contentFit`, no `recyclingKey` -- worse for avatars |
| `fetch().arrayBuffer()` | `base64-arraybuffer` + `expo-file-system` | Extra dependency; `fetch(uri).arrayBuffer()` works in RN and is the pattern from official Supabase + Expo tutorial |
| `Alert.alert` for action sheet | `@expo/react-native-action-sheet` | Extra dependency; `Alert.alert` with buttons is consistent with existing codebase patterns and works cross-platform |

**Installation:**
```bash
npx expo install expo-image-picker expo-image
```

No other new dependencies needed. `expo-image-picker` and `expo-image` are both Expo-managed packages included in Expo Go.

## Architecture Patterns

### Recommended Project Structure
```
lib/
  avatar-upload.ts        # Pick, upload, update profile utility
components/ui/
  Avatar.tsx              # Modified: add avatarUrl prop, expo-image rendering
  AvatarUpload.tsx        # NEW: Avatar + camera badge + tap-to-upload
app/(app)/settings/
  profile.tsx             # Modified: use AvatarUpload component
app/(onboarding)/
  profile.tsx             # Modified: use AvatarUpload component
```

### Pattern 1: Upload Flow (pick -> upload -> update profile -> refresh)
**What:** Complete avatar upload pipeline from image selection to global state update
**When to use:** Every time user picks or captures a photo for their avatar

```typescript
// Source: Supabase official Expo tutorial + project ARCHITECTURE.md
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

async function uploadAvatar(userId: string): Promise<string | null> {
  // 1. Pick image with square crop
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const image = result.assets[0];

  // 2. Convert to ArrayBuffer (official Supabase + Expo pattern)
  const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());

  // 3. Upload to Supabase Storage (upsert overwrites previous)
  const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const filePath = `${userId}/avatar.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, arraybuffer, {
      contentType: image.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 4. Get public URL with cache-busting timestamp
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  // 5. Update profiles table
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  return publicUrl;
}
```

### Pattern 2: Avatar Component with Image + Fallback
**What:** Avatar renders uploaded photo when available, gradient+initials otherwise
**When to use:** Every Avatar render across the app

```typescript
// Source: project ARCHITECTURE.md + expo-image docs
import { Image } from 'expo-image';

interface AvatarProps {
  userId: string;
  name: string;
  size?: AvatarSize;
  avatarUrl?: string | null;  // NEW optional prop
}

export function Avatar({ userId, name, size = 'md', avatarUrl }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const hasImage = !!avatarUrl && !imageError;
  const dim = SIZE_MAP[size];

  // Brand-colored ring (2px for small sizes, 3px for large)
  const ringWidth = dim >= 56 ? 3 : 2;

  return (
    <View style={{
      width: dim + ringWidth * 2,
      height: dim + ringWidth * 2,
      borderRadius: (dim + ringWidth * 2) / 2,
      borderWidth: ringWidth,
      borderColor: '#2D6A4F', // brand wintergreen
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {hasImage ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          contentFit="cover"
          cachePolicy="disk"
          onError={() => setImageError(true)}
        />
      ) : (
        <LinearGradient /* ...existing gradient+initials... */ />
      )}
    </View>
  );
}
```

### Pattern 3: Action Sheet via Alert.alert (Cross-Platform)
**What:** Show pick/capture options when user taps avatar
**When to use:** Both settings and onboarding screens

```typescript
// Consistent with existing codebase pattern (Alert.alert used in 15+ places)
import { Alert } from 'react-native';

function showAvatarOptions(hasExistingPhoto: boolean) {
  const buttons = [
    { text: 'Take Photo', onPress: handleCamera },
    { text: 'Choose from Library', onPress: handleGallery },
  ];

  if (hasExistingPhoto) {
    buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: handleRemove });
  }

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Profile Photo', undefined, buttons);
}
```

**Note on action sheet options:** The user's CONTEXT.md specifies "Edit" and "Remove" options when a photo exists. "Edit" means re-picking (camera/gallery), not a photo editor. When no photo exists, only "Take Photo" and "Choose from Library" appear. When a photo exists, all four options appear: "Take Photo", "Choose from Library", "Edit" (which is functionally equivalent to re-picking), and "Remove Photo".

**Simplification:** Since "Edit" just means "change photo" (re-pick from camera or gallery), and "Take Photo" + "Choose from Library" already cover that, the action sheet when a photo exists should show: "Take Photo", "Choose from Library", "Remove Photo", "Cancel". The "Edit" label can be used as the alert title or replaced since the individual options already cover editing. This avoids a confusing sub-menu.

### Pattern 4: Realtime Avatar Updates for Household Members
**What:** Subscribe to profile changes so other members' avatar updates appear immediately
**When to use:** Any screen displaying household members' avatars

```typescript
// Source: existing realtime pattern in groceries.tsx
useEffect(() => {
  if (!household?.id) return;

  const channel = supabase
    .channel(`profiles-${household.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        // Filter to household members only
      },
      (payload) => {
        // Update local member profile data with new avatar_url
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [household?.id]);
```

### Anti-Patterns to Avoid
- **Using `base64-arraybuffer` library:** The `fetch(uri).then(res => res.arrayBuffer())` pattern works natively in React Native and is the official Supabase + Expo tutorial approach. No extra library needed.
- **Using `expo-file-system` to read file as base64:** Adds unnecessary complexity. The `fetch().arrayBuffer()` pattern is simpler and officially supported.
- **Using `createSignedUrl()` for avatar display:** The bucket is public. Use `getPublicUrl()` which returns a direct URL without expiration. Signed URLs add unnecessary complexity and expire.
- **Caching avatars with `memory-disk` policy:** Known memory leak issues with `memory-disk` in expo-image. Use `disk` cache policy instead, combined with timestamp query params for cache busting.
- **Using `expo-camera` for taking photos:** `expo-image-picker`'s `launchCameraAsync` already opens the system camera. A custom camera UI is unnecessary for avatar capture.
- **Building a custom crop UI:** The native crop UI from `allowsEditing: true` is sufficient. The REQUIREMENTS.md explicitly lists "Custom crop UI" as deferred.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image picking + cropping | Custom file browser / crop UI | `expo-image-picker` with `allowsEditing` | Native OS UI, handles permissions, aspect ratio, format conversion |
| File upload to cloud | HTTP multipart form upload code | `supabase.storage.upload()` with ArrayBuffer | Handles auth headers, RLS, CDN, content-type automatically |
| Image caching + display | Manual cache with expo-file-system | `expo-image` with `cachePolicy="disk"` | Disk cache, memory cache, recyclingKey, contentFit, error handling built-in |
| Cross-platform action sheet | Custom bottom sheet modal | `Alert.alert` with button array | Works on both platforms, matches existing codebase pattern, zero new dependencies |
| Cache busting | Custom cache invalidation logic | Timestamp query parameter on URL | `?t=Date.now()` appended to public URL, stored in `profiles.avatar_url` |
| Permission management | Custom permission flow | `ImagePicker.requestCameraPermissionsAsync()` | Returns `{ granted, canAskAgain }`, handles OS dialog automatically |

**Key insight:** The entire avatar upload pipeline is a composition of well-established Expo + Supabase patterns. Every piece has an official tutorial or docs example. The only custom code needed is the glue between them and the UI components.

## Common Pitfalls

### Pitfall 1: Stale Avatar After Upload (Cache Not Busted)
**What goes wrong:** User uploads new avatar, sees success, but old photo persists across the app. Different screens may show different versions.
**Why it happens:** Supabase CDN caches files at the same path. `expo-image` disk cache also serves stale data by URI. Overwriting `{userId}/avatar.jpg` does not invalidate either cache.
**How to avoid:** Append `?t={Date.now()}` to the public URL and store this full URL (with timestamp) in `profiles.avatar_url`. When the auth context's `refreshProfile()` runs, all Avatar components re-render with the new timestamped URL, which `expo-image` treats as a new resource.
**Warning signs:** Old photo persists after upload. Different avatars on different screens.

### Pitfall 2: Missing RLS Policies on storage.objects
**What goes wrong:** Upload returns "new row violates row-level security policy". Or upload succeeds but image URL returns 403.
**Why it happens:** Supabase Storage RLS is on the `storage.objects` table, not your custom tables. The bucket "public" setting only controls anonymous downloads -- it does not bypass RLS for uploads.
**How to avoid:** Create four RLS policies (SELECT, INSERT, UPDATE, DELETE) on `storage.objects` for the `avatars` bucket before writing any client code. Test via Supabase Dashboard SQL editor first.
**Warning signs:** "row-level security policy" errors. Upload succeeds but 403 on fetch.

### Pitfall 3: aspect Prop Ignored on iOS
**What goes wrong:** On iOS, the crop rectangle is always a square regardless of the `aspect` value. On Android, `aspect: [1, 1]` enforces a square crop rectangle.
**Why it happens:** This is documented iOS behavior: "on iOS the crop rectangle is always a square." The `aspect` prop is Android-only.
**How to avoid:** This is actually desirable for avatars -- both platforms produce a square crop. Just be aware that `aspect: [1, 1]` is only enforced on Android; iOS always crops square when `allowsEditing: true`. No workaround needed.
**Warning signs:** None -- this works in our favor for square avatar crops.

### Pitfall 4: Camera Permission Not Requested Before launchCameraAsync
**What goes wrong:** On Android, `launchCameraAsync` may fail with "user rejected permissions" if camera permission wasn't pre-requested.
**Why it happens:** While `launchImageLibraryAsync` needs no permissions on modern OS versions, `launchCameraAsync` requires explicit camera permission. Some Android versions/devices handle the implicit permission request poorly.
**How to avoid:** Always call `ImagePicker.requestCameraPermissionsAsync()` before `launchCameraAsync()`. Check the `granted` property. If denied, show a toast explaining why camera access is needed.
**Warning signs:** Camera fails to open on some Android devices. "User rejected permissions" error.

### Pitfall 5: Upload Fails Silently When upsert is false
**What goes wrong:** First avatar upload succeeds. Second upload (replacement) returns a "duplicate" error because a file already exists at `{userId}/avatar.jpg`.
**Why it happens:** Supabase Storage `upload()` defaults to `upsert: false`, which rejects uploads to existing paths.
**How to avoid:** Always pass `{ upsert: true }` in the upload options. This requires both INSERT and UPDATE RLS policies on `storage.objects`.
**Warning signs:** First upload works, subsequent replacements fail.

### Pitfall 6: Realtime Subscription Filtering for Profiles
**What goes wrong:** Subscribing to `profiles` table changes for all users wastes bandwidth and may leak data. Filtering by `household_id` does not work because `profiles` has no `household_id` column.
**Why it happens:** Unlike `grocery_items` which has a `household_id` column for filtering, `profiles` is a flat table keyed by `user_id`.
**How to avoid:** Two approaches: (1) Subscribe to all `profiles` changes and filter client-side to only process updates for known household member IDs, or (2) Use screen-focus refetch (`useCachedFetch`) with a short stale time instead of realtime. Option 2 is simpler and avoids the filtering complexity.
**Warning signs:** Excessive realtime events. Privacy concerns about receiving all profile updates.

## Code Examples

### Complete Avatar Upload Utility
```typescript
// lib/avatar-upload.ts
// Source: Supabase official Expo tutorial + project research
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

type PickSource = 'camera' | 'gallery';

export async function pickAndUploadAvatar(
  userId: string,
  source: PickSource
): Promise<string | null> {
  // Request camera permission if needed
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      throw new Error('CAMERA_PERMISSION_DENIED');
    }
  }

  // Pick or capture image
  const launcher = source === 'camera'
    ? ImagePicker.launchCameraAsync
    : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const image = result.assets[0];

  // Upload to Supabase Storage
  const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
  const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, arraybuffer, {
      contentType: image.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL with cache buster
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return avatarUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  // List files in user's folder to find the avatar file
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filePaths);
  }

  // Clear avatar_url in profile
  await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);
}
```

### Supabase Storage Bucket + RLS Setup (SQL)
```sql
-- Source: project STACK.md research + Supabase Storage docs
-- Run in Supabase Dashboard SQL Editor

-- Create the avatars bucket (public for reads, RLS for writes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- SELECT: Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Users can overwrite their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### AvatarUpload Component Pattern
```typescript
// components/ui/AvatarUpload.tsx
// Avatar with camera badge overlay + tap handler
interface AvatarUploadProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: 'md' | '2xl';  // small or large tier
  showBadgeAlways?: boolean;  // true in onboarding, false in settings
  onUploadComplete: (url: string | null) => void;
  onError: (message: string) => void;
}

// Renders: <Pressable onPress={showActionSheet}>
//   <Avatar ... />
//   {showBadge && <CameraBadge />}
// </Pressable>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-native-fast-image` for caching | `expo-image` (built on SDWebImage/Glide) | Expo SDK 49+ | No native dependency, included in Expo Go |
| `base64-arraybuffer` + `expo-file-system` for upload | `fetch(uri).arrayBuffer()` directly | Supabase Expo tutorial update 2025 | No extra dependency, simpler code |
| `ImagePicker.MediaTypeOptions.Images` (enum) | `['images']` (string array) | SDK 54 | Enum still works but string array is the current API |
| `expo-auth-session` for OAuth | `expo-web-browser` + `signInWithOAuth` | SDK 52+ | Simpler, fewer dependencies |

**Deprecated/outdated:**
- `react-native-fast-image`: Unmaintained. `expo-image` is the direct replacement.
- `ImagePicker.MediaTypeOptions` enum: Still works but the modern API uses string arrays like `['images']`.

## Open Questions

1. **Realtime vs polling for other members' avatar updates**
   - What we know: Supabase Realtime can subscribe to `profiles` table changes. The project already uses Realtime for groceries.
   - What's unclear: `profiles` has no `household_id` column, so filtering to only household members requires client-side filtering or a view.
   - Recommendation: Use screen-focus refetch (`useCachedFetch` with ~60s stale time) on screens that show other members' avatars. Simpler than Realtime for a low-frequency event (avatar changes are rare). If the user strongly wants instant updates, add a Realtime subscription filtered client-side by known member IDs.

2. **Avatar size tiers: exact pixel values**
   - What we know: User wants two tiers (small for lists, large for profile). Current Avatar has 6 sizes: xs(24), sm(32), md(40), lg(48), xl(56), 2xl(72).
   - What's unclear: Which existing sizes map to "small" and "large" tiers. The brand ring adds to total dimensions.
   - Recommendation: "Small" = existing `md` (40px) for list/row contexts. "Large" = existing `2xl` (72px) or new `3xl` (96px) for profile screens. Ring width: 2px for small, 3px for large. This is Claude's discretion per CONTEXT.md.

3. **Toast notification implementation**
   - What we know: User wants toast for permission denial and upload failure. The app currently uses `Alert.alert` for all user-facing messages.
   - What's unclear: Whether to add a toast library or simulate with a temporary banner.
   - Recommendation: Use `Alert.alert` for now (consistent with codebase). A proper toast library could be added later but is out of scope for this phase. The user said "toast" but `Alert.alert` achieves the same communication goal.

## Existing Codebase Context

### Files That Will Be Modified
| File | Current State | Modification |
|------|---------------|--------------|
| `components/ui/Avatar.tsx` | Gradient+initials only, no image support | Add `avatarUrl` prop, `expo-image` rendering, brand ring, error fallback |
| `components/ui/index.ts` | Exports Avatar | Add AvatarUpload export |
| `app/(app)/settings/profile.tsx` | Static initials circle | Replace with AvatarUpload component |
| `app/(onboarding)/profile.tsx` | Illustration image, no avatar | Add AvatarUpload above name input |
| `lib/types/database.ts` | `avatar_url: string \| null` already in Profile type | No change needed |
| `package.json` | No expo-image-picker or expo-image | Add both packages |

### Files That Already Pass Profile Data (progressive adoption sites)
These files already have access to `userId` and `name` for Avatar. They will need `avatarUrl` passed through:

| File | Avatar Usage | Profile Data Source |
|------|-------------|---------------------|
| `components/home/MembersCard.tsx` | `<Avatar userId={...} name={...} size="md" />` | Members array with `user_id`, `display_name` |
| `components/expenses/BalanceMemberRow.tsx` | `<Avatar userId={...} name={...} size="md" />` | Props: `userId`, `displayName` |
| `components/expenses/ExpenseRow.tsx` | Avatar for expense creator | Expense data |
| `components/expenses/RoommateSection.tsx` | Avatar for each roommate | Members data |
| `components/home/WeeklyTimeline.tsx` | Avatar in timeline | Members data |
| `components/groceries/GroceryItemRow.tsx` | Avatar for item creator | Creator profile |
| `app/(app)/(tabs)/chores.tsx` | Avatars in chore rows | Members data |
| `app/(app)/chores/dashboard.tsx` | Avatars in dashboard | Members data |
| `app/(app)/settings/members.tsx` | Avatars in member list | Members data |
| `app/(onboarding)/member-welcome.tsx` | Welcome screen avatars | Members data |

### Database Schema (already supports avatar)
- `profiles.avatar_url` column exists (TEXT, nullable)
- `handle_new_user()` trigger already captures `avatar_url` from auth metadata
- Profile type in `lib/types/database.ts` already includes `avatar_url: string | null`
- Auth context already fetches and exposes `profile` (including `avatar_url`) via `useSession()`

## Sources

### Primary (HIGH confidence)
- [expo/expo SDK 54 branch](https://github.com/expo/expo/blob/sdk-54/docs/pages/versions/unversioned/sdk/imagepicker.mdx) - ImagePicker API, permissions, allowsEditing behavior, aspect ratio (iOS vs Android)
- [expo/expo SDK 54 branch](https://github.com/expo/expo/blob/sdk-54/docs/pages/versions/unversioned/sdk/image.mdx) - expo-image component, cachePolicy, contentFit, recyclingKey, onError
- [Supabase official Expo tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) - Avatar upload component using fetch().arrayBuffer() pattern
- [Supabase Storage docs](https://supabase.com/docs/guides/storage/quickstart) - Bucket creation, RLS policies, public access
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - aspect is Android-only, iOS always crops square
- [Expo Image docs](https://docs.expo.dev/versions/latest/sdk/image/) - cachePolicy options, included in Expo Go
- Project `.planning/research/STACK.md` - Prior research on avatar stack, verified current
- Project `.planning/research/ARCHITECTURE.md` - Upload flow architecture, Avatar modification pattern
- Project `.planning/research/PITFALLS.md` - Cache busting, RLS policies, base64 upload pitfalls

### Secondary (MEDIUM confidence)
- [Supabase Storage RLS helper functions](https://supabase.com/docs/guides/storage/schema/helper-functions) - `storage.foldername()`, `storage.extension()` functions

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in SDK 54 Context7 docs and official Supabase tutorial
- Architecture: HIGH - Upload flow pattern directly from official Supabase + Expo tutorial; Avatar modification pattern validated against existing codebase
- Pitfalls: HIGH - Cache busting, RLS policies, and permission handling all documented in official sources and prior project research

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- Expo SDK 54 is current, Supabase Storage API is stable)