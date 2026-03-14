import { colors } from "@/lib/theme/colors";
import { ONBOARDING_CREAM } from "@/lib/onboarding-images";
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
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, signInWithApple } from "@/lib/auth-utils";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  function validateConfirmPassword(value: string): boolean {
    if (!value) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  }

  async function handleSignUp() {
    setGeneralError("");
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    const confirmValid = validateConfirmPassword(confirmPassword);
    if (!emailValid || !passwordValid || !confirmValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setGeneralError(error.message);
      } else {
        // Redirect to sign-in so user can log in (especially if email confirmation is enabled)
        router.replace("/(auth)/sign-in?registered=true");
        return;
      }
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

  function inputStyle(field: string, hasError: boolean) {
    if (hasError) {
      return "rounded-2xl bg-white border-2 border-semantic-error px-4 py-3.5 text-base text-gray-800";
    }
    if (focusedField === field) {
      return "rounded-2xl bg-white border-2 border-brand px-4 py-3.5 text-base text-gray-800";
    }
    return "rounded-2xl bg-[#F5F5F5] border-2 border-transparent px-4 py-3.5 text-base text-gray-800";
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: ONBOARDING_CREAM }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Glassmorphism logo */}
        <View className="mb-6 items-center">
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <BlurView
              intensity={25}
              tint="light"
              style={{ flex: 1 }}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Platform.select({
                    ios: "rgba(255,255,255,0.3)",
                    default: "rgba(255,255,255,0.7)",
                  }),
                }}
              >
                <Image
                  source={require("@/assets/android-icon-foreground.png")}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
            </BlurView>
          </View>
        </View>

        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-gray-800">
            Create Account
          </Text>
          <Text className="mt-2 text-base text-neutral-secondary">
            Start managing your household
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
          <TextInput
            className={inputStyle("email", !!emailError)}
            placeholder="Email"
            placeholderTextColor={colors.neutral.tertiary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onFocus={() => setFocusedField("email")}
            onBlur={() => {
              setFocusedField(null);
              if (email) validateEmail(email);
            }}
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
        <View className="mb-4">
          <TextInput
            className={inputStyle("password", !!passwordError)}
            placeholder="Password"
            placeholderTextColor={colors.neutral.tertiary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onFocus={() => setFocusedField("password")}
            onBlur={() => {
              setFocusedField(null);
              if (password) validatePassword(password);
            }}
            secureTextEntry
            textContentType="newPassword"
            editable={!isDisabled}
          />
          {passwordError ? (
            <Text className="mt-1 text-sm text-red-500">{passwordError}</Text>
          ) : null}
        </View>

        {/* Confirm Password input */}
        <View className="mb-6">
          <TextInput
            className={inputStyle("confirmPassword", !!confirmPasswordError)}
            placeholder="Confirm Password"
            placeholderTextColor={colors.neutral.tertiary}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) validateConfirmPassword(text);
            }}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => {
              setFocusedField(null);
              if (confirmPassword) validateConfirmPassword(confirmPassword);
            }}
            secureTextEntry
            textContentType="newPassword"
            editable={!isDisabled}
          />
          {confirmPasswordError ? (
            <Text className="mt-1 text-sm text-red-500">
              {confirmPasswordError}
            </Text>
          ) : null}
        </View>

        {/* Create Account button */}
        <Pressable
          className={`mb-6 items-center rounded-2xl py-3.5 ${
            isDisabled ? "bg-brand/50" : "bg-brand active:bg-brand-dark"
          }`}
          onPress={handleSignUp}
          disabled={isDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Create Account</Text>
          )}
        </Pressable>

        {/* Divider */}
        <View className="mb-6 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-4 text-sm text-gray-400">or</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        {/* Social auth buttons */}
        <Pressable
          className={`mb-3 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white py-3.5 ${
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
            className={`mb-6 flex-row items-center justify-center rounded-2xl bg-black py-3.5 ${
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
            <Text className="font-semibold text-brand-dark">Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
