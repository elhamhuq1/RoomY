/**
 * useChoreActions — Shared chore action handlers used by both the chores tab
 * and the My Day screen. Manages complete, claim, dispute, dispute-submit,
 * and delete flows with their associated loading/modal state.
 */

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-context";
import type { ChoreCompletion } from "@/lib/types/database";

interface DisputeReasonModal {
  visible: boolean;
  choreId: string | null;
  completionId: string | null;
}

export function useChoreActions(refreshFn: () => void) {
  const { user } = useSession();

  // Loading states
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  // Session-level set: disables nudge button after successful nudge (prevents rapid re-taps)
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());

  // Dispute modal state
  const [disputeReasonModal, setDisputeReasonModal] = useState<DisputeReasonModal>({
    visible: false,
    choreId: null,
    completionId: null,
  });
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

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
                setTimeout(() => refreshFn(), 400);
              }
            },
          },
        ]
      );
    },
    [user?.id, refreshFn]
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
        refreshFn();
      }
    },
    [user?.id, refreshFn]
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
      refreshFn();
    }
  }, [user?.id, disputeReasonModal, disputeReason, refreshFn]);

  const handleNudge = useCallback(
    async (choreId: string) => {
      setNudgingId(choreId);
      try {
        const { data, error } = await supabase.functions.invoke("push-chore-nudge", {
          body: { chore_id: choreId },
        });
        if (error) {
          const message =
            (data as { error?: string } | null)?.error ?? error.message ?? "Something went wrong.";
          Alert.alert("Nudge Failed", message);
        } else {
          setNudgedIds((prev) => new Set(prev).add(choreId));
          Alert.alert("Nudge Sent", "Your roommate will get a notification.");
        }
      } catch {
        Alert.alert("Nudge Failed", "Could not reach the server.");
      } finally {
        setNudgingId(null);
      }
    },
    []
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
                refreshFn();
              }
            },
          },
        ]
      );
    },
    [refreshFn]
  );

  return {
    handleComplete,
    handleClaim,
    handleDispute,
    handleDisputeSubmit,
    handleNudge,
    handleDelete,
    completingId,
    claimingId,
    nudgingId,
    nudgedIds,
    disputeReasonModal,
    setDisputeReasonModal,
    disputeReason,
    setDisputeReason,
    disputeSubmitting,
  };
}
