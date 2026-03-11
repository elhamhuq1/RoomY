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
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function ProfileSettingsScreen() {
  const { user, profile, refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? ""
  );
  const [venmoUsername, setVenmoUsername] = useState(
    profile?.venmo_username ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const hasChanges =
    displayName.trim() !== (profile?.display_name ?? "") ||
    venmoUsername.trim() !== (profile?.venmo_username ?? "");

  async function handleSave() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Display name is required");
      return;
    }

    setError("");
    setLoading(true);
    setSaved(false);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName,
          venmo_username: venmoUsername.trim() || null,
        })
        .eq("id", user!.id);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { display_name: trimmedName },
      });

      // Refresh context
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="px-6 pt-8 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar preview */}
        <View className="mb-8 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-500">
            <Text className="text-3xl font-bold text-white">{initials}</Text>
          </View>
          <Text className="mt-2 text-sm text-gray-400">
            Initials from your display name
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Saved confirmation */}
        {saved ? (
          <View className="mb-4 rounded-xl bg-green-50 px-4 py-3">
            <Text className="text-sm text-green-600">
              Profile saved successfully!
            </Text>
          </View>
        ) : null}

        {/* Display name */}
        <View className="mb-5">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Display Name
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-4 py-3.5 text-base text-gray-800 ${
              error && !displayName.trim()
                ? "border-red-400"
                : "border-surface-200"
            }`}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (error) setError("");
              if (saved) setSaved(false);
            }}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        {/* Venmo username */}
        <View className="mb-8">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Venmo Username
          </Text>
          <TextInput
            className="rounded-xl border border-surface-200 bg-white px-4 py-3.5 text-base text-gray-800"
            placeholder="@your-venmo (optional)"
            placeholderTextColor="#9ca3af"
            value={venmoUsername}
            onChangeText={(text) => {
              setVenmoUsername(text);
              if (saved) setSaved(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <Text className="mt-1.5 text-xs text-gray-400">
            Used for quick payments in Phase 2
          </Text>
        </View>

        {/* Save button */}
        <Pressable
          className={`items-center rounded-2xl py-4 ${
            !hasChanges || loading
              ? "bg-primary-300"
              : "bg-primary-500 active:bg-primary-600"
          }`}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
