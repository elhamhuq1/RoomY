// Auth helper functions for social sign-in and password reset
// Uses native SDKs + signInWithIdToken (NOT signInWithOAuth browser redirect)
// Sources: RESEARCH.md Patterns 6 & 7, Supabase Auth docs

import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "./supabase";

// Configure Google Sign-In with web client ID
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

/**
 * Sign in with Google using native SDK.
 * Uses signInWithIdToken (not signInWithOAuth) for native experience.
 * Per RESEARCH.md Pattern 6.
 */
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      return { data: null, error: new Error("No ID token received from Google") };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.data.idToken,
    });

    return { data, error };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Google sign-in failed"),
    };
  }
}

/**
 * Sign in with Apple using native SDK (iOS only).
 * Captures fullName on first sign-in (Apple only sends it once -- Pitfall 3).
 * Per RESEARCH.md Pattern 7.
 */
export async function signInWithApple() {
  if (Platform.OS !== "ios") {
    return { data: null, error: new Error("Apple Sign-In is only available on iOS") };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { data: null, error: new Error("No identity token from Apple") };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    // CRITICAL: Apple only provides full name on first sign-in.
    // Capture it immediately and save to user metadata (Pitfall 3).
    if (!error && credential.fullName) {
      const fullName = [
        credential.fullName.givenName,
        credential.fullName.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      if (fullName) {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }
    }

    return { data, error };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Apple sign-in failed"),
    };
  }
}

/**
 * Request a password reset email.
 * Uses Supabase resetPasswordForEmail with deep link redirect.
 * Per RESEARCH.md Code Example: Password Reset Flow.
 */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "com.roomy://reset-password",
  });

  return { error };
}
