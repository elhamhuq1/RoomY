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
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
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

  function inputStyle(field: string, hasError: boolean) {
    if (hasError) {
      return "rounded-2xl bg-white border-2 border-semantic-error px-4 py-3.5 text-base text-gray-800";
    }
    if (focusedField === field) {
      return "rounded-2xl bg-white border-2 border-brand px-4 py-3.5 text-base text-gray-800";
    }
    return "rounded-2xl bg-[#F5F5F5] border-2 border-transparent px-4 py-3.5 text-base text-gray-800";
  }

  // Success state: confirmation message
  if (sent) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: ONBOARDING_CREAM }}
      >
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-semantic-success/20">
          <Ionicons name="mail-outline" size={40} color={colors.semantic.success} />
        </View>
        <Text className="mb-3 text-center text-2xl font-bold text-gray-800">
          Check Your Email
        </Text>
        <Text className="mb-8 text-center text-base leading-6 text-gray-500">
          We sent a password reset link to{"\n"}
          <Text className="font-semibold text-gray-700">{email}</Text>
        </Text>
        <Pressable
          className="w-full items-center rounded-2xl bg-brand py-3.5 active:bg-brand-dark"
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text className="text-lg font-bold text-white">Back to Log In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: ONBOARDING_CREAM }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-grow justify-center px-8">
        {/* Back button */}
        <Pressable
          className="absolute left-8 top-16 z-10 h-10 w-10 items-center justify-center rounded-full bg-white"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.neutral.text} />
        </Pressable>

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
          <Text className="text-2xl font-bold text-gray-800">
            Reset Password
          </Text>
          <Text className="mt-2 text-center text-base text-neutral-secondary">
            Enter your email and we'll send you a reset link
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
            editable={!loading}
          />
          {emailError ? (
            <Text className="mt-1 text-sm text-red-500">{emailError}</Text>
          ) : null}
        </View>

        {/* Send reset link button */}
        <Pressable
          className={`mb-6 items-center rounded-2xl py-3.5 ${
            loading ? "bg-brand/50" : "bg-brand active:bg-brand-dark"
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

        {/* Back to Log In link */}
        <Pressable
          className="items-center py-3"
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text className="text-base text-gray-500">
            Back to{" "}
            <Text className="font-semibold text-brand-dark">Log In</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
