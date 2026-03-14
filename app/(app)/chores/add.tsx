import { colors, AVATAR_COLORS } from "@/lib/theme/colors";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;


function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Frequency = "daily" | "weekly" | "monthly" | "custom";

interface MemberItem {
  userId: string;
  profile: Profile;
  selected: boolean;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AddChoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    suggestedName?: string;
    suggestedFrequency?: string;
  }>();
  const { user, household } = useSession();

  // Form state
  const [name, setName] = useState(params.suggestedName ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    (params.suggestedFrequency as Frequency) ?? "weekly"
  );
  const [customDays, setCustomDays] = useState("3");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch members (two-query pattern)
  // -------------------------------------------------------------------------

  const fetchMembers = useCallback(async () => {
    if (!household?.id) return;

    const { data: membersData } = await supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", household.id);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesData) {
        const memberItems: MemberItem[] = (profilesData as Profile[]).map(
          (p) => ({
            userId: p.id,
            profile: p,
            selected: true, // all checked by default
          })
        );
        setMembers(memberItems);
      }
    }
    setLoadingMembers(false);
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // -------------------------------------------------------------------------
  // Toggle member selection
  // -------------------------------------------------------------------------

  const toggleMember = useCallback((userId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === userId ? { ...m, selected: !m.selected } : m
      )
    );
  }, []);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a chore name.");
      return;
    }
    if (!household?.id || !user?.id) return;

    const selectedMembers = members.filter((m) => m.selected);
    if (selectedMembers.length === 0) {
      Alert.alert(
        "Members required",
        "At least one member must be in the rotation."
      );
      return;
    }

    const customIntervalDays =
      frequency === "custom" ? parseInt(customDays, 10) || 3 : null;

    // Shuffle selected member IDs for random rotation order
    const shuffled = selectedMembers
      .map((m) => m.userId)
      .sort(() => Math.random() - 0.5);

    const firstAssignee = shuffled[0];

    // Compute first due date based on frequency (not "now" — avoids instant overdue)
    const now = new Date();
    const dueDate = new Date(now);
    if (frequency === "daily") dueDate.setDate(dueDate.getDate() + 1);
    else if (frequency === "weekly") dueDate.setDate(dueDate.getDate() + 7);
    else if (frequency === "monthly") dueDate.setMonth(dueDate.getMonth() + 1);
    else if (frequency === "custom") dueDate.setDate(dueDate.getDate() + (parseInt(customDays, 10) || 3));

    setSubmitting(true);
    const { error } = await supabase
      .from("chores")
      .insert({
        household_id: household.id,
        name: trimmedName,
        frequency,
        custom_interval_days: customIntervalDays,
        rotation_order: shuffled,
        current_assignee_index: 0,
        current_assignee: firstAssignee,
        next_due_at: dueDate.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", "Failed to create chore. Please try again.");
      return;
    }

    router.back();
  }, [name, frequency, customDays, members, household?.id, user?.id, router]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const selectedCount = members.filter((m) => m.selected).length;
  const canSubmit = name.trim().length > 0 && selectedCount > 0 && !submitting;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Chore name */}
        <View className="px-4 pt-6">
          <Text className="mb-1 text-sm font-medium text-gray-500">
            Chore Name
          </Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
            placeholder="Chore name"
            placeholderTextColor={colors.neutral.tertiary}
            value={name}
            onChangeText={setName}
            autoFocus={!params.suggestedName}
            returnKeyType="next"
          />
        </View>

        {/* Frequency picker */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Frequency
          </Text>
          <View className="flex-row gap-2">
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f.value}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  frequency === f.value
                    ? "bg-brand"
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => setFrequency(f.value)}
              >
                <Text
                  className={`text-sm font-medium ${
                    frequency === f.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom interval input */}
          {frequency === "custom" && (
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="text-sm text-gray-500">Every</Text>
              <TextInput
                className="w-16 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-base text-gray-800"
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text className="text-sm text-gray-500">days</Text>
            </View>
          )}
        </View>

        {/* Member selection */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Rotation Members ({selectedCount} selected)
          </Text>

          {loadingMembers ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.DEFAULT}
              style={{ marginTop: 12 }}
            />
          ) : (
            <View className="overflow-hidden rounded-xl">
              {members.map((member, index) => (
                <Pressable
                  key={member.userId}
                  className={`flex-row items-center bg-white px-4 py-3 active:bg-gray-50 ${
                    index < members.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onPress={() => toggleMember(member.userId)}
                >
                  {/* Avatar */}
                  <View
                    className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        AVATAR_COLORS[
                          member.userId.charCodeAt(0) % AVATAR_COLORS.length
                        ],
                    }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {getInitials(member.profile.display_name)}
                    </Text>
                  </View>

                  {/* Name */}
                  <Text className="flex-1 text-base text-gray-800">
                    {member.profile.display_name}
                    {member.userId === user?.id ? " (you)" : ""}
                  </Text>

                  {/* Checkbox */}
                  <Ionicons
                    name={member.selected ? "checkbox" : "square-outline"}
                    size={24}
                    color={member.selected ? colors.brand.DEFAULT : "#d1d5db"}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit button */}
      <View className="border-t border-neutral-border bg-[#F5F0EB] px-4 pb-6 pt-3">
        <Pressable
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            canSubmit
              ? "bg-brand active:bg-brand-dark"
              : "bg-gray-200"
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="add-circle"
                size={22}
                color={canSubmit ? "#fff" : colors.neutral.tertiary}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`text-lg font-bold ${
                  canSubmit ? "text-white" : "text-gray-400"
                }`}
              >
                Create Chore
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
