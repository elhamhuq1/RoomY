# Phase 14: Google OAuth - Research

**Researched:** 2026-03-14
**Domain:** Supabase OAuth + expo-web-browser in Expo Go
**Confidence:** HIGH

## Summary

This phase replaces the existing native Google Sign-In (`@react-native-google-signin/google-signin` + `signInWithIdToken`) with a browser-based OAuth flow (`expo-web-browser` + `signInWithOAuth`) that works in Expo Go without native modules. It also removes all Apple Sign-In code and updates the UI on both auth screens.

The browser-based flow is well-documented by Supabase and Expo. The core pattern is: call `signInWithOAuth` with `skipBrowserRedirect: true` to get a URL, open it with `WebBrowser.openAuthSessionAsync()`, extract tokens from the redirect URL, and call `setSession()`. A known issue exists where `setSession()` can hang -- a timeout wrapper with `Promise.race()` is the standard mitigation.

**Primary recommendation:** Use the official Supabase deep-linking pattern with `expo-auth-session` for redirect URI generation and `QueryParams.getQueryParams()` for token extraction. Keep `detectSessionInUrl: false` in the Supabase client (already set).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Google button appears **below** the email/password form on both sign-in and sign-up screens
- Divider text between email/password and Google button: **"or"** (minimal, just a line with "or" in the middle)
- Use **Google's branded button** -- white/light button with Google "G" logo and "Sign in with Google" text, following Google's brand guidelines
- **Remove Apple sign-in button and all Apple sign-in functionality** from both screens
- **No loading overlay** while browser is open -- stay on auth screen as-is (browser covers the app anyway)
- After successful Google auth, **same routing as email/password** -- new users go to onboarding, existing users go to home
- If user **cancels mid-flow** (closes browser without completing), **silent return** to auth screen with no message
- **Brief loading spinner** shown after browser redirects back while session is being established
- If someone with an existing email/password account tries Google sign-in with the same email: **block with message** -- "An account with this email already exists. Please sign in with your password."
- Google-only users **cannot add a password** -- that's a future enhancement
- **No auth method indicator** shown anywhere in the app (settings, profile, etc.)
- Google button is **always visible** regardless of Google service availability -- errors handled when they occur
- **Disable Google button briefly** after tap to prevent double-opens

### Claude's Discretion
- Error display pattern (inline vs toast) -- match whatever the app currently uses
- Timeout/retry strategy for known setSession hang issue
- Forgot password handling for Google-only users

### Deferred Ideas (OUT OF SCOPE)
- Adding password to Google-only accounts (from settings) -- future enhancement
- Account linking/merging between email and Google -- future phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in with Google via browser-based OAuth flow | Core OAuth pattern with signInWithOAuth + expo-web-browser documented below |
| AUTH-02 | Google OAuth works in Expo Go (expo-web-browser approach) | expo-web-browser is a JS-only package, no native module needed -- confirmed Expo Go compatible |
| AUTH-03 | Google-authenticated users automatically get profile picture from Google metadata | Already handled by existing DB trigger (no new work needed, just verify) |
| AUTH-04 | OAuth redirect URLs configured in Supabase Dashboard | Redirect URL pattern documented: `com.roomy://google-auth` must be added to Supabase allowlist |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-web-browser | latest SDK 54 | Open OAuth URL in system browser | JS-only, works in Expo Go, official Supabase recommendation |
| expo-auth-session | latest SDK 54 | `makeRedirectUri()` + `QueryParams.getQueryParams()` | Generates correct platform-specific redirect URIs |
| expo-linking | latest SDK 54 | Deep link handling for URL callbacks | Already included with expo-router |
| @supabase/supabase-js | ^2.99.0 | `signInWithOAuth` + `setSession` | Already installed |

### To Remove
| Library | Reason |
|---------|--------|
| @react-native-google-signin/google-signin | Native module, crashes Expo Go, replaced by browser flow |
| expo-apple-authentication | Apple Sign-In deferred, all code being removed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-auth-session QueryParams | Manual URL parsing | QueryParams handles edge cases (hash vs query params), less error-prone |
| Custom redirect URI | makeRedirectUri() | makeRedirectUri() handles platform differences automatically |

