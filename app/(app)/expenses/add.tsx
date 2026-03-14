import { colors, AVATAR_COLORS } from "@/lib/theme/colors";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";


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

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user, household } = useSession();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set()
  );
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
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
        profile: (profilesData?.find((p) => p.id === member.user_id) as Profile) ?? {
          id: member.user_id,
          display_name: "Unknown",
          venmo_username: null,
          avatar_url: null,
          created_at: "",
          updated_at: "",
        },
      }));

      setMembers(combined);

      // Default: current user as payer, all members selected
      if (user?.id) {
        setPayerId(user.id);
      }
      setSelectedMemberIds(new Set(userIds));
    }

    setLoading(false);
  }, [household?.id, user?.id]);

  const fetchSuggestions = useCallback(async () => {
    if (!household?.id) return;

    const { data } = await supabase
      .from("expenses")
      .select("description, created_at")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      // Get distinct descriptions preserving most-recent order
      const seen = new Set<string>();
      const distinct: string[] = [];
      for (const row of data) {
        const desc = row.description;
        if (!seen.has(desc.toLowerCase())) {
          seen.add(desc.toLowerCase());
          distinct.push(desc);
        }
        if (distinct.length >= 10) break;
      }
      setSuggestions(distinct);
    }
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
    fetchSuggestions();
  }, [fetchMembers, fetchSuggestions]);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const selectedMembers = members.filter((m) =>
    selectedMemberIds.has(m.user_id)
  );
  const splits = isValidAmount
    ? calculateEqualSplits(parsedAmount, selectedMembers.length)
    : [];

  const canSubmit =
    description.trim().length > 0 &&
    isValidAmount &&
    payerId !== null &&
    selectedMembers.length > 0 &&
    !submitting;

  function handleAmountChange(text: string) {
    // Allow digits and one decimal point, max 2 decimal places
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return; // multiple dots
    if (parts[1] && parts[1].length > 2) return; // more than 2 decimals
    setAmount(cleaned);
  }

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        // Don't allow deselecting last member
        if (next.size <= 1) return prev;
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!canSubmit || !household?.id || !user?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          household_id: household.id,
          description: description.trim(),
          amount: parsedAmount,
          paid_by: payerId!,
          created_by: user.id,
        })
        .select()
        .single();

      if (expenseError || !expense) {
        throw new Error(expenseError?.message ?? "Failed to create expense");
      }

      // 2. Insert splits
      const splitRows = selectedMembers.map((member, i) => ({
        expense_id: expense.id,
        user_id: member.user_id,
        share_amount: splits[i],
      }));

      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(splitRows);

      if (splitsError) {
        throw new Error(splitsError.message);
      }

      // Success - go back
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6 pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <Text className="mb-2 text-sm font-medium text-gray-500">
          Description
        </Text>
        <TextInput
          className="mb-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
          placeholder="What's the expense for?"
          placeholderTextColor={colors.neutral.tertiary}
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 mt-1"
            contentContainerStyle={{ gap: 8 }}
          >
            {suggestions.map((s) => (
              <Pressable
                key={s}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 active:bg-brand-light"
                onPress={() => setDescription(s)}
              >
                <Text className="text-sm text-gray-600">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {suggestions.length === 0 && <View className="mb-4" />}

        {/* Amount */}
        <Text className="mb-2 text-sm font-medium text-gray-500">Amount</Text>
        <View className="mb-6 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
          <Text className="mr-1 text-lg text-gray-400">$</Text>
          <TextInput
            className="flex-1 text-lg text-gray-800"
            style={{ paddingVertical: 0 }}
            placeholder="0.00"
            placeholderTextColor={colors.neutral.tertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleAmountChange}
          />
        </View>

        {/* Payer */}
        <Text className="mb-2 text-sm font-medium text-gray-500">Paid by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerStyle={{ gap: 12 }}
        >
          {members.map((member, index) => {
            const isSelected = payerId === member.user_id;
            return (
              <Pressable
                key={member.user_id}
                className={`items-center rounded-xl px-3 py-2 ${
                  isSelected
                    ? "border-2 border-brand bg-brand-light"
                    : "border-2 border-transparent"
                }`}
                onPress={() => setPayerId(member.user_id)}
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
                    isSelected ? "font-semibold text-brand-dark" : "text-gray-500"
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
          {members.map((member, index) => {
            const isChecked = selectedMemberIds.has(member.user_id);
            const splitIndex = selectedMembers.findIndex(
              (m) => m.user_id === member.user_id
            );
            const shareAmount =
              isChecked && splitIndex >= 0 ? splits[splitIndex] : 0;

            return (
              <Pressable
                key={member.user_id}
                className={`flex-row items-center px-4 py-3 ${
                  index < members.length - 1 ? "border-b border-gray-100" : ""
                }`}
                onPress={() => toggleMember(member.user_id)}
              >
                {/* Checkbox */}
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

                {/* Avatar */}
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

                {/* Name */}
                <Text className="flex-1 text-base text-gray-800">
                  {member.user_id === user?.id
                    ? "You"
                    : member.profile.display_name}
                </Text>

                {/* Share amount */}
                {isChecked && isValidAmount && (
                  <Text className="text-sm font-medium text-gray-500">
                    {formatCurrency(shareAmount)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Error message */}
        {error && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* Submit button */}
        <Pressable
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            canSubmit
              ? "bg-brand active:bg-brand-dark"
              : "bg-gray-200"
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              className={`text-lg font-bold ${
                canSubmit ? "text-white" : "text-gray-400"
              }`}
            >
              Add Expense
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
