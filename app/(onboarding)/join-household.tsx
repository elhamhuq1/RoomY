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

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  const displayCode = code.length > 4 ? code.slice(0, 4) + " " + code.slice(4) : code;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable
          className="absolute left-8 top-16 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.neutral.text} />
        </Pressable>

        {/* Header */}
        <View className="mb-8 items-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-brand-light">
            <Ionicons name="key" size={44} color={colors.brand.DEFAULT} />
          </View>
          <Text className="text-3xl font-bold text-gray-800">
            Enter Invite Code
          </Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            Ask your roommate for their household's code
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Code input */}
        <View className="mb-8">
          <TextInput
            className={`rounded-xl border bg-white px-4 py-4 text-center text-2xl font-bold tracking-widest text-gray-800 ${
              error ? "border-red-400" : "border-neutral-border"
            }`}
            placeholder="ABCD EFGH"
            placeholderTextColor="#d1d5db"
            value={displayCode}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9} // 8 chars + 1 space
            editable={!loading}
            autoFocus
          />
          <Text className="mt-2 text-center text-xs text-gray-400">
            8-character code from your roommate
          </Text>
        </View>

        {/* Join button */}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
