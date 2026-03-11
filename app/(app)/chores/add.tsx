import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types/database";

type Frequency = "daily" | "weekly" | "monthly" | "custom";

export default function AddChoreScreen() {
  const { householdId, session } = useSession();
  const { suggestedName } = useLocalSearchParams<{ suggestedName?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [name, setName] = useState(suggestedName || "");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [customDays, setCustomDays] = useState("3");

  useEffect(() => {
    if (!householdId) return;

    const fetchMembers = async () => {
      try {
        setFetchingMembers(true);
        const { data: members, error: membersError } = await supabase
          .from("household_members")
          .select("user_id")
          .eq("household_id", householdId);

        if (membersError) throw membersError;

        const userIds = members.map((m) => m.user_id);
        const { data: profileData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        setProfiles(profileData);
        setSelectedMembers(profileData.map((p) => p.id));
      } catch (error) {
        console.error("Error fetching members:", error);
        Alert.alert("Error", "Failed to load household members.");
      } finally {
        setFetchingMembers(false);
      }
    };

    fetchMembers();
  }, [householdId]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a chore name.");
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert("Required", "Please select at least one person for the rotation.");
      return;
    }

    if (frequency === "custom" && (!customDays || parseInt(customDays) <= 0)) {
      Alert.alert("Required", "Please enter a valid number of days for custom frequency.");
      return;
    }

    try {
      setLoading(true);

      // 1. Shuffle selected members for random rotation
      const rotationOrder = [...selectedMembers].sort(() => Math.random() - 0.5);
      const initialAssignee = rotationOrder[0];

      // 2. Insert chore (next_due_at is now so it's due immediately)
      const { error } = await supabase.from("chores").insert({
        household_id: householdId,
        name: name.trim(),
        frequency,
        custom_interval_days: frequency === "custom" ? parseInt(customDays) : null,
        rotation_order: rotationOrder,
        current_assignee_index: 0,
        current_assignee: initialAssignee,
        next_due_at: new Date().toISOString(),
        created_by: session?.user?.id,
      });

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error("Error creating chore:", error);
      Alert.alert("Error", "Failed to create chore.");
    } finally {
      setLoading(false);
    }
  };

  const frequencies: { label: string; value: Frequency }[] = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface-50"
    >
      <ScrollView className="flex-1 px-6 pt-6">
        <Text className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">
          What needs to be done?
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Vacuum living room"
          className="rounded-2xl bg-white p-4 text-lg text-gray-800 shadow-sm"
        />

        <Text className="mb-2 mt-8 text-sm font-bold uppercase tracking-wider text-gray-400">
          How often?
        </Text>
        <View className="flex-row flex-wrap">
          {frequencies.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFrequency(f.value)}
              className={`mb-3 mr-3 rounded-full border px-6 py-3 ${
                frequency === f.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text
                className={`font-bold ${
                  frequency === f.value ? "text-primary-600" : "text-gray-500"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequency === "custom" && (
          <View className="mt-2 flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-gray-600">Every</Text>
            <TextInput
              value={customDays}
              onChangeText={setCustomDays}
              keyboardType="numeric"
              className="mx-3 w-16 border-b-2 border-primary-500 pb-1 text-center text-lg font-bold text-gray-800"
            />
            <Text className="text-gray-600">days</Text>
          </View>
        )}

        <Text className="mb-2 mt-8 text-sm font-bold uppercase tracking-wider text-gray-400">
          Who's in the rotation?
        </Text>
        {fetchingMembers ? (
          <ActivityIndicator color="#f9a825" className="py-4" />
        ) : (
          <View className="rounded-2xl bg-white p-2 shadow-sm">
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                onPress={() => toggleMember(profile.id)}
                className="flex-row items-center justify-between border-b border-gray-50 p-4 last:border-0"
              >
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Text className="font-bold text-primary-700">
                      {profile.display_name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text className="ml-3 font-medium text-gray-800">
                    {profile.display_name || "Unknown member"}
                  </Text>
                </View>
                <Ionicons
                  name={selectedMembers.includes(profile.id) ? "checkbox" : "square-outline"}
                  size={24}
                  color={selectedMembers.includes(profile.id) ? "#f9a825" : "#d1d5db"}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="border-t border-gray-100 bg-white p-6 pb-10">
        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          className={`h-16 items-center justify-center rounded-2xl bg-primary-500 shadow-md ${
            loading ? "opacity-70" : ""
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-bold text-white">Create Chore</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
