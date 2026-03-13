import { colors } from "@/lib/theme/colors";
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
import { useSession } from "@/lib/auth-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import { supabase } from "@/lib/supabase";
import type {
  Chore,
  ChoreSwapRequest,
  Profile,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwapRequestWithDetails extends ChoreSwapRequest {
  choreName: string;
  otherPersonName: string;
  otherPersonId: string;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SwapRequestScreen() {
  const { user, household } = useSession();

  const [incoming, setIncoming] = useState<SwapRequestWithDetails[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!household?.id || !user?.id) return;

    // Fetch all swap requests for this household's chores
    const { data: choresData } = await supabase
      .from("chores")
      .select("id, name")
      .eq("household_id", household.id);

    if (!choresData || choresData.length === 0) {
      setLoading(false);
      return;
    }

    const choreMap: Record<string, string> = {};
    choresData.forEach((c) => {
      choreMap[c.id] = c.name;
    });
    const choreIds = choresData.map((c) => c.id);

    // Fetch swap requests for these chores
    const { data: requestsData } = await supabase
      .from("chore_swap_requests")
      .select("*")
      .in("chore_id", choreIds)
      .order("created_at", { ascending: false });

    if (!requestsData || requestsData.length === 0) {
      setIncoming([]);
      setOutgoing([]);
      setLoading(false);
      return;
    }

    const requests = requestsData as ChoreSwapRequest[];

    // Gather unique user IDs for profile fetching (two-query pattern)
    const userIdSet = new Set<string>();
    requests.forEach((r) => {
      userIdSet.add(r.requested_by);
      userIdSet.add(r.requested_to);
    });

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

    // Separate into incoming and outgoing
    const incomingRequests: SwapRequestWithDetails[] = [];
    const outgoingRequests: SwapRequestWithDetails[] = [];

    requests.forEach((r) => {
      const choreName = choreMap[r.chore_id] ?? "Unknown chore";

      if (r.requested_to === user.id) {
        incomingRequests.push({
          ...r,
          choreName,
          otherPersonName:
            profileMap[r.requested_by]?.display_name ?? "Unknown",
          otherPersonId: r.requested_by,
        });
      }

      if (r.requested_by === user.id) {
        outgoingRequests.push({
          ...r,
          choreName,
          otherPersonName:
            profileMap[r.requested_to]?.display_name ?? "Unknown",
          otherPersonId: r.requested_to,
        });
      }
    });

    setIncoming(incomingRequests);
    setOutgoing(outgoingRequests);
    setLoading(false);
  }, [household?.id, user?.id]);

  const { refresh: refreshSwaps } = useCachedFetch(fetchData, {
    staleTime: 30_000,
    deps: [household?.id, user?.id],
  });

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleResolve = useCallback(
    async (requestId: string, status: "accepted" | "declined") => {
      setResolvingId(requestId);
      const { error } = await supabase.rpc("resolve_swap_request", {
        p_request_id: requestId,
        p_status: status,
      });
      setResolvingId(null);

      if (error) {
        console.error("[SwapRequest] resolve_swap_request error:", error);
        Alert.alert("Error", `Failed to ${status === "accepted" ? "accept" : "decline"} swap request.`);
      } else {
        refreshSwaps();
      }
    },
    [refreshSwaps]
  );

  // -------------------------------------------------------------------------
  // Status badge helper
  // -------------------------------------------------------------------------

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <View className="rounded-full bg-amber-100 px-2.5 py-0.5">
            <Text className="text-xs font-medium text-amber-700">Pending</Text>
          </View>
        );
      case "accepted":
        return (
          <View className="rounded-full bg-green-100 px-2.5 py-0.5">
            <Text className="text-xs font-medium text-green-700">Accepted</Text>
          </View>
        );
      case "declined":
        return (
          <View className="rounded-full bg-red-100 px-2.5 py-0.5">
            <Text className="text-xs font-medium text-red-700">Declined</Text>
          </View>
        );
      default:
        return null;
    }
  }

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
  // Empty state
  // -------------------------------------------------------------------------

  const hasNoRequests = incoming.length === 0 && outgoing.length === 0;

  if (hasNoRequests) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <Ionicons name="swap-horizontal" size={32} color="#9333ea" />
        </View>
        <Text className="text-lg font-bold text-gray-800">
          No swap requests
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
          When you or a housemate requests to swap a chore, it will appear here.
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  const pendingIncoming = incoming.filter((r) => r.status === "pending");

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Incoming requests */}
        {incoming.length > 0 && (
          <View className="mt-4">
            <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              Incoming ({pendingIncoming.length} pending)
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl">
              {incoming.map((request, index) => {
                const isResolving = resolvingId === request.id;
                const isPending = request.status === "pending";

                return (
                  <View
                    key={request.id}
                    className={`bg-white px-4 py-3.5 ${
                      index < incoming.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            AVATAR_COLORS[
                              request.otherPersonId.charCodeAt(0) %
                                AVATAR_COLORS.length
                            ],
                        }}
                      >
                        <Text className="text-xs font-bold text-white">
                          {getInitials(request.otherPersonName)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold text-gray-800"
                          numberOfLines={1}
                        >
                          {request.choreName}
                        </Text>
                        <Text className="mt-0.5 text-xs text-gray-400">
                          From {request.otherPersonName}
                        </Text>
                      </View>
                      {!isPending && getStatusBadge(request.status)}
                    </View>

                    {/* Accept / Decline buttons for pending incoming */}
                    {isPending && (
                      <View className="mt-3 flex-row gap-3">
                        <Pressable
                          className="flex-1 items-center rounded-xl bg-green-500 py-2.5 active:bg-green-600"
                          onPress={() => handleResolve(request.id, "accepted")}
                          disabled={isResolving}
                        >
                          {isResolving ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-sm font-bold text-white">
                              Accept
                            </Text>
                          )}
                        </Pressable>
                        <Pressable
                          className="flex-1 items-center rounded-xl bg-gray-100 py-2.5 active:bg-gray-200"
                          onPress={() => handleResolve(request.id, "declined")}
                          disabled={isResolving}
                        >
                          {isResolving ? (
                            <ActivityIndicator size="small" color="#6b7280" />
                          ) : (
                            <Text className="text-sm font-bold text-gray-600">
                              Decline
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <View className="mt-6">
            <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              Outgoing
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl">
              {outgoing.map((request, index) => (
                <View
                  key={request.id}
                  className={`flex-row items-center bg-white px-4 py-3.5 ${
                    index < outgoing.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <View
                    className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        AVATAR_COLORS[
                          request.otherPersonId.charCodeAt(0) %
                            AVATAR_COLORS.length
                        ],
                    }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {getInitials(request.otherPersonName)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-gray-800"
                      numberOfLines={1}
                    >
                      {request.choreName}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      To {request.otherPersonName}
                    </Text>
                  </View>
                  {getStatusBadge(request.status)}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
