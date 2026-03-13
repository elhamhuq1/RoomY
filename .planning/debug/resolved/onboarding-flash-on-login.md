---
status: verifying
trigger: "When signing in, the 'what should we call you' onboarding page flashes briefly before redirecting to the home page"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - Race condition in onAuthStateChange: session set before household fetch completes
test: Fix applied - set loading=true on SIGNED_IN event before fetch, reset in .finally()
expecting: Loading spinner shows during sign-in transition instead of onboarding screen flash
next_action: Verify fix, then archive

## Symptoms

expected: After signing in, the user should go directly to the home page without seeing any onboarding screens flash
actual: The "what should we call you" onboarding page appears briefly (flashes) before disappearing and landing on the home page
errors: No errors - just a visual flash/flicker
reproduction: Sign in to the app - right before landing on the home page, the onboarding "what should we call you" screen is briefly visible
started: Likely present since onboarding was implemented

## Eliminated

## Evidence

- timestamp: 2026-03-13T00:01:00Z
  checked: app/_layout.tsx routing logic
  found: RootNavigator uses Stack.Protected guards based on isAuthenticated (!!session) and hasCompletedOnboarding (!!household). Loading spinner only shown when `loading` is true.
  implication: If session is set but household is null (and loading is false), the onboarding guard (isAuthenticated && !hasCompletedOnboarding) will activate

- timestamp: 2026-03-13T00:02:00Z
  checked: lib/auth-context.tsx onAuthStateChange callback (lines 119-129)
  found: The callback sets session and user synchronously, then calls fetchProfileAndHousehold WITHOUT awaiting it and WITHOUT setting loading=true. The loading flag is only managed during the initial getSession() call (lines 103-113), NOT during subsequent auth state changes.
  implication: CONFIRMED - When user signs in, onAuthStateChange fires, sets session immediately (isAuthenticated=true), but household remains null until the async fetch completes. Since loading is NOT set to true, the RootNavigator renders with isAuthenticated=true, hasCompletedOnboarding=false, which matches the onboarding guard.

## Resolution

root_cause: In auth-context.tsx, the onAuthStateChange callback (line 119) sets session/user state immediately but does NOT set loading=true before calling fetchProfileAndHousehold. This creates a window where isAuthenticated is true but household is still null (loading is false), causing the Stack.Protected guard for onboarding (isAuthenticated && !hasCompletedOnboarding) to activate briefly until the household fetch completes.
fix: In the onAuthStateChange callback, added `setLoading(true)` when event is SIGNED_IN (before calling fetchProfileAndHousehold), and added `.finally(() => setLoading(false))` to ensure loading is cleared after fetch completes. This ensures the loading spinner is shown during the sign-in transition instead of briefly rendering the onboarding screen. Token refresh events skip the loading flag to avoid spinner flashes during normal app use.
verification: TypeScript compiles without new errors. Logic traced through all 6 scenarios (fresh open no session, fresh open with session, sign in, token refresh, sign out, concurrent initial load) - all correct.
files_changed: [lib/auth-context.tsx]
