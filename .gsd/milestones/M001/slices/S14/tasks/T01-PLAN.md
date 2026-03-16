# T01: 14-google-oauth 01

**Slice:** S14 — **Milestone:** M001

## Description

Replace native Google Sign-In with browser-based OAuth flow using expo-web-browser, remove all Apple sign-in code, and update auth screen UI with Google's branded button.

Purpose: Enable Google sign-in that works in Expo Go without native modules, completing the v1.2 auth story.
Output: Working Google OAuth flow on both sign-in and sign-up screens.

## Must-Haves

- [x] "User can tap Google button and complete sign-in via browser OAuth"
- [x] "Google OAuth works in Expo Go without native module crash"
- [x] "Apple sign-in button and code are completely removed"
- [x] "Google-authenticated users get their Google profile picture automatically"
- [x] "Cancelling mid-flow returns silently to auth screen"
- [x] "Email/password auth continues to work unchanged"

## Files

- `lib/auth-utils.ts`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app.json`
- `assets/google-g-logo.png`
