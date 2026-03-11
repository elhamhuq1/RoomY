import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Chore, Profile, ChoreCompletion, ChoreSwapRequest } from "@/lib/types/database";
import { format, isAfter, parseISO, differenceInDays, subHours } from "date-fns";

type ChoreWithAssignee = Chore & {
  assignee_profile?: Profile;
  is_overdue: boolean;
  overdue_days: number;
  is_disputed?: boolean;
  last_completion?: ChoreCompletion;
};

export default function ChoresScreen() {
  const { session, householdId } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chores, setChores] = useState<ChoreWithAssignee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, Profile>>({});
  const [streak, setStreak] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);

  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!householdId || !session?.user?.id) return;

    try {
      setLoading(true);

      // 1. Fetch household members and profiles
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
      const profileMap = profileData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, Profile>);
      setMemberProfiles(profileMap);

      // 2. Fetch chores and recent completions for disputes
      const { data: choresData, error: choresError } = await supabase
        .from("chores")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .order("next_due_at", { ascending: true });

      if (choresError) throw choresError;

      const { data: allCompletions, error: allCompletionsError } = await supabase
        .from("chore_completions")
        .select("*")
        .in("chore_id", choresData.map(c => c.id))
        .order("completed_at", { ascending: false });

      if (allCompletionsError) throw allCompletionsError;

      const now = new Date();
      const enrichedChores: ChoreWithAssignee[] = choresData.map((chore) => {
        const dueDate = parseISO(chore.next_due_at);
        const overdue = isAfter(now, dueDate);
        const days = overdue ? differenceInDays(now, dueDate) : 0;
        
        const lastComp = allCompletions.find(c => c.chore_id === chore.id && !c.is_reverted);
        
        return {
          ...chore,
          assignee_profile: chore.current_assignee ? profileMap[chore.current_assignee] : undefined,
          is_overdue: overdue,
          overdue_days: days,
          is_disputed: lastComp?.is_disputed,
          last_completion: lastComp,
        };
      });

      setChores(enrichedChores);

      // 3. Stats
      setPendingCount(enrichedChores.filter(c => c.current_assignee === session.user.id).length);
      setOverdueCount(enrichedChores.filter(c => c.is_overdue).length);

      // 4. Streak
      const { data: userCompletions, error: userCompletionsError } = await supabase
        .from("chore_completions")
        .select("*")
        .eq("completed_by", session.user.id)
        .order("completed_at", { ascending: false });

      if (userCompletionsError) throw userCompletionsError;

      let currentStreak = 0;
      for (const comp of userCompletions) {
        if (comp.is_reverted) break;
        currentStreak++;
      }
      setStreak(currentStreak);

      // 5. Swap requests count
      const { count, error: countError } = await supabase
        .from("chore_swap_requests")
        .select("*", { count: "exact", head: true })
        .eq("requested_to", session.user.id)
        .eq("status", "pending");
      
      setPendingSwapsCount(count || 0);

      // 6. Client-side fallback check for stale disputes
      const staleDisputes = allCompletions.filter(c => 
        c.is_disputed && 
        !c.is_reverted && 
        isAfter(subHours(now, 24), parseISO(c.disputed_at!))
      );
      
      if (staleDisputes.length > 0) {
        await supabase
          .from("chore_completions")
          .update({ is_reverted: true, reverted_at: now.toISOString() })
          .in("id", staleDisputes.map(d => d.id));
        fetchData(); // Refetch if we auto-reverted
      }

    } catch (error) {
      console.error("Error fetching chores:", error);
      Alert.alert("Error", "Failed to load chores.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleComplete = async (choreId: string) => {
    if (!session?.user?.id) return;

    Alert.alert(
      "Mark Complete?",
      "This chore will be marked as done and rotate to the next person.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const { error } = await supabase.rpc("complete_chore", {
                p_chore_id: choreId,
                p_completed_by: session.user.id,
              });

              if (error) throw error;
              fetchData();
            } catch (error) {
              console.error("Error completing chore:", error);
              Alert.alert("Error", "Failed to complete chore.");
            }
          },
        },
      ]
    );
  };

  const handleClaim = async (choreId: string) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase.rpc("claim_chore", {
        p_chore_id: choreId,
        p_claimed_by: session.user.id,
      });

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error claiming chore:", error);
      Alert.alert("Error", "Failed to claim chore. Are you in the rotation?");
    }
  };

  const handleDispute = async (completionId: string) => {
    if (!session?.user?.id) return;

    Alert.alert(
      "Dispute Completion?",
      "Flag the last completion as not actually done. If unresolved within 24 hours, it will be automatically reverted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dispute",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.rpc("dispute_completion", {
                p_completion_id: completionId,
                p_disputed_by: session.user.id,
              });

              if (error) throw error;
              fetchData();
            } catch (error) {
              console.error("Error disputing completion:", error);
              Alert.alert("Error", "Failed to dispute completion.");
            }
          },
        },
      ]
    );
  };

  const openSwapModal = (choreId: string) => {
    setSelectedChoreId(choreId);
    setSwapModalVisible(true);
  };

  const requestSwap = async (targetUserId: string) => {
    if (!selectedChoreId || !session?.user?.id) return;

    try {
      const { error } = await supabase.from("chore_swap_requests").insert({
        chore_id: selectedChoreId,
        requested_by: session.user.id,
        requested_to: targetUserId,
      });

      if (error) throw error;

      setSwapModalVisible(false);
      Alert.alert("Request Sent", "A swap request has been sent.");
    } catch (error) {
      console.error("Error requesting swap:", error);
      Alert.alert("Error", "Failed to send swap request.");
    }
  };

  const myChores = useMemo(() => chores.filter(c => c.current_assignee === session?.user?.id), [chores, session?.user?.id]);
  const otherChores = useMemo(() => chores.filter(c => c.current_assignee !== session?.user?.id), [chores, session?.user?.id]);

  const suggestedChores = [
    { name: "Dishes", icon: "restaurant-outline" as const },
    { name: "Take out trash", icon: "trash-outline" as const },
    { name: "Vacuum", icon: "home-outline" as const },
    { name: "Clean bathroom", icon: "water-outline" as const },
    { name: "Mop floors", icon: "grid-outline" as const },
    { name: "Wipe counters", icon: "hand-left-outline" as const },
    { name: "Laundry", icon: "shirt-outline" as const },
  ];

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
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Header */}
        <View className="flex-row justify-between px-4 py-4">
          <View className="flex-1 items-center rounded-xl bg-primary-100 p-3 mx-1 shadow-sm">
            <Text className="text-xl font-bold text-primary-900">{pendingCount}</Text>
            <Text className="text-xs text-primary-700">Pending</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-red-100 p-3 mx-1 shadow-sm">
            <Text className="text-xl font-bold text-red-900">{overdueCount}</Text>
            <Text className="text-xs text-red-700">Overdue</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-amber-100 p-3 mx-1 shadow-sm">
            <Text className="text-xl font-bold text-amber-900">{streak}</Text>
            <Text className="text-xs text-amber-700">Streak</Text>
          </View>
        </View>

        {chores.length === 0 ? (
          <View className="px-6 py-10 items-center">
            <Text className="text-xl font-bold text-gray-800">No chores yet!</Text>
            <Text className="mt-2 text-center text-gray-500">
              Add some chores to keep your home running smoothly
            </Text>

            <View className="mt-8 flex-row flex-wrap justify-center">
              {suggestedChores.map((suggested, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push({ pathname: "/chores/add", params: { suggestedName: suggested.name } })}
                  className="m-2 w-[44%] items-center rounded-xl bg-white p-4 shadow-sm"
                >
                  <Ionicons name={suggested.icon} size={32} color="#f9a825" />
                  <Text className="mt-2 text-center font-medium text-gray-700">{suggested.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.push("/chores/add")}
              className="mt-6 flex-row items-center rounded-full bg-primary-500 px-6 py-3"
            >
              <Ionicons name="add" size={24} color="white" />
              <Text className="ml-2 font-bold text-white">Create custom chore</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4">
            {myChores.length > 0 && (
              <View className="mb-6">
                <Text className="mb-3 text-lg font-bold text-gray-800">My Chores</Text>
                {myChores.map((chore) => (
                  <ChoreRow 
                    key={chore.id} 
                    chore={chore} 
                    onComplete={handleComplete} 
                    onClaim={handleClaim} 
                    onDispute={handleDispute}
                    onSwap={openSwapModal}
                    isMine={true} 
                    currentUserId={session?.user?.id || ""}
                  />
                ))}
              </View>
            )}

            {otherChores.length > 0 && (
              <View className="mb-6">
                <Text className="mb-3 text-lg font-bold text-gray-800">Household Chores</Text>
                {otherChores.map((chore) => (
                  <ChoreRow 
                    key={chore.id} 
                    chore={chore} 
                    onComplete={handleComplete} 
                    onClaim={handleClaim} 
                    onDispute={handleDispute}
                    onSwap={openSwapModal}
                    isMine={false} 
                    currentUserId={session?.user?.id || ""}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/chores/add")}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-primary-500 shadow-lg"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Swap Request Count Badge Overlay on Header Icon handled in _layout.tsx via navigation params or similar?
          Actually the plan says "Show a badge count on the swap/dashboard icon in the header" 
          I'll need to use navigation.setOptions in a useFocusEffect or pass it up. */}

      {/* Swap Modal */}
      <Modal
        visible={swapModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-6 pb-12">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">Request Chore Swap</Text>
              <TouchableOpacity onPress={() => setSwapModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text className="mb-6 text-gray-500">Who would you like to swap this chore with?</Text>
            
            <ScrollView className="max-h-80">
              {profiles.filter(p => p.id !== session?.user?.id).map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  onPress={() => requestSwap(profile.id)}
                  className="mb-3 flex-row items-center rounded-2xl bg-surface-50 p-4"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Text className="font-bold text-primary-700">
                      {profile.display_name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text className="ml-3 font-medium text-gray-800">{profile.display_name}</Text>
                  <View className="flex-1" />
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChoreRow({
  chore,
  onComplete,
  onClaim,
  onDispute,
  onSwap,
  isMine,
  currentUserId,
}: {
  chore: ChoreWithAssignee;
  onComplete: (id: string) => void;
  onClaim: (id: string) => void;
  onDispute: (completionId: string) => void;
  onSwap: (id: string) => void;
  isMine: boolean;
  currentUserId: string;
}) {
  const lastCompByUser = chore.last_completion?.completed_by === currentUserId;

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-lg font-bold text-gray-800">{chore.name}</Text>
            {chore.is_overdue && (
              <View className="ml-2 rounded-full bg-red-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-red-600 uppercase">
                  {chore.overdue_days}d overdue
                </Text>
              </View>
            )}
            {chore.is_disputed && (
              <View className="ml-2 rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-amber-600 uppercase">
                  Disputed
                </Text>
              </View>
            )}
          </View>
          {chore.is_disputed && lastCompByUser && (
            <Text className="mt-1 text-[10px] text-amber-600 font-medium">
              Your last completion was disputed
            </Text>
          )}
          <View className="mt-1 flex-row items-center">
            <View className="h-5 w-5 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-[10px] font-bold text-primary-700">
                {chore.assignee_profile?.display_name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <Text className="ml-1.5 text-xs text-gray-500">
              {isMine ? "You" : chore.assignee_profile?.display_name || "Unassigned"}
            </Text>
            <View className="mx-2 h-1 w-1 rounded-full bg-gray-300" />
            <Text className="text-xs text-gray-500 capitalize">{chore.frequency}</Text>
          </View>
          <Text className="mt-1 text-xs font-medium text-gray-400">
            Due {format(parseISO(chore.next_due_at), "MMM d")}
          </Text>
        </View>

        <View className="flex-row">
          {isMine && (
            <TouchableOpacity
              onPress={() => onSwap(chore.id)}
              className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-surface-50 border border-gray-100"
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
          {chore.last_completion && !lastCompByUser && !chore.is_disputed && (
            <TouchableOpacity
              onPress={() => onDispute(chore.last_completion!.id)}
              className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-surface-50 border border-gray-100"
            >
              <Ionicons name="flag-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
          {!isMine && (
            <TouchableOpacity
              onPress={() => onClaim(chore.id)}
              className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-surface-50 border border-gray-100"
            >
              <Ionicons name="hand-left-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onComplete(chore.id)}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary-100"
          >
            <Ionicons name="checkmark" size={20} color="#f9a825" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
