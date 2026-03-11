import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

type MemberWithProfile = {
  user_id: string;
  role: string;
  profiles: Profile;
};

export default function MemberWelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    household_id: string;
    household_name: string;
    member_count: string;
  }>();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      if (!params.household_id) return;

      try {
        const { data } = await supabase
          .from("household_members")
          .select("user_id, role, profiles(*)")
          .eq("household_id", params.household_id);

        if (data) {
          setMembers(data as unknown as MemberWithProfile[]);
        }
      } catch {
        // Silently fail -- we still show the welcome with params data
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [params.household_id]);

  function getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : "?";
  }

  // Alternate colors for member avatars
  const avatarColors = [
    "bg-primary-100",
    "bg-accent-500/20",
    "bg-blue-100",
    "bg-purple-100",
    "bg-pink-100",
  ];

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration header */}
        <View className="mb-8 items-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-accent-500/20">
            <Ionicons name="checkmark-circle" size={56} color="#66bb6a" />
          </View>
          <Text className="text-4xl font-bold text-gray-800">
            You're in!
          </Text>
          <Text className="mt-2 text-center text-xl font-semibold text-primary-600">
            {params.household_name}
          </Text>
          <Text className="mt-1 text-center text-base text-gray-500">
            You're member #{params.member_count}
          </Text>
        </View>

        {/* Member list */}
        <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-4 text-sm font-medium text-gray-400">
            HOUSEHOLD MEMBERS
          </Text>

          {loading ? (
            <ActivityIndicator color="#f9a825" className="py-4" />
          ) : (
            <View className="gap-3">
              {members.map((member, index) => (
                <View
                  key={member.user_id}
                  className="flex-row items-center"
                >
                  <View
                    className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${avatarColors[index % avatarColors.length]}`}
                  >
                    <Text className="text-lg font-bold text-gray-700">
                      {getInitial(member.profiles?.display_name ?? "")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {member.profiles?.display_name || "Unknown"}
                    </Text>
                    {member.role === "creator" ? (
                      <Text className="text-xs text-gray-400">Creator</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Continue button */}
        <Pressable
          className="items-center rounded-2xl bg-primary-500 py-4 active:bg-primary-600"
          onPress={() => router.push("/(onboarding)/module-quiz")}
        >
          <Text className="text-lg font-bold text-white">Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
