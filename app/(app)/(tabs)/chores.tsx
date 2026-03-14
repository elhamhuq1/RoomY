import { colors } from "@/lib/theme/colors";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui";
import { Card } from "@/components/ui";
import { StatsRow, ChoreRow, EmptyState } from "@/components/chores";
import type {
  Chore,
  ChoreCompletion,
  ChoreSwapRequest,
  Profile,
} from "@/lib/types/database";

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

function calculatePersonalBest(completions: ChoreCompletion[]): number {
  let current = 0;
  let best = 0;
  for (const c of completions) {
    if (c.is_reverted) {
      current = 0;
    } else {
      current++;
      best = Math.max(best, current);
    }
  }
  return best;
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
  const [disputedChoreIds, setDisputedChoreIds] = useState<Set<string>>(new Set());
  const [disputedByMeChoreIds, setDisputedByMeChoreIds] = useState<Set<string>>(new Set());
  // Map chore_id -> completion details for disputed completions
  const [disputeDetails, setDisputeDetails] = useState<Record<string, ChoreCompletion>>({});
  const [pendingSwapCount, setPendingSwapCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [swapModalChoreId, setSwapModalChoreId] = useState<string | null>(null);
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  // Dispute reason modal
  const [disputeReasonModal, setDisputeReasonModal] = useState<{
    visible: boolean;
    choreId: string | null;
    completionId: string | null;
  }>({ visible: false, choreId: null, completionId: null });
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

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

    // Fetch disputed completions (active, non-reverted) for badge display
    if (choresData && choresData.length > 0) {
      const choreIds = (choresData as Chore[]).map((c) => c.id);
      const { data: disputedData } = await supabase
        .from("chore_completions")
        .select("*")
        .in("chore_id", choreIds)
        .eq("is_disputed", true)
        .eq("is_reverted", false);

      if (disputedData) {
        const disputedSet = new Set<string>();
        const disputedByMeSet = new Set<string>();
        const detailsMap: Record<string, ChoreCompletion> = {};
        (disputedData as ChoreCompletion[]).forEach((d) => {
          disputedSet.add(d.chore_id);
          detailsMap[d.chore_id] = d;
          if (d.completed_by === user.id) {
            disputedByMeSet.add(d.chore_id);
          }
        });
        setDisputedChoreIds(disputedSet);
        setDisputedByMeChoreIds(disputedByMeSet);
        setDisputeDetails(detailsMap);
      }
    }

    // Client-side dispute revert check (fallback if pg_cron unavailable)
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: staleDisputes } = await supabase
      .from("chore_completions")
      .select("id")
      .eq("is_disputed", true)
      .eq("is_reverted", false)
      .lt("disputed_at", twentyFourHoursAgo);

    if (staleDisputes && staleDisputes.length > 0) {
      // Revert stale disputes
      const staleIds = staleDisputes.map((d) => d.id);
      await supabase
        .from("chore_completions")
        .update({ is_reverted: true, reverted_at: new Date().toISOString() })
        .in("id", staleIds);
    }

    // Fetch pending swap request count for current user
    const { count: swapCount } = await supabase
      .from("chore_swap_requests")
      .select("*", { count: "exact", head: true })
      .eq("requested_to", user.id)
      .eq("status", "pending");

    setPendingSwapCount(swapCount ?? 0);

    setLoading(false);
  }, [household?.id, user?.id]);

  // Refetch on screen focus (cached - skips if data is < 30s old)
  const { refresh: refreshChores } = useCachedFetch(fetchData, {
    staleTime: 30_000,
    deps: [household?.id, user?.id],
  });

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
                setTimeout(() => refreshChores(), 400);
              }
            },
          },
        ]
      );
    },
    [user?.id, refreshChores]
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
        refreshChores();
      }
    },
    [user?.id, refreshChores]
  );

  const handleDispute = useCallback(
    async (choreId: string) => {
      if (!user?.id) return;

      // Fetch the most recent non-reverted completion for this chore
      const { data: recentCompletions } = await supabase
        .from("chore_completions")
        .select("*")
        .eq("chore_id", choreId)
        .eq("is_reverted", false)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (!recentCompletions || recentCompletions.length === 0) {
        Alert.alert("No completion", "No recent completion found to dispute.");
        return;
      }

      const completion = recentCompletions[0] as ChoreCompletion;

      if (completion.is_disputed) {
        Alert.alert("Already disputed", "This completion is already under dispute.");
        return;
      }

      // Show the dispute reason modal
      setDisputeReason("");
      setDisputeReasonModal({
        visible: true,
        choreId,
        completionId: completion.id,
      });
    },
    [user?.id]
  );

  const handleDisputeSubmit = useCallback(async () => {
    if (!user?.id || !disputeReasonModal.completionId || !disputeReasonModal.choreId) return;

    const reason = disputeReason.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please explain why you are disputing this completion.");
      return;
    }

    setDisputeSubmitting(true);
    const { error } = await supabase.rpc("dispute_completion", {
      p_completion_id: disputeReasonModal.completionId,
      p_disputed_by: user.id,
      p_reason: reason,
    });
    setDisputeSubmitting(false);

    if (error) {
      Alert.alert("Error", "Failed to dispute completion.");
    } else {
      setDisputeReasonModal({ visible: false, choreId: null, completionId: null });
      setDisputeReason("");
      refreshChores();
    }
  }, [user?.id, disputeReasonModal, disputeReason, refreshChores]);

  const handleViewDispute = useCallback(
    (choreId: string) => {
      const detail = disputeDetails[choreId];
      if (!detail) return;
      router.push({
        pathname: "/(app)/chores/dispute",
        params: { completionId: detail.id },
      } as never);
    },
    [disputeDetails, router]
  );

  const handleDelete = useCallback(
    (choreId: string, choreName: string) => {
      Alert.alert(
        "Delete Chore?",
        `"${choreName}" will be removed for everyone in the household.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("chores")
                .update({ is_active: false })
                .eq("id", choreId);
              if (!error) {
                refreshChores();
              }
            },
          },
        ]
      );
    },
    [refreshChores]
  );

  const handleSwapRequest = useCallback(
    async (targetUserId: string) => {
      if (!user?.id || !swapModalChoreId) return;

      setSwapSubmitting(true);
      const { error } = await supabase.from("chore_swap_requests").insert({
        chore_id: swapModalChoreId,
        requested_by: user.id,
        requested_to: targetUserId,
      });
      setSwapSubmitting(false);

      if (error) {
        Alert.alert("Error", "Failed to create swap request.");
      } else {
        Alert.alert("Swap Requested", "Your swap request has been sent.");
        setSwapModalChoreId(null);
        refreshChores();
      }
    },
    [user?.id, swapModalChoreId, refreshChores]
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
  const streak = calculateStreak(completions);
  const personalBest = calculatePersonalBest(completions);

  const isEmpty = chores.length === 0 && !loading;

  // Other members eligible for swap: must be in the chore's rotation_order
  const swapChore = chores.find((c) => c.id === swapModalChoreId);
  const swapEligibleMembers = Object.values(profiles).filter(
    (p) =>
      p.id !== user?.id &&
      (swapChore ? swapChore.rotation_order.includes(p.id) : true)
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

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (isEmpty) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="bg-neutral-bg"
      >
        <EmptyState
          onSelectSuggestion={(name, freq) =>
            router.push({
              pathname: "/(app)/chores/add",
              params: { suggestedName: name, suggestedFrequency: freq },
            } as never)
          }
          onCreateCustom={() => router.push("/(app)/chores/add" as never)}
        />
      </ScrollView>
    );
  }

  // -------------------------------------------------------------------------
  // Main render (has chores)
  // -------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <StatsRow
          pendingCount={pendingCount}
          disputedCount={disputedChoreIds.size}
          streak={streak}
          personalBest={personalBest}
        />

        {/* Swap requests banner */}
        {pendingSwapCount > 0 && (
          <Pressable
            className="mx-4 mt-2 flex-row items-center rounded-xl bg-gray-100 px-4 py-3"
            onPress={() => router.push("/(app)/chores/swap-request" as never)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#64748B" />
            <Text className="ml-2 flex-1 text-sm font-medium text-neutral-text">
              {pendingSwapCount} pending swap request{pendingSwapCount !== 1 ? "s" : ""}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        )}

        {/* YOUR CHORES section */}
        {myChores.length > 0 && (
          <View className="mt-4">
            <Text className="text-overline text-neutral-secondary uppercase mb-2 px-4">
              YOUR CHORES
            </Text>
            <Card className="mx-4 p-0 overflow-hidden">
              {myChores.map((chore, index) => {
                const overdueDays = getOverdueDays(chore.next_due_at);
                const assigneeProfile = chore.current_assignee
                  ? profiles[chore.current_assignee]
                  : null;
                const assigneeName = assigneeProfile?.display_name ?? "Unassigned";
                const isDisputed = disputedChoreIds.has(chore.id);
                const isDisputedByMe = disputedByMeChoreIds.has(chore.id);
                const detail = disputeDetails[chore.id];
                const hasLastCompletion = chore.last_completed_at !== null;
                const showDisputeButton = hasLastCompletion && !isDisputed && !true; // isMyChore is always true here

                return (
                  <View
                    key={chore.id}
                    className={
                      index < myChores.length - 1 && !isDisputed
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    <ChoreRow
                      chore={chore}
                      assigneeName={assigneeName}
                      assigneeId={chore.current_assignee}
                      assigneeAvatarUrl={assigneeProfile?.avatar_url}
                      isMyChore={true}
                      isDisputed={isDisputed}
                      isDisputedByMe={isDisputedByMe}
                      disputeReason={detail?.dispute_reason}
                      overdueDays={overdueDays}
                      isCompleting={completingId === chore.id}
                      isClaiming={claimingId === chore.id}
                      isDisputing={disputingId === chore.id}
                      showDisputeButton={showDisputeButton}
                      onComplete={() => handleComplete(chore.id)}
                      onClaim={() => handleClaim(chore.id)}
                      onDispute={() => handleDispute(chore.id)}
                      onSwap={() => setSwapModalChoreId(chore.id)}
                      onDelete={() => handleDelete(chore.id, chore.name)}
                      onViewDispute={isDisputed ? () => handleViewDispute(chore.id) : undefined}
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* HOUSEHOLD section */}
        {othersChores.length > 0 && (
          <View className="mt-6">
            <Text className="text-overline text-neutral-secondary uppercase mb-2 px-4">
              HOUSEHOLD
            </Text>
            <Card className="mx-4 p-0 overflow-hidden">
              {othersChores.map((chore, index) => {
                const overdueDays = getOverdueDays(chore.next_due_at);
                const assigneeProfile = chore.current_assignee
                  ? profiles[chore.current_assignee]
                  : null;
                const assigneeName = assigneeProfile?.display_name ?? "Unassigned";
                const isDisputed = disputedChoreIds.has(chore.id);
                const isDisputedByMe = disputedByMeChoreIds.has(chore.id);
                const detail = disputeDetails[chore.id];
                const hasLastCompletion = chore.last_completed_at !== null;
                const showDisputeButton = hasLastCompletion && !isDisputed && !false; // isMyChore is always false here

                return (
                  <View
                    key={chore.id}
                    className={
                      index < othersChores.length - 1 && !isDisputed
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    <ChoreRow
                      chore={chore}
                      assigneeName={assigneeName}
                      assigneeId={chore.current_assignee}
                      assigneeAvatarUrl={assigneeProfile?.avatar_url}
                      isMyChore={false}
                      isDisputed={isDisputed}
                      isDisputedByMe={isDisputedByMe}
                      disputeReason={detail?.dispute_reason}
                      overdueDays={overdueDays}
                      isCompleting={completingId === chore.id}
                      isClaiming={claimingId === chore.id}
                      isDisputing={disputingId === chore.id}
                      showDisputeButton={showDisputeButton}
                      onComplete={() => handleComplete(chore.id)}
                      onClaim={() => handleClaim(chore.id)}
                      onDispute={() => handleDispute(chore.id)}
                      onSwap={() => setSwapModalChoreId(chore.id)}
                      onDelete={() => handleDelete(chore.id, chore.name)}
                      onViewDispute={isDisputed ? () => handleViewDispute(chore.id) : undefined}
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Swap member picker modal */}
      <Modal
        visible={swapModalChoreId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalChoreId(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setSwapModalChoreId(null)}
        >
          <Pressable
            className="rounded-t-3xl bg-white pb-8 pt-4"
            onPress={() => {}}
          >
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-gray-300" />
            </View>
            <Text className="mb-4 px-6 text-lg font-bold text-gray-800">
              Request Swap With
            </Text>
            {swapEligibleMembers.length === 0 ? (
              <Text className="px-6 py-4 text-center text-gray-500">
                No other members in this chore's rotation
              </Text>
            ) : (
              swapEligibleMembers.map((member) => (
                <Pressable
                  key={member.id}
                  className="flex-row items-center px-6 py-3.5 active:bg-gray-50"
                  onPress={() => handleSwapRequest(member.id)}
                  disabled={swapSubmitting}
                >
                  <View className="mr-3">
                    <Avatar userId={member.id} name={member.display_name} size="sm" avatarUrl={member.avatar_url} />
                  </View>
                  <Text className="flex-1 text-base text-gray-800">
                    {member.display_name}
                  </Text>
                  {swapSubmitting ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                  )}
                </Pressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dispute reason modal */}
      <Modal
        visible={disputeReasonModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDisputeReasonModal({ visible: false, choreId: null, completionId: null });
          setDisputeReason("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/40"
            onPress={() => {
              setDisputeReasonModal({ visible: false, choreId: null, completionId: null });
              setDisputeReason("");
            }}
          >
            <Pressable
              className="rounded-t-3xl bg-white pb-8 pt-4"
              onPress={() => {}}
            >
              <View className="mb-4 items-center">
                <View className="h-1 w-10 rounded-full bg-gray-300" />
              </View>

              <View className="px-6">
                <View className="flex-row items-center mb-2">
                  <View className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Ionicons name="flag" size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-800">
                      Dispute Completion
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      If unresolved within 24h, the completion is auto-reverted
                    </Text>
                  </View>
                </View>

                <Text className="text-sm font-medium text-gray-600 mt-4 mb-2">
                  Why are you disputing this?
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 min-h-[80px]"
                  placeholder="e.g. The dishes were still dirty..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  autoFocus
                />

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    className="flex-1 items-center rounded-xl bg-gray-100 py-3 active:bg-gray-200"
                    onPress={() => {
                      setDisputeReasonModal({ visible: false, choreId: null, completionId: null });
                      setDisputeReason("");
                    }}
                  >
                    <Text className="text-sm font-bold text-gray-600">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 items-center rounded-xl bg-red-500 py-3 active:bg-red-600"
                    onPress={handleDisputeSubmit}
                    disabled={disputeSubmitting || !disputeReason.trim()}
                    style={{ opacity: !disputeReason.trim() ? 0.5 : 1 }}
                  >
                    {disputeSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-sm font-bold text-white">Submit Dispute</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
