import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile, Expense, Settlement } from "@/lib/types/database";
import * as Linking from "expo-linking";

// Colors for member initials avatars
const AVATAR_COLORS = [
  "#f9a825",
  "#66bb6a",
  "#42a5f5",
  "#ab47bc",
  "#ef5350",
  "#26a69a",
  "#ff7043",
  "#5c6bc0",
];

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

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type BalanceEntry = {
  user_id: string;
  net_amount: number;
  profile: Profile | null;
};

type HistoryItem =
  | { type: "expense"; data: Expense; payerName: string }
  | {
      type: "settlement";
      data: Settlement;
      paidByName: string;
      paidToName: string;
    };

type GroupedHistory = {
  label: string;
  items: HistoryItem[];
};

export default function ExpensesScreen() {
  const router = useRouter();
  const { household, user } = useSession();
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!household?.id) return;

    try {
      // Fetch balances, expenses, and settlements in parallel
      const [balanceResult, expenseResult, settlementResult] = await Promise.all(
        [
          supabase.rpc("get_household_balances", {
            p_household_id: household.id,
          }),
          supabase
            .from("expenses")
            .select("*")
            .eq("household_id", household.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("settlements")
            .select("*")
            .eq("household_id", household.id)
            .order("created_at", { ascending: false }),
        ]
      );

      // Process balances
      const balanceData = balanceResult.data;
      if (balanceData && balanceData.length > 0) {
        const balUserIds = balanceData.map(
          (b: { user_id: string }) => b.user_id
        );
        const { data: balProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", balUserIds);

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
      const settlements = (settlementResult.data as Settlement[]) ?? [];

      const profileIdSet = new Set<string>();
      for (const e of expenses) {
        profileIdSet.add(e.paid_by);
      }
      for (const s of settlements) {
        profileIdSet.add(s.paid_by);
        profileIdSet.add(s.paid_to);
      }
      const profileIds = Array.from(profileIdSet);

      let profileMap: Record<string, Profile> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = p as Profile;
          }
        }
      }

      // Build combined history items
      const historyItems: HistoryItem[] = [];

      for (const e of expenses) {
        historyItems.push({
          type: "expense",
          data: e,
          payerName:
            profileMap[e.paid_by]?.display_name ?? "Unknown",
        });
      }

      for (const s of settlements) {
        historyItems.push({
          type: "settlement",
          data: s,
          paidByName:
            profileMap[s.paid_by]?.display_name ?? "Unknown",
          paidToName:
            profileMap[s.paid_to]?.display_name ?? "Unknown",
        });
      }

      // Sort by created_at descending
      historyItems.sort((a, b) => {
        const dateA =
          a.type === "expense" ? a.data.created_at : a.data.created_at;
        const dateB =
          b.type === "expense" ? b.data.created_at : b.data.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      // Group by date
      const groups: GroupedHistory[] = [];
      let currentLabel = "";
      let currentItems: HistoryItem[] = [];

      for (const item of historyItems) {
        const createdAt =
          item.type === "expense"
            ? item.data.created_at
            : item.data.created_at;
        const label = getDateLabel(createdAt);
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

      setGroupedHistory(groups);
    } catch (err) {
      console.error("Error fetching expense data:", err);
      setBalances([]);
      setGroupedHistory([]);
    }
  }, [household?.id]);

  // Refetch on screen focus (returning from add/edit/settle screens)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const owedToYou = balances.filter((b) => b.net_amount > 0);
  const youOwe = balances.filter((b) => b.net_amount < 0);
  const allSettled = balances.length === 0;

  function getRecentExpenseForUser(userId: string): { description: string; date: string } | null {
    for (const group of groupedHistory) {
      for (const item of group.items) {
        if (item.type === 'expense') {
          if (item.data.paid_by === userId || item.data.paid_by === user?.id) {
            return {
              description: item.data.description,
              date: item.data.created_at,
            };
          }
        }
      }
    }
    return null;
  }

  function handleVenmoRequest(venmoUsername: string, amount: number, description?: string, date?: string) {
    const username = venmoUsername.replace(/^@/, "");
    const note = description && date
      ? `${description} - ${new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}`
      : `RoomY: Balance settlement for ${household?.name ?? "household"}`;
    const encodedNote = encodeURIComponent(note);
    const url = `https://venmo.com/${username}?txn=charge&amount=${Math.abs(amount).toFixed(2)}&note=${encodedNote}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Dashboard */}
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-3 text-lg font-bold text-gray-800">
            Balances
          </Text>

          {allSettled ? (
            <View className="items-center py-6">
              <Ionicons name="checkmark-circle" size={56} color="#66bb6a" />
              <Text className="mt-3 text-lg font-semibold text-gray-700">
                All settled up!
              </Text>
              <Text className="mt-1 text-sm text-gray-400">
                No outstanding balances with your roommates.
              </Text>
            </View>
          ) : (
            <View>
              {/* Owed to you */}
              {owedToYou.length > 0 && (
                <View className="mb-3">
                  <Text className="mb-2 text-sm font-semibold text-green-600">
                    Owed to you
                  </Text>
                  {owedToYou.map((entry, index) => {
                    const recentExpense = getRecentExpenseForUser(entry.user_id);
                    return (
                    <View
                      key={entry.user_id}
                      className="mb-2 flex-row items-center rounded-xl bg-surface-50 p-3"
                    >
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            AVATAR_COLORS[index % AVATAR_COLORS.length],
                        }}
                      >
                        <Text className="text-xs font-bold text-white">
                          {getInitials(
                            entry.profile?.display_name ?? "Unknown"
                          )}
                        </Text>
                      </View>
                      <View className="mr-2 flex-1">
                        <Text className="text-sm font-medium text-gray-800">
                          {entry.profile?.display_name ?? "Unknown"}
                        </Text>
                        <Text className="text-base font-bold text-green-600">
                          {formatCurrency(entry.net_amount)}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        {entry.profile?.venmo_username && (
                          <Pressable
                            className="rounded-lg px-3 py-2 active:opacity-70"
                            style={{ backgroundColor: "#3D95CE" }}
                            onPress={() =>
                              handleVenmoRequest(
                                entry.profile!.venmo_username!,
                                entry.net_amount,
                                recentExpense?.description,
                                recentExpense?.date
                              )
                            }
                          >
                            <Text className="text-xs font-semibold text-white">
                              Request
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          className="rounded-lg bg-primary-500 px-3 py-2 active:bg-primary-600"
                          onPress={() =>
                            router.push(
                              `/(app)/expenses/settle?userId=${entry.user_id}&amount=${Math.abs(entry.net_amount).toFixed(2)}&direction=owed_to_you${recentExpense ? `&description=${encodeURIComponent(recentExpense.description)}&date=${encodeURIComponent(recentExpense.date)}` : ''}` as never
                            )
                          }
                        >
                          <Text className="text-xs font-semibold text-white">
                            Settle Up
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    );
                  })}
                </View>
              )}

              {/* You owe */}
              {youOwe.length > 0 && (
                <View>
                  <Text className="mb-2 text-sm font-semibold text-red-500">
                    You owe
                  </Text>
                  {youOwe.map((entry, index) => {
                    const recentExpense = getRecentExpenseForUser(entry.user_id);
                    return (
                    <View
                      key={entry.user_id}
                      className="mb-2 flex-row items-center rounded-xl bg-surface-50 p-3"
                    >
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            AVATAR_COLORS[
                              (index + owedToYou.length) % AVATAR_COLORS.length
                            ],
                        }}
                      >
                        <Text className="text-xs font-bold text-white">
                          {getInitials(
                            entry.profile?.display_name ?? "Unknown"
                          )}
                        </Text>
                      </View>
                      <View className="mr-2 flex-1">
                        <Text className="text-sm font-medium text-gray-800">
                          {entry.profile?.display_name ?? "Unknown"}
                        </Text>
                        <Text className="text-base font-bold text-red-500">
                          {formatCurrency(Math.abs(entry.net_amount))}
                        </Text>
                      </View>
                      <Pressable
                        className="rounded-lg bg-primary-500 px-3 py-2 active:bg-primary-600"
                        onPress={() =>
                          router.push(
                            `/(app)/expenses/settle?userId=${entry.user_id}&amount=${Math.abs(entry.net_amount).toFixed(2)}&direction=you_owe${recentExpense ? `&description=${encodeURIComponent(recentExpense.description)}&date=${encodeURIComponent(recentExpense.date)}` : ''}` as never
                          )
                        }
                      >
                        <Text className="text-xs font-semibold text-white">
                          Settle Up
                        </Text>
                      </Pressable>
                    </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Expense History */}
        <Text className="mb-3 text-lg font-bold text-gray-800">History</Text>

        {groupedHistory.length === 0 ? (
          /* Empty state */
          <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="wallet-outline" size={40} color="#f9a825" />
            </View>
            <Text className="text-lg font-semibold text-gray-700">
              No expenses yet
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Add your first expense to start tracking.
            </Text>
          </View>
        ) : (
          groupedHistory.map((group) => (
            <View key={group.label} className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-400">
                {group.label}
              </Text>
              <View className="rounded-2xl bg-white shadow-sm">
                {group.items.map((item, idx) => {
                  const isLast = idx === group.items.length - 1;

                  if (item.type === "settlement") {
                    return (
                      <Pressable
                        key={item.data.id}
                        className={`flex-row items-center px-4 py-3 active:bg-surface-50 ${
                          !isLast ? "border-b border-gray-100" : ""
                        }`}
                        onPress={() =>
                          router.push(
                            `/(app)/expenses/${item.data.id}?type=settlement` as never
                          )
                        }
                      >
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-100">
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#66bb6a"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-gray-800">
                            {item.paidByName} paid {item.paidToName}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            Settlement
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-green-600">
                          {formatCurrency(Number(item.data.amount))}
                        </Text>
                      </Pressable>
                    );
                  }

                  return (
                    <Pressable
                      key={item.data.id}
                      className={`flex-row items-center px-4 py-3 active:bg-surface-50 ${
                        !isLast ? "border-b border-gray-100" : ""
                      }`}
                      onPress={() =>
                        router.push(
                          `/(app)/expenses/${item.data.id}` as never
                        )
                      }
                    >
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <Ionicons
                          name="receipt-outline"
                          size={20}
                          color="#f9a825"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-800">
                          {item.data.description}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          paid by {item.payerName}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-gray-700">
                        {formatCurrency(Number(item.data.amount))}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB - Add Expense */}
      <Pressable
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:bg-primary-600"
        style={{
          shadowColor: "#f9a825",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => router.push("/(app)/expenses/add" as never)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
