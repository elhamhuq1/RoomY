import { colors } from "@/lib/theme/colors";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

type ReceiptItemData = {
  name: string;
  quantity: number;
  price: number;
};

type ReceiptData = {
  items: ReceiptItemData[];
  total: number;
};


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

type SplitMode = 'even' | 'custom' | 'ownership';

export default function CompleteTripScreen() {
  const router = useRouter();
  const { user, household } = useSession();
  const params = useLocalSearchParams<{ receiptItems?: string; receiptTotal?: string; itemAssignments?: string }>();

  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [itemAssignments, setItemAssignments] = useState<{ name: string; assigned_to: string }[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set()
  );
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('even');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Fetch household members (same pattern as expenses/add.tsx)
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

      setMembers(combined);

      // Default: current user as payer, all members selected
      if (user?.id) {
        setPayerId(user.id);
      }
      setSelectedMemberIds(new Set(userIds));
    }

    setLoading(false);
  }, [household?.id, user?.id]);

  // Fetch count of checked items for summary display
  const fetchCheckedCount = useCallback(async () => {
    if (!household?.id) return;

    const { count } = await supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", household.id)
      .eq("is_checked", true)
      .is("trip_id", null);

    setCheckedCount(count ?? 0);
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
    fetchCheckedCount();
  }, [fetchMembers, fetchCheckedCount]);

  // Parse receipt data from route params (from scan-receipt screen)
  useEffect(() => {
    if (params.receiptItems && params.receiptTotal) {
      try {
        const items: ReceiptItemData[] = JSON.parse(params.receiptItems);
        const total = parseFloat(params.receiptTotal);
        if (Array.isArray(items) && items.length > 0 && !isNaN(total) && total > 0) {
          setReceiptData({ items, total });
          setAmount(total.toFixed(2));
        }
      } catch {
        // Invalid receipt params — ignore silently, user can still enter manually
      }
    }
  }, [params.receiptItems, params.receiptTotal]);

  // Parse item assignments from route params (from assign-items screen)
  useEffect(() => {
    if (params.itemAssignments) {
      try {
        const parsed = JSON.parse(params.itemAssignments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItemAssignments(parsed);
          setSplitMode('ownership');
        }
      } catch {
        // Invalid — ignore, user can still do even/custom split
      }
    }
  }, [params.itemAssignments]);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const selectedMembers = members.filter((m) =>
    selectedMemberIds.has(m.user_id)
  );
  const splits = isValidAmount
    ? calculateEqualSplits(parsedAmount, selectedMembers.length)
    : [];

  // Ownership mode: compute per-member shares from item assignments + receipt data
  const ownershipShares = useMemo(() => {
    if (splitMode !== 'ownership' || !receiptData || itemAssignments.length === 0) return {};

    const shares: Record<string, number> = {};
    let assignedTotal = 0;

    // Sum assigned item prices per user
    for (const assignment of itemAssignments) {
      const item = receiptData.items.find(
        (ri) => ri.name.toLowerCase() === assignment.name.toLowerCase()
      );
      if (item) {
        const itemCost = item.price * item.quantity;
        shares[assignment.assigned_to] = (shares[assignment.assigned_to] ?? 0) + itemCost;
        assignedTotal += itemCost;
      }
    }

    // Unassigned portion splits evenly across all selected members
    const unassignedTotal = parsedAmount - assignedTotal;
    if (unassignedTotal > 0 && selectedMembers.length > 0) {
      const evenShare = Math.round((unassignedTotal / selectedMembers.length) * 100) / 100;
      for (const m of selectedMembers) {
        shares[m.user_id] = (shares[m.user_id] ?? 0) + evenShare;
      }
    }

    return shares;
  }, [splitMode, receiptData, itemAssignments, parsedAmount, selectedMembers]);

  // Custom mode validation
  const customTotal = splitMode === 'custom'
    ? members.reduce((sum, m) => {
        if (!selectedMemberIds.has(m.user_id)) return sum;
        const val = parseFloat(customAmounts[m.user_id] || '0');
        return sum + (isNaN(val) ? 0 : val);
      }, 0)
    : 0;
  const remaining = isValidAmount ? parsedAmount - customTotal : 0;
  const customSplitsValid = Math.abs(remaining) < 0.01;

  const canSubmit =
    isValidAmount &&
    payerId !== null &&
    selectedMembers.length > 0 &&
    (splitMode === 'even' || splitMode === 'ownership' || customSplitsValid) &&
    !submitting;

  function handleAmountChange(text: string) {
    // Allow digits and one decimal point, max 2 decimal places
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return; // multiple dots
    if (parts[1] && parts[1].length > 2) return; // more than 2 decimals
    setAmount(cleaned);
  }

  function handleCustomAmountChange(userId: string, text: string) {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setCustomAmounts((prev) => ({ ...prev, [userId]: cleaned }));
  }

  function handleSplitModeChange(mode: SplitMode) {
    if (mode === splitMode) return;
    setSplitMode(mode);
    if (mode === 'custom') {
      // Pre-fill with even split values only for selected members
      if (isValidAmount && selectedMemberIds.size > 0) {
        const selectedCount = selectedMemberIds.size;
        const evenSplits = calculateEqualSplits(parsedAmount, selectedCount);
        const amounts: Record<string, string> = {};
        let idx = 0;
        members.forEach((m) => {
          if (selectedMemberIds.has(m.user_id)) {
            amounts[m.user_id] = evenSplits[idx].toFixed(2);
            idx++;
          } else {
            amounts[m.user_id] = '';
          }
        });
        setCustomAmounts(amounts);
      } else {
        const amounts: Record<string, string> = {};
        members.forEach((m) => {
          amounts[m.user_id] = '';
        });
        setCustomAmounts(amounts);
      }
    } else if (mode === 'ownership') {
      // Ownership mode — pre-computed from item assignments, no custom amounts needed
      setCustomAmounts({});
      setSelectedMemberIds(new Set(members.map((m) => m.user_id)));
    } else {
      // Switching back to even: clear custom amounts, select all members
      setCustomAmounts({});
      setSelectedMemberIds(new Set(members.map((m) => m.user_id)));
    }
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
    // Clear custom amount when unchecking in custom mode
    if (splitMode === 'custom' && selectedMemberIds.has(userId)) {
      setCustomAmounts((prev) => ({ ...prev, [userId]: '' }));
    }
  }

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!canSubmit || !household?.id || !user?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      if (splitMode === 'ownership') {
        // Ownership mode: use receipt-aware RPC with item assignments
        const { error: rpcError } = await supabase.rpc("complete_grocery_trip_with_receipt", {
          p_household_id: household.id,
          p_total_amount: parsedAmount,
          p_paid_by: payerId!,
          p_split_user_ids: Array.from(selectedMemberIds),
          p_created_by: user.id,
          p_item_prices: receiptData ? receiptData.items : null,
          p_item_assignments: itemAssignments,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }
      } else if (splitMode === 'even') {
        if (receiptData) {
          // Even mode with receipt: use receipt-aware RPC (no assignments)
          const { error: rpcError } = await supabase.rpc("complete_grocery_trip_with_receipt", {
            p_household_id: household.id,
            p_total_amount: parsedAmount,
            p_paid_by: payerId!,
            p_split_user_ids: Array.from(selectedMemberIds),
            p_created_by: user.id,
            p_item_prices: receiptData.items,
          });

          if (rpcError) {
            throw new Error(rpcError.message);
          }
        } else {
          // Even mode without receipt: use existing RPC
          const { error: rpcError } = await supabase.rpc("complete_grocery_trip", {
            p_household_id: household.id,
            p_total_amount: parsedAmount,
            p_paid_by: payerId!,
            p_split_user_ids: Array.from(selectedMemberIds),
            p_created_by: user.id,
          });

          if (rpcError) {
            throw new Error(rpcError.message);
          }
        }
      } else {
        // Custom mode: client-side inserts
        // 1. Create grocery trip
        const { data: trip, error: tripError } = await supabase
          .from("grocery_trips")
          .insert({
            household_id: household.id,
            total_amount: parsedAmount,
            paid_by: payerId!,
            created_by: user.id,
          })
          .select()
          .single();

        if (tripError || !trip) {
          throw new Error(tripError?.message ?? "Failed to create grocery trip");
        }

        // 2. Update checked grocery items with trip_id
        const { error: itemsError } = await supabase
          .from("grocery_items")
          .update({ trip_id: trip.id })
          .eq("household_id", household.id)
          .eq("is_checked", true)
          .is("trip_id", null);

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        // 3. Create expense
        const { data: expense, error: expenseError } = await supabase
          .from("expenses")
          .insert({
            household_id: household.id,
            description: "Grocery Trip",
            amount: parsedAmount,
            paid_by: payerId!,
            created_by: user.id,
          })
          .select()
          .single();

        if (expenseError || !expense) {
          throw new Error(expenseError?.message ?? "Failed to create expense");
        }

        // 4. Create expense_splits from custom amounts
        const splitRows = members
          .map((member) => {
            const val = parseFloat(customAmounts[member.user_id] || '0');
            return {
              expense_id: expense.id,
              user_id: member.user_id,
              share_amount: isNaN(val) ? 0 : val,
            };
          })
          .filter((row) => row.share_amount > 0);

        const { error: splitsError } = await supabase
          .from("expense_splits")
          .insert(splitRows);

        if (splitsError) {
          throw new Error(splitsError.message);
        }

        // 5. Apply receipt item prices to archived grocery items (if receipt data present)
        // Uses ilike for case-insensitive exact match (matches RPC's LOWER() approach)
        if (receiptData) {
          for (const receiptItem of receiptData.items) {
            await supabase
              .from("grocery_items")
              .update({ unit_price: receiptItem.price, source: 'receipt' })
              .eq("trip_id", trip.id)
              .ilike("name", receiptItem.name);
          }
        }
      }

      // Clear the scan→assign→complete stack and land on trip history
      // Navigate to groceries tab first, then push trip-history on top
      router.dismissAll();
      router.push('/(app)/groceries/trip-history');
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
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Summary */}
        {checkedCount > 0 && (
          <View className="mb-6 flex-row items-center rounded-xl bg-brand-light px-4 py-3">
            <Ionicons name="cart" size={20} color={colors.brand.DEFAULT} />
            <Text className="ml-2 text-sm font-medium text-brand-dark">
              {checkedCount} item{checkedCount !== 1 ? "s" : ""} checked off
            </Text>
          </View>
        )}

        {/* Receipt total */}
        <Text className="mb-2 text-sm font-medium text-gray-500">
          Receipt Total
        </Text>
        <View className="mb-6 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
          <Text className="font-sans mr-1 text-lg text-gray-400">$</Text>
          <TextInput
            className="font-sans flex-1 text-lg text-gray-800"
            style={{ paddingVertical: 0 }}
            placeholder="0.00"
            placeholderTextColor={colors.neutral.tertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleAmountChange}
            autoFocus
          />
        </View>

        {/* Payer picker */}
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
                <Avatar
                  userId={member.user_id}
                  name={member.profile.display_name}
                  size="lg"
                  avatarUrl={member.profile.avatar_url}
                />
                <Text
                  className={`mt-1 text-xs ${
                    isSelected
                      ? "font-heading-semi text-brand-dark"
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

        {/* Split mode toggle */}
        <View className="mb-3 flex-row rounded-full border border-gray-200 bg-white p-1">
          {itemAssignments.length > 0 && (
            <Pressable
              className={`flex-1 items-center rounded-full py-2 ${
                splitMode === 'ownership' ? 'bg-brand' : ''
              }`}
              onPress={() => handleSplitModeChange('ownership')}
            >
              <Text className={`font-sans text-sm ${
                splitMode === 'ownership' ? 'font-medium text-white' : 'text-gray-600'
              }`}>By Item</Text>
            </Pressable>
          )}
          <Pressable
            className={`flex-1 items-center rounded-full py-2 ${
              splitMode === 'even' ? 'bg-brand' : ''
            }`}
            onPress={() => handleSplitModeChange('even')}
          >
            <Text className={`font-sans text-sm ${
              splitMode === 'even' ? 'font-medium text-white' : 'text-gray-600'
            }`}>Even</Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center rounded-full py-2 ${
              splitMode === 'custom' ? 'bg-brand' : ''
            }`}
            onPress={() => handleSplitModeChange('custom')}
          >
            <Text className={`font-sans text-sm ${
              splitMode === 'custom' ? 'font-medium text-white' : 'text-gray-600'
            }`}>Custom</Text>
          </Pressable>
        </View>

        <View className="mb-2 rounded-xl bg-white">
          {members.map((member, index) => {
            if (splitMode === 'ownership') {
              const share = ownershipShares[member.user_id] ?? 0;
              return (
                <View
                  key={member.user_id}
                  className={`flex-row items-center px-4 py-3 ${
                    index < members.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  {/* Avatar */}
                  <View className="mr-3">
                    <Avatar
                      userId={member.user_id}
                      name={member.profile.display_name}
                      size="md"
                      avatarUrl={member.profile.avatar_url}
                    />
                  </View>

                  {/* Name */}
                  <Text className="font-sans flex-1 text-base text-gray-800">
                    {member.user_id === user?.id
                      ? "You"
                      : member.profile.display_name}
                  </Text>

                  {/* Ownership share (read-only) */}
                  {isValidAmount && (
                    <Text className={`text-sm font-medium ${share > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>
                      {formatCurrency(share)}
                    </Text>
                  )}
                </View>
              );
            }

            if (splitMode === 'even') {
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
                  <View className="mr-3">
                    <Avatar
                      userId={member.user_id}
                      name={member.profile.display_name}
                      size="md"
                      avatarUrl={member.profile.avatar_url}
                    />
                  </View>

                  {/* Name */}
                  <Text className="font-sans flex-1 text-base text-gray-800">
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
            }

            // Custom mode
            const isChecked = selectedMemberIds.has(member.user_id);
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
                <View className="mr-3">
                  <Avatar
                    userId={member.user_id}
                    name={member.profile.display_name}
                    size="md"
                    avatarUrl={member.profile.avatar_url}
                  />
                </View>

                {/* Name */}
                <Text className="font-sans flex-1 text-base text-gray-800">
                  {member.user_id === user?.id
                    ? "You"
                    : member.profile.display_name}
                </Text>

                {/* Custom amount input - only when checked */}
                {isChecked && (
                  <View className="flex-row items-center rounded-lg border border-gray-200 px-2 py-1">
                    <Text className="font-sans text-sm text-gray-400">$</Text>
                    <TextInput
                      className="font-sans w-20 text-right text-sm text-gray-800"
                      style={{ paddingVertical: 0 }}
                      placeholder="0.00"
                      placeholderTextColor={colors.neutral.tertiary}
                      keyboardType="decimal-pad"
                      value={customAmounts[member.user_id] || ''}
                      onChangeText={(text) => handleCustomAmountChange(member.user_id, text)}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Custom mode validation */}
        {splitMode === 'custom' && isValidAmount && (
          <View className="mb-4">
            {customSplitsValid ? (
              <Text className="font-sans text-center text-sm text-brand">
                Splits add up
              </Text>
            ) : remaining > 0 ? (
              <Text className="font-sans text-center text-sm text-amber-500">
                Remaining: {formatCurrency(remaining)}
              </Text>
            ) : (
              <Text className="font-sans text-center text-sm text-red-500">
                Over by: {formatCurrency(Math.abs(remaining))}
              </Text>
            )}
          </View>
        )}

        {/* Per-person split summary (even mode only) */}
        {splitMode === 'even' && isValidAmount && selectedMembers.length > 0 && (
          <View className="mb-6 rounded-xl bg-neutral-surface px-4 py-3">
            <Text className="font-sans text-center text-sm text-gray-500">
              {formatCurrency(parsedAmount)} split {selectedMembers.length} way
              {selectedMembers.length !== 1 ? "s" : ""} ={" "}
              <Text className="font-heading-semi text-gray-700">
                {formatCurrency(splits[0] ?? 0)}
              </Text>{" "}
              each
            </Text>
          </View>
        )}

        {splitMode === 'custom' && !isValidAmount && <View className="mb-4" />}

        {/* Error message */}
        {error && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-sans text-sm text-red-600">{error}</Text>
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
            <>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={canSubmit ? "#fff" : colors.neutral.tertiary}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`text-lg font-heading ${
                  canSubmit ? "text-white" : "text-gray-400"
                }`}
              >
                Complete Trip
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
