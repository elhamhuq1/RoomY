import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTED_CHORES = [
  { name: "Dishes", icon: "restaurant-outline" as const, frequency: "daily" as const },
  { name: "Take out trash", icon: "trash-outline" as const, frequency: "weekly" as const },
  { name: "Vacuum", icon: "home-outline" as const, frequency: "weekly" as const },
  { name: "Clean bathroom", icon: "water-outline" as const, frequency: "weekly" as const },
  { name: "Mop floors", icon: "grid-outline" as const, frequency: "weekly" as const },
  { name: "Wipe counters", icon: "hand-left-outline" as const, frequency: "daily" as const },
  { name: "Laundry", icon: "shirt-outline" as const, frequency: "weekly" as const },
];

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOverdueDays(nextDueAt: string): number | null {
  const due = new Date(nextDueAt);
  const now = new Date();
  if (now <= due) return null;
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "custom":
      return "Custom";
    default:
      return frequency;
  }
}

function formatDueDate(nextDueAt: string): string {
  const due = new Date(nextDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays}d`;
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function calculateStreak(completions: ChoreCompletion[]): number {
  let streak = 0;
  for (const c of completions) {
    if (c.is_reverted) break;
    streak++;
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ChoresScreen() {
  const router = useRouter();
  const { user, household } = useSession();

  // State
  const [chores, setChores] = useState<Chore[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!household?.id || !user?.id) return;

    // Fetch chores
    const { data: choresData } = await supabase
      .from("chores")
      .select("*")
      .eq("household_id", household.id)
      .eq("is_active", true)
      .order("next_due_at", { ascending: true });

    if (choresData) {
      setChores(choresData as Chore[]);
    }

    // Fetch members + profiles (two-query pattern)
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
        const profileMap: Record<string, Profile> = {};
        (profilesData as Profile[]).forEach((p) => {
          profileMap[p.id] = p;
        });
        setProfiles(profileMap);
      }
    }

    // Fetch completions for current user (for streak calculation)
    const { data: completionsData } = await supabase
      .from("chore_completions")
      .select("*")
      .eq("completed_by", user.id)
      .order("completed_at", { ascending: false })
      .limit(50);

    if (completionsData) {
      setCompletions(completionsData as ChoreCompletion[]);
    }

    setLoading(false);
  }, [household?.id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleComplete = useCallback(
    (choreId: string) => {
      if (!user?.id) return;

      Alert.alert(
        "Mark Complete?",
        "This chore will be marked as done and rotate to the next person.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Complete",
            onPress: async () => {
              setCompletingId(choreId);
              const { error } = await supabase.rpc("complete_chore", {
                p_chore_id: choreId,
                p_completed_by: user.id,
              });
              setCompletingId(null);
              if (!error) {
                fetchData();
              }
            },
          },
        ]
      );
    },
    [user?.id, fetchData]
  );

  const handleClaim = useCallback(
    async (choreId: string) => {
      if (!user?.id) return;
      setClaimingId(choreId);
      const { error } = await supabase.rpc("claim_chore", {
        p_chore_id: choreId,
        p_claimed_by: user.id,
      });
      setClaimingId(null);
      if (!error) {
        fetchData();
      }
    },
    [user?.id, fetchData]
  );

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const myChores = chores
    .filter((c) => c.current_assignee === user?.id)
    .sort(
      (a, b) =>
        new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime()
    );

  const othersChores = chores
    .filter((c) => c.current_assignee !== user?.id)
    .sort(
      (a, b) =>
        new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime()
    );

  const pendingCount = myChores.length;
  const overdueCount = chores.filter(
    (c) => c.current_assignee === user?.id && getOverdueDays(c.next_due_at) !== null
  ).length;
  const streak = calculateStreak(completions);

  const isEmpty = chores.length === 0 && !loading;

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderChoreRow(chore: Chore) {
    const overdueDays = getOverdueDays(chore.next_due_at);
    const assigneeProfile = chore.current_assignee
      ? profiles[chore.current_assignee]
      : null;
    const assigneeName = assigneeProfile?.display_name ?? "Unassigned";
    const isMyChore = chore.current_assignee === user?.id;
    const isCompleting = completingId === chore.id;
    const isClaiming = claimingId === chore.id;

    return (
      <View
        key={chore.id}
        className="flex-row items-center bg-white px-4 py-3.5"
      >
        {/* Assignee avatar */}
        <View
          className="mr-3 h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              AVATAR_COLORS[
                (chore.current_assignee?.charCodeAt(0) ?? 0) %
                  AVATAR_COLORS.length
              ],
          }}
        >
          <Text className="text-xs font-bold text-white">
            {getInitials(assigneeName)}
          </Text>
        </View>

        {/* Chore info */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
            {chore.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-2">
            <View className="rounded-full bg-primary-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-primary-700">
                {getFrequencyLabel(chore.frequency)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {isMyChore ? "You" : assigneeName}
            </Text>
            {overdueDays === null && (
              <Text className="text-xs text-gray-400">
                {formatDueDate(chore.next_due_at)}
              </Text>
            )}
            {overdueDays !== null && (
              <View className="rounded-full bg-red-100 px-2 py-0.5">
                <Text className="text-xs font-semibold text-red-600">
                  {overdueDays}d overdue
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center gap-2">
          {/* Claim button -- only on others' chores */}
          {!isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100"
              onPress={() => handleClaim(chore.id)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons name="hand-left-outline" size={18} color="#3b82f6" />
              )}
            </Pressable>
          )}

          {/* Complete button */}
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-green-50 active:bg-green-100"
            onPress={() => handleComplete(chore.id)}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#22c55e" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#22c55e" />
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (isEmpty) {
    return (
      <View className="flex-1 bg-surface-50">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center px-8 pt-12">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="checkbox" size={40} color="#f9a825" />
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              No chores yet!
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-gray-500">
              Add some chores to keep your home running smoothly
            </Text>
          </View>

          {/* Suggested chores grid */}
          <View className="mt-8 px-4">
            <Text className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
              Suggested Chores
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {SUGGESTED_CHORES.map((suggestion) => (
                <Pressable
                  key={suggestion.name}
                  className="w-[47%] flex-row items-center rounded-xl bg-white px-3 py-3.5 active:bg-gray-50"
                  style={{ elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/chores/add",
                      params: { suggestedName: suggestion.name, suggestedFrequency: suggestion.frequency },
                    } as never)
                  }
                >
                  <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                    <Ionicons name={suggestion.icon} size={16} color="#f9a825" />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-gray-700" numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom chore button */}
            <Pressable
              className="mt-4 flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 py-3.5 active:bg-gray-50"
              onPress={() => router.push("/(app)/chores/add" as never)}
            >
              <Ionicons name="add" size={20} color="#9ca3af" />
              <Text className="ml-2 text-sm font-medium text-gray-500">
                Create custom chore
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* FAB */}
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
          style={{ elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
          onPress={() => router.push("/(app)/chores/add" as never)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render (has chores)
  // -------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary header */}
        <View className="flex-row gap-3 px-4 pt-4 pb-2">
          <View className="flex-1 items-center rounded-xl bg-primary-100 py-3">
            <Text className="text-xl font-bold text-primary-700">
              {pendingCount}
            </Text>
            <Text className="text-xs text-primary-600">Pending</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-red-100 py-3">
            <Text className="text-xl font-bold text-red-600">
              {overdueCount}
            </Text>
            <Text className="text-xs text-red-500">Overdue</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-green-100 py-3">
            <Text className="text-xl font-bold text-green-600">{streak}</Text>
            <Text className="text-xs text-green-500">Streak</Text>
          </View>
        </View>

        {/* My Chores section */}
        {myChores.length > 0 && (
          <View className="mt-4">
            <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              My Chores
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl">
              {myChores.map((chore, index) => (
                <View
                  key={chore.id}
                  className={
                    index < myChores.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }
                >
                  {renderChoreRow(chore)}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Household Chores section */}
        {othersChores.length > 0 && (
          <View className="mt-6">
            <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              Household Chores
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl">
              {othersChores.map((chore, index) => (
                <View
                  key={chore.id}
                  className={
                    index < othersChores.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }
                >
                  {renderChoreRow(chore)}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
        style={{ elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
        onPress={() => router.push("/(app)/chores/add" as never)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
