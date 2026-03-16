import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSession } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/lib/theme/colors';
import type { Profile } from '@/lib/types/database';

// ------- Types -------

type ReceiptItemParam = {
  name: string;
  quantity: number;
  price: number;
};

type MemberWithProfile = {
  user_id: string;
  profile: Profile;
};

/** Map of item name → assigned user_id (null = shared/unassigned) */
type Assignments = Record<string, string | null>;

// ------- Helpers -------

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

function getFirstName(member: MemberWithProfile, currentUserId?: string): string {
  if (member.user_id === currentUserId) return 'You';
  return member.profile.display_name.split(' ')[0];
}

// ------- Main Screen -------

export default function AssignItemsScreen() {
  const router = useRouter();
  const { user, household } = useSession();
  const params = useLocalSearchParams<{
    receiptItems?: string;
    receiptTotal?: string;
  }>();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignments>({});

  // Parse receipt items from route params
  const receiptItems = useMemo<ReceiptItemParam[]>(() => {
    if (!params.receiptItems) return [];
    try {
      const parsed = JSON.parse(params.receiptItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.receiptItems]);

  const receiptTotal = useMemo(() => {
    if (!params.receiptTotal) return 0;
    const n = parseFloat(params.receiptTotal);
    return isNaN(n) ? 0 : n;
  }, [params.receiptTotal]);

  // Fetch household members (same pattern as complete-trip)
  const fetchMembers = useCallback(async () => {
    if (!household?.id) return;

    const { data: membersData } = await supabase
      .from('household_members')
      .select('user_id, role')
      .eq('household_id', household.id);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const combined: MemberWithProfile[] = membersData.map((member) => ({
        user_id: member.user_id,
        profile: (profilesData?.find(
          (p) => p.id === member.user_id
        ) as Profile) ?? {
          id: member.user_id,
          display_name: 'Unknown',
          venmo_username: null,
          avatar_url: null,
          created_at: '',
          updated_at: '',
        },
      }));

      setMembers(combined);
    }

    setLoading(false);
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Initialize assignments — all items start unassigned
  useEffect(() => {
    if (receiptItems.length > 0) {
      const initial: Assignments = {};
      receiptItems.forEach((item) => {
        initial[item.name] = null;
      });
      setAssignments(initial);
    }
  }, [receiptItems]);

  // Compute per-member totals from assignments
  const memberTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    members.forEach((m) => {
      totals[m.user_id] = 0;
    });

    receiptItems.forEach((item) => {
      const assignedTo = assignments[item.name];
      if (assignedTo && totals[assignedTo] !== undefined) {
        totals[assignedTo] += item.price * item.quantity;
      }
    });

    return totals;
  }, [assignments, receiptItems, members]);

  // Count of unassigned items
  const unassignedCount = useMemo(() => {
    return receiptItems.filter((item) => !assignments[item.name]).length;
  }, [assignments, receiptItems]);

  const unassignedTotal = useMemo(() => {
    return receiptItems
      .filter((item) => !assignments[item.name])
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [assignments, receiptItems]);

  // Toggle assignment: tap same member to unassign, tap different to reassign
  const handleAssign = useCallback(
    (itemName: string, userId: string) => {
      setAssignments((prev) => ({
        ...prev,
        [itemName]: prev[itemName] === userId ? null : userId,
      }));
    },
    []
  );

  // Bulk assign: assign all unassigned items to "Shared" (unassigned)
  const handleClearAll = useCallback(() => {
    setAssignments((prev) => {
      const next: Assignments = {};
      Object.keys(prev).forEach((key) => {
        next[key] = null;
      });
      return next;
    });
  }, []);

  // Continue to complete-trip with assignments
  const handleContinue = useCallback(() => {
    // Build itemAssignments array for the RPC: { name, assigned_to }
    const itemAssignments = receiptItems
      .filter((item) => assignments[item.name] !== null)
      .map((item) => ({
        name: item.name,
        assigned_to: assignments[item.name],
      }));

    router.navigate({
      pathname: '/(app)/groceries/complete-trip',
      params: {
        receiptItems: params.receiptItems ?? '',
        receiptTotal: params.receiptTotal ?? '',
        itemAssignments: JSON.stringify(itemAssignments),
      },
    });
  }, [receiptItems, assignments, params, router]);

  // ---- Loading state ----
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  // ---- Empty state (no items) ----
  if (receiptItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.neutral.tertiary}
        />
        <Text className="mt-4 text-center text-base text-neutral-secondary">
          No items to assign. Go back and scan a receipt first.
        </Text>
        <Pressable
          className="mt-6 rounded-2xl bg-brand px-8 py-3 active:bg-brand-dark"
          onPress={() => router.back()}
        >
          <Text className="text-base font-heading text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-48"
        showsVerticalScrollIndicator={false}
      >
        {/* Header summary */}
        <View className="mb-4 rounded-xl bg-brand-light px-4 py-3">
          <Text className="text-center text-sm text-brand-dark">
            Assign {receiptItems.length} item{receiptItems.length !== 1 ? 's' : ''} to household members
          </Text>
          <Text className="mt-1 text-center text-xs text-brand-mid">
            Tap a member to assign • Tap again to unassign • Unassigned items split evenly
          </Text>
        </View>

        {/* Clear all button (only show when some items are assigned) */}
        {unassignedCount < receiptItems.length && (
          <Pressable
            className="mb-3 self-end flex-row items-center px-2 py-1"
            onPress={handleClearAll}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.neutral.secondary} />
            <Text className="ml-1 text-xs text-neutral-secondary">Clear all</Text>
          </Pressable>
        )}

        {/* Item list with member pickers */}
        {receiptItems.map((item, index) => {
          const assignedTo = assignments[item.name];
          const itemTotal = item.price * item.quantity;

          return (
            <View
              key={`${item.name}-${index}`}
              className={`bg-white px-4 py-3 ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === receiptItems.length - 1
                  ? 'rounded-b-xl'
                  : 'border-b border-gray-100'
              }`}
            >
              {/* Item name and price row */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 mr-3">
                  <Text
                    className="text-base text-neutral-text"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.quantity > 1 && (
                    <Text className="text-xs text-neutral-tertiary">
                      ×{item.quantity} @ {formatCurrency(item.price)} each
                    </Text>
                  )}
                </View>
                <Text className="text-sm font-heading-semi text-neutral-text">
                  {formatCurrency(itemTotal)}
                </Text>
              </View>

              {/* Member picker row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {members.map((member) => {
                  const isSelected = assignedTo === member.user_id;
                  return (
                    <Pressable
                      key={member.user_id}
                      className={`items-center rounded-xl px-2 py-1.5 ${
                        isSelected
                          ? 'border-2 border-brand bg-brand-light'
                          : 'border-2 border-transparent'
                      }`}
                      onPress={() => handleAssign(item.name, member.user_id)}
                    >
                      <Avatar
                        userId={member.user_id}
                        name={member.profile.display_name}
                        size="sm"
                        avatarUrl={member.profile.avatar_url}
                      />
                      <Text
                        className={`mt-0.5 text-[10px] ${
                          isSelected
                            ? 'font-heading-semi text-brand-dark'
                            : 'text-neutral-tertiary'
                        }`}
                        numberOfLines={1}
                      >
                        {getFirstName(member, user?.id)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom summary bar — fixed at bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-8">
        {/* Per-member totals */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
          >
            {members.map((member) => {
              const total = memberTotals[member.user_id] ?? 0;
              return (
                <View key={member.user_id} className="items-center">
                  <Avatar
                    userId={member.user_id}
                    name={member.profile.display_name}
                    size="sm"
                    avatarUrl={member.profile.avatar_url}
                  />
                  <Text className="mt-1 text-[10px] text-neutral-secondary" numberOfLines={1}>
                    {getFirstName(member, user?.id)}
                  </Text>
                  <Text className="text-xs font-heading-semi text-neutral-text">
                    {formatCurrency(total)}
                  </Text>
                </View>
              );
            })}

            {/* Shared/unassigned bucket */}
            {unassignedCount > 0 && (
              <View className="items-center">
                <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-neutral-surface border-2 border-neutral-border">
                  <Ionicons name="people-outline" size={16} color={colors.neutral.secondary} />
                </View>
                <Text className="mt-1 text-[10px] text-neutral-secondary">Shared</Text>
                <Text className="text-xs font-heading-semi text-neutral-text">
                  {formatCurrency(unassignedTotal)}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Summary line */}
        <Text className="mb-3 text-center text-xs text-neutral-secondary">
          {unassignedCount === 0
            ? 'All items assigned'
            : `${unassignedCount} item${unassignedCount !== 1 ? 's' : ''} shared (${formatCurrency(unassignedTotal)} split evenly)`}
        </Text>

        {/* Continue button */}
        <Pressable
          className="flex-row items-center justify-center rounded-2xl bg-brand py-4 active:bg-brand-dark"
          onPress={handleContinue}
        >
          <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
          <Text className="ml-2 text-lg font-heading text-white">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
