import { colors } from "@/lib/theme/colors";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui";
import { ONBOARDING_CREAM } from "@/lib/onboarding-images";
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
        const { data: membersData } = await supabase
          .from("household_members")
          .select("user_id, role")
          .eq("household_id", params.household_id);

        if (membersData && membersData.length > 0) {
          const userIds = membersData.map((m) => m.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds);

          const combined = membersData.map((member) => ({
            ...member,
            profiles: profilesData?.find((p) => p.id === member.user_id) ?? {
              id: member.user_id,
              display_name: "Unknown",
            },
          })) as unknown as MemberWithProfile[];

          setMembers(combined);
        }
      } catch {
        // Silently fail -- we still show the welcome with params data
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [params.household_id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      {/* No StepProgressBar -- celebration screen for joiners */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 36,
              fontFamily: 'SpaceGrotesk_700Bold',
              color: colors.neutral.text,
              textAlign: "center",
            }}
          >
            You're in!
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.brand.dark,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {params.household_name}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'SpaceGrotesk_400Regular',
              color: colors.neutral.secondary,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            You're member #{params.member_count}
          </Text>
        </View>

        {/* Member list card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              letterSpacing: 1,
              color: colors.neutral.tertiary,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            HOUSEHOLD MEMBERS
          </Text>

          {loading ? (
            <ActivityIndicator
              color={colors.brand.DEFAULT}
              style={{ paddingVertical: 16 }}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {members.map((member) => (
                <View
                  key={member.user_id}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <View style={{ marginRight: 12 }}>
                    <Avatar
                      userId={member.user_id}
                      name={member.profiles?.display_name ?? "?"}
                      size="md"
                      avatarUrl={member.profiles?.avatar_url}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'SpaceGrotesk_600SemiBold',
                        color: colors.neutral.text,
                      }}
                    >
                      {member.profiles?.display_name || "Unknown"}
                    </Text>
                    {member.role === "creator" ? (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'SpaceGrotesk_400Regular',
                          color: colors.neutral.tertiary,
                        }}
                      >
                        Creator
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Continue button */}
        <Pressable
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
          onPress={() => router.push("/(onboarding)/module-quiz")}
        >
          <Text
            style={{
              fontSize: 17,
              fontFamily: 'SpaceGrotesk_700Bold',
              color: "#FFFFFF",
            }}
          >
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
