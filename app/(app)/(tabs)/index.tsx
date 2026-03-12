import { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
  isSameDay,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { useSession } from '@/lib/auth-context';
import { projectChoreDates } from '@/lib/calendar-utils';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme/colors';
import type { Profile, Expense, Chore } from '@/lib/types/database';

import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MembersCard } from '@/components/home/MembersCard';
import { BalanceSummaryCard } from '@/components/home/BalanceSummaryCard';
import CalendarSection from '@/components/home/CalendarSection';
import { AttentionFeed } from '@/components/home/AttentionFeed';
import { WeeklyTimeline } from '@/components/home/WeeklyTimeline';

type MemberWithProfile = {
  user_id: string;
  role: 'creator' | 'member';
  display_name: string;
};

type BalanceRow = {
  user_id: string;
  net_amount: number;
};

type DisputeRow = {
  id: string;
  chore_id: string;
  chores: { name: string };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { household, user, profile } = useSession();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const inviteCode = household?.invite_code ?? '';

  // ---------- Data fetching ----------

  const fetchAllData = useCallback(async () => {
    if (!household?.id) return;

    const monthStart = startOfMonth(parseISO(selectedDate)).toISOString();
    const monthEnd = endOfMonth(parseISO(selectedDate)).toISOString();

    const [membersRes, balancesRes, expensesRes, choresRes, disputesRes] =
      await Promise.all([
        // Members: two-query pattern (household_members + profiles, combine client-side)
        (async () => {
          const { data: membersData } = await supabase
            .from('household_members')
            .select('user_id, role')
            .eq('household_id', household.id);

          if (!membersData || membersData.length === 0) return [];

          const userIds = membersData.map((m) => m.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          return membersData.map((member) => {
            const p = profilesData?.find(
              (pr) => pr.id === member.user_id
            ) as Profile | undefined;
            return {
              user_id: member.user_id,
              role: member.role as 'creator' | 'member',
              display_name: p?.display_name ?? 'Unknown',
            };
          });
        })(),

        // Balances
        supabase
          .rpc('get_household_balances', { p_household_id: household.id })
          .then((r) => r.data ?? []),

        // Expenses (current month)
        supabase
          .from('expenses')
          .select('*')
          .eq('household_id', household.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)
          .then((r) => (r.data ?? []) as Expense[]),

        // Chores (active)
        supabase
          .from('chores')
          .select('*')
          .eq('household_id', household.id)
          .eq('is_active', true)
          .then((r) => (r.data ?? []) as Chore[]),

        // Pending disputes
        supabase
          .from('chore_completions')
          .select('id, chore_id, chores!inner(name)')
          .eq('is_disputed', true)
          .eq('is_reverted', false)
          .then((r) => (r.data ?? []) as unknown as DisputeRow[]),
      ]);

    setMembers(membersRes);
    setBalances(balancesRes as BalanceRow[]);
    setExpenses(expensesRes);
    setChores(choresRes);
    setDisputes(disputesRes);
    setLoading(false);
  }, [household?.id, selectedDate]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  // ---------- Derived data ----------

  const firstName = profile?.display_name?.split(' ')[0] ?? '';

  const membersList = useMemo(
    () =>
      members.map((m) => ({
        user_id: m.user_id,
        display_name: m.display_name,
      })),
    [members]
  );

  const myNetAmount = useMemo(() => {
    // Each balance row = pairwise net between current user and one other member.
    // Positive = they owe us, negative = we owe them. Sum = overall net position.
    return balances.reduce((sum, b) => sum + Number(b.net_amount), 0);
  }, [balances]);

  // Unsettled balances: members with non-zero balance relative to current user
  const unsettledBalances = useMemo(() => {
    return balances
      .filter((b) => b.user_id !== user?.id && Number(b.net_amount) !== 0)
      .map((b) => {
        const member = members.find((m) => m.user_id === b.user_id);
        // From current user's perspective: if another member has negative net_amount,
        // they owe the household (and potentially the current user).
        // Simplified: show the amount and let the card describe it.
        const amount = Number(b.net_amount);
        return {
          userId: b.user_id,
          displayName: member?.display_name ?? 'Unknown',
          // Negative net_amount = they owe; Positive = they are owed
          // From current user's perspective, invert: if they owe, it's positive for us
          amount: -amount,
        };
      })
      .filter((b) => b.amount !== 0);
  }, [balances, members, user?.id]);

  // Overdue chores
  const overdueChores = useMemo(() => {
    const now = new Date().toISOString();
    return chores
      .filter((c) => c.next_due_at < now)
      .map((c) => {
        const assignee = members.find((m) => m.user_id === c.current_assignee);
        return {
          id: c.id,
          name: c.name,
          assigneeName: assignee?.display_name ?? 'Unassigned',
        };
      });
  }, [chores, members]);

  // Pending disputes
  const pendingDisputes = useMemo(
    () =>
      disputes.map((d) => ({
        id: d.id,
        choreName: d.chores?.name ?? 'Unknown chore',
      })),
    [disputes]
  );

  // Chores due today
  const choresDueToday = useMemo(() => {
    const today = new Date();
    return chores
      .filter((c) => {
        const dueDate = parseISO(c.next_due_at);
        return isSameDay(dueDate, today) && !isBefore(dueDate, today);
      })
      .map((c) => {
        const assignee = members.find((m) => m.user_id === c.current_assignee);
        return {
          id: c.id,
          name: c.name,
          assigneeName: assignee?.display_name ?? 'Unassigned',
        };
      });
  }, [chores, members]);

  // Week chores for timeline (projected from recurring frequency)
  const weekChores = useMemo(() => {
    const selected = parseISO(selectedDate);
    const wStart = startOfWeek(selected, { weekStartsOn: 0 });
    const wEnd = endOfWeek(selected, { weekStartsOn: 0 });

    const entries: {
      id: string;
      name: string;
      assigneeId: string;
      assigneeName: string;
      dueDate: string;
      isCompleted: boolean;
    }[] = [];

    for (const chore of chores) {
      const projected = projectChoreDates(chore, selected);
      for (const dateStr of projected) {
        if (isWithinInterval(parseISO(dateStr), { start: wStart, end: wEnd })) {
          const assignee = members.find((m) => m.user_id === chore.current_assignee);
          entries.push({
            id: `${chore.id}-${dateStr}`,
            name: chore.name,
            assigneeId: chore.current_assignee ?? '',
            assigneeName: assignee?.display_name ?? 'Unassigned',
            dueDate: dateStr,
            isCompleted: chore.last_completed_at
              ? isSameDay(parseISO(chore.last_completed_at), parseISO(dateStr))
              : false,
          });
        }
      }
    }

    return entries;
  }, [chores, members, selectedDate]);

  // Determine if date filter is active (not today)
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const isDateFiltered = selectedDate !== todayString;

  // ---------- Navigation handlers ----------

  const handleSettleUp = useCallback(() => {
    router.push('/(app)/(tabs)/expenses' as never);
  }, [router]);

  const handleRequest = useCallback(() => {
    router.push('/(app)/(tabs)/expenses' as never);
  }, [router]);

  const handleBalanceCardPress = useCallback(() => {
    router.push('/(app)/(tabs)/expenses' as never);
  }, [router]);

  // ---------- Loading state ----------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  const isSoloCreator = members.length <= 1;

  // ---------- Solo creator state ----------

  if (isSoloCreator) {
    return (
      <ScrollView
        className="flex-1 bg-neutral-bg"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <GreetingHeader userName={firstName} />
        <MembersCard
          members={membersList}
          householdName={household?.name ?? ''}
          inviteCode={inviteCode}
        />
      </ScrollView>
    );
  }

  // ---------- Full dashboard ----------

  return (
    <ScrollView
      className="flex-1 bg-neutral-bg"
      contentContainerClassName="pb-12"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <GreetingHeader userName={firstName} />

      <MembersCard
        members={membersList}
        householdName={household?.name ?? ''}
        inviteCode={inviteCode}
      />

      <BalanceSummaryCard
        netAmount={myNetAmount}
        onSettleUp={handleSettleUp}
        onRequest={handleRequest}
        onCardPress={handleBalanceCardPress}
      />

      <View className="mt-4 px-5">
        <CalendarSection
          expenses={expenses}
          chores={chores}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </View>

      <AttentionFeed
        unsettledBalances={unsettledBalances}
        overdueChores={overdueChores}
        pendingDisputes={pendingDisputes}
        choresDueToday={choresDueToday}
      />

      <WeeklyTimeline
        chores={weekChores}
        selectedDate={isDateFiltered ? selectedDate : null}
      />
    </ScrollView>
  );
}
