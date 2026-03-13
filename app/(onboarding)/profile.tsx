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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-context";
import { StepProgressBar } from "@/components/ui";
import { ONBOARDING_CREAM, ONBOARDING_IMAGES } from "@/lib/onboarding-images";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const trimmedName = displayName.trim();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      <StepProgressBar currentStep={0} totalSteps={3} showBack={false} />

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
          {/* Illustration hero */}
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Image
              source={ONBOARDING_IMAGES.displayName}
              style={{ width: "100%", height: 240 }}
              resizeMode="contain"
            />
          </View>

          {/* Title + subtitle */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: colors.neutral.text,
                textAlign: "center",
              }}
            >
              What's your name?
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.neutral.secondary,
                textAlign: "center",
                marginTop: 6,
              }}
            >
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
          <View style={{ marginBottom: 24 }}>
            <TextInput
              className={`rounded-2xl px-4 py-3.5 text-base text-neutral-text ${
                error
                  ? "border-2 border-semantic-error bg-white"
                  : focused
                    ? "border-2 border-brand bg-white"
                    : "bg-[#F5F5F5]"
              }`}
              placeholder="Display name"
              placeholderTextColor={colors.neutral.tertiary}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (error) setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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
    </SafeAreaView>
  );
}