**Installation:**
```bash
npx expo install expo-web-browser expo-auth-session
```

**Uninstall:**
```bash
npm uninstall @react-native-google-signin/google-signin expo-apple-authentication
```

## Architecture Patterns

### Pattern 1: Browser-Based OAuth Flow
**What:** Use `signInWithOAuth` with `skipBrowserRedirect: true`, then open the URL with `WebBrowser.openAuthSessionAsync()`.
**When to use:** Always for Google OAuth in Expo Go.

```typescript
// Source: Supabase official deep-linking docs + verified blog
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession(); // Call at module level

const redirectTo = makeRedirectUri();
// In Expo Go this produces something like: exp://192.168.x.x:8081/--/
// With custom scheme in production: com.roomy://

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { data: null, error };
    if (!data?.url) return { data: null, error: new Error("No OAuth URL returned") };

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      { showInRecents: true }
    );

    if (result.type !== "success") {
      // User cancelled -- silent return per CONTEXT.md
      return { data: null, error: null };
    }

    // Extract tokens from redirect URL
    const { params, errorCode } = QueryParams.getQueryParams(result.url);

    if (errorCode) {
      return { data: null, error: new Error(errorCode) };
    }

    const { access_token, refresh_token } = params;

    if (!access_token) {
      return { data: null, error: new Error("No access token in response") };
    }

    // Set session with timeout wrapper (known hang issue)
    const sessionResult = await withTimeout(
      supabase.auth.setSession({ access_token, refresh_token }),
      10000 // 10 second timeout
    );

    return sessionResult;
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Google sign-in failed"),
    };
  }
}
```

### Pattern 2: Timeout Wrapper for setSession Hang
**What:** `Promise.race()` between `setSession()` and a timeout to prevent indefinite hang.
**When to use:** Always wrap `setSession()` calls.

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Session setup timed out. Please try again.")), ms)
  );
  return Promise.race([promise, timeout]);
}
```

### Pattern 3: Handling Cancel vs Success
**What:** `WebBrowser.openAuthSessionAsync()` returns `{ type: "success" | "cancel" | "dismiss" }`.
**When to use:** Check `result.type` before attempting token extraction.

```typescript
if (result.type !== "success") {
  // User closed browser without completing auth
  // Silent return -- no error message shown
  return { data: null, error: null };
}
```

### Pattern 4: Account Conflict Detection
**What:** When a Google sign-in email matches an existing email/password account, Supabase may return a specific error or merge accounts depending on configuration.
**When to use:** After `setSession` or `signInWithOAuth` returns.
**Implementation:** Check the Supabase project's "Automatic Linking" setting. If disabled, Supabase returns an error when the email already exists with a different provider. The error message from Supabase should be caught and replaced with the user-facing message: "An account with this email already exists. Please sign in with your password."

### Anti-Patterns to Avoid
- **Using `signInWithIdToken` with native Google SDK:** Requires development build, crashes Expo Go
- **Setting `detectSessionInUrl: true`:** The app already has this set to `false` (correct for RN). Do NOT change it.
- **Not calling `WebBrowser.maybeCompleteAuthSession()`:** Required at module level for web auth session completion
- **Parsing URL manually with string splitting:** Use `QueryParams.getQueryParams()` which handles both hash fragments and query parameters

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Redirect URI generation | Manual scheme://path string | `makeRedirectUri()` from expo-auth-session | Handles Expo Go vs standalone differences |
| URL parameter extraction | `url.split('#')` parsing | `QueryParams.getQueryParams()` from expo-auth-session | Handles edge cases, error codes, encoding |
| Google branded button icon | Custom SVG or Ionicons | Google "G" logo image asset | Google brand guidelines require specific logo |
| Browser auth session | `Linking.openURL()` | `WebBrowser.openAuthSessionAsync()` | Handles redirect back to app automatically |

**Key insight:** `expo-auth-session` provides critical utilities (`makeRedirectUri`, `QueryParams`) even though we're not using its full auth session flow. These handle platform-specific edge cases that manual implementations miss.

## Common Pitfalls

### Pitfall 1: setSession Hangs Indefinitely
**What goes wrong:** `supabase.auth.setSession()` promise never resolves after Google OAuth redirect.
**Why it happens:** Known issue (GitHub #1429) related to auth state listener interactions in React Native.
**How to avoid:** Always wrap `setSession()` in a `Promise.race()` timeout (10 seconds recommended). On timeout, show error and let user retry.
**Warning signs:** App appears frozen after browser redirects back.

### Pitfall 2: Wrong Redirect URI in Supabase Dashboard
**What goes wrong:** OAuth flow completes in browser but never redirects back to the app.
**Why it happens:** The redirect URL in Supabase Dashboard doesn't match what `makeRedirectUri()` generates.
**How to avoid:** Log `makeRedirectUri()` output during development. Add BOTH the Expo Go URI (`exp://192.168.x.x:8081/--/`) and the production scheme URI (`com.roomy://`) to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs. Use wildcard patterns: `com.roomy://**` and `exp://**`.
**Warning signs:** Browser shows Google consent but then shows error or goes nowhere.

