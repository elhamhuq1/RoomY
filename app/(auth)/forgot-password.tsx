import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { requestPasswordReset } from "@/lib/auth-utils";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

  async function handleReset() {
    setGeneralError("");
    if (!validateEmail(email)) return;

    setLoading(true);
    try {
      const { error } = await requestPasswordReset(email.trim());

      if (error) {
        setGeneralError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state: confirmation message
  if (sent) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-accent-500/20">
          <Ionicons name="mail-outline" size={40} color="#66bb6a" />
        </View>
        <Text className="mb-3 text-center text-2xl font-bold text-gray-800">
          Check Your Email
        </Text>
        <Text className="mb-8 text-center text-base leading-6 text-gray-500">
          We sent a password reset link to{"\n"}
          <Text className="font-semibold text-gray-700">{email}</Text>
        </Text>
        <Pressable
          className="w-full items-center rounded-2xl bg-primary-500 py-4 active:bg-primary-600"
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text className="text-lg font-bold text-white">Back to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-grow justify-center px-8">
        {/* Back button */}
        <Pressable
          className="absolute left-8 top-16 z-10 h-10 w-10 items-center justify-center rounded-full bg-white"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>

        {/* Header */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Ionicons name="lock-closed-outline" size={32} color="#f9a825" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            Reset Password
          </Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        {/* General error */}
        {generalError ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{generalError}</Text>
          </View>
        ) : null}

        {/* Email input */}
        <View className="mb-6">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Email
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-4 py-3.5 text-base text-gray-800 ${
              emailError ? "border-red-400" : "border-surface-200"
            }`}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
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
            editable={!loading}
          />
          {emailError ? (
            <Text className="mt-1 text-sm text-red-500">{emailError}</Text>
          ) : null}
        </View>

        {/* Send reset link button */}
        <Pressable
          className={`items-center rounded-2xl py-4 ${
            loading ? "bg-primary-300" : "bg-primary-500 active:bg-primary-600"
          }`}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">
              Send Reset Link
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
