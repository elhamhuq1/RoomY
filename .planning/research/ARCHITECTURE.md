# Architecture Patterns

**Domain:** Integration of profile picture uploads, Google OAuth, empty state images, and palette shift into existing Expo React Native app (v1.2 Polish & Identity)
**Researched:** 2026-03-13
**Confidence:** HIGH -- verified against Supabase docs, Expo docs, and full codebase analysis

## Existing Architecture Summary

The app follows clear, established patterns that the v1.2 features must integrate with:

- **Design tokens** live in two parallel files: `lib/theme/colors.ts` (JS object for inline styles) and `tailwind.config.js` (NativeWind classes). Both must stay in sync.
- **Component library** in `components/ui/` -- Avatar, Card, Badge, Button, IconContainer, Toggle, FAB, StepProgressBar.
- **Centralized data fetching** -- parent screens fetch via `Promise.all`, pass data to presentational children.
- **Auth context** (`lib/auth-context.tsx`) provides `session`, `user`, `profile`, `household`, `refreshProfile` to the entire app.
- **Two-query pattern** for profiles -- fetch `household_members` then `profiles` separately, join client-side (because PostgREST FK goes to `auth.users`, not `profiles`).
- **Avatar component** uses gradient colors derived from a userId hash, shows initials. Used across 17 files. Takes `userId`, `name`, `size`.
- **Profile type** already has `avatar_url: string | null` column in the DB and TypeScript types, but it is never rendered in the UI.
- **Onboarding images** use static `require()` maps in `lib/onboarding-images.ts`, rendered via `<Image source={...} />`.

---

## 1. Palette Shift Architecture

### Scope of Change

