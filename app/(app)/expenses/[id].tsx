import { colors, AVATAR_COLORS } from "@/lib/theme/colors";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile, Expense, ExpenseSplit, Settlement } from "@/lib/types/database";


function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

function calculateEqualSplits(
  totalAmount: number,
  memberCount: number
): number[] {
  const baseShare = Math.floor((totalAmount * 100) / memberCount) / 100;
  const remainder = Math.round((totalAmount - baseShare * memberCount) * 100);
  return Array.from({ length: memberCount }, (_, i) =>
    baseShare + (i < remainder ? 0.01 : 0)
  );
}

type MemberWithProfile = {
  user_id: string;
  profile: Profile;
};

type SplitWithProfile = ExpenseSplit & {
  profile: Profile | null;
};

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id, type: itemType } = useLocalSearchParams<{
    id: string;
    type?: string;
  }>();
  const { user, household } = useSession();

  const isSettlement = itemType === "settlement";

  // Expense state
  const [expense, setExpense] = useState<Expense | null>(null);
  const [splits, setSplits] = useState<SplitWithProfile[]>([]);
  const [payerProfile, setPayerProfile] = useState<Profile | null>(null);

  // Settlement state
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [paidByProfile, setPaidByProfile] = useState<Profile | null>(null);
  const [paidToProfile, setPaidToProfile] = useState<Profile | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPayerId, setEditPayerId] = useState<string | null>(null);
  const [editSelectedMemberIds, setEditSelectedMemberIds] = useState<
    Set<string>
  >(new Set());
  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseData = useCallback(async () => {
    if (!id) return;

    try {
      if (isSettlement) {
        // Fetch settlement
        const { data: settlementData, error: settlementError } = await supabase
          .from("settlements")
          .select("*")
          .eq("id", id)
          .single();

        if (settlementError || !settlementData) {
          setError("Settlement not found");
          setLoading(false);
          return;
        }

        const s = settlementData as Settlement;
        setSettlement(s);

        // Fetch profiles for paid_by and paid_to
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", [s.paid_by, s.paid_to]);

        if (profiles) {
          setPaidByProfile(
            (profiles.find((p) => p.id === s.paid_by) as Profile) ?? null
          );
          setPaidToProfile(
            (profiles.find((p) => p.id === s.paid_to) as Profile) ?? null
          );
        }
      } else {
        // Fetch expense
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("id", id)
          .single();

        if (expenseError || !expenseData) {
          setError("Expense not found");
          setLoading(false);
          return;
        }

        const e = expenseData as Expense;
        setExpense(e);

        // Fetch splits
        const { data: splitsData } = await supabase
          .from("expense_splits")
          .select("*")
          .eq("expense_id", id);

        // Collect all user IDs for profiles
        const profileIds = new Set<string>();
        profileIds.add(e.paid_by);
        if (splitsData) {
          for (const split of splitsData) {
            profileIds.add(split.user_id);
          }
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", Array.from(profileIds));

        const profileMap: Record<string, Profile> = {};
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = p as Profile;
          }
        }

        setPayerProfile(profileMap[e.paid_by] ?? null);

        const splitsWithProfiles: SplitWithProfile[] = (splitsData ?? []).map(
          (split) => ({
            ...(split as ExpenseSplit),
            profile: profileMap[split.user_id] ?? null,
          })
        );
        setSplits(splitsWithProfiles);

        // Initialize edit state
        setEditDescription(e.description);
        setEditAmount(String(e.amount));
        setEditPayerId(e.paid_by);
        setEditSelectedMemberIds(
          new Set((splitsData ?? []).map((s) => s.user_id))
        );
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      setError("Failed to load details");
    }

    setLoading(false);
  }, [id, isSettlement]);

  const fetchAllMembers = useCallback(async () => {
    if (!household?.id) return;

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

      const combined: MemberWithProfile[] = membersData.map((member) => ({
        user_id: member.user_id,
        profile: (profilesData?.find(
          (p) => p.id === member.user_id
        ) as Profile) ?? {
          id: member.user_id,
          display_name: "Unknown",
          venmo_username: null,
          avatar_url: null,
          created_at: "",
          updated_at: "",
        },
      }));

      setAllMembers(combined);
    }
  }, [household?.id]);

  useEffect(() => {
    fetchExpenseData();
    fetchAllMembers();
  }, [fetchExpenseData, fetchAllMembers]);

  // Edit helpers
  const parsedEditAmount = parseFloat(editAmount);
  const isValidEditAmount = !isNaN(parsedEditAmount) && parsedEditAmount > 0;
  const editSelectedMembers = allMembers.filter((m) =>
    editSelectedMemberIds.has(m.user_id)
  );
  const editSplits = isValidEditAmount
    ? calculateEqualSplits(parsedEditAmount, editSelectedMembers.length)
    : [];

  const canSave =
    editDescription.trim().length > 0 &&
    isValidEditAmount &&
    editPayerId !== null &&
    editSelectedMembers.length > 0 &&
    !saving;

  function handleEditAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setEditAmount(cleaned);
  }

  function toggleEditMember(userId: string) {
    setEditSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size <= 1) return prev;
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!canSave || !expense) return;

    setSaving(true);
    setError(null);

    try {
      // Update expense row
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          description: editDescription.trim(),
          amount: parsedEditAmount,
          paid_by: editPayerId!,
        })
        .eq("id", expense.id);

      if (updateError) throw new Error(updateError.message);

      // Delete old splits
      const { error: deleteError } = await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", expense.id);

      if (deleteError) throw new Error(deleteError.message);

      // Insert new splits
      const newSplitRows = editSelectedMembers.map((member, i) => ({
        expense_id: expense.id,
        user_id: member.user_id,
        share_amount: editSplits[i],
      }));

      const { error: insertError } = await supabase
        .from("expense_splits")
        .insert(newSplitRows);

      if (insertError) throw new Error(insertError.message);

      // Refresh data and exit edit mode
      setEditing(false);
      setLoading(true);
      await fetchExpenseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }

    setSaving(false);
  }

  function handleDelete() {
    const itemName = isSettlement ? "settlement" : "expense";
    Alert.alert(
      `Delete ${itemName}?`,
      `This will permanently remove this ${itemName}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (isSettlement && settlement) {
                await supabase
                  .from("settlements")
                  .delete()
                  .eq("id", settlement.id);
              } else if (expense) {
                // CASCADE deletes splits automatically
                await supabase
                  .from("expenses")
                  .delete()
                  .eq("id", expense.id);
              }
              router.back();
            } catch (err) {
              setError("Failed to delete");
            }
          },
        },
      ]
    );
  }

  function handleCancelEdit() {
    if (expense) {
      setEditDescription(expense.description);
      setEditAmount(String(expense.amount));
      setEditPayerId(expense.paid_by);
      setEditSelectedMemberIds(new Set(splits.map((s) => s.user_id)));
    }
    setEditing(false);
    setError(null);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  if (error && !expense && !settlement) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef5350" />
        <Text className="mt-3 text-base text-gray-500">{error}</Text>
      </View>
    );
  }

  // Settlement detail view
  if (isSettlement && settlement) {
    return (
      <ScrollView
        className="flex-1 bg-neutral-bg"
        contentContainerClassName="px-6 pt-6 pb-12"
      >
        <View className="items-center rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark-circle" size={36} color={colors.semantic.success} />
          </View>

          <Text className="text-2xl font-bold text-gray-800">
            {formatCurrency(Number(settlement.amount))}
          </Text>

          <Text className="mt-2 text-base text-gray-500">
            {paidByProfile?.display_name ?? "Unknown"} paid{" "}
            {paidToProfile?.display_name ?? "Unknown"}
          </Text>

          <Text className="mt-1 text-sm text-gray-400">
            {new Date(settlement.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>

          <View className="mt-1">
            <Text className="text-xs text-gray-300">Settlement</Text>
          </View>
        </View>

        {/* Delete button */}
        <Pressable
          className="mt-6 flex-row items-center justify-center rounded-2xl border-2 border-red-200 py-4 active:bg-red-50"
          onPress={handleDelete}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#ef5350"
            style={{ marginRight: 8 }}
          />
          <Text className="text-base font-semibold text-red-500">
            Delete Settlement
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Expense detail / edit view
  if (!expense) return null;

  const createdDate = new Date(expense.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (editing) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-bg"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Description
          </Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Description"
            placeholderTextColor={colors.neutral.tertiary}
          />

          {/* Amount */}
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Amount
          </Text>
          <View className="mb-6 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
            <Text className="mr-1 text-lg font-semibold text-gray-400">
              $
            </Text>
            <TextInput
              className="flex-1 text-lg text-gray-800"
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={handleEditAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.neutral.tertiary}
            />
          </View>

          {/* Payer */}
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Paid by
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {allMembers.map((member, index) => {
              const isSelected = editPayerId === member.user_id;
              return (
                <Pressable
                  key={member.user_id}
                  className={`items-center rounded-xl px-3 py-2 ${
                    isSelected
                      ? "border-2 border-brand bg-brand-light"
                      : "border-2 border-transparent"
                  }`}
                  onPress={() => setEditPayerId(member.user_id)}
                >
                  <View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        AVATAR_COLORS[index % AVATAR_COLORS.length],
                    }}
                  >
                    <Text className="text-sm font-bold text-white">
                      {getInitials(member.profile.display_name)}
                    </Text>
                  </View>
                  <Text
                    className={`mt-1 text-xs ${
                      isSelected
                        ? "font-semibold text-brand-dark"
                        : "text-gray-500"
                    }`}
                    numberOfLines={1}
                  >
                    {member.user_id === user?.id
                      ? "You"
                      : member.profile.display_name.split(" ")[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Split between */}
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Split between
          </Text>
          <View className="mb-6 rounded-xl bg-white">
            {allMembers.map((member, index) => {
              const isChecked = editSelectedMemberIds.has(member.user_id);
              const splitIndex = editSelectedMembers.findIndex(
                (m) => m.user_id === member.user_id
              );
              const shareAmount =
                isChecked && splitIndex >= 0 ? editSplits[splitIndex] : 0;

              return (
                <Pressable
                  key={member.user_id}
                  className={`flex-row items-center px-4 py-3 ${
                    index < allMembers.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  onPress={() => toggleEditMember(member.user_id)}
                >
                  <View
                    className={`mr-3 h-6 w-6 items-center justify-center rounded-md ${
                      isChecked
                        ? "bg-brand"
                        : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    {isChecked && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        AVATAR_COLORS[index % AVATAR_COLORS.length],
                    }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {getInitials(member.profile.display_name)}
                    </Text>
                  </View>
                  <Text className="flex-1 text-base text-gray-800">
                    {member.user_id === user?.id
                      ? "You"
                      : member.profile.display_name}
                  </Text>
                  {isChecked && isValidEditAmount && (
                    <Text className="text-sm font-medium text-gray-500">
                      {formatCurrency(shareAmount)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Error */}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}

          {/* Action buttons */}
          <Pressable
            className={`mb-3 flex-row items-center justify-center rounded-2xl py-4 ${
              canSave
                ? "bg-brand active:bg-brand-dark"
                : "bg-gray-200"
            }`}
            onPress={handleSave}
            disabled={!canSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`text-lg font-bold ${
                  canSave ? "text-white" : "text-gray-400"
                }`}
              >
                Save Changes
              </Text>
            )}
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center rounded-2xl border-2 border-gray-200 py-4 active:bg-neutral-surface"
            onPress={handleCancelEdit}
          >
            <Text className="text-lg font-bold text-gray-500">Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // View mode
  return (
    <ScrollView
      className="flex-1 bg-neutral-bg"
      contentContainerClassName="px-6 pt-6 pb-12"
      showsVerticalScrollIndicator={false}
    >
      {/* Header card */}
      <View className="items-center rounded-2xl bg-white p-6 shadow-sm">
        <Text className="text-2xl font-bold text-gray-800">
          {expense.description}
        </Text>

        <Text className="mt-2 text-3xl font-bold text-gray-800">
          {formatCurrency(Number(expense.amount))}
        </Text>

        <View className="mt-3 flex-row items-center">
          <Ionicons
            name="person-outline"
            size={16}
            color={colors.neutral.tertiary}
            style={{ marginRight: 4 }}
          />
          <Text className="text-sm text-gray-500">
            Paid by {payerProfile?.display_name ?? "Unknown"}
          </Text>
        </View>

        <Text className="mt-1 text-xs text-gray-400">{createdDate}</Text>
      </View>

      {/* Split breakdown */}
      <Text className="mb-3 mt-6 text-sm font-semibold text-gray-400">
        SPLIT BETWEEN
      </Text>
      <View className="rounded-2xl bg-white shadow-sm">
        {splits.map((split, index) => (
          <View
            key={split.id}
            className={`flex-row items-center px-4 py-3 ${
              index < splits.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  AVATAR_COLORS[index % AVATAR_COLORS.length],
              }}
            >
              <Text className="text-xs font-bold text-white">
                {getInitials(split.profile?.display_name ?? "?")}
              </Text>
            </View>
            <Text className="flex-1 text-base text-gray-800">
              {split.user_id === user?.id
                ? "You"
                : split.profile?.display_name ?? "Unknown"}
            </Text>
            <Text className="text-base font-semibold text-gray-700">
              {formatCurrency(Number(split.share_amount))}
            </Text>
          </View>
        ))}
      </View>

      {/* Edit button */}
      <Pressable
        className="mt-6 flex-row items-center justify-center rounded-2xl bg-brand py-4 active:bg-brand-dark"
        onPress={() => setEditing(true)}
      >
        <Ionicons
          name="pencil-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text className="text-base font-bold text-white">Edit Expense</Text>
      </Pressable>

      {/* Delete button */}
      <Pressable
        className="mt-3 flex-row items-center justify-center rounded-2xl border-2 border-red-200 py-4 active:bg-red-50"
        onPress={handleDelete}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="#ef5350"
          style={{ marginRight: 8 }}
        />
        <Text className="text-base font-semibold text-red-500">
          Delete Expense
        </Text>
      </Pressable>

      {error && (
        <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}
