import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile, Chore, ChoreSwapRequest } from "@/lib/types/database";

type SwapWithDetails = ChoreSwapRequest & {
  chore: Chore;
  requester?: Profile;
  target?: Profile;
};

export default function SwapRequestsScreen() {
  const { session, household } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incoming, setIncoming] = useState<SwapWithDetails[]>([]);
  const [outgoing, setOutgoing] = useState<SwapWithDetails[]>([]);

  const fetchData = useCallback(async () => {
    if (!household?.id || !session?.user?.id) return;

    try {
      setLoading(true);

      // 1. Fetch swap requests for the household
      const { data: requests, error: requestsError } = await supabase
        .from("chore_swap_requests")
        .select(`
          *,
          chore:chores(*)
        `)
        .eq("chore.household_id", household.id);

      if (requestsError) throw requestsError;

      // 2. Fetch profiles for everyone involved
      const userIds = Array.from(new Set(requests.flatMap(r => [r.requested_by, r.requested_to])));
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, Profile>);

      const enrichedRequests: SwapWithDetails[] = requests.map(r => ({
        ...r,
        requester: profileMap[r.requested_by],
        target: profileMap[r.requested_to],
      }));

      setIncoming(enrichedRequests.filter(r => r.requested_to === session.user.id && r.status === "pending"));
      setOutgoing(enrichedRequests.filter(r => r.requested_by === session.user.id));

    } catch (error) {
      console.error("Error fetching swap requests:", error);
      Alert.alert("Error", "Failed to load swap requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [household?.id, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleResolve = async (requestId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase.rpc("resolve_swap_request", {
        p_request_id: requestId,
        p_status: status,
      });

      if (error) throw error;
      fetchData();
      Alert.alert(status === "accepted" ? "Swap Accepted" : "Swap Declined");
    } catch (error) {
      console.error("Error resolving swap request:", error);
      Alert.alert("Error", "Failed to resolve swap request.");
    }
  };

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
        <View className="px-6 py-6">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
            Incoming Requests
          </Text>
          {incoming.length === 0 ? (
            <View className="rounded-2xl bg-white p-6 shadow-sm">
              <Text className="text-center text-gray-500">No pending incoming requests</Text>
            </View>
          ) : (
            incoming.map((request) => (
              <View key={request.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      Swap: {request.chore.name}
                    </Text>
                    <Text className="mt-1 text-sm text-gray-500">
                      From: {request.requester?.display_name}
                    </Text>
                  </View>
                </View>
                <View className="mt-4 flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => handleResolve(request.id, "declined")}
                    className="mr-3 rounded-full bg-gray-100 px-6 py-2"
                  >
                    <Text className="font-bold text-gray-600">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleResolve(request.id, "accepted")}
                    className="rounded-full bg-primary-500 px-6 py-2"
                  >
                    <Text className="font-bold text-white">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <Text className="mb-4 mt-8 text-sm font-bold uppercase tracking-wider text-gray-400">
            Outgoing Requests
          </Text>
          {outgoing.length === 0 ? (
            <View className="rounded-2xl bg-white p-6 shadow-sm">
              <Text className="text-center text-gray-500">No outgoing requests</Text>
            </View>
          ) : (
            outgoing.map((request) => (
              <View key={request.id} className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <View>
                  <Text className="font-bold text-gray-800">{request.chore.name}</Text>
                  <Text className="text-xs text-gray-500">To: {request.target?.display_name}</Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${
                  request.status === "accepted" ? "bg-green-100" : 
                  request.status === "declined" ? "bg-red-100" : "bg-primary-50"
                }`}>
                  <Text className={`text-[10px] font-bold uppercase ${
                    request.status === "accepted" ? "text-green-600" : 
                    request.status === "declined" ? "text-red-600" : "text-primary-600"
                  }`}>
                    {request.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
