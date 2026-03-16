# S14: Google Oauth

**Goal:** Replace native Google Sign-In with browser-based OAuth flow using expo-web-browser, remove all Apple sign-in code, and update auth screen UI with Google's branded button.
**Demo:** Replace native Google Sign-In with browser-based OAuth flow using expo-web-browser, remove all Apple sign-in code, and update auth screen UI with Google's branded button.

## Must-Haves


## Tasks

- [x] **T01: 14-google-oauth 01**
  - Replace native Google Sign-In with browser-based OAuth flow using expo-web-browser, remove all Apple sign-in code, and update auth screen UI with Google's branded button.

Purpose: Enable Google sign-in that works in Expo Go without native modules, completing the v1.2 auth story.
Output: Working Google OAuth flow on both sign-in and sign-up screens.

## Files Likely Touched

- `lib/auth-utils.ts`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app.json`
- `assets/google-g-logo.png`
