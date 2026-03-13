import { colors } from "@/lib/theme/colors";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui";
import { Card } from "@/components/ui";
import type { ChoreCompletion, Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function hoursRemaining(disputedAt: string): number {
  const disputed = new Date(disputedAt).getTime();
  const deadline = disputed + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60)));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DisputeData {
  completion: ChoreCompletion;
  choreName: string;
  completedByProfile: Profile | null;
  disputedByProfile: Profile | null;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DisputeScreen() {
  const { completionId } = useLocalSearchParams<{ completionId: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [data, setData] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!completionId) return;

    // Fetch the completion with chore name
    const { data: completionData, error } = await supabase
      .from("chore_completions")
      .select("*, chores!inner(name)")
      .eq("id", completionId)
      .single();

    if (error || !completionData) {
      setLoading(false);
      return;
    }

    const completion = completionData as ChoreCompletion & {
      chores: { name: string };
    };

    // Fetch profiles for both parties
    const userIds = [completion.completed_by];
    if (completion.disputed_by) userIds.push(completion.disputed_by);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const profiles = (profilesData ?? []) as Profile[];
    const completedByProfile =
      profiles.find((p) => p.id === completion.completed_by) ?? null;
    const disputedByProfile = completion.disputed_by
      ? profiles.find((p) => p.id === completion.disputed_by) ?? null
      : null;

    setData({
      completion: {
        id: completion.id,
        chore_id: completion.chore_id,
        completed_by: completion.completed_by,
        completed_at: completion.completed_at,
        is_disputed: completion.is_disputed,
        disputed_by: completion.disputed_by,
        disputed_at: completion.disputed_at,
        dispute_reason: completion.dispute_reason,
        is_reverted: completion.is_reverted,
        reverted_at: completion.reverted_at,
      },
      choreName: completion.chores?.name ?? "Unknown chore",
      completedByProfile,
      disputedByProfile,
    });

    setLoading(false);
  }, [completionId]);

  useCachedFetch(fetchData, {
    staleTime: 30_000,
    deps: [completionId],
  });

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleResolve = useCallback(
    (action: "accept" | "dismiss") => {
      if (!user?.id || !completionId) return;

      const title =
        action === "accept" ? "Accept Dispute?" : "Dismiss Dispute?";
      const message =
        action === "accept"
          ? "This will revert the completion. The chore will need to be done again."
          : "This will dismiss the dispute and keep the completion as valid.";
      const buttonText = action === "accept" ? "Accept" : "Dismiss";
      const buttonStyle = action === "accept" ? "destructive" : "default";

      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: buttonText,
          style: buttonStyle as "destructive" | "default",
          onPress: async () => {
            setResolving(action);
            const { error } = await supabase.rpc("resolve_dispute", {
              p_completion_id: completionId,
              p_resolved_by: user.id,
              p_action: action,
            });
            setResolving(null);

            if (error) {
              Alert.alert("Error", `Failed to ${action} dispute.`);
            } else {
              Alert.alert(
                action === "accept" ? "Dispute Accepted" : "Dispute Dismissed",
                action === "accept"
                  ? "The completion has been reverted."
                  : "The dispute has been dismissed. The completion stands.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            }
          },
        },
      ]);
    },
    [user?.id, completionId, router]
  );

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

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-8">
        <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
        <Text className="text-lg font-bold text-gray-800 mt-3">
          Dispute not found
        </Text>
        <Text className="text-sm text-gray-500 mt-1 text-center">
          This dispute may have already been resolved.
        </Text>
      </View>
    );
  }

  const { completion, choreName, completedByProfile, disputedByProfile } = data;
  const isCompletedByMe = completion.completed_by === user?.id;
  const isDisputedByMe = completion.disputed_by === user?.id;
  const isResolved = completion.is_reverted || !completion.is_disputed;
  const hrsLeft = completion.disputed_at
    ? hoursRemaining(completion.disputed_at)
    : 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <Card className="mx-4 mt-4">
          <View className="items-center">
            <View className="h-14 w-14 rounded-full bg-red-100 items-center justify-center mb-3">
              <Ionicons name="flag" size={28} color="#EF4444" />
            </View>
            <Text className="text-xl font-bold text-gray-800">{choreName}</Text>
            <Text className="text-sm text-gray-400 mt-1">Dispute Details</Text>
          </View>
        </Card>

        {/* Timeline */}
        <View className="mx-4 mt-4">
          <Text className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-3 px-1">
            Timeline
          </Text>
          <Card className="p-0 overflow-hidden">
            {/* Completed event */}
            <View className="flex-row items-start px-4 py-3 border-b border-gray-100">
              <View className="h-8 w-8 rounded-full bg-green-100 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="checkmark" size={16} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">
                  Marked as complete
                </Text>
                <View className="flex-row items-center mt-1">
                  {completedByProfile && (
                    <View className="mr-2">
                      <Avatar
                        userId={completedByProfile.id}
                        name={completedByProfile.display_name}
                        size="xs"
                      />
                    </View>
                  )}
                  <Text className="text-xs text-gray-500">
                    {isCompletedByMe
                      ? "You"
                      : completedByProfile?.display_name ?? "Unknown"}
                    {" -- "}
                    {formatDate(completion.completed_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Disputed event */}
            <View className="flex-row items-start px-4 py-3">
              <View className="h-8 w-8 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="flag" size={16} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">
                  Disputed
                </Text>
                <View className="flex-row items-center mt-1">
                  {disputedByProfile && (
                    <View className="mr-2">
                      <Avatar
                        userId={disputedByProfile.id}
                        name={disputedByProfile.display_name}
                        size="xs"
                      />
                    </View>
                  )}
                  <Text className="text-xs text-gray-500">
                    {isDisputedByMe
                      ? "You"
                      : disputedByProfile?.display_name ?? "Unknown"}
                    {completion.disputed_at
                      ? ` -- ${formatDate(completion.disputed_at)}`
                      : ""}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Dispute reason */}
        {completion.dispute_reason && (
          <View className="mx-4 mt-4">
            <Text className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-3 px-1">
              Reason
            </Text>
            <Card>
              <View className="flex-row items-start">
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color="#6B7280"
                  style={{ marginRight: 10, marginTop: 2 }}
                />
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  {completion.dispute_reason}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                {isDisputedByMe
                  ? "You"
                  : disputedByProfile?.display_name ?? "Unknown"}{" "}
                {completion.disputed_at ? `-- ${timeAgo(completion.disputed_at)}` : ""}
              </Text>
            </Card>
          </View>
        )}

        {/* Status / countdown */}
        {!isResolved && completion.disputed_at && (
          <View className="mx-4 mt-4">
            <Card
              className={`flex-row items-center ${
                hrsLeft <= 6 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              }`}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={hrsLeft <= 6 ? "#EF4444" : "#F59E0B"}
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  hrsLeft <= 6 ? "text-red-700" : "text-amber-700"
                }`}
              >
                {hrsLeft > 0
                  ? `Auto-reverts in ${hrsLeft} hour${hrsLeft !== 1 ? "s" : ""} if unresolved`
                  : "Auto-revert deadline reached"}
              </Text>
            </Card>
          </View>
        )}

        {/* Resolution actions */}
        {!isResolved && isCompletedByMe && (
          <View className="mx-4 mt-6">
            <Text className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-3 px-1">
              Your Response
            </Text>
            <Text className="text-sm text-gray-500 mb-4 px-1">
              Your completion was disputed. You can accept the dispute (completion
              will be reverted) or dismiss it (completion stands).
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl bg-red-500 py-3.5 active:bg-red-600"
                onPress={() => handleResolve("accept")}
                disabled={resolving !== null}
              >
                {resolving === "accept" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text className="text-sm font-bold text-white ml-1.5">
                      Accept Dispute
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-gray-100 py-3.5 active:bg-gray-200"
                onPress={() => handleResolve("dismiss")}
                disabled={resolving !== null}
              >
                {resolving === "dismiss" ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="close-circle" size={18} color="#6B7280" />
                    <Text className="text-sm font-bold text-gray-600 ml-1.5">
                      Dismiss
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Informational for disputer */}
        {!isResolved && isDisputedByMe && (
          <View className="mx-4 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="ml-2 text-sm text-blue-700 flex-1">
                  Waiting for{" "}
                  {completedByProfile?.display_name ?? "the other person"} to
                  respond. If unresolved within 24 hours, the completion will be
                  automatically reverted.
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Resolved state */}
        {isResolved && (
          <View className="mx-4 mt-6">
            <Card
              className={`items-center ${
                completion.is_reverted
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <Ionicons
                name={
                  completion.is_reverted
                    ? "close-circle"
                    : "checkmark-circle"
                }
                size={32}
                color={completion.is_reverted ? "#EF4444" : "#22C55E"}
              />
              <Text
                className={`text-base font-bold mt-2 ${
                  completion.is_reverted ? "text-red-700" : "text-green-700"
                }`}
              >
                {completion.is_reverted
                  ? "Completion Reverted"
                  : "Dispute Dismissed"}
              </Text>
              <Text className="text-sm text-gray-500 mt-1 text-center">
                {completion.is_reverted
                  ? "The dispute was accepted and the completion was reverted."
                  : "The dispute was dismissed. The completion stands as valid."}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
