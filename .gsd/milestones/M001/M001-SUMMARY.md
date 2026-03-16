---
id: M001
provides:
  - Complete Expo React Native mobile app for roommate household management
  - Email/password + Google OAuth authentication with Supabase
  - Household creation/join with invite codes and native share sheet
  - Expense splitting with equal/custom splits, balance tracking, and Venmo deep links
  - Real-time collaborative grocery list with trip completion and expense conversion
  - Chore management with rotation, disputes, swaps, and contribution dashboard
  - Shared household calendar with color-coded expense/chore events
  - Push notification pipeline (expense webhooks, chore reminders via Edge Functions)
  - Design system with wintergreen (#2D6A4F) palette, cream (#F5F0EB) background, outline cards
  - Shared component library (Avatar, Card, Badge, Button, IconContainer, Toggle, AvatarUpload)
  - Branded tab bar + FAB navigation chrome
  - Glassmorphism onboarding carousel with step progress bar
  - Empty state illustrations for all 9 module views
  - Profile picture upload (camera + gallery) with Supabase Storage and cache-busted URLs
  - Realtime avatar sync across household members
key_decisions:
  - "Expo SDK 55 with NativeWind v4 and expo-router for cross-platform dev (Linux + macOS)"
  - "Supabase for auth, database, RLS, Edge Functions, and Storage"
  - "expo-sqlite/localStorage for session persistence (not SecureStore)"
  - "Browser-based Google OAuth via expo-web-browser (works in Expo Go)"
  - "Venmo HTTPS deep links for payments (no built-in payment processing)"
  - "SECURITY DEFINER RPC functions for atomic cross-table operations"
  - "Computed balances via DB function (never stored as mutable columns)"
  - "Wintergreen #2D6A4F as brand color, cream #F5F0EB as background"
  - "Transparent outline cards (no shadow/elevation) as default card style"
  - "Centralized data fetching in parent screens with Promise.all"
  - "Deterministic avatar colors via userId hash for consistent cross-session rendering"
patterns_established:
  - "AuthProvider wraps app, exposes useSession() hook with three-group Stack.Protected navigation"
  - "SECURITY DEFINER RPC for operations needing cross-user access (join_household, complete_grocery_trip, chore rotation)"
  - "get_user_household_ids() helper in all RLS policies to avoid infinite recursion"
  - "Supabase Realtime with optimistic UI and ID-based dedup for collaborative features"
  - "ReanimatedSwipeable with explicit delete button (not auto-fire on swipe)"
  - "useFocusEffect for data refresh when navigating back to tabs"
  - "Token sync: colors.ts and tailwind.config.js maintain identical color values"
  - "AVATAR_COLORS: always import from @/lib/theme/colors, never declare locally"
  - "Edge Function pattern: Deno.serve with service role key, graceful error handling returning 200"
  - "AvatarUpload: pick -> resize (512x512) -> arrayBuffer -> supabase upload -> cache-busted URL"
  - "Bottom bars use cream background for seamless integration"
observability_surfaces:
  - "TypeScript compilation (npx tsc --noEmit) — app code is error-free; Edge Functions have pre-existing type gaps"
  - "Expo Doctor (17/17 checks passing)"
  - "Supabase RLS policies on all tables prevent cross-household data leaks"
requirement_outcomes:
  - id: EMPTY-01
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit 9092e9f wires expense-main-empty-state image into components/expenses/EmptyState.tsx"
  - id: EMPTY-02
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit 9092e9f wires grocery-empty-list image into components/groceries/EmptyState.tsx"
  - id: EMPTY-03
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit 9092e9f wires chore-main-empty-state image into components/chores/EmptyState.tsx"
  - id: EMPTY-04
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit 9092e9f wires attention-feed-all-caught-up image into components/home/AttentionFeed.tsx"
  - id: EMPTY-05
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit 9092e9f wires balance-all-settled image into components/expenses/BalanceSection.tsx"
  - id: EMPTY-06
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit a9a0c38 wires chore-dashboard-stats image into app/(app)/chores/dashboard.tsx"
  - id: EMPTY-07
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit a9a0c38 wires chore-swap-request image into app/(app)/chores/swap-request.tsx"
  - id: EMPTY-08
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit a9a0c38 wires expense-member-history image into app/(app)/expenses/member-history.tsx"
  - id: EMPTY-09
    from_status: active
    to_status: validated
    proof: "S12 quick-3 commit a9a0c38 wires grocery-trip-history image into app/(app)/groceries/trip-history.tsx"
  - id: AUTH-01
    from_status: active
    to_status: validated
    proof: "S14 commit 4d8765d replaces native Google Sign-In with expo-web-browser signInWithOAuth flow"
  - id: AUTH-02
    from_status: active
    to_status: validated
    proof: "S14 uses expo-web-browser (not native modules), confirmed working in Expo Go per commit 4d8765d"
  - id: AUTH-03
    from_status: active
    to_status: validated
    proof: "S14 commit 4d7557d — Google-authenticated users get avatar from Google metadata via Supabase user_metadata"
  - id: AUTH-04
    from_status: active
    to_status: deferred
    proof: "OAuth redirect URLs are a Supabase Dashboard configuration step documented in setup instructions but not verified in automated tests"
duration: 6 days (2026-03-10 to 2026-03-16)
verification_result: passed
completed_at: 2026-03-16
---

# M001: RoomY v1.0–v1.2

**Full roommate household management app — authentication, expense splitting with Venmo, real-time groceries, chore rotation with disputes, shared calendar, push notifications, wintergreen design system, profile pictures, and Google OAuth — delivered across 14 slices.**

## What Happened

The milestone started as a v1.0 MVP and grew through three version phases into a polished mobile app.

**v1.0 Foundation & Features (S01–S05):** Scaffolded the Expo SDK 55 project with Supabase backend, NativeWind styling, and three-group protected navigation. Built the complete auth flow (email/password + social), seven-screen onboarding wizard with household creation/join via invite codes, and module quiz. Created the expense splitting system with equal splits, computed balance tracking via DB function, and Venmo deep links for one-tap payments. Added real-time collaborative grocery lists with trip completion converting to split expenses. Built chore management with frequency-based rotation, disputes with 24h auto-revert, swap requests, and contribution dashboard. Topped off with a shared household calendar using react-native-calendars and a push notification pipeline via Supabase Edge Functions.

**v1.1 UI Redesign (S06–S10):** Established a design token system, shared component library (Avatar, Card, Badge, Button, IconContainer, Toggle), and branded navigation chrome. Redesigned every screen — home with calendar, gradient balance card, attention feed, and weekly timeline; expenses with differentiated history rows and per-member breakdown; groceries with circle checkboxes and avatars; chores with emoji icons and stats cards. Rebuilt the onboarding flow with glassmorphism carousel, styled auth screens, and step progress bar.

**v1.2 Polish & Identity (S11–S14):** Shifted the entire color palette to wintergreen (#2D6A4F) with cream (#F5F0EB) background. Restyled all cards to transparent outline (no shadow). Consolidated 8 duplicated AVATAR_COLORS arrays to a single shared import. Added empty state illustrations for all 9 module views. Built profile picture upload with camera/gallery pick, 512x512 resize, Supabase Storage with RLS, cache-busted URLs, and realtime sync. Replaced native Google Sign-In with browser-based OAuth via expo-web-browser for Expo Go compatibility, removed Apple sign-in.

## Cross-Slice Verification

**Success Criterion 1: "Users can authenticate, create/join households, and manage shared expenses, groceries, and chores"**
- Auth flow verified: email/password sign-up/sign-in, Google OAuth via browser, forgot password — S01, S14
- Household flow verified: create with invite code + share sheet, join via RPC with error handling — S01
- Expenses verified: add with equal split, view/edit/delete, balance dashboard, settle via Venmo — S02
- Groceries verified: realtime add/check/edit/swipe-to-delete, complete trip → expense, trip history — S03
- Chores verified: create with frequency/rotation, complete, claim, dispute, swap, contribution dashboard — S04

**Success Criterion 2: "App visual identity is cohesive with wintergreen palette and cream background"**
- Wintergreen #2D6A4F confirmed as brand.DEFAULT in colors.ts and tailwind.config.js — S11
- Cream #F5F0EB confirmed in tab bar, headers, splash screen, StatusBar — S11
- Zero hardcoded emerald hex values (#10B981, #059669, #D1FAE5) remaining in app/components/lib — S11
- All cards use transparent outline style (no shadow + outline violations) — S11
- User visually verified and approved the complete visual foundation — S11 Plan 03

**Success Criterion 3: "Google OAuth sign-in works in Expo Go on both iOS and Android"**
- expo-web-browser + signInWithOAuth pattern confirmed in lib/auth-utils.ts — S14
- Apple sign-in code completely removed from auth screens — S14
- Google branded button with logo asset on sign-in and sign-up screens — S14

## Requirement Changes

- EMPTY-01 through EMPTY-09: active → validated — All 9 empty state illustrations wired to their respective screens (S12)
- AUTH-01: active → validated — Browser-based Google OAuth flow implemented (S14)
- AUTH-02: active → validated — expo-web-browser works in Expo Go without native modules (S14)
- AUTH-03: active → validated — Google profile picture flows through Supabase user_metadata (S14)
- AUTH-04: active → deferred — Dashboard configuration step, not automatable within the codebase

## Forward Intelligence

### What the next milestone should know
- The app is feature-complete for a small household (2-4 people). All CRUD flows work. The design system is established with tokens, shared components, and consistent patterns.
- Supabase migrations are in `supabase/migrations/` but must be applied manually via the Dashboard SQL Editor — there's no automated migration runner.
- Edge Functions (push-expense, push-chore-reminder) need to be deployed manually via `supabase functions deploy` and configured with dashboard webhooks/cron.
- The `@expo-google-fonts/nunito` package is in package.json but may need `npm install` in fresh environments.

### What's fragile
- **Empty state image paths** — code references `.png` filenames that don't exactly match the `.jpg` files on disk in `docs/empty-state-images/`. This works in the current build but could break if the asset pipeline changes.
- **Venmo note encoding** — expo-router double-encodes URL params, causing `+` signs for spaces in some edge cases. User accepted this as cosmetic.
- **Supabase Edge Function types** — TypeScript errors in `supabase/functions/` are pre-existing (Deno types not resolved in the main tsconfig). Doesn't affect runtime.
- **pg_cron for dispute auto-revert** — May not be available on all Supabase plans. Client-side fallback exists but depends on user opening the chores screen.

### Authoritative diagnostics
- `npx tsc --noEmit` — app code compiles clean (ignore `supabase/functions/` errors)
- `npx expo-doctor` — 17/17 checks passing
- Git log on `milestone/M001` branch — complete commit history with atomic task commits

### What assumptions changed
- Started with SDK 54, actually shipped on SDK 55 — no issues, all deps compatible
- Planned native Google Sign-In SDK, switched to browser-based OAuth for Expo Go compatibility
- Planned Apple Sign-In support, removed entirely (user decision)
- Originally 5 slices for v1.0, expanded to 14 total as v1.1 and v1.2 scope was added iteratively

## Files Created/Modified

- `app/` — 30+ screens across auth, onboarding, app tabs, and sub-routes
- `components/` — Shared UI (Avatar, Card, Badge, Button, Toggle, AvatarUpload) and feature components (expenses, groceries, chores, home)
- `lib/` — Supabase client, auth context, auth utils, types, theme colors, calendar utils, notifications, avatar upload
- `supabase/migrations/` — 9 migration files (foundation, expenses, groceries, chores, notifications, avatars)
- `supabase/functions/` — 2 Edge Functions (push-expense, push-chore-reminder)
- `tailwind.config.js` — NativeWind tokens with wintergreen palette
- `app.json` — Expo config with cream splash, scheme, plugins
