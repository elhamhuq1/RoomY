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
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-context";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedName = displayName.trim();
  const initial = trimmedName.charAt(0).toUpperCase();

  async function handleContinue() {
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: trimmedName })
        .eq("id", user!.id);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update auth user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { display_name: trimmedName },
      });

      if (metaError) {
        setError(metaError.message);
        return;
      }

      router.push("/(onboarding)/household-choice");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar preview */}
        <View className="mb-8 items-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-brand-light">
            {initial ? (
              <Text className="text-4xl font-bold text-brand-dark">
                {initial}
              </Text>
            ) : (
              <Text className="text-4xl text-brand/50">?</Text>
            )}
          </View>

          <Text className="text-3xl font-bold text-gray-800">
            What should we call you?
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            This is how your roommates will see you
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Display name input */}
        <View className="mb-8">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Display Name
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-4 py-3.5 text-base text-gray-800 ${
              error ? "border-red-400" : "border-neutral-border"
            }`}
            placeholder="Your name"
            placeholderTextColor={colors.neutral.tertiary}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (error) setError("");
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            editable={!loading}
            autoFocus
          />
        </View>

        {/* Continue button */}
        <Pressable
          className={`items-center rounded-2xl py-4 ${
            !trimmedName || loading
              ? "bg-brand/50"
              : "bg-brand active:bg-brand-dark"
          }`}
          onPress={handleContinue}
          disabled={!trimmedName || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Continue</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
