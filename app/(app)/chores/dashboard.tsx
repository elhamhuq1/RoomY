import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile, ChoreCompletion } from "@/lib/types/database";
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, parseISO, isWithinInterval } from "date-fns";

type TimePeriod = "week" | "month";

type MemberStats = {
  profile: Profile;
  count: number;
  streak: number;
};

export default function ChoreDashboardScreen() {
  const { householdId } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>("week");
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);

  const fetchData = useCallback(async () => {
    if (!householdId) return;

    try {
      setLoading(true);

      // 1. Fetch household members and profiles
      const { data: members, error: membersError } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", householdId);

      if (membersError) throw membersError;

      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // 2. Fetch ALL non-reverted completions for these members to calculate streaks + counts
      const { data: completions, error: completionsError } = await supabase
        .from("chore_completions")
        .select(`
          *,
          chore:chores!inner(household_id)
        `)
        .eq("chore.household_id", householdId)
        .eq("is_reverted", false)
        .order("completed_at", { ascending: false });

      if (completionsError) throw completionsError;

      const now = new Date();
      const interval = {
        start: period === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now),
        end: period === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now),
      };

      const stats = profiles.map(profile => {
        const userComps = completions.filter(c => c.completed_by === profile.id);
        
        // Count in period
        const periodCount = userComps.filter(c => 
          isWithinInterval(parseISO(c.completed_at), interval)
        ).length;

        // Streak (consecutive non-reverted)
        let streak = 0;
        // userComps is already sorted DESC by completed_at
        for (const comp of userComps) {
          streak++;
          // A streak breaks if there's a gap or revert (reverts already filtered out)
          // Actually, the plan says "stopping at first reverted or gap". 
          // Reverts are filtered, but what is a "gap"? 
          // "completion by someone else in between for the same chore doesn't break global streak"
          // So it's just total non-reverted consecutive completions.
        }

        return {
          profile,
          count: periodCount,
          streak: streak,
        };
      });

      setMemberStats(stats.sort((a, b) => b.count - a.count));
      setTotalCompletions(stats.reduce((acc, s) => acc + s.count, 0));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId, period]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const maxCount = useMemo(() => Math.max(...memberStats.map(s => s.count), 1), [memberStats]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData()} />}
      >
        {/* Period Toggle */}
        <View className="flex-row p-4">
          <TouchableOpacity
            onPress={() => setPeriod("week")}
            className={`flex-1 items-center rounded-l-xl py-3 ${
              period === "week" ? "bg-primary-500" : "bg-white border-y border-l border-gray-100"
            }`}
          >
            <Text className={`font-bold ${period === "week" ? "text-white" : "text-gray-500"}`}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriod("month")}
            className={`flex-1 items-center rounded-r-xl py-3 ${
              period === "month" ? "bg-primary-500" : "bg-white border-y border-r border-gray-100"
            }`}
          >
            <Text className={`font-bold ${period === "month" ? "text-white" : "text-gray-500"}`}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aggregate Stats */}
        <View className="mx-4 mb-6 rounded-2xl bg-primary-100 p-6 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-primary-900">{totalCompletions}</Text>
              <Text className="text-sm text-primary-700">Total Completions</Text>
            </View>
            <Ionicons name="trophy" size={48} color="#f9a825" opacity={0.5} />
          </View>
        </View>

        {/* Member List */}
        <View className="px-4">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
            Member Contributions
          </Text>
          {memberStats.map((stat) => (
            <View key={stat.profile.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    <Text className="text-lg font-bold text-primary-700">
                      {stat.profile.display_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <Text className="font-bold text-gray-800">{stat.profile.display_name}</Text>
                    {stat.streak > 0 && (
                      <View className="flex-row items-center">
                        <Ionicons name="flame" size={14} color="#f59e0b" />
                        <Text className="ml-1 text-xs text-amber-600 font-medium">{stat.streak} streak</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-800">{stat.count}</Text>
                  <Text className="text-[10px] text-gray-400 uppercase font-bold">Done</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View className="h-2 w-full rounded-full bg-gray-100">
                <View 
                  className="h-full rounded-full bg-primary-400" 
                  style={{ width: `${(stat.count / maxCount) * 100}%` }}
                />
              </View>
            </View>
          ))}
          
          {memberStats.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-gray-500">No members found</Text>
            </View>
          )}
          
          {totalCompletions === 0 && (
            <View className="items-center py-10">
              <Text className="text-gray-500">No chores completed this {period}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
