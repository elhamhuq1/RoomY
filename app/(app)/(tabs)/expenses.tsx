import { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/lib/auth-context';
import { useCachedFetch } from '@/lib/use-cached-fetch';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme/colors';
import type { Profile, Expense } from '@/lib/types/database';
import {
  BalanceSection,
  HistorySection,
  EmptyState,
  RoommateSection,
} from '@/components/expenses';
import type {
  BalanceEntry,
  HistoryItem,
  GroupedHistory,
  SplitWithProfile,
  PayerBalanceMap,
  RoommateMember,
} from '@/components/expenses';

const BATCH_SIZE = 20;

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

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

export default function ExpensesScreen() {
  const router = useRouter();
  const { household, user } = useSession();
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [members, setMembers] = useState<RoommateMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [splitsCache, setSplitsCache] = useState<
    Record<string, SplitWithProfile[]>
  >({});
  const [payerBalancesCache, setPayerBalancesCache] = useState<
    Record<string, PayerBalanceMap>
  >({});

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ---------- Data fetching ----------

  const fetchData = useCallback(async () => {
    if (!household?.id) return;

    try {
      // Fetch balances and expenses in parallel
      const [balanceResult, expenseResult] =
        await Promise.all([
          supabase.rpc('get_household_balances', {
            p_household_id: household.id,
          }),
          supabase
            .from('expenses')
            .select('*')
            .eq('household_id', household.id)
            .order('created_at', { ascending: false })
            .range(0, BATCH_SIZE - 1),
        ]);

      // Process balances
      const balanceData = balanceResult.data;
      if (balanceData && balanceData.length > 0) {
        const balUserIds = balanceData.map(
          (b: { user_id: string }) => b.user_id
        );
        const { data: balProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', balUserIds);

        setBalances(
          balanceData.map((b: { user_id: string; net_amount: number }) => ({
            user_id: b.user_id,
            net_amount: Number(b.net_amount),
            profile:
              (balProfiles?.find((p) => p.id === b.user_id) as Profile) ?? null,
          }))
        );
      } else {
        setBalances([]);
      }

      // Collect all user IDs that need profiles
      const expenses = (expenseResult.data as Expense[]) ?? [];

      const profileIdSet = new Set<string>();
      for (const e of expenses) {
        profileIdSet.add(e.paid_by);
      }
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

      // Reset pagination
      setOffset(BATCH_SIZE);
      setHasMore(expenses.length === BATCH_SIZE);

      // Fetch all household members for roommate section
      const { data: membersData } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', household.id);
      if (membersData && membersData.length > 0) {
        const memberUserIds = membersData
          .map(m => m.user_id)
          .filter(id => id !== user?.id);
        if (memberUserIds.length > 0) {
          const { data: memberProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', memberUserIds);
          setMembers(
            memberUserIds.map(id => {
              const mp = memberProfiles?.find(p => p.id === id);
              return {
                user_id: id,
                display_name: mp?.display_name ?? 'Unknown',
                avatar_url: mp?.avatar_url ?? null,
              };
            })
          );
        } else {
          setMembers([]);
        }
      } else {
        setMembers([]);
      }

      // Clear expanded state and caches on refresh
      setExpandedId(null);
      setSplitsCache({});
      setPayerBalancesCache({});
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setBalances([]);
      setHistoryItems([]);
      setGroupedHistory([]);
    }
  }, [household?.id]);

  // Load more items for pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !household?.id) return;

    setLoadingMore(true);
    try {
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('household_id', household.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      const expenses = (expenseData as Expense[]) ?? [];

      if (expenses.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      // Fetch profiles for new items
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

      const newItems: HistoryItem[] = [];
      for (const e of expenses) {
        newItems.push({
          type: 'expense',
          data: e,
          payerName: profileMap[e.paid_by]?.display_name ?? 'Unknown',
        });
      }
      // Merge with existing, re-sort, re-group
      const merged = [...historyItems, ...newItems].sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() -
          new Date(a.data.created_at).getTime()
      );

      setHistoryItems(merged);
      setGroupedHistory(buildGroups(merged));
      setOffset((prev) => prev + BATCH_SIZE);
      setHasMore(expenses.length === BATCH_SIZE);
    } catch (err) {
      console.error('Error loading more expenses:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, household?.id, offset, historyItems]);

  // Refetch on screen focus (cached - skips if data is < 30s old)
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
    deps: [household?.id],
  });

  // -------------------------------------------------------------------------
  // Realtime subscription for expenses table
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!household?.id) return;

    const channel = supabase
      .channel(`expenses:${household.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `household_id=eq.${household.id}`,
        },
        () => {
          // Refetch all data on any expense change — expenses have profile
          // lookups and balance recalculations that are easier to refetch
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household?.id, fetchData]);

  // ---------- Inline expand for expense splits ----------

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
              .select('id, display_name, avatar_url')
              .in('id', splitUserIds);

            const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
            if (profiles) {
              for (const p of profiles) {
                profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
              }
            }

            const splitsWithProfiles: SplitWithProfile[] = splitsData.map(
              (s) => ({
                id: s.id,
                user_id: s.user_id,
                share_amount: String(s.share_amount),
                profile: profileMap[s.user_id] ?? null,
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

        // Fetch payer balances if not cached for this payer
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

  // ---------- Action handlers ----------

  const handleRemind = useCallback(
    async (memberName: string, amount: number) => {
      try {
        await Share.share({
          message: `Hey ${memberName}, you owe ${formatCurrency(amount)} on RoomY. Can you settle up?`,
        });
      } catch {
        // User cancelled share or share failed -- no action needed
      }
    },
    []
  );

  const handleSettle = useCallback(
    (userId: string, amount: number) => {
      router.push(
        `/(app)/expenses/settle?userId=${userId}&amount=${amount.toFixed(2)}&direction=you_owe` as never
      );
    },
    [router]
  );

  const handleMemberPress = useCallback(
    (userId: string) => {
      router.push(
        `/(app)/expenses/member-history?userId=${userId}` as never
      );
    },
    [router]
  );

  // ---------- Scroll handler for pagination ----------

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      if (
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - 200
      ) {
        loadMore();
      }
    },
    [loadMore]
  );

  // ---------- Loading state ----------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <BalanceSection
          balances={balances}
          currentUserId={user?.id ?? ''}
          onSettle={handleSettle}
          onRemind={handleRemind}
        />

        {members.length > 0 && (
          <RoommateSection
            members={members}
            onMemberPress={handleMemberPress}
          />
        )}

        {groupedHistory.length === 0 ? (
          <EmptyState
            onAddExpense={() => router.push('/(app)/expenses/add' as never)}
          />
        ) : (
          <HistorySection
            groups={groupedHistory}
            expandedId={expandedId}
            splitsCache={splitsCache}
            payerBalancesCache={payerBalancesCache}
            onExpensePress={handleExpensePress}
            currentUserId={user?.id ?? ''}
          />
        )}

        {loadingMore && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
