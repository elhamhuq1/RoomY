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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { StepProgressBar } from "@/components/ui";
import { ONBOARDING_CREAM } from "@/lib/onboarding-images";

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const trimmedCode = code.trim().toUpperCase();

  function handleCodeChange(text: string) {
    // Filter to allowed characters (uppercase letters + digits, no ambiguous chars)
    const filtered = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    setCode(filtered);
    if (error) setError("");
  }

  function getFriendlyError(message: string): string {
    if (message.includes("Invalid or expired invite code")) {
      return "This code is invalid or has expired. Ask your roommate for a new one.";
    }
    if (message.includes("Household is full")) {
      return "This household has reached its member limit.";
    }
    if (message.includes("Already a member")) {
      return "You're already in this household!";
    }
    return message;
  }

  async function handleJoin() {
    if (trimmedCode.length < 8) {
      setError("Please enter the full 8-character code");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "join_household_by_code",
        { code: trimmedCode },
      );

      if (rpcError) {
        setError(getFriendlyError(rpcError.message));
        return;
      }

      // Navigate to welcome screen with household info
      router.push({
        pathname: "/(onboarding)/member-welcome",
        params: {
          household_id: data.household_id,
          household_name: data.household_name,
          member_count: String(data.member_count),
        },
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Format code display with space in middle
  const displayCode =
    code.length > 4 ? code.slice(0, 4) + " " + code.slice(4) : code;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      <StepProgressBar
        currentStep={1}
        totalSteps={3}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title + subtitle */}
          <View style={{ alignItems: "center", marginTop: 32, marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: colors.neutral.text,
                textAlign: "center",
              }}
            >
              Join Household
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.neutral.secondary,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Enter the invite code from your roommate
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          {/* Code input -- inset style */}
          <View style={{ marginBottom: 8 }}>
            <TextInput
              className={`rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-neutral-text ${
                error
                  ? "border-2 border-semantic-error bg-white"
                  : focused
                    ? "border-2 border-brand bg-white"
                    : "border-2 border-transparent bg-[#F5F5F5]"
              }`}
              placeholder="ABCD EFGH"
              placeholderTextColor={colors.neutral.tertiary}
              value={displayCode}
              onChangeText={handleCodeChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={9}
              editable={!loading}
              autoFocus
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.neutral.tertiary,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              8-character code from your roommate
            </Text>
          </View>

          {/* Join button */}
          <View style={{ marginTop: 24 }}>
            <Pressable
              className={`items-center rounded-2xl py-4 ${
                trimmedCode.length < 8 || loading
                  ? "bg-brand/50"
                  : "bg-brand active:bg-brand-dark"
              }`}
              onPress={handleJoin}
              disabled={trimmedCode.length < 8 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-bold text-white">
                  Join Household
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
