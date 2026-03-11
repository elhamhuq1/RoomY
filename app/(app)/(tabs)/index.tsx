import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

import * as Clipboard from "expo-clipboard";

// Colors for member initials avatars
const AVATAR_COLORS = [
  "#f9a825",
  "#66bb6a",
  "#42a5f5",
  "#ab47bc",
  "#ef5350",
  "#26a69a",
  "#ff7043",
  "#5c6bc0",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type MemberWithProfile = {
  user_id: string;
  role: "creator" | "member";
  profiles: Profile;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { household, householdSettings, user } = useSession();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteCode = household?.invite_code ?? "";
  const formattedCode = inviteCode
    ? inviteCode.slice(0, 4) + " " + inviteCode.slice(4)
    : "";

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

      const combined = membersData.map((member) => ({
        ...member,
        profiles: (profilesData?.find((p) => p.id === member.user_id) as Profile) ?? {
          id: member.user_id,
          display_name: "Unknown",
        },
      })) as MemberWithProfile[];

      setMembers(combined);
    } else {
      setMembers([]);
    }
    setLoading(false);
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  async function handleShare() {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join my household on RoomY! Use code: ${inviteCode}`,
      });
    } catch {
      // User cancelled or share failed
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  const isSoloCreator = members.length <= 1;

  // Solo creator empty state
  if (isSoloCreator) {
    return (
      <ScrollView
        className="flex-1 bg-surface-50"
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friendly icon */}
        <View className="mb-6 items-center">
          <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-primary-100">
            <Ionicons name="people" size={56} color="#f9a825" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">
            Your household is ready!
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-gray-500">
            Share this invite code with your roommates so they can join{" "}
            <Text className="font-semibold text-gray-700">
              {household?.name}
            </Text>
          </Text>
        </View>

        {/* Invite code display */}
        <View className="mb-6 items-center rounded-2xl bg-white p-8 shadow-sm">
          <Text className="mb-2 text-sm font-medium text-gray-400">
            INVITE CODE
          </Text>
          <Text
            className="text-4xl font-bold tracking-widest text-primary-600"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formattedCode}
          </Text>
          <Text className="mt-3 text-xs text-gray-400">
            Code expires in 7 days. You can regenerate it in Settings.
          </Text>
        </View>

        {/* Share button */}
        <Pressable
          className="mb-3 flex-row items-center justify-center rounded-2xl bg-primary-500 py-4 active:bg-primary-600"
          onPress={handleShare}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text className="text-lg font-bold text-white">
            Share with Roommates
          </Text>
        </Pressable>

        {/* Copy code button */}
        <Pressable
          className="flex-row items-center justify-center rounded-2xl border-2 border-primary-500 py-4 active:bg-primary-50"
          onPress={handleCopyCode}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={20}
            color="#f59b20"
            style={{ marginRight: 8 }}
          />
          <Text className="text-lg font-bold text-primary-600">
            {copied ? "Copied!" : "Copy Code"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Normal state (2+ members)
  const groceriesEnabled = householdSettings?.groceries_enabled ?? false;
  const choresEnabled = householdSettings?.chores_enabled ?? false;

  type ModuleCardConfig = {
    key: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    status: string;
    route: string;
    enabled: boolean;
  };

  const moduleCards: ModuleCardConfig[] = [
    {
      key: "expenses",
      title: "Expenses",
      icon: "wallet",
      status: "No expenses yet",
      route: "/(app)/(tabs)/expenses",
      enabled: true,
    },
    ...(groceriesEnabled
      ? [
          {
            key: "groceries",
            title: "Groceries",
            icon: "cart" as keyof typeof Ionicons.glyphMap,
            status: "No items yet",
            route: "/(app)/(tabs)/groceries",
            enabled: true,
          },
        ]
      : []),
    ...(choresEnabled
      ? [
          {
            key: "chores",
            title: "Chores",
            icon: "checkbox" as keyof typeof Ionicons.glyphMap,
            status: "No chores yet",
            route: "/(app)/(tabs)/chores",
            enabled: true,
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      className="flex-1 bg-surface-50"
      contentContainerClassName="px-6 pt-6 pb-12"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Text className="text-2xl font-bold text-gray-800">
        {household?.name}
      </Text>

      {/* Member avatars row */}
      <View className="mt-4 flex-row items-center">
        {members.map((member, index) => (
          <View
            key={member.user_id}
            className="mr-3 items-center"
          >
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  AVATAR_COLORS[index % AVATAR_COLORS.length],
              }}
            >
              <Text className="text-sm font-bold text-white">
                {getInitials(
                  member.profiles?.display_name ?? "?"
                )}
              </Text>
            </View>
            <Text
              className="mt-1 text-xs text-gray-500"
              numberOfLines={1}
            >
              {member.profiles?.display_name?.split(" ")[0] ?? "?"}
            </Text>
          </View>
        ))}
      </View>

      {/* Module cards */}
      <Text className="mb-3 mt-6 text-lg font-semibold text-gray-700">
        Modules
      </Text>
      <View className="gap-3">
        {moduleCards.map((card) => (
          <Pressable
            key={card.key}
            className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm active:bg-surface-100"
            onPress={() => router.push(card.route as never)}
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <Ionicons name={card.icon} size={24} color="#f9a825" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                {card.title}
              </Text>
              <Text className="text-sm text-gray-400">{card.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
