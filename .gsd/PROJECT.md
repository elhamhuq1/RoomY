# RoomY

## What This Is

A mobile app for roommates to manage shared household expenses, groceries, and chores without friction. Built with Expo (React Native) with a cohesive design system — wintergreen brand palette (#2D6A4F), cream background (#F5F0EB), transparent outline cards, reusable UI components, and a polished glassmorphism onboarding flow.

## Core Value

Roommates can see exactly who owes what and settle up with one tap — no awkward conversations, no mental math, no forgotten debts.

## Current State

**Milestone M001 complete.** The app covers v1.0 (core MVP), v1.1 (UI redesign), and v1.2 (polish & identity). All core features are built and functional.

### What's Built
- ✓ Email/password + Google OAuth authentication
- ✓ Household creation with invite codes and roommate joining
- ✓ Onboarding wizard with module selection quiz
- ✓ Expense splitting with even/custom splits and Venmo settle-up
- ✓ Real-time collaborative grocery list with trip-to-expense conversion
- ✓ Chore assignment, rotation, disputes, swaps, and contribution dashboard
- ✓ Shared household calendar with color-coded event markers
- ✓ Push notification pipeline (expense alerts, chore reminders)
- ✓ Design token system with 9 shared UI components
- ✓ Wintergreen palette + cream background across entire app
- ✓ Profile picture upload (camera + gallery) with app-wide propagation
- ✓ Empty state illustrations for all 9 modules
- ✓ Glassmorphism onboarding with step progress bar
- ✓ Space Grotesk font applied across the app

### What's Not Built
- Auto-populating avatar from Google profile picture (deferred)
- Dark mode (tokens support it, not implemented)
- Push notification end-to-end testing (Edge Functions exist, need Dashboard setup)
- Web version
- App Store release

## Tech Stack

- **Frontend:** Expo SDK 55, React Native, expo-router, NativeWind v4 (TW3)
- **Backend:** Supabase (Auth, PostgreSQL + RLS, Realtime, Storage, Edge Functions)
- **Styling:** NativeWind with dual token system (colors.ts + tailwind.config.js)
- **Auth:** Browser-based Google OAuth via expo-web-browser (Expo Go compatible)
- **Payments:** Venmo HTTPS deep links (no built-in payment processing)

## Codebase

- 14,544 LOC TypeScript/TSX across 77 source files
- 9 SQL migrations, 2 Supabase Edge Functions
- 9 shared UI components in components/ui/
- 321 commits on milestone branch

## Constraints

- **Platform**: Expo — must work for dev on both Linux and macOS
- **Payments**: No Stripe — Venmo deep links only
- **Scope**: Personal use for own household
- **Team**: Two developers, no designer
- **Backend**: Supabase for all shared state

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo (React Native) over native Swift | One dev on Linux, can't run Xcode | ✓ Good |
| Venmo deep links over built-in payments | Personal project, already use Venmo | ✓ Good |
| Browser OAuth over native Google SDK | Works in Expo Go, no native modules | ✓ Good |
| Wintergreen #2D6A4F brand palette | Trust/money association, matches logo | ✓ Good |
| Cream #F5F0EB background | Warm aesthetic, cohesive with wintergreen | ✓ Good |
| Transparent outline cards (no shadow) | Clean flat design on cream surface | ✓ Good |
| NativeWind v4 for styling | Tailwind-in-RN, design tokens scale well | ✓ Good |
| Centralized data fetching in parent screens | Avoids waterfalls, simplifies refresh | ✓ Good |
| Supabase Realtime for grocery list | Multi-device collaboration without polling | ✓ Good |
| SECURITY DEFINER RPCs | Atomic multi-table operations with proper access | ✓ Good |

## Out of Scope

- Built-in payment processing (Stripe, etc.)
- Web version
- Public App Store release
- Social features beyond household
- Receipt scanning / OCR
- Dark mode

---
*Last updated: 2026-03-15 after M001 completion*
