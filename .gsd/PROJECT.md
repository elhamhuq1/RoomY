# RoomY

## What This Is

A mobile app for roommates to manage shared household expenses, groceries, and chores without friction. Built with Expo (React Native) with an intentional design system — wintergreen brand palette (#2D6A4F), cream background (#F5F0EB), consistent typography hierarchy, reusable UI components, and a polished onboarding flow that builds user confidence from first launch.

## Core Value

Roommates can see exactly who owes what and settle up with one tap — no awkward conversations, no mental math, no forgotten debts.

## Requirements

### Validated

- ✓ User authentication (email/password + Google OAuth) — v1.0/v1.2
- ✓ Household creation and roommate invites — v1.0
- ✓ Household onboarding quiz — v1.0
- ✓ Utility/bill splitting with Venmo deep links — v1.0
- ✓ Balance tracking (who owes who) — v1.0
- ✓ Shared grocery list with real-time sync — v1.0
- ✓ Grocery trip to expense conversion — v1.0
- ✓ Chore assignment, rotation, and contribution tracking — v1.0
- ✓ Push notifications (expenses, chores) — v1.0
- ✓ Shared household calendar — v1.0
- ✓ Design token system (colors, typography, elevation) with wintergreen palette — v1.1
- ✓ Shared component library (Avatar, Card, Badge, Button, IconContainer, Toggle) — v1.1
- ✓ Branded tab bar and FAB navigation — v1.1
- ✓ Home screen with calendar, gradient balance card, attention feed, weekly timeline — v1.1
- ✓ Expenses screen with differentiated history rows, per-member breakdown — v1.1
- ✓ Groceries screen with circle checkboxes, avatars, to-get/done sections — v1.1
- ✓ Chores screen with emoji icons, stats cards, dispute styling — v1.1
- ✓ Onboarding flow with glassmorphism carousel, styled auth, gradient cards, step progress bar — v1.1
- ✓ Cream background throughout entire app — v1.2
- ✓ Card component → gray outline style (transparent bg, no shadow) — v1.2
- ✓ Green palette shift to wintergreen (#2D6A4F) — v1.2
- ✓ Google OAuth sign-in (expo-web-browser, Expo Go compatible) — v1.2
- ✓ Empty state illustrations for all 9 modules — v1.2
- ✓ Profile picture upload (camera + gallery) in settings and onboarding — v1.2
- ✓ Profile pictures with cache busting and realtime sync — v1.2

### Active

- Receipt scanning with Gemini Vision OCR for grocery trip completion (M002/S01)
- Receipt-based item ownership with per-member smart splitting (M002/S01b)

## Completed Milestones

### M001: RoomY v1.0–v1.2 (completed 2026-03-16)

Full roommate household management app delivered across 14 slices. Three version phases: v1.0 MVP (auth, expenses, groceries, chores, calendar, notifications), v1.1 UI Redesign (design system, component library, all screens restyled), v1.2 Polish & Identity (wintergreen palette, cream background, empty states, profile pictures, Google OAuth).

## Out of Scope

- Built-in payment processing (Stripe, etc.) — not a business, no merchant account
- Web version — mobile first, web can come later
- Public app store release — v1 is for personal use
- Social features beyond the household — this isn't a social network
- ~~Receipt scanning / OCR — manual entry is fine for small households~~ (now implemented in M002)
- Dark mode — doubles design surface area; tokens support it later but not implementing now

## Context

- Two-person dev team: one on Linux, one on macOS
- Both CS majors, post-college age, roommate experience firsthand
- Expo chosen so both devs can test on their own phones via QR code regardless of OS
- Personal project — solving their own problem first
- Venmo is the existing payment method in their social circle
- Shipped v1.0 MVP (2026-03-10), v1.1 UI Redesign (2026-03-13), v1.2 Polish & Identity (2026-03-16)
- Codebase: ~14k LOC TypeScript/TSX across app/, components/, lib/
- Tech stack: Expo SDK 55, NativeWind v4 (TW3), Supabase (auth + DB + RLS + Storage + Edge Functions), expo-router

## Constraints

- **Platform**: Expo (React Native) — must work for dev on both Linux and macOS
- **Payments**: No Stripe/built-in payments — Venmo deep links only
- **Scope**: v1 is personal use for their own household
- **Team**: Two developers, no designer — design guided by reference mockup and spec
- **Backend**: Supabase for shared state between roommates with real-time sync

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo (React Native) over native Swift | One dev is on Linux, can't run Xcode — Expo lets both devs test via QR code | ✓ Good |
| Venmo deep links over built-in payments | Personal project, no business account needed — Venmo is already how they pay each other | ✓ Good |
| Modular features via onboarding quiz | Not every household needs every feature — quiz recommends a setup | ✓ Good |
| Mobile first | Roommates interact with this at home, not at a desk | ✓ Good |
| Wintergreen brand palette (#2D6A4F) | Trust/money association, distinct from default — shifted from emerald in v1.2 | ✓ Good |
| Presentation-only v1.1 redesign | All backend logic untouched — zero regressions, shipped in 3 days | ✓ Good |
| NativeWind v4 for styling | Tailwind-in-RN with platformSelect for cross-platform — design tokens scale well | ✓ Good |
| Centralized data fetching in parent screens | Promise.all in parent, pass to presentational children — avoids waterfall, simplifies refresh | ✓ Good |
| Deterministic avatar colors via userId hash | charCodeAt hash % 8 gradient pairs — no DB storage, consistent across sessions | ✓ Good |
| Browser-based Google OAuth | expo-web-browser works in Expo Go without native modules — removed Apple Sign-In | ✓ Good |
| Supabase Storage for profile pictures | RLS-protected, user-scoped paths, cache-busted URLs with realtime sync | ✓ Good |

---
*Last updated: 2026-03-16 after M001 completion*