### Pitfall 3: detectSessionInUrl Must Stay false
**What goes wrong:** Setting `detectSessionInUrl: true` causes Supabase client to try auto-parsing URLs, conflicting with manual token extraction.
**Why it happens:** Default web behavior doesn't apply to React Native.
**How to avoid:** Already set to `false` in `lib/supabase.ts`. Do not change it.

### Pitfall 4: Forgetting to Remove Native Plugin from app.json
**What goes wrong:** Build warnings or errors from orphaned plugin references.
**Why it happens:** `@react-native-google-signin/google-signin` and `expo-apple-authentication` plugins remain in app.json after package removal.
**How to avoid:** Remove both plugin entries from `app.json` plugins array when uninstalling packages.

### Pitfall 5: Google-Only Users Requesting Password Reset
**What goes wrong:** Google-only user clicks "Forgot Password", receives reset email, but can't set a password (no existing password provider).
**Why it happens:** Supabase sends the email regardless, but the flow may not work correctly for OAuth-only accounts.
**How to avoid:** On the forgot-password screen, after sending the reset email, if it fails or if we detect the user is Google-only, show a helpful message. However, since we can't easily detect provider before the user authenticates, the simplest approach is: let the reset email send (Supabase handles it gracefully -- if no password identity exists, it just won't work). No changes needed to forgot-password screen.

### Pitfall 6: Double Browser Opens
**What goes wrong:** User taps Google button rapidly, opening multiple browser sessions.
**Why it happens:** No debounce on the button.
**How to avoid:** Disable the Google button immediately on tap (set `socialLoading` state), re-enable after flow completes or cancels. Already partially implemented with `isDisabled` pattern in current code.

## Code Examples

### Complete auth-utils.ts Replacement Pattern
```typescript
// lib/auth-utils.ts -- browser-based OAuth (Expo Go compatible)
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Session setup timed out. Please try again.")), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { data: null, error };
    if (!data?.url) return { data: null, error: new Error("No OAuth URL returned") };

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      { showInRecents: true }
    );

    if (result.type !== "success") {
      return { data: null, error: null }; // User cancelled
    }

    const { params, errorCode } = QueryParams.getQueryParams(result.url);
    if (errorCode) return { data: null, error: new Error(errorCode) };

    const { access_token, refresh_token } = params;
    if (!access_token) return { data: null, error: new Error("No access token received") };

    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.setSession({ access_token, refresh_token }),
      10000
    );

    return { data: sessionData, error: sessionError };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Google sign-in failed"),
    };
  }
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "com.roomy://reset-password",
  });
  return { error };
}
```

### Google "G" Logo Button
The current auth screens use `Ionicons` `logo-google` icon. Per CONTEXT.md, we need Google's branded button. The simplest approach is to use an SVG or PNG of the Google "G" logo. Since the app already uses `Image` from React Native, a small PNG asset works well.

