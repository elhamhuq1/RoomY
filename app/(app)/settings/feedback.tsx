import { colors } from "@/lib/theme/colors";
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as MailComposer from "expo-mail-composer";
import Constants from "expo-constants";
import { useSession } from "@/lib/auth-context";

const FEEDBACK_EMAIL = "elhamhuq04@gmail.com";

type FeedbackType = "bug" | "feature" | "other";

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string; emoji: string }[] = [
  { value: "bug", label: "Report a Bug", icon: "bug-outline", emoji: "🐛" },
  { value: "feature", label: "Feature Idea", icon: "bulb-outline", emoji: "💡" },
  { value: "other", label: "Other Feedback", icon: "chatbubble-outline", emoji: "💬" },
];

export default function FeedbackScreen() {
  const { user, profile, household } = useSession();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");

  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? "dev";

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Message required", "Please describe what you'd like to share.");
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "No Mail App",
        `No mail app is configured on this device. You can email us directly at ${FEEDBACK_EMAIL}`,
        [{ text: "OK" }]
      );
      return;
    }

    const typeLabel = FEEDBACK_TYPES.find((t) => t.value === feedbackType)?.label ?? feedbackType;
    const subject = `[RoomY ${typeLabel}] from ${profile?.display_name ?? "User"}`;

    const deviceInfo = [
      `App Version: ${appVersion} (${buildNumber})`,
      `Platform: ${Platform.OS} ${Platform.Version}`,
      `User: ${profile?.display_name ?? "Unknown"}`,
      `Household: ${household?.name ?? "None"}`,
    ].join("\n");

    const body = `${message}\n\n---\n${deviceInfo}`;

    await MailComposer.composeAsync({
      recipients: [FEEDBACK_EMAIL],
      subject,
      body,
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center px-6 pt-8 pb-4">
          <Text className="text-2xl font-heading text-neutral-text mb-1">
            We'd love to hear from you
          </Text>
          <Text className="text-sm font-sans text-neutral-secondary text-center">
            Help us make RoomY better for everyone
          </Text>
        </View>

        {/* Feedback type picker */}
        <View className="px-4 mt-2">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            What type of feedback?
          </Text>
          <View className="flex-row gap-2">
            {FEEDBACK_TYPES.map((type) => {
              const isSelected = feedbackType === type.value;
              return (
                <Pressable
                  key={type.value}
                  className={`flex-1 items-center rounded-xl py-3 ${
                    isSelected
                      ? "bg-brand"
                      : "bg-white border border-gray-200"
                  }`}
                  onPress={() => setFeedbackType(type.value)}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{type.emoji}</Text>
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Message input */}
        <View className="px-4 mt-6">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            {feedbackType === "bug"
              ? "What happened? What did you expect?"
              : feedbackType === "feature"
              ? "Describe your idea"
              : "What's on your mind?"}
          </Text>
          <TextInput
            className="font-sans rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
            placeholder={
              feedbackType === "bug"
                ? "I tapped X and Y happened instead of Z..."
                : feedbackType === "feature"
                ? "It would be great if the app could..."
                : "I wanted to share..."
            }
            placeholderTextColor={colors.neutral.tertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{ minHeight: 140 }}
          />
        </View>

        {/* Info note */}
        <View className="px-4 mt-4">
          <View className="flex-row items-start rounded-xl bg-white border border-gray-100 px-4 py-3">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.neutral.tertiary}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text className="flex-1 font-sans text-xs text-gray-400 leading-4">
              Your device info and app version will be included automatically to
              help us diagnose issues faster.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Send button */}
      <View className="border-t border-neutral-border bg-[#F5F0EB] px-4 pb-6 pt-3">
        <Pressable
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            message.trim()
              ? "bg-brand active:bg-brand-dark"
              : "bg-gray-200"
          }`}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? "#fff" : colors.neutral.tertiary}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-lg font-heading ${
              message.trim() ? "text-white" : "text-gray-400"
            }`}
          >
            Send Feedback
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
