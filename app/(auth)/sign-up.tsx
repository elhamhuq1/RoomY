import { colors } from "@/lib/theme/colors";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, signInWithApple } from "@/lib/auth-utils";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null,
  );

  function validateEmail(value: string): boolean {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  }

  function validatePassword(value: string): boolean {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleSignUp() {
    setGeneralError("");
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    if (!emailValid || !passwordValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setGeneralError(error.message);
      }
      // On success, onAuthStateChange in auth-context fires and
      // Stack.Protected redirects to onboarding automatically
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGeneralError("");
    setSocialLoading("google");
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setGeneralError(error.message);
      }
    } catch {
      setGeneralError("Google sign-in failed. Please try again.");
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setGeneralError("");
    setSocialLoading("apple");
    try {
      const { error } = await signInWithApple();
      if (error) {
        setGeneralError(error.message);
      }
    } catch {
      setGeneralError("Apple sign-in failed. Please try again.");
    } finally {
      setSocialLoading(null);
    }
  }

  const isDisabled = loading || socialLoading !== null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-gray-800">
            Create Account
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            Join your household on RoomY
          </Text>
        </View>

        {/* General error */}
        {generalError ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{generalError}</Text>
          </View>
        ) : null}

        {/* Email input */}
        <View className="mb-4">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Email
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-4 py-3.5 text-base text-gray-800 ${
              emailError ? "border-red-400" : "border-neutral-border"
            }`}
            placeholder="you@example.com"
            placeholderTextColor={colors.neutral.tertiary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => email && validateEmail(email)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isDisabled}
          />
          {emailError ? (
            <Text className="mt-1 text-sm text-red-500">{emailError}</Text>
          ) : null}
        </View>

        {/* Password input */}
        <View className="mb-6">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Password
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-4 py-3.5 text-base text-gray-800 ${
              passwordError ? "border-red-400" : "border-neutral-border"
            }`}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.neutral.tertiary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onBlur={() => password && validatePassword(password)}
            secureTextEntry
            textContentType="newPassword"
            editable={!isDisabled}
          />
          {passwordError ? (
            <Text className="mt-1 text-sm text-red-500">{passwordError}</Text>
          ) : null}
        </View>

        {/* Sign up button */}
        <Pressable
          className={`mb-6 items-center rounded-2xl py-4 ${
            isDisabled ? "bg-brand/50" : "bg-brand-light0 active:bg-brand-dark"
          }`}
          onPress={handleSignUp}
          disabled={isDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Sign Up</Text>
          )}
        </Pressable>

        {/* Divider */}
        <View className="mb-6 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-4 text-sm text-gray-400">or</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        {/* Social sign-in buttons */}
        <Pressable
          className={`mb-3 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3.5 ${
            isDisabled ? "opacity-50" : "active:bg-gray-50"
          }`}
          onPress={handleGoogleSignIn}
          disabled={isDisabled}
        >
          {socialLoading === "google" ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={20}
                color="#4285F4"
                style={{ marginRight: 8 }}
              />
              <Text className="text-base font-semibold text-gray-700">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        {Platform.OS === "ios" ? (
          <Pressable
            className={`mb-6 flex-row items-center justify-center rounded-xl border border-gray-200 bg-black py-3.5 ${
              isDisabled ? "opacity-50" : "active:opacity-80"
            }`}
            onPress={handleAppleSignIn}
            disabled={isDisabled}
          >
            {socialLoading === "apple" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-base font-semibold text-white">
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <View className="mb-6" />
        )}

        {/* Footer link */}
        <Pressable
          className="items-center py-3"
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text className="text-base text-gray-500">
            Already have an account?{" "}
            <Text className="font-semibold text-brand-dark">Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
