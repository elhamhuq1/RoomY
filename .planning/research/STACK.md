# Stack Research

**Domain:** Roommate household management mobile app (expense splitting, shared lists, chore tracking)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 55 | App framework | The de facto standard for React Native in 2026. SDK 55 ships with React Native 0.83 and React 19.2. New Architecture is now the only option (legacy dropped). Enables both devs to test via QR code on Linux and macOS without native build tools. |
| React Native | 0.83 | Cross-platform UI | Bundled with Expo SDK 55. Runs Hermes v1 with improved JS engine performance, better ES6+ support. New Architecture provides better performance via JSI and Fabric renderer. |
| TypeScript | ~5.7 | Type safety | Non-negotiable for any new RN project. Catches expense calculation bugs at compile time. Expo SDK 55 templates ship with TypeScript by default. |
| Expo Router | v7 (SDK 55) | Navigation | File-based routing bundled with SDK 55. Automatic deep linking (critical for Venmo and Supabase auth callbacks), typed routes, native tab navigation API. Replaces the need for standalone React Navigation setup. |
| Supabase | ^2.99.0 (@supabase/supabase-js) | Backend-as-a-Service | PostgreSQL-based BaaS with auth, realtime subscriptions, row-level security, and edge functions. Relational data model fits expense/balance tracking perfectly (users, households, expenses, balances are inherently relational). Official Expo integration guide exists. Free tier is generous for a personal-use app. |

### Database & Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (PostgreSQL) | Hosted | Primary database | Relational model is ideal for expense splitting: households have members, members have expenses, expenses produce balances. SQL queries can compute running totals and debt simplification natively. Row-level security ensures roommates only see their own household data. |
| Supabase Auth | Included | Authentication | Email/password + magic links out of the box. Deep link integration with Expo Router for email verification. No need to build auth from scratch. Supports invite flows (email a roommate a link to join). |
| Supabase Realtime | Included | Live sync | When one roommate adds an expense, others see it instantly via Postgres changes subscriptions. Critical for shared grocery lists and chore updates. No additional infrastructure needed. |
| Supabase Edge Functions | Included | Server-side logic | Deno-based serverless functions for debt simplification calculations, recurring expense scheduling, and notification triggers. Runs close to the database for low latency. |

