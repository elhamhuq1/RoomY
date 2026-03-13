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
