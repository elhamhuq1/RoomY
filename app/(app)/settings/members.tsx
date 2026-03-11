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
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

import * as Clipboard from "expo-clipboard";

// Colors for member initials avatars (same as dashboard)
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type MemberWithProfile = {
  user_id: string;
  role: "creator" | "member";
  joined_at: string;
  profiles: Profile;
};

export default function MembersSettingsScreen() {
  const { household, refreshProfile } = useSession();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const inviteCode = household?.invite_code ?? "";
  const formattedCode = inviteCode
    ? inviteCode.slice(0, 4) + " " + inviteCode.slice(4)
    : "";

  // Check if invite code is expired
  const expiresAt = household?.invite_code_expires_at
    ? new Date(household.invite_code_expires_at)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const fetchMembers = useCallback(async () => {
    if (!household?.id) return;
    const { data } = await supabase
      .from("household_members")
      .select("user_id, role, joined_at, profiles(*)")
      .eq("household_id", household.id)
      .order("joined_at", { ascending: true });

    if (data) {
      setMembers(data as unknown as MemberWithProfile[]);
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

  async function handleRegenerateCode() {
    if (!household?.id) return;

    setError("");
    setRegenerating(true);

    try {
      // Generate a new 8-character invite code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let newCode = "";
      for (let i = 0; i < 8; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Set new expiry to 7 days from now
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const { error: updateError } = await supabase
        .from("households")
        .update({
          invite_code: newCode,
          invite_code_expires_at: newExpiry.toISOString(),
        })
        .eq("id", household.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Refresh context to get new code
      await refreshProfile();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  const maxMembers = household?.max_members ?? 10;

  return (
    <ScrollView
      className="flex-1 bg-surface-50"
      contentContainerClassName="px-6 pt-6 pb-12"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Error */}
      {error ? (
        <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : null}

      {/* Members section */}
      <View className="mb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-700">
            Household Members
          </Text>
          <Text className="text-sm text-gray-400">
            {members.length}/{maxMembers} members
          </Text>
        </View>

        <View className="rounded-2xl bg-white shadow-sm">
          {members.map((member, index) => (
            <View
              key={member.user_id}
              className={`flex-row items-center px-5 py-4 ${
                index < members.length - 1
                  ? "border-b border-surface-200"
                  : ""
              }`}
            >
              {/* Avatar */}
              <View
                className="mr-4 h-12 w-12 items-center justify-center rounded-full"
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

              {/* Name and info */}
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-medium text-gray-800">
                    {member.profiles?.display_name ?? "Unknown"}
                  </Text>
                  {/* Role badge */}
                  <View
                    className={`ml-2 rounded-full px-2 py-0.5 ${
                      member.role === "creator"
                        ? "bg-primary-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        member.role === "creator"
                          ? "text-primary-600"
                          : "text-gray-500"
                      }`}
                    >
                      {member.role === "creator" ? "Creator" : "Member"}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-xs text-gray-400">
                  Joined {formatDate(member.joined_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Invite code section */}
      <View>
        <Text className="mb-3 text-lg font-semibold text-gray-700">
          Invite Code
        </Text>

        <View className="items-center rounded-2xl bg-white p-6 shadow-sm">
          {/* Code display */}
          <Text
            className="text-3xl font-bold tracking-widest text-primary-600"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formattedCode}
          </Text>

          {/* Expiry indicator */}
          <View className="mt-2 flex-row items-center">
            <Ionicons
              name={isExpired ? "alert-circle" : "time-outline"}
              size={14}
              color={isExpired ? "#ef4444" : "#9ca3af"}
            />
            <Text
              className={`ml-1 text-xs ${
                isExpired ? "font-medium text-red-500" : "text-gray-400"
              }`}
            >
              {isExpired
                ? "Expired"
                : expiresAt
                  ? `Expires ${formatDate(expiresAt.toISOString())}`
                  : ""}
            </Text>
          </View>

          {/* Action buttons */}
          <View className="mt-5 w-full gap-3">
            {/* Share button */}
            <Pressable
              className="flex-row items-center justify-center rounded-2xl bg-primary-500 py-3.5 active:bg-primary-600"
              onPress={handleShare}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text className="text-base font-bold text-white">
                Share Code
              </Text>
            </Pressable>

            {/* Copy + Regenerate row */}
            <View className="flex-row gap-3">
              {/* Copy button */}
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-2xl border-2 border-primary-500 py-3 active:bg-primary-50"
                onPress={handleCopyCode}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={18}
                  color="#f59b20"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-sm font-bold text-primary-600">
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </Pressable>

              {/* Regenerate button */}
              <Pressable
                className={`flex-1 flex-row items-center justify-center rounded-2xl border-2 py-3 ${
                  regenerating
                    ? "border-gray-300"
                    : "border-gray-400 active:bg-gray-50"
                }`}
                onPress={handleRegenerateCode}
                disabled={regenerating}
              >
                {regenerating ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                  <>
                    <Ionicons
                      name="refresh"
                      size={18}
                      color="#6b7280"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-sm font-bold text-gray-600">
                      Regenerate
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