### State Management & Data Fetching

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TanStack Query (React Query) | ^5.90 (@tanstack/react-query) | Server state management | Handles caching, background refetching, optimistic updates, and loading/error states for all Supabase data. Pairs with Supabase client for automatic cache invalidation on realtime events. DevTools plugin now available for Expo. |
| Zustand | ^5.0.11 | Client state management | ~1KB, zero-boilerplate global state for UI concerns: active household selection, onboarding quiz state, navigation state, filter/sort preferences. Not for server data (that is TanStack Query's job). Synchronous API, works perfectly with React 19. |

### Styling & UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NativeWind | v5 (preview) | Utility-first styling | Tailwind CSS for React Native. Compiles to native StyleSheet.create at build time (zero runtime cost). Both devs likely know Tailwind from web. v5 supports React Native 0.81+ and is built on Tailwind v4.1+. Install via `nativewind@preview`. |
| Expo Router Native Tabs | Bundled (SDK 55) | Tab navigation | SDK 55 default template includes platform-native tab bar. Uses iOS UITabBar and Android Material tabs. No additional UI library needed for navigation chrome. |

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React Hook Form | ^7.71 | Form state management | Minimal re-renders, Controller component works natively with RN inputs. Expense entry forms, chore assignment forms, onboarding quiz -- all need form state. ~9KB gzipped. |
| Zod | ^4.3 | Schema validation | TypeScript-first validation. Infers types from schemas so you define the shape once and get both runtime validation and compile-time types. Use with @hookform/resolvers for react-hook-form integration. v4 is faster and slimmer than v3. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-secure-store | ^55.0 | Encrypted key-value storage | Store Supabase auth tokens securely. Uses iOS Keychain and Android Keystore under the hood. Required for session persistence. |
| expo-notifications | ^55.0 | Push notifications | Notify roommates of new expenses, chore reminders, payment requests. Requires development build (not Expo Go). Use Expo Push Notification service (free). |
| expo-linking | ^55.0 | Deep linking / URL handling | Open Venmo with pre-filled payment requests. Handle Supabase auth email callbacks. Critical for the one-tap Venmo flow. |
| react-native-reanimated | ^4.x (SDK 55 bundled) | Animations | Gesture-driven transitions, shared element animations (enabled by default in SDK 55). Used by NativeWind v5 internally. |
| day.js | ^1.11 | Date manipulation | 2KB minified. Format recurring expense dates, chore rotation schedules, calendar displays. Lighter than date-fns for a mobile app where bundle size matters. |
| expo-image | ^55.0 | Image handling | Profile photos, household avatars. Replaces react-native-fast-image with an Expo-native solution. Supports caching, blurhash placeholders. |
| @react-native-async-storage/async-storage | ^2.x | Unencrypted local storage | Cache non-sensitive data (user preferences, onboarding completion flag). Use expo-secure-store for anything auth-related. |

### Development & Testing Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| jest-expo | Unit testing preset | Mocks native Expo modules. Use `jest-expo/universal` for cross-platform test runs. |
| @testing-library/react-native | Component testing | Replaces deprecated react-test-renderer (incompatible with React 19). Query components by text/role, not implementation details. |
| Expo Dev Client | Custom development build | Required for push notifications and any native module testing. Replaces Expo Go for development once native deps are added. |
| EAS Build | Cloud builds | Builds iOS binaries without a Mac (Linux dev can trigger iOS builds in the cloud). Critical for the two-person cross-OS team. |
| EAS Update | Over-the-air updates | Push JS-only fixes without rebuilding. Hermes bytecode diffing in SDK 55 reduces update sizes by ~75%. |
| TypeScript strict mode | Type safety | Enable `strict: true` in tsconfig.json from day one. Catches null pointer bugs in expense calculations. |
| ESLint + Prettier | Code formatting | Use `eslint-config-expo` for Expo-specific linting rules. Keep code consistent across two developers. |

## Installation

```bash
# Create new Expo project with SDK 55 default template
npx create-expo-app@latest SplitBase --template default@sdk-55

# Core dependencies
npx expo install @supabase/supabase-js @tanstack/react-query zustand

# Forms & validation
npx expo install react-hook-form zod @hookform/resolvers

# Styling (NativeWind v5 preview)
npx expo install nativewind@preview react-native-css

# Date handling
npx expo install dayjs

# These are bundled with SDK 55 but may need explicit install:
npx expo install expo-secure-store expo-notifications expo-linking expo-image

# Dev dependencies
npx expo install --dev jest-expo @testing-library/react-native
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Supabase | Firebase (Firestore) | If you need robust offline-first sync with automatic conflict resolution. Firestore excels at offline mode. But its NoSQL model is a poor fit for relational expense data, and vendor lock-in to Google is heavier. |
| Supabase | Convex | If you want end-to-end TypeScript with server functions that feel like calling local functions. Newer, smaller ecosystem. Less battle-tested for mobile. |
| NativeWind v5 | Tamagui | If building a design system with advanced theming and cross-platform web+native parity. More complex setup, steeper learning curve, 75k weekly downloads vs NativeWind's 403k. Overkill for a two-dev personal project. |
| NativeWind v5 | StyleSheet.create (vanilla) | If team does not know Tailwind. But both devs are CS majors who likely used Tailwind on web projects. NativeWind accelerates UI development significantly. |
| Zustand | Redux Toolkit | If you have a large team (5+) that needs strict state mutation patterns and middleware ecosystem. 15KB vs Zustand's 1KB. For a two-dev app, Redux is overhead with no benefit. |
| Zustand | Jotai | If your state is mostly independent atoms (like form fields). Zustand is better for the "household context" pattern where multiple pieces of state relate to each other. |
| TanStack Query | SWR | If you want a simpler API for basic fetching. TanStack Query has better mutation support, optimistic updates, and DevTools -- all critical for an expense app where writes are frequent. |
| day.js | date-fns | If you want tree-shakable functional API and don't mind ~18KB. day.js is 2KB and sufficient for this app's date needs (formatting, recurring schedules). |
| React Hook Form | Formik | Formik re-renders the entire form on every keystroke. React Hook Form isolates re-renders to changed fields. In a mobile context, this matters for performance. Formik is also less actively maintained. |
| Expo Router v7 | React Navigation 7 | Only if you need navigation patterns Expo Router doesn't support. In practice, Expo Router wraps React Navigation and adds file-based routing, typed routes, and automatic deep linking. There is no reason to use bare React Navigation in an Expo project in 2026. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo Go (for development beyond prototyping) | Cannot run push notifications, custom native modules, or dev client features. SDK 55 leans heavily on New Architecture features that require a development build. | Expo Dev Client via `npx expo run:android` / `npx expo run:ios`, or EAS Build for cloud builds. |
| react-test-renderer | Deprecated. Does not support React 19 (which SDK 55 uses via React 19.2). Will cause cryptic failures. | @testing-library/react-native |
| AsyncStorage for auth tokens | Unencrypted. Auth tokens stored in plain text are a security vulnerability, even for a personal app. | expo-secure-store (uses OS keychain/keystore). |
| Moment.js | Deprecated since 2020. 329KB minified. Still appears in old tutorials. | day.js (2KB, largely Moment-compatible API). |
| Redux (classic, not Toolkit) | Massive boilerplate, no longer recommended even by Redux team. | Zustand for client state, TanStack Query for server state. |
| react-native-fast-image | Unmaintained, doesn't support New Architecture. Was the go-to image library but is now abandoned. | expo-image (maintained by Expo, supports SDK 55). |
| NativeWind v4 (stable) | Compatibility issues with Reanimated v4 and New Architecture. v5 is designed for RN 0.81+ and is the forward path. | NativeWind v5 (preview). Monitor for stable release. |
| Stripe / in-app payments | Project explicitly scopes out payment processing. No merchant account needed. Adds regulatory complexity for zero benefit. | Venmo deep links via expo-linking. |

## Venmo Integration Pattern

This is project-specific but critical to get right. Venmo provides deep links for payment requests:

```typescript
// Mobile deep link (opens Venmo app directly)
const venmoMobileUrl = `venmo://paycharge?txn=charge&recipients=${username}&amount=${amount}&note=${encodeURIComponent(note)}`;

// Web fallback (works if Venmo app not installed)
const venmoWebUrl = `https://venmo.com/${username}?txn=charge&amount=${amount}&note=${encodeURIComponent(note)}`;

// Usage with expo-linking
import * as Linking from 'expo-linking';

async function requestVenmoPayment(username: string, amount: number, note: string) {
  const mobileUrl = `venmo://paycharge?txn=charge&recipients=${username}&amount=${amount}&note=${encodeURIComponent(note)}`;
  const canOpen = await Linking.canOpenURL(mobileUrl);

  if (canOpen) {
    await Linking.openURL(mobileUrl);
  } else {
    // Fall back to web URL
    await Linking.openURL(`https://venmo.com/${username}?txn=charge&amount=${amount}&note=${encodeURIComponent(note)}`);
  }
}
```

**Parameters:**
- `txn`: "charge" for requests, "pay" for payments
- `recipients`: Venmo username, email, or phone number
- `amount`: Decimal number (no $ symbol)
- `note`: URL-encoded description (e.g., "March rent - electric bill")

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@55 | react-native@0.83, react@19.2 | SDK 55 pins these versions. Do not manually override. |
| nativewind@preview (v5) | react-native@0.81+ | Built for New Architecture. Requires react-native-css. |
| react-native-reanimated@4.x | expo@55 | New Architecture only (matches SDK 55 requirement). Check bundledNativeModules.json for exact patch version. |
| @tanstack/react-query@5.x | react@18+ | Works with React 19.2 in SDK 55. |
| zustand@5.x | react@18+ | Uses native useSyncExternalStore, compatible with React 19.2. |
| zod@4.x | TypeScript 5.0+ | v4 is stable as of early 2026. Faster and smaller than v3. |
| react-hook-form@7.x | react@16.8+ | Fully compatible with React 19.2. |
| @supabase/supabase-js@2.x | Any JS runtime | Isomorphic client, works in React Native without polyfills. |
| jest-expo@55 | jest@29+ | Match jest-expo version to your SDK version. |

## Node.js Requirement

Expo SDK 55 requires Node.js `^20.19.4`, `^22.13.0`, `^24.3.0`, or `^25.0.0`. Use Node 22 LTS for the most stable experience.

## Stack Patterns by Variant

**If you need offline-first (future consideration):**
- Add expo-sqlite or PowerSync for local-first data with Supabase sync
- This is not needed for v1 (personal use, always on home wifi) but is the upgrade path

**If you outgrow Supabase free tier:**
- Supabase is open source -- self-host on a $5/mo VPS
- Or upgrade to Supabase Pro ($25/mo) which is generous for a small household app

**If NativeWind v5 preview proves unstable:**
- Fall back to NativeWind v4.2.2 (stable) with known Reanimated v4 patch
- Or use vanilla StyleSheet.create as a last resort
- Monitor https://github.com/nativewind/nativewind/releases for stable v5

## Confidence Assessment

| Decision | Confidence | Reasoning |
|----------|------------|-----------|
| Expo SDK 55 | HIGH | Official release, verified on expo.dev changelog. SDK 55 released Feb 25, 2026. |
| Supabase as BaaS | HIGH | Official Expo integration guide exists. Relational model matches domain perfectly. Verified on docs.expo.dev and supabase.com. |
| Expo Router v7 | HIGH | Bundled with SDK 55. File-based routing is the official Expo recommendation. |
| TanStack Query v5 | HIGH | 5.90.x verified on npm. Standard server-state solution for React/RN. DevTools for Expo available. |
| Zustand v5 | HIGH | 5.0.11 verified on npm. Dominant lightweight state manager in 2026 RN ecosystem. |
| NativeWind v5 | MEDIUM | Still in preview (not stable release). v5 is the forward path for RN 0.81+ but may have edge cases. Fallback plan documented. |
| Zod v4 | HIGH | 4.3.6 verified on npm. Stable release, TypeScript-first. |
| React Hook Form v7 | HIGH | 7.71.2 verified on npm. Long-standing, well-maintained. |
| day.js | HIGH | Stable, lightweight, widely used. No version concerns. |
| Venmo deep links | MEDIUM | URL scheme documented by community (not official Venmo API docs). Parameters verified across multiple independent sources. Venmo could change scheme without notice. |

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK 55 features, React Native 0.83, Node requirements (HIGH confidence)
- [Expo SDK 55 Beta Announcement](https://expo.dev/changelog/sdk-55-beta) -- Early feature list, architecture changes (HIGH confidence)
- [Expo Router v55 Blog Post](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web) -- Router v7 features, native tabs, Colors API (HIGH confidence)
- [Expo Documentation: Using Supabase](https://docs.expo.dev/guides/using-supabase/) -- Official integration guide (HIGH confidence)
- [Supabase Docs: Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) -- Auth + client setup (HIGH confidence)
- [Supabase Docs: Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) -- Auth deep link setup (HIGH confidence)
- [NativeWind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) -- v5 preview install steps (HIGH confidence)
- [NativeWind v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4) -- v4 to v5 changes (HIGH confidence)
- [TanStack Query React Native Docs](https://tanstack.com/query/v5/docs/react/react-native) -- RN-specific setup (HIGH confidence)
- [Expo Documentation: Unit Testing](https://docs.expo.dev/develop/unit-testing/) -- jest-expo setup (HIGH confidence)
- [Expo Documentation: Push Notifications](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- Notification requirements (HIGH confidence)
- [Expo Documentation: SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) -- Encrypted storage API (HIGH confidence)
- [Venmo Deep Linking](https://blog.alexbeals.com/posts/venmo-deeplinking) -- URL scheme documentation (MEDIUM confidence, community source)
- [Venmo Payment Links](https://venmo.com/paymentlinks/) -- Official web link format (MEDIUM confidence)
- [Galaxies.dev: React Native Tech Stack 2025](https://galaxies.dev/article/react-native-tech-stack-2025) -- Ecosystem overview (MEDIUM confidence)
- [Zustand npm](https://www.npmjs.com/package/zustand) -- Version 5.0.11 verified (HIGH confidence)
- [TanStack React Query npm](https://www.npmjs.com/package/@tanstack/react-query) -- Version 5.90.21 verified (HIGH confidence)
- [Supabase JS npm](https://www.npmjs.com/package/@supabase/supabase-js) -- Version 2.99.0 verified (HIGH confidence)
- [React Hook Form npm](https://www.npmjs.com/package/react-hook-form) -- Version 7.71.2 verified (HIGH confidence)
- [Zod Release Notes v4](https://zod.dev/v4) -- v4 stable, performance improvements (HIGH confidence)

---
*Stack research for: SplitBase -- Roommate household management app*
*Researched: 2026-03-10*
