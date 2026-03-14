import { colors } from "@/lib/theme/colors";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/auth-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui";
import type { ChoreCompletion, Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

type TimePeriod = "week" | "month";

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ---------------------------------------------------------------------------
// Streak calculation
// ---------------------------------------------------------------------------

function calculateStreak(completions: ChoreCompletion[]): number {
  // Consecutive non-reverted completions counting backwards from most recent
  let streak = 0;
  for (const c of completions) {
    if (c.is_reverted) break;
    streak++;
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberStats {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  completionCount: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const { user, household } = useSession();

  const [period, setPeriod] = useState<TimePeriod>("week");
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);

  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(
    async (selectedPeriod: TimePeriod) => {
      if (!household?.id) return;

      setLoading(true);

      // Get date range
      const { start, end } =
        selectedPeriod === "week" ? getWeekRange() : getMonthRange();

      // Fetch completions in date range for household chores
      // First, get household chore IDs
      const { data: choresData } = await supabase
        .from("chores")
        .select("id")
        .eq("household_id", household.id);

      if (!choresData || choresData.length === 0) {
        setMemberStats([]);
        setTotalCompletions(0);

        setLoading(false);
        return;
      }

      const choreIds = choresData.map((c) => c.id);

      // Fetch completions within date range (non-reverted)
      const { data: completionsData } = await supabase
        .from("chore_completions")
        .select("*")
        .in("chore_id", choreIds)
        .eq("is_reverted", false)
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString())
        .order("completed_at", { ascending: false });

      const completions = (completionsData ?? []) as ChoreCompletion[];
      setTotalCompletions(completions.length);

      // Also fetch ALL completions (no date filter) for streak calculation
      const { data: allCompletionsData } = await supabase
        .from("chore_completions")
        .select("*")
        .in("chore_id", choreIds)
        .order("completed_at", { ascending: false });

      const allCompletions = (allCompletionsData ?? []) as ChoreCompletion[];

      // Extract unique user IDs from completions
      const userIdSet = new Set<string>();
      completions.forEach((c) => userIdSet.add(c.completed_by));
      // Also include users from all completions for streak
      allCompletions.forEach((c) => userIdSet.add(c.completed_by));

      // Also include all household members (even those with 0 completions)
      const { data: membersData } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", household.id);

      if (membersData) {
        membersData.forEach((m) => userIdSet.add(m.user_id));
      }

      if (userIdSet.size === 0) {
        setMemberStats([]);
        setLoading(false);
        return;
      }

      // Fetch profiles (two-query pattern)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIdSet));

      const profileMap: Record<string, Profile> = {};
      if (profilesData) {
        (profilesData as Profile[]).forEach((p) => {
          profileMap[p.id] = p;
        });
      }

      // Compute per-member stats
      const stats: MemberStats[] = [];

      for (const userId of userIdSet) {
        const displayName =
          profileMap[userId]?.display_name ?? "Unknown";

        // Count completions in period
        const completionCount = completions.filter(
          (c) => c.completed_by === userId
        ).length;

        // Calculate streak from all completions for this user
        const userAllCompletions = allCompletions
          .filter((c) => c.completed_by === userId)
          .sort(
            (a, b) =>
              new Date(b.completed_at).getTime() -
              new Date(a.completed_at).getTime()
          );
        const streak = calculateStreak(userAllCompletions);

        stats.push({
          userId,
          displayName,
          avatarUrl: profileMap[userId]?.avatar_url ?? null,
          completionCount,
          streak,
        });
      }

      // Sort by completion count (descending)
      stats.sort((a, b) => b.completionCount - a.completionCount);
      setMemberStats(stats);
      setLoading(false);
    },
    [household?.id]
  );

  // Wrap fetchData to bind current period
  const fetchCurrentPeriod = useCallback(async () => {
    await fetchData(period);
  }, [fetchData, period]);

  useCachedFetch(fetchCurrentPeriod, {
    staleTime: 30_000,
    deps: [household?.id, period],
  });

  // -------------------------------------------------------------------------
  // Period toggle
  // -------------------------------------------------------------------------

  const handlePeriodChange = useCallback(
    (newPeriod: TimePeriod) => {
      setPeriod(newPeriod);
      fetchData(newPeriod);
    },
    [fetchData]
  );

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  const maxCompletions = Math.max(
    ...memberStats.map((s) => s.completionCount),
    1
  );
  const periodLabel = period === "week" ? "week" : "month";

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period toggle */}
        <View className="mx-4 mt-4 flex-row overflow-hidden rounded-xl bg-gray-100 p-1">
          <Pressable
            className={`flex-1 items-center rounded-lg py-2.5 ${
              period === "week" ? "bg-white" : ""
            }`}
            style={
              period === "week"
                ? {
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                  }
                : undefined
            }
            onPress={() => handlePeriodChange("week")}
          >
            <Text
              className={`text-sm font-semibold ${
                period === "week" ? "text-gray-800" : "text-gray-500"
              }`}
            >
              This Week
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center rounded-lg py-2.5 ${
              period === "month" ? "bg-white" : ""
            }`}
            style={
              period === "month"
                ? {
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                  }
                : undefined
            }
            onPress={() => handlePeriodChange("month")}
          >
            <Text
              className={`text-sm font-semibold ${
                period === "month" ? "text-gray-800" : "text-gray-500"
              }`}
            >
              This Month
            </Text>
          </Pressable>
        </View>

        {/* Empty state */}
        {totalCompletions === 0 && (
          <View className="mx-4 mt-8 items-center rounded-card bg-transparent border border-neutral-border px-6 py-8">
            <Image
              source={require('@/docs/empty-state-images/chore-dashboard-stats.png')}
              style={{ width: 140, height: 140, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text className="text-base font-semibold text-gray-700">
              No chores completed this {periodLabel}
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Complete some chores to see stats here
            </Text>
          </View>
        )}

        {/* Member stats cards */}
        {memberStats.length > 0 && (
          <View className="mt-6">
            <Text className="mb-3 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              Member Contributions
            </Text>
            {memberStats.map((member) => {
              const barWidth =
                maxCompletions > 0
                  ? (member.completionCount / maxCompletions) * 100
                  : 0;
              const isCurrentUser = member.userId === user?.id;

              return (
                <View
                  key={member.userId}
                  className="mx-4 mb-3 rounded-card bg-transparent border border-neutral-border p-4"
                >
                  <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="mr-3">
                      <Avatar
                        userId={member.userId}
                        name={member.displayName}
                        size="md"
                        avatarUrl={member.avatarUrl}
                      />
                    </View>

                    {/* Name and streak */}
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">
                        {member.displayName}
                        {isCurrentUser ? " (you)" : ""}
                      </Text>
                      {member.streak > 0 && (
                        <View className="mt-0.5 flex-row items-center">
                          <Ionicons
                            name="flame-outline"
                            size={14}
                            color="#f97316"
                          />
                          <Text className="ml-1 text-xs text-orange-500">
                            {member.streak} streak
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Completion count */}
                    <Text className="text-2xl font-bold text-brand-dark">
                      {member.completionCount}
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                    <View
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${barWidth}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
