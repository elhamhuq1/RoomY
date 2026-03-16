# Research Summary: v1.2 Polish & Identity

**Researched:** 2026-03-13
**Confidence:** HIGH
**Sources:** 4 parallel research agents (Stack, Features, Architecture, Pitfalls)

---

## Executive Summary

v1.2 adds six features to RoomY: wintergreen palette shift, cream background, outline cards, profile picture uploads, empty state illustrations, and Google OAuth. The architecture is well-suited — the token system propagates color changes to ~90% of the app, the Avatar component accepts a backward-compatible optional `avatarUrl` prop, and empty state images follow the proven onboarding image pattern. The user already has all 9 empty state illustration PNGs in `docs/empty-state-images/`.

**Critical finding:** Google OAuth via the native `@react-native-google-signin/google-signin` module does NOT work in Expo Go. The recommended approach is `expo-web-browser` + `signInWithOAuth` with `skipBrowserRedirect: true`, which works in Expo Go on both platforms without requiring a development build.

---

## Key Decisions

### 1. Google OAuth: expo-web-browser (not native module)
**Why:** Both devs use Expo Go. Native Google Sign-In requires dev builds (Linux dev can't build iOS). The web browser OAuth flow works everywhere and the auth code signature stays the same.

### 2. Profile uploads: base64-arraybuffer (not Blob/FormData)
**Why:** React Native's Blob/FormData produces 0-byte files with Supabase Storage. The `base64-arraybuffer` decode pattern is the only reliable upload method.

### 3. Palette shift FIRST, then features
**Why:** Illustrations and avatar UI must be built against the final palette. Token changes propagate automatically but 8 duplicated AVATAR_COLORS arrays and ~15 hardcoded hex values need manual updates.

### 4. Card outline: regular cards only
**Why:** Gradient balance card and dark invite code card are identity elements that should keep their distinctive styling. Regular content cards → transparent bg + gray outline.

---

## New Dependencies

| Package | Purpose | Expo Go? |
|---------|---------|----------|
| `expo-image-picker` ~17.0.10 | Camera + gallery with square crop | Yes |
| `expo-file-system` ~19.0.21 | Read image as base64 | Yes |
| `expo-web-browser` ~15.0.10 | Google OAuth browser flow | Yes |
| `expo-image` ~3.0.11 | Display avatars with caching | Yes |
| `base64-arraybuffer` ^1.0.2 | Base64→ArrayBuffer for upload | Pure JS |

**No dev build required for any v1.2 feature.**

---

## Backend Changes

- **Supabase Storage:** New `avatars` public bucket with path-based RLS (`{userId}/avatar.jpg`)
- **Supabase Dashboard:** Add Expo redirect URL to OAuth allowlist, enable "Skip nonce checks" for Google
- **profiles.avatar_url:** Column already exists, unused — will now be populated

---

## Token Changes

| Token | Current | New |
|-------|---------|-----|
| `brand.DEFAULT` | `#10B981` | `#2D6A4F` |
| `brand.dark` | `#059669` | `#1B4332` |
| `brand.light` | `#D1FAE5` | `#D8F3DC` |
| `neutral.bg` | `#F8FAFC` | `#F5F0EB` |

Plus: Card.tsx (remove shadow/bg-white, add transparent bg + gray outline), Avatar.tsx GRADIENT_PAIRS update, consolidate 8 duplicated AVATAR_COLORS arrays.

---

## Top Pitfalls

1. **163 hardcoded color references across 49 files** — token swap alone insufficient, must grep for old hex values
2. **8 duplicated AVATAR_COLORS arrays** — consolidate into shared import BEFORE palette shift
3. **Supabase Storage RLS is separate from DB RLS** — must create INSERT/SELECT/UPDATE policies on `storage.objects`
4. **CDN cache on avatar updates** — append `?t={timestamp}` to avatar URL for cache busting
5. **Cream background needs system chrome updates** — StatusBar, tab bar, header, splash all must match

---

## Build Order

```
1. Palette + Background + Cards (visual foundation)
   ↓
2. Empty State Images + Profile Picture Upload (parallel, independent)
   ↓
3. Google OAuth (last — changes auth flow)
```

---

## Empty State Images (Already Provided)

| Image | Target |
|-------|--------|
| `attention-feed-all-caught-up.png` | Home attention feed empty |
| `balance-all-settled.png` | Balance section settled |
| `chore-dashboard-stats.png` | Chore dashboard empty stats |
| `chore-main-empty-state.png` | Chores tab empty |
| `chore-swap-request.png` | No swap requests |
| `expense-main-empty-state.png` | Expenses tab empty |
| `expense-member-history.png` | Member expense history empty |
| `grocery-empty-list.png` | Groceries tab empty |
| `grocery-trip-history.png` | Trip history empty |

---

## Confidence

| Area | Level | Key Risk |
|------|-------|----------|
| Palette shift | HIGH | Hardcoded values — mitigated by grep audit |
| Profile upload | HIGH | base64-arraybuffer pattern verified in Supabase docs |
| Google OAuth | MEDIUM | `setSession()` may hang — needs timeout wrapper |
| Empty states | HIGH | Images already exist, proven require() pattern |
| Card redesign | HIGH | Single component change, auto-propagates |

---
*Ready for requirements.*

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