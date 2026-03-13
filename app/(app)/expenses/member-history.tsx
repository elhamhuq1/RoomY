import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSession } from '@/lib/auth-context';
import { useCachedFetch } from '@/lib/use-cached-fetch';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme/colors';
import { Card } from '@/components/ui/Card';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import type { Profile, Expense } from '@/lib/types/database';
import type { HistoryItem, GroupedHistory } from '@/components/expenses';
import type {
  SplitWithProfile,
  PayerBalanceMap,
} from '@/components/expenses/ExpenseRow';

function getDateGroup(dateStr: string): 'TODAY' | 'YESTERDAY' | 'EARLIER' {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'TODAY';
  if (date >= yesterday) return 'YESTERDAY';
  return 'EARLIER';
}

function buildGroups(items: HistoryItem[]): GroupedHistory[] {
  const groups: GroupedHistory[] = [];
  let currentLabel = '';
  let currentItems: HistoryItem[] = [];

  for (const item of items) {
    const createdAt = item.data.created_at;
    const label = getDateGroup(createdAt);
    if (label !== currentLabel) {
      if (currentItems.length > 0) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [item];
    } else {
      currentItems.push(item);
    }
  }
  if (currentItems.length > 0) {
    groups.push({ label: currentLabel, items: currentItems });
  }

  return groups;
}

export default function MemberHistoryScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { household, user } = useSession();
  const currentUserId = user?.id ?? '';

  const [memberName, setMemberName] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [splitsCache, setSplitsCache] = useState<
    Record<string, SplitWithProfile[]>
  >({});
  const [payerBalancesCache, setPayerBalancesCache] = useState<
    Record<string, PayerBalanceMap>
  >({});

  const fetchData = useCallback(async () => {
    if (!household?.id || !userId) return;

    try {
      // Fetch other member's profile
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (memberProfile) {
        setMemberName((memberProfile as Profile).display_name);
      }

      // Fetch expense_splits for the other user to find their expenses
      const { data: otherSplits } = await supabase
        .from('expense_splits')
        .select('expense_id')
        .eq('user_id', userId);

      // Fetch expense_splits for the current user to find their expenses
      const { data: mySplits } = await supabase
        .from('expense_splits')
        .select('expense_id')
        .eq('user_id', currentUserId);

      // Find expense IDs that involve BOTH users
      const otherExpenseIds = new Set(
        (otherSplits ?? []).map((s) => s.expense_id)
      );
      const myExpenseIds = new Set(
        (mySplits ?? []).map((s) => s.expense_id)
      );
      const sharedExpenseIds = Array.from(otherExpenseIds).filter((id) =>
        myExpenseIds.has(id)
      );

      // Fetch the shared expenses (filtered to current household)
      let expenses: Expense[] = [];
      if (sharedExpenseIds.length > 0) {
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('*')
          .in('id', sharedExpenseIds)
          .eq('household_id', household.id)
          .order('created_at', { ascending: false });

        expenses = (expenseData as Expense[]) ?? [];
      }

      // Collect profile IDs for display names
      const profileIdSet = new Set<string>();
      for (const e of expenses) profileIdSet.add(e.paid_by);
      const profileIds = Array.from(profileIdSet);

      let profileMap: Record<string, Profile> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = p as Profile;
          }
        }
      }

      // Build combined history items
      const items: HistoryItem[] = [];

      for (const e of expenses) {
        items.push({
          type: 'expense',
          data: e,
          payerName: profileMap[e.paid_by]?.display_name ?? 'Unknown',
        });
      }

      // Sort by created_at descending
      items.sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() -
          new Date(a.data.created_at).getTime()
      );

      setHistoryItems(items);
      setGroupedHistory(buildGroups(items));

      // Clear expanded state and caches on refresh
      setExpandedId(null);
      setSplitsCache({});
      setPayerBalancesCache({});
    } catch (err) {
      console.error('Error fetching member history:', err);
      setGroupedHistory([]);
    }
  }, [household?.id, userId, currentUserId]);

  const fetchWithLoading = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData();
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const { onRefresh, refreshing } = useCachedFetch(fetchWithLoading, {
    staleTime: 30_000,
    deps: [household?.id, userId],
  });

  // Inline expand for expense splits
  const handleExpensePress = useCallback(
    async (expenseId: string) => {
      if (expandedId === expenseId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(expenseId);

      // Find the expense to get the payer ID
      const expense = historyItems.find((item) => item.data.id === expenseId);
      const payerId = expense?.data.paid_by;

      try {
        // Fetch splits if not cached
        if (!splitsCache[expenseId]) {
          const { data: splitsData } = await supabase
            .from('expense_splits')
            .select('*')
            .eq('expense_id', expenseId);

          if (splitsData && splitsData.length > 0) {
            const splitUserIds = splitsData.map((s) => s.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', splitUserIds);

            const pMap: Record<string, { display_name: string }> = {};
            if (profiles) {
              for (const p of profiles) {
                pMap[p.id] = { display_name: p.display_name };
              }
            }

            const splitsWithProfiles: SplitWithProfile[] = splitsData.map(
              (s) => ({
                id: s.id,
                user_id: s.user_id,
                share_amount: String(s.share_amount),
                profile: pMap[s.user_id] ?? null,
              })
            );

            setSplitsCache((prev) => ({
              ...prev,
              [expenseId]: splitsWithProfiles,
            }));
          } else {
            setSplitsCache((prev) => ({
              ...prev,
              [expenseId]: [],
            }));
          }
        }

        // Fetch payer balances if not cached
        if (payerId && household?.id && !payerBalancesCache[payerId]) {
          const { data: balanceData } = await supabase.rpc(
            'get_balances_for_user',
            {
              p_household_id: household.id,
              p_user_id: payerId,
            }
          );

          const balanceMap: PayerBalanceMap = {};
          if (balanceData) {
            for (const row of balanceData) {
              balanceMap[row.user_id] = Number(row.net_amount);
            }
          }

          setPayerBalancesCache((prev) => ({
            ...prev,
            [payerId]: balanceMap,
          }));
        }
      } catch (err) {
        console.error('Error fetching splits/balances:', err);
        if (!splitsCache[expenseId]) {
          setSplitsCache((prev) => ({
            ...prev,
            [expenseId]: [],
          }));
        }
      }
    },
    [expandedId, splitsCache, payerBalancesCache, historyItems, household?.id]
  );

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-bg">
      <Stack.Screen options={{ title: memberName || 'Member History' }} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groupedHistory.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-body text-neutral-secondary">
              No expenses with {memberName || 'this member'} yet
            </Text>
          </View>
        ) : (
          <View>
            {groupedHistory.map((group) => (
              <View key={group.label} className="mb-4">
                <Text className="text-overline text-neutral-secondary uppercase mb-2">
                  {group.label}
                </Text>
                <Card className="p-0">
                  {group.items.map((item, idx) => {
                    const isLast = idx === group.items.length - 1;

                    return (
                      <ExpenseRow
                        key={item.data.id}
                        expense={item.data}
                        payerName={item.payerName}
                        isExpanded={expandedId === item.data.id}
                        splits={splitsCache[item.data.id] ?? null}
                        payerBalances={payerBalancesCache[item.data.paid_by] ?? null}
                        onPress={() => handleExpensePress(item.data.id)}
                        isLast={isLast}
                      />
                    );
                  })}
                </Card>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
