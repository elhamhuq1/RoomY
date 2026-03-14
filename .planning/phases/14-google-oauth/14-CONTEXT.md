# Phase 14: Google OAuth - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable Google sign-in via browser-based OAuth flow that works in Expo Go. Replace existing `signInWithGoogle()` with expo-web-browser + `signInWithOAuth`. Remove Apple sign-in button and functionality entirely. Google-authenticated users get their avatar from Google metadata (already handled by DB trigger).

</domain>

<decisions>
## Implementation Decisions

### Sign-in button placement & style
- Google button appears **below** the email/password form on both sign-in and sign-up screens
- Divider text between email/password and Google button: **"or"** (minimal, just a line with "or" in the middle)
- Use **Google's branded button** — white/light button with Google "G" logo and "Sign in with Google" text, following Google's brand guidelines
- **Remove Apple sign-in button and all Apple sign-in functionality** from both screens

### Auth flow experience
- **No loading overlay** while browser is open — stay on auth screen as-is (browser covers the app anyway)
- After successful Google auth, **same routing as email/password** — new users go to onboarding, existing users go to home
- If user **cancels mid-flow** (closes browser without completing), **silent return** to auth screen with no message
- **Brief loading spinner** shown after browser redirects back while session is being established

### Account linking
- If someone with an existing email/password account tries Google sign-in with the same email: **block with message** — "An account with this email already exists. Please sign in with your password."
- Google-only users **cannot add a password** — that's a future enhancement
- **No auth method indicator** shown anywhere in the app (settings, profile, etc.)

### Error & edge cases
- Google button is **always visible** regardless of Google service availability — errors handled when they occur
- **Disable Google button briefly** after tap to prevent double-opens
- Google-only users and "Forgot Password" flow: **Claude's discretion** on best UX approach

### Claude's Discretion
- Error display pattern (inline vs toast) — match whatever the app currently uses
- Timeout/retry strategy for known setSession hang issue
- Forgot password handling for Google-only users

</decisions>

<specifics>
## Specific Ideas

- Google's official branded button style — not a custom-styled button
- Clean "or" divider, not verbose "or continue with"
- Apple sign-in removal should be complete — no dead code left behind

</specifics>

<deferred>
## Deferred Ideas

- Adding password to Google-only accounts (from settings) — future enhancement
- Account linking/merging between email and Google — future phase

</deferred>

---

*Phase: 14-google-oauth*
*Context gathered: 2026-03-14*
