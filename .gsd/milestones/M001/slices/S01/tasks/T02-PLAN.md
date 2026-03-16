# T02: 01-foundation 02

**Slice:** S01 — **Milestone:** M001

## Description

Build the complete authentication UI: welcome screen, sign-up, sign-in (email/password + Google + Apple), and forgot password. These are the first screens users see and must match the warm/friendly visual direction.

Purpose: Delivers AUTH-01 (sign up and sign in with email/password + social providers). After this plan, users can create accounts and authenticate -- the prerequisite for all onboarding and household features.

Output: Four fully-styled auth screens with working email/password auth and social sign-in (Google + Apple), plus a password reset flow.

## Must-Haves

- [x] "User can sign up with email and password and be redirected to onboarding"
- [x] "User can sign in with existing email/password credentials"
- [x] "User can sign in with Google (native, not browser)"
- [x] "User can sign in with Apple on iOS (native)"
- [x] "User can request a password reset email"
- [x] "Auth persists across app restarts (session restored from local storage)"

## Files

- `app/(auth)/welcome.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/_layout.tsx`
- `lib/auth-utils.ts`
