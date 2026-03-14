// Auth helper functions for browser-based Google OAuth and password reset
// Uses expo-web-browser + signInWithOAuth (Expo Go compatible)

import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Session setup timed out. Please try again.")),
      ms,
    ),
  );
  return Promise.race([promise, timeout]);
}

/**
 * Sign in with Google using browser-based OAuth flow.
 * Opens system browser for Google consent, then extracts tokens from redirect.
 * Works in Expo Go without native modules.
 */
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
    if (!data?.url)
      return { data: null, error: new Error("No OAuth URL returned") };

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      { showInRecents: true },
    );

    if (result.type !== "success") {
      // User cancelled -- silent return per CONTEXT.md
      return { data: null, error: null };
    }

    // Extract tokens from redirect URL
    const { params, errorCode } = QueryParams.getQueryParams(result.url);
    if (errorCode) return { data: null, error: new Error(errorCode) };

    const { access_token, refresh_token } = params;
    if (!access_token)
      return { data: null, error: new Error("No access token received") };

    // Set session with timeout wrapper (known hang issue)
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? "",
      }),
      10000,
    );

    // Handle account conflict: email exists with different provider
    if (
      sessionError?.message &&
      /already registered|already exists|different provider/i.test(
        sessionError.message,
      )
    ) {
      return {
        data: null,
        error: new Error(
          "An account with this email already exists. Please sign in with your password.",
        ),
      };
    }

    return { data: sessionData, error: sessionError };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Google sign-in failed"),
    };
  }
}

/**
 * Request a password reset email.
 * Uses Supabase resetPasswordForEmail with deep link redirect.
 */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "com.roomy://reset-password",
  });

  return { error };
}