The palette shift from emerald green (#10B981) to dark wintergreen (~#2D6A4F) and the background change from blue-gray (#F8FAFC) to cream (#F5F0EB) affects the entire app visually but is architecturally simple because colors flow through exactly **two source files** and one component with hardcoded gradients.

### Component Boundaries

| Layer | File(s) | What Changes |
|-------|---------|--------------|
| Token source (JS) | `lib/theme/colors.ts` | `brand.DEFAULT`, `brand.dark`, `brand.light` hex values |
| Token source (TW) | `tailwind.config.js` | Same three hex values in `colors.brand` |
| Avatar gradients | `components/ui/Avatar.tsx` | `GRADIENT_PAIRS[0]` (emerald pair) must match new brand |
| Background color | Both token files | `neutral.bg` from `#F8FAFC` to `#F5F0EB` |
| Card component | `components/ui/Card.tsx` | White bg + shadow to transparent bg + gray outline |
| Onboarding constant | `lib/onboarding-images.ts` | `ONBOARDING_CREAM` (#F5F0EB) now matches app-wide bg |
| Header backgrounds | `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx` | `headerStyle.backgroundColor` |
| Tab bar | `app/(app)/(tabs)/_layout.tsx` | `tabBarStyle.backgroundColor`, `tabBarActiveTintColor` |
| Loading spinners | Multiple screens | `colors.brand.DEFAULT` used as spinner color |

### Data Flow for Palette

```
lib/theme/colors.ts (JS object)
    |
    +--> imported directly in components using inline styles
    |       (ActivityIndicator color, Ionicons color, shadowColor, etc.)
    |
tailwind.config.js (NativeWind tokens)
    |
    +--> used via className strings: "bg-brand", "text-brand-dark", "bg-neutral-bg"
    |       (Button, Card, Badge, screen backgrounds, etc.)
    |
components/ui/Avatar.tsx (GRADIENT_PAIRS -- hardcoded array)
    |
    +--> NOT driven by tokens -- must be updated manually
```

### Recommended Token Changes

**Brand colors (wintergreen):**

| Token | Current | New | Rationale |
|-------|---------|-----|-----------|
| `brand.DEFAULT` | `#10B981` | `#2D6A4F` | Matches logo wintergreen |
| `brand.dark` | `#059669` | `#1B4332` | Darker shade for pressed states |
| `brand.light` | `#D1FAE5` | `#D8F3DC` | Light tint for icon containers, badges |

**Background (cream):**

| Token | Current | New | Rationale |
|-------|---------|-----|-----------|
| `neutral.bg` | `#F8FAFC` | `#F5F0EB` | Matches onboarding, cohesive identity |

**Card component transformation:**

```tsx
// BEFORE (Card.tsx)
<View
  className={`bg-white rounded-card border border-neutral-border shadow p-4 ${className}`}
  style={Platform.OS === 'android' ? { elevation: 2 } : undefined}
>

// AFTER
<View
  className={`bg-transparent rounded-card border border-gray-300 p-4 ${className}`}
>
```

Remove `shadow`, remove `bg-white`, remove Android `elevation`, add visible gray outline.

### Manual Updates After Token Change

1. **Avatar `GRADIENT_PAIRS`** -- update emerald pair `['#10B981', '#059669']` to wintergreen `['#2D6A4F', '#1B4332']`
2. **Grep for hardcoded hex** -- search for `#10B981`, `#059669`, `#D1FAE5`, `#F8FAFC` across all files
3. **Tab bar** -- `backgroundColor: colors.white` needs evaluation against cream
4. **Header backgrounds** -- verify `headerStyle.backgroundColor` against cream
5. **Semantic colors** (success, info) -- the existing `semantic.success: '#22C55E'` may need to differentiate from the new brand green; check contrast

### Build Order Implication

**Palette shift should be done FIRST.** It is low-risk (token swap), fast (1-2 hours), and means all subsequent work -- empty state illustrations, avatar upload UI -- happens against the final palette. Illustrations designed against emerald green would look wrong after a later palette shift.

---

## 2. Profile Picture Upload Architecture

### New Dependencies

| Package | Purpose | Expo Go Compatible? | Confidence |
|---------|---------|---------------------|------------|
| `expo-image-picker` | System UI for camera/gallery | YES -- "Included in Expo Go" per official docs | HIGH |
| `expo-file-system` | Read image URI as base64 | YES -- included in Expo Go | HIGH |
| `base64-arraybuffer` | Convert base64 to ArrayBuffer for Supabase Storage upload | Pure JS, no native module | HIGH |

All three work in Expo Go. No development build required for this feature.

### Supabase Storage Setup

**Bucket:** Create a public bucket named `avatars`.

**Storage RLS policies (on `storage.objects` table):**

```sql
-- Anyone can view avatars (public bucket, public URLs)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users upload to their own userId folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can overwrite their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**File path convention:** `{userId}/avatar.jpg` -- overwrite on each upload (Supabase Storage `upsert: true`), no stale files. Append `?t={timestamp}` to the public URL for cache busting.

### Upload Data Flow

```
User taps "Change Photo" on AvatarUpload component
    |
    v
ActionSheet: "Take Photo" | "Choose from Library" | "Remove Photo" | "Cancel"
    |
    v
expo-image-picker
    launchCameraAsync() or launchImageLibraryAsync()
    options: { mediaTypes: 'images', allowsEditing: true, aspect: [1,1], quality: 0.7 }
    |
    v
result.assets[0].uri  (local file URI)
    |
    v
expo-file-system
    FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
    |
    v
base64-arraybuffer
    decode(base64String) --> ArrayBuffer
    |
    v
supabase.storage.from('avatars').upload(
  `${userId}/avatar.jpg`,
  arrayBuffer,
  { contentType: 'image/jpeg', upsert: true }
)
    |
    v
supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`)
    --> append ?t=Date.now() for cache busting
    |
    v
supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    |
    v
refreshProfile() from auth-context --> profile.avatar_url updated in React context
    |
    v
Avatar component re-renders: shows <Image> instead of gradient+initials
```

### Avatar Component Modification

The existing `Avatar` accepts `userId`, `name`, `size`. Add an optional `avatarUrl` prop. When provided (and not errored), render an `<Image>`. Fall back to existing gradient+initials.

**Modified interface:**

```typescript
interface AvatarProps {
  userId: string;
  name: string;
  size?: AvatarSize;
  avatarUrl?: string | null;  // NEW
}
```

**Rendering logic:**

```typescript
export function Avatar({ userId, name, size = 'md', avatarUrl }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const hasImage = !!avatarUrl && !imageError;
  const dim = SIZE_MAP[size];

  if (hasImage) {
    return (
      <View style={{ /* existing shadow wrapper */ }}>
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // existing gradient + initials code (unchanged)
  return (/* ... */);
}
```

### Backward Compatibility

The `avatarUrl` prop is optional, defaulting to `undefined`. **Zero existing call sites break.** All 17 current Avatar usages continue showing gradient+initials until they are updated to pass `avatarUrl`.

### Progressive Adoption by Call Sites

Call sites can adopt `avatarUrl` based on whether they already have profile data available:

| Screen/Component | File | Has Profile Data? | Effort |
|------------------|------|-------------------|--------|
| Settings index | `app/(app)/settings/index.tsx` | YES -- `profile` from `useSession()` | Trivial |
| Settings profile | `app/(app)/settings/profile.tsx` | YES -- `profile` from `useSession()` | Trivial (replaced by AvatarUpload) |
| Chores swap modal | `app/(app)/(tabs)/chores.tsx` | YES -- full `profiles` map | Trivial |
| Chores dashboard | `app/(app)/chores/dashboard.tsx` | YES -- full `profiles` map | Trivial |
| MembersCard (home) | `components/home/MembersCard.tsx` | NO -- extend `Member` type to include `avatar_url` | Small refactor of parent data |
| GroceryItemRow | `components/groceries/GroceryItemRow.tsx` | NO -- `creatorProfiles` map only has `id, display_name` | Fetch `avatar_url` too |
| RoommateSection | `components/expenses/RoommateSection.tsx` | NO -- extend `RoommateMember` type | Small refactor |
| WeeklyTimeline | `components/home/WeeklyTimeline.tsx` | NO -- needs avatar data in timeline entries | Medium refactor |

**Strategy:** Update Avatar component first (zero-cost, backward compatible). Then update screens that already have profile data (settings, chores). Defer screens that need profile query changes to a later pass.

### New Components and Files

| Type | Path | Purpose |
|------|------|---------|
| Component | `components/ui/AvatarUpload.tsx` | Avatar display + camera icon overlay + tap handler for pick/upload |
| Utility | `lib/avatar-upload.ts` | `pickAndUploadAvatar(userId, source)` -- encapsulates the full upload pipeline |

**AvatarUpload component** wraps the existing Avatar and overlays a camera icon badge. Used in:
1. `app/(app)/settings/profile.tsx` -- replaces the hardcoded initials circle
2. `app/(onboarding)/profile.tsx` -- optional "Add Photo" during onboarding

### Auth Context: No Changes Needed

The `profile` object in auth context already includes `avatar_url` (from the `Profile` type). After upload, calling `refreshProfile()` re-fetches from Supabase and updates the context. All consuming components re-render automatically.

### Google OAuth Bonus: Automatic Avatar

The `handle_new_user()` trigger in the DB already captures `avatar_url` from `raw_user_meta_data`:

```sql
INSERT INTO public.profiles (id, display_name, avatar_url)
VALUES (
  new.id,
  COALESCE(new.raw_user_meta_data->>'full_name', ...),
  COALESCE(new.raw_user_meta_data->>'avatar_url', '')
);
```

Google provides a profile picture URL in this metadata. So Google-authenticated users will automatically have an `avatar_url` populated without uploading anything. The Avatar component just needs to display it.

---

## 3. Google OAuth Architecture

### Current State (Already Implemented)

Google OAuth code already exists across five files:

| File | What Exists |
|------|-------------|
| `lib/auth-utils.ts` | `signInWithGoogle()` with lazy `await import()` of `@react-native-google-signin/google-signin` |
| `app/(auth)/sign-in.tsx` | "Continue with Google" button calling `handleGoogleSignIn()` |
| `app.json` | `@react-native-google-signin/google-signin` config plugin |
| `package.json` | `@react-native-google-signin/google-signin: ^16.1.2` installed |
| `.env` | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set |

### The Expo Go Limitation

**`@react-native-google-signin/google-signin` requires native modules and DOES NOT work in Expo Go.** This is a permanent, architectural limitation -- not a version issue.

The lazy `await import()` pattern in `signInWithGoogle()` already prevents the app from crashing at load time. But the Google button still fails at runtime in Expo Go with a native module error.

**Confidence: HIGH** -- verified from official docs and confirmed by the existing lazy import workaround in the codebase.

### Recommended Architecture: Conditional Rendering

Detect Expo Go at runtime and hide the Google Sign-In button:

```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
```

In `sign-in.tsx` and `sign-up.tsx`:

```tsx
{!isExpoGo && (
  <Pressable onPress={handleGoogleSignIn} ...>
    {/* Continue with Google */}
  </Pressable>
)}
```

**Why this approach:**
- Zero code changes to `signInWithGoogle()` -- it already handles errors gracefully
- Google OAuth works in development builds and production APKs
- Email/password auth works everywhere including Expo Go
- No need for a fallback `expo-auth-session` flow (worse UX, more code to maintain)
- `expo-constants` is already installed and available

### Development Build Setup (One-Time)

For the team to actually test Google OAuth, they need a development build:

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:android  # or run:ios
```

After the first dev build, both devs can still scan QR codes -- the dev client replaces Expo Go. This is a one-time setup cost.

### Data Flow (Already Implemented, No Changes)

```
Google Sign-In button tap
    --> signInWithGoogle() (lib/auth-utils.ts)
    --> GoogleSignin.signIn() --> idToken
    --> supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
    --> Supabase creates/finds user
    --> handle_new_user() trigger auto-creates profile with avatar_url from Google metadata
    --> onAuthStateChange fires in auth-context.tsx
    --> fetchProfileAndHousehold() loads profile
    --> Router redirects based on onboarding state
```

### Files to Modify

| File | Change |
|------|--------|
| `app/(auth)/sign-in.tsx` | Add `isExpoGo` check around Google button |
| `app/(auth)/sign-up.tsx` | Same `isExpoGo` check (if Google button exists) |

That is the entire scope of Google OAuth work for v1.2.

---

## 4. Empty State Images Architecture

### Current Empty States

Three empty state components exist, all using Ionicons in colored circles:

| Component | File | Current Visual | Action |
|-----------|------|----------------|--------|
| Expenses | `components/expenses/EmptyState.tsx` | `wallet-outline` in `bg-brand-light` circle | "Add Expense" button |
| Chores | `components/chores/EmptyState.tsx` | `checkbox` in `bg-brand-light` circle | Suggestion grid + "Create custom" |
| Groceries | `components/groceries/EmptyState.tsx` | `cart` in `bg-brand-light` circle | Text only (inline add is above) |

### Existing Image Pattern (from Onboarding)

The onboarding flow has a proven pattern:
1. PNG files in `assets/onboarding/`
2. Static `require()` map in `lib/onboarding-images.ts`
3. Components render via `<Image source={ONBOARDING_IMAGES.key} />`
4. Cream background matches illustration backgrounds

### Recommended Architecture: Follow the Same Pattern

**New directory:** `assets/empty-states/`

**New file:** `lib/empty-state-images.ts`

```typescript
export const EMPTY_STATE_IMAGES = {
  expenses: require('@/assets/empty-states/expenses.png'),
  groceries: require('@/assets/empty-states/groceries.png'),
  chores: require('@/assets/empty-states/chores.png'),
} as const;
```

### Component Integration

Each empty state replaces the Ionicon-in-circle with an `<Image>`. Layout and CTAs remain unchanged.

**Example (expenses):**

```tsx
// BEFORE
<View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-light">
  <Ionicons name="wallet-outline" size={48} color={colors.brand.DEFAULT} />
</View>

// AFTER
<Image
  source={EMPTY_STATE_IMAGES.expenses}
  style={{ width: 200, height: 160 }}
  resizeMode="contain"
/>
```

### Files to Modify

| File | Change |
|------|--------|
| `components/expenses/EmptyState.tsx` | Replace Ionicon circle with Image |
| `components/groceries/EmptyState.tsx` | Replace Ionicon circle with Image |
| `components/chores/EmptyState.tsx` | Replace Ionicon circle with Image (keep suggestion grid below) |
| `lib/empty-state-images.ts` (new) | Static require map |
| `assets/empty-states/` (new dir) | PNG illustration files |

### Design Considerations

- Illustrations should use transparent or cream (#F5F0EB) backgrounds
- After the palette shift, `bg-brand-light` becomes wintergreen tint (#D8F3DC) -- illustrations should harmonize with wintergreen
- The chores empty state has a suggestion grid below the illustration -- the image replaces only the top icon area, grid stays
- Illustration style should match the existing onboarding illustrations in `docs/onboarding-images/`
- Metro bundler requires static `require()` calls -- no dynamic image paths

---

## Component Boundaries Summary

### New Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `AvatarUpload` | `components/ui/AvatarUpload.tsx` | Avatar display + camera overlay + tap to pick/upload image |

### New Utility/Config Files

| File | Responsibility |
|------|----------------|
| `lib/avatar-upload.ts` | Image pick, base64 encode, upload to Supabase Storage, update profile |
| `lib/empty-state-images.ts` | Static require map for empty state illustrations |

### Modified Components

| Component | File | Change |
|-----------|------|--------|
| `Avatar` | `components/ui/Avatar.tsx` | Add optional `avatarUrl` prop, render `<Image>` when available, fallback to gradient+initials |
| `Card` | `components/ui/Card.tsx` | Transparent bg, gray outline border, no shadow, no elevation |

### Modified Token Files

| File | Change |
|------|--------|
| `lib/theme/colors.ts` | Brand colors (#2D6A4F family), neutral.bg (#F5F0EB) |
| `tailwind.config.js` | Same brand colors + neutral.bg |

### Modified Screens

| Screen | File | Change |
|--------|------|--------|
| Settings profile | `app/(app)/settings/profile.tsx` | AvatarUpload replaces initials circle |
| Onboarding profile | `app/(onboarding)/profile.tsx` | Optional AvatarUpload added |
| Sign-in | `app/(auth)/sign-in.tsx` | `isExpoGo` check for Google button |
| Settings index | `app/(app)/settings/index.tsx` | Pass `avatar_url` to Avatar |
| Expenses empty | `components/expenses/EmptyState.tsx` | Image illustration |
| Groceries empty | `components/groceries/EmptyState.tsx` | Image illustration |
| Chores empty | `components/chores/EmptyState.tsx` | Image illustration |

---

## Patterns to Follow

### Pattern 1: Token-Driven Color Changes

**What:** Change colors in the two token files (`lib/theme/colors.ts` and `tailwind.config.js`), not in individual components.
**When:** Any palette change.
**Why:** NativeWind classes like `bg-brand`, `text-brand-dark` flow from `tailwind.config.js`. Inline style references flow from `lib/theme/colors.ts`. Changing at the source propagates to all consumers automatically.

### Pattern 2: Optional Props for Backward Compatibility

**What:** Add new optional props to existing components rather than creating parallel components.
**When:** Enhancing a widely-used component (Avatar is used in 17 files).
**Why:** Making `avatarUrl` optional means zero existing call sites break. Sites adopt the new prop progressively, not all at once.

### Pattern 3: Static Require Maps for Bundled Images

**What:** Centralized `require()` map file (like `lib/onboarding-images.ts`) for all bundled assets.
**When:** Adding new bundled images (empty state illustrations).
**Why:** Metro bundler requires static `require()` calls -- no dynamic paths. The existing onboarding images prove this pattern works.

### Pattern 4: Lazy Import for Native-Module Libraries

**What:** Use `await import()` instead of top-level `import` for libraries that crash in Expo Go.
**When:** Using `@react-native-google-signin/google-signin`.
**Why:** Already established in `lib/auth-utils.ts`. Prevents app crash on load; error only surfaces at runtime when user taps the button.

### Pattern 5: Upload-Then-Refresh for Profile Changes

**What:** Upload file to Storage, update profile DB row, then call `refreshProfile()` from auth context.
**When:** Any profile field update.
**Why:** `refreshProfile()` re-fetches from Supabase and updates React context. All consuming components re-render. Already used in `settings/profile.tsx` for display name saves.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Images as Base64 in the Database

**What:** Saving base64 image data in the `avatar_url` column.
**Why bad:** Bloats database, slows queries, no CDN caching, increases Supabase egress costs.
**Instead:** Upload to Supabase Storage, store the public URL string in `avatar_url`.

### Anti-Pattern 2: Creating a Separate AvatarImage Component

**What:** Making `AvatarImage` for profile pictures alongside the original `Avatar` for initials.
**Why bad:** Fragments usage across 17 call sites -- every consumer must decide which to use. Leads to inconsistency.
**Instead:** Extend the existing `Avatar` with an optional `avatarUrl` prop.

### Anti-Pattern 3: Hardcoding New Colors in Individual Files

**What:** Grep-replacing `#10B981` inline in each file instead of updating token files.
**Why bad:** NativeWind classes like `bg-brand` still read from `tailwind.config.js`. You would fix inline styles but miss class-based styles (or vice versa). Double work, inconsistent results.
**Instead:** Update both token files first. Then grep for remaining hardcoded hex values.

### Anti-Pattern 4: Using signInWithOAuth for Google in React Native

**What:** Using `supabase.auth.signInWithOAuth({ provider: 'google' })` which opens a browser redirect.
**Why bad:** Opens external browser, loses app context, terrible mobile UX.
**Instead:** Use `signInWithIdToken()` with the native Google SDK's ID token (already implemented correctly).

### Anti-Pattern 5: Removing Google Button Entirely for Expo Go

**What:** Removing Google OAuth code because it does not work in Expo Go.
**Why bad:** The code works perfectly in development builds and production. Removing it means re-implementing later.
**Instead:** Conditionally hide the button in Expo Go using `Constants.appOwnership === 'expo'`.

---

## Build Order Recommendation

```
1. Palette Shift (tokens + Card + Avatar gradients + backgrounds)
   |-- Pure visual change, no functional dependencies
   |-- Fast: update 2 token files, 2 components, grep for hardcoded hex
   |-- Everything after this uses the final palette
   |
2. Empty State Images (asset creation + component updates)
   |-- Depends on palette being settled (illustration colors)
   |-- No code dependencies on other features
   |-- Can proceed while #3 is in progress (different files)
   |
3. Profile Picture Upload (Supabase Storage + Avatar + AvatarUpload)
   |-- Depends on palette being settled (Avatar border/shadow colors)
   |-- Can be done in parallel with #2 (different components/files)
   |-- Substeps:
   |   3a. Create Supabase avatars bucket + RLS policies
   |   3b. Install expo-image-picker, expo-file-system, base64-arraybuffer
   |   3c. Create lib/avatar-upload.ts upload utility
   |   3d. Modify Avatar component (add avatarUrl prop)
   |   3e. Create AvatarUpload component
   |   3f. Integrate in settings/profile.tsx
   |   3g. Integrate in onboarding/profile.tsx (optional)
   |   3h. Progressive adoption in other Avatar call sites
   |
4. Google OAuth (Expo Go detection + conditional rendering)
   |-- Independent of all other features
   |-- Minimal code change (just conditional render)
   |-- Can be done at any point
```

**Rationale:**
- Palette MUST come first because illustrations and avatar UI need the final colors
- Empty states and profile pictures can run in parallel (different files, different components)
- Google OAuth is a 10-minute task (add one conditional check) -- slot it anywhere

---

## Scalability Considerations

| Concern | At 2 users | At 10 users | At 50 users |
|---------|------------|-------------|-------------|
| Avatar image loading | Negligible | Public URL + Supabase CDN | Consider image size limits (~200KB) |
| Storage costs | Free tier (1GB) | Free tier | Monitor, likely still free |
| Avatar cache busting | `?t=timestamp` query param | Same | Consider `expo-image` for disk caching |
| Google OAuth | Single household | Same flow | Same -- Supabase handles user creation |
| Empty state images | Bundled in app binary | Same | Same -- no network cost |

## Sources

- [Supabase Expo React Native Tutorial -- Avatar Upload](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) -- HIGH confidence
- [Supabase Blog: React Native File Upload to Storage](https://supabase.com/blog/react-native-storage) -- HIGH confidence, verified base64-to-ArrayBuffer upload pattern
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- HIGH confidence, RLS policy patterns
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- HIGH confidence, public bucket configuration
- [expo-image-picker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- HIGH confidence, confirmed "Included in Expo Go"
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/) -- HIGH confidence
- [@react-native-google-signin Expo Setup](https://react-native-google-signin.github.io/docs/setting-up/expo) -- HIGH confidence, confirmed native module requirement
- [Handling Expo Go Limitations for Google Sign-In](https://www.amanmaharshi.com/blog/google-login-expo-react-native) -- MEDIUM confidence, community source consistent with official docs

---
*Architecture research for: RoomY v1.2 Polish & Identity*
*Researched: 2026-03-13*
