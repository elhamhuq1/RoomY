import { colors } from "@/lib/theme/colors";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
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
import { useChoreActions } from "@/lib/hooks/use-chore-actions";
import { Card } from "@/components/ui";
import { ChoreRow } from "@/components/chores";
import type {
  Chore,
  ChoreCompletion,
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

// ---------------------------------------------------------------------------
// My Day Screen
// ---------------------------------------------------------------------------

export default function MyDayScreen() {
  const router = useRouter();
  const { user, household } = useSession();

  // State
  const [chores, setChores] = useState<Chore[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [disputedChoreIds, setDisputedChoreIds] = useState<Set<string>>(
    new Set()
  );
  const [disputedByMeChoreIds, setDisputedByMeChoreIds] = useState<
    Set<string>
  >(new Set());
  const [disputeDetails, setDisputeDetails] = useState<
    Record<string, ChoreCompletion>
  >({});
  const [loading, setLoading] = useState(true);
  const [swapModalChoreId, setSwapModalChoreId] = useState<string | null>(null);
  const [swapSubmitting, setSwapSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!household?.id || !user?.id) return;

    // Fetch all active chores for household
    const { data: choresData } = await supabase
      .from("chores")
      .select("*")
      .eq("household_id", household.id)
      .eq("is_active", true);

    if (!choresData) {
      setLoading(false);
      return;
    }

    // Filter to current user's chores that are due today or overdue
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const myChores = (choresData as Chore[]).filter((c) => {
      if (c.current_assignee !== user.id) return false;
      const dueDate = new Date(c.next_due_at);
      return dueDate <= endOfToday; // includes overdue + due today
    });

    // Sort: overdue oldest-first, then due-today
    myChores.sort((a, b) => {
      const aDue = new Date(a.next_due_at).getTime();
      const bDue = new Date(b.next_due_at).getTime();
      const nowMs = now.getTime();
      const aOverdue = aDue < nowMs;
      const bOverdue = bDue < nowMs;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aDue - bDue; // both same category: earliest first
    });

    setChores(myChores);

    // Fetch profiles for display
    const { data: membersData } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", household.id);
    if (membersData) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      if (profilesData) {
        const map: Record<string, Profile> = {};
        (profilesData as Profile[]).forEach((p) => {
          map[p.id] = p;
        });
        setProfiles(map);
      }
    }

    // Fetch disputed completions for badge display
    const choreIds = myChores.map((c) => c.id);
    if (choreIds.length > 0) {
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
    } else {
      // Clear dispute state when no chores
      setDisputedChoreIds(new Set());
      setDisputedByMeChoreIds(new Set());
      setDisputeDetails({});
    }

    setLoading(false);
  }, [household?.id, user?.id]);

  const { refresh: refreshMyDay } = useCachedFetch(fetchData, {
    staleTime: 30_000,
    deps: [household?.id, user?.id],
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const {
    handleComplete,
    handleClaim,
    handleDispute,
    handleDisputeSubmit,
    handleDelete,
    completingId,
    claimingId,
    disputeReasonModal,
    setDisputeReasonModal,
    disputeReason,
    setDisputeReason,
    disputeSubmitting,
  } = useChoreActions(refreshMyDay);

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
        // Silently fail — user can retry
      } else {
        setSwapModalChoreId(null);
        refreshMyDay();
      }
    },
    [user?.id, swapModalChoreId, refreshMyDay]
  );

  // Swap eligible members: in the chore's rotation_order, excluding current user
  const swapChore = chores.find((c) => c.id === swapModalChoreId);
  const swapEligibleMembers = Object.values(profiles).filter(
    (p) =>
      p.id !== user?.id &&
      (swapChore ? swapChore.rotation_order.includes(p.id) : true)
  );

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (chores.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 100,
        }}
        className="bg-neutral-bg"
      >
        <View className="items-center px-8">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <Ionicons name="sunny" size={40} color="#F59E0B" />
          </View>
          <Text className="text-xl font-heading text-neutral-text mb-2">
            You're all caught up! 🎉
          </Text>
          <Text className="text-sm font-sans text-neutral-secondary text-center">
            No chores due today. Enjoy your free time!
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary pill */}
        <View className="mx-4 mt-4 mb-2 flex-row items-center">
          <Ionicons name="sunny" size={18} color="#F59E0B" />
          <Text className="ml-1.5 text-sm font-heading-semi text-neutral-text">
            {chores.length} chore{chores.length !== 1 ? "s" : ""} for today
          </Text>
        </View>

        {/* Chore list */}
        <Card className="mx-4 p-0 overflow-hidden">
          {chores.map((chore, index) => {
            const overdueDays = getOverdueDays(chore.next_due_at);
            const assigneeProfile = chore.current_assignee
              ? profiles[chore.current_assignee]
              : null;
            const assigneeName =
              assigneeProfile?.display_name ?? "Unassigned";
            const isMyChore = chore.current_assignee === user?.id;
            const isDisputed = disputedChoreIds.has(chore.id);
            const isDisputedByMe = disputedByMeChoreIds.has(chore.id);
            const detail = disputeDetails[chore.id];
            const hasLastCompletion = chore.last_completed_at !== null;
            const showDisputeButton =
              hasLastCompletion && !isDisputed && !isMyChore;

            return (
              <View
                key={chore.id}
                className={
                  index < chores.length - 1 && !isDisputed
                    ? "border-b border-gray-100"
                    : ""
                }
              >
                <ChoreRow
                  chore={chore}
                  assigneeName={assigneeName}
                  assigneeId={chore.current_assignee}
                  assigneeAvatarUrl={assigneeProfile?.avatar_url}
                  isMyChore={isMyChore}
                  isDisputed={isDisputed}
                  isDisputedByMe={isDisputedByMe}
                  disputeReason={detail?.dispute_reason}
                  overdueDays={overdueDays}
                  isCompleting={completingId === chore.id}
                  isClaiming={claimingId === chore.id}
                  isDisputing={false}
                  showDisputeButton={showDisputeButton}
                  onComplete={() => handleComplete(chore.id)}
                  onClaim={() => handleClaim(chore.id)}
                  onDispute={() => handleDispute(chore.id)}
                  onSwap={() => setSwapModalChoreId(chore.id)}
                  onDelete={() => handleDelete(chore.id, chore.name)}
                  onViewDispute={
                    isDisputed ? () => handleViewDispute(chore.id) : undefined
                  }
                />
              </View>
            );
          })}
        </Card>
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
            <Text className="mb-4 px-6 text-lg font-heading text-gray-800">
              Request Swap With
            </Text>
            {swapEligibleMembers.length === 0 ? (
              <Text className="font-sans px-6 py-4 text-center text-gray-500">
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
                  <Text className="font-sans flex-1 text-base text-gray-800">
                    {member.display_name}
                  </Text>
                  {swapSubmitting ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#d1d5db"
                    />
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
          setDisputeReasonModal({
            visible: false,
            choreId: null,
            completionId: null,
          });
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
              setDisputeReasonModal({
                visible: false,
                choreId: null,
                completionId: null,
              });
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
                    <Text className="text-lg font-heading text-gray-800">
                      Dispute Completion
                    </Text>
                    <Text className="font-sans text-xs text-gray-400 mt-0.5">
                      If unresolved within 24h, the completion is auto-reverted
                    </Text>
                  </View>
                </View>

                <Text className="text-sm font-medium text-gray-600 mt-4 mb-2">
                  Why are you disputing this?
                </Text>
                <TextInput
                  className="font-sans border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 min-h-[80px]"
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
                      setDisputeReasonModal({
                        visible: false,
                        choreId: null,
                        completionId: null,
                      });
                      setDisputeReason("");
                    }}
                  >
                    <Text className="text-sm font-heading text-gray-600">
                      Cancel
                    </Text>
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
                      <Text className="text-sm font-heading text-white">
                        Submit Dispute
                      </Text>
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
