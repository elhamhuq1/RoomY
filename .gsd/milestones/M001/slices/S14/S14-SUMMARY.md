---
id: S14
parent: M001
milestone: M001
provides:
  - "Browser-based Google OAuth via expo-web-browser + signInWithOAuth"
  - "Google G logo branded button on sign-in and sign-up screens"
  - "Removed all Apple sign-in code and dependencies"
  - "withTimeout wrapper for known setSession hang issue"
requires: []
affects: []
key_files:
  - lib/auth-utils.ts
  - app/(auth)/sign-in.tsx
  - app/(auth)/sign-up.tsx
  - app.json
  - assets/google-g-logo.png
key_decisions:
  - "Browser-based OAuth (expo-web-browser + signInWithOAuth) instead of native Google Sign-In SDK"
  - "Expo Go compatible — no native module dependency for auth"
  - "All Apple sign-in code removed entirely (not just hidden)"
  - "withTimeout wrapper added around setSession to handle known expo-web-browser hang"
  - "Google G logo as image asset rather than Ionicons icon"
  - "Removed @react-native-google-signin/google-signin and expo-apple-authentication plugins from app.json"
patterns_established:
  - "OAuth pattern: expo-web-browser opens Supabase OAuth URL, redirects back with token, setSession"
  - "Timeout wrapper pattern: Promise.race with timeout for potentially-hanging async operations"
observability_surfaces: []
drill_down_paths: []
duration: ~5min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# S14: Google OAuth

**Browser-based Google OAuth via expo-web-browser replacing native Google Sign-In SDK, with Apple auth fully removed**

## What Happened

Rewrote auth-utils.ts to use expo-web-browser + signInWithOAuth for Google authentication, making it compatible with Expo Go (no native modules required). Removed all Apple sign-in code, the signInWithApple function, and both @react-native-google-signin/google-signin and expo-apple-authentication plugins from app.json. Updated both sign-in and sign-up screens to show a branded Google G logo button with "Sign in with Google" text, removing the Apple button entirely. Added a withTimeout wrapper around setSession to handle a known issue where expo-web-browser can hang after redirect.

Key commits: `4d8765d` (OAuth rewrite), `4d7557d` (UI update).