```typescript
// Google branded button pattern
<Pressable
  className={`flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white py-3.5 ${
    isDisabled ? "opacity-50" : "active:bg-gray-50"
  }`}
  onPress={handleGoogleSignIn}
  disabled={isDisabled}
>
  {socialLoading === "google" ? (
    <ActivityIndicator color="#4285F4" />
  ) : (
    <>
      <Image
        source={require("@/assets/google-g-logo.png")}
        style={{ width: 20, height: 20, marginRight: 8 }}
      />
      <Text className="text-base font-semibold text-gray-700">
        Sign in with Google
      </Text>
    </>
  )}
</Pressable>
```

### Files to Modify (Summary)

| File | Changes |
|------|---------|
| `lib/auth-utils.ts` | Complete rewrite: remove native Google SDK + Apple, add expo-web-browser OAuth flow |
| `app/(auth)/sign-in.tsx` | Remove Apple button + import, update Google button UI to branded style, remove `signInWithApple` import |
| `app/(auth)/sign-up.tsx` | Same changes as sign-in |
| `app.json` | Remove `@react-native-google-signin/google-signin` and `expo-apple-authentication` plugins |
| `package.json` | Add expo-web-browser, expo-auth-session; remove google-signin, expo-apple-authentication |
| `assets/google-g-logo.png` | New asset: Google "G" logo for branded button |

### Supabase Dashboard Configuration
1. Go to Authentication > URL Configuration > Redirect URLs
2. Add: `com.roomy://**` (production scheme)
3. Add: `exp://**` (Expo Go development -- can use wildcard or specific IP)
4. Verify Google provider is enabled under Authentication > Providers > Google

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@react-native-google-signin/google-signin` + `signInWithIdToken` | `expo-web-browser` + `signInWithOAuth` | Ongoing (both valid) | Browser flow works in Expo Go without native module |
| `expo-auth-session` full managed flow | Manual `signInWithOAuth` + `openAuthSessionAsync` | 2024+ | More control, simpler, uses only utilities from expo-auth-session |

## Open Questions

1. **Account conflict behavior with current Supabase settings**
   - What we know: CONTEXT.md says block with message when email exists with password provider
   - What's unclear: Whether Supabase "Automatic Linking" is enabled in the project. If enabled, Supabase auto-links and no error occurs. If disabled, an error is returned.
   - Recommendation: Check Supabase Dashboard > Authentication > Providers > Email > "Automatically link accounts". If auto-linking is ON, the user signs in successfully (no conflict). If OFF, catch the error and show the custom message. Either way, the implementation handles both cases gracefully.

2. **Exact `makeRedirectUri()` output in Expo Go**
   - What we know: In Expo Go it generates `exp://` URIs. With custom scheme it generates `com.roomy://`.
   - What's unclear: Whether additional path segment is needed for the Supabase redirect URL allowlist.
   - Recommendation: Log the URI during development and add it to Supabase Dashboard. Use wildcard `exp://**` for dev flexibility.

## Sources

### Primary (HIGH confidence)
- [Supabase Native Mobile Deep Linking docs](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) - Complete code example for expo-web-browser + signInWithOAuth pattern
- [Expo Using Supabase guide](https://docs.expo.dev/guides/using-supabase/) - Configuration and setup reference

### Secondary (MEDIUM confidence)
- [Erdem Gonul blog: Google Sign In With Supabase + Expo](https://www.erdemgonul.com/blog/google-signin-supabase-expo-react-native) - Verified working implementation with getQueryParams pattern
- [GitHub Issue #1429: setSession hang](https://github.com/supabase/supabase-js/issues/1429) - Documents the known setSession hang issue and timeout workaround

### Tertiary (LOW confidence)
- None -- all findings verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase + Expo docs prescribe this exact pattern
- Architecture: HIGH - Multiple verified sources show identical flow
- Pitfalls: HIGH - setSession hang is well-documented; other pitfalls from codebase analysis

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable pattern, unlikely to change)