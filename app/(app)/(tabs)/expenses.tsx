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
import type { Profile } from "@/lib/types/database";
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

type BalanceEntry = {
  user_id: string;
  net_amount: number;
  profile: Profile | null;
};

export default function ExpensesScreen() {
  const router = useRouter();
  const { household, user } = useSession();
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!household?.id) return;

    try {
      // Fetch computed balances from DB function
      const { data: balanceData, error: balanceError } = await supabase.rpc(
        "get_household_balances",
        { p_household_id: household.id }
      );

      if (balanceError) {
        console.error("Error fetching balances:", balanceError);
        setBalances([]);
        return;
      }

      if (!balanceData || balanceData.length === 0) {
        setBalances([]);
        return;
      }

      // Fetch profiles for all user_ids in balance results
      const userIds = balanceData.map(
        (b: { user_id: string; net_amount: number }) => b.user_id
      );
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const combined: BalanceEntry[] = balanceData.map(
        (b: { user_id: string; net_amount: number }) => ({
          user_id: b.user_id,
          net_amount: Number(b.net_amount),
          profile:
            (profilesData?.find((p) => p.id === b.user_id) as Profile) ?? null,
        })
      );

      setBalances(combined);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setBalances([]);
    }
  }, [household?.id]);

  // Refetch on screen focus (returning from add/settle screens)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBalances().finally(() => setLoading(false));
    }, [fetchBalances])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBalances();
    setRefreshing(false);
  }, [fetchBalances]);

  const owedToYou = balances.filter((b) => b.net_amount > 0);
  const youOwe = balances.filter((b) => b.net_amount < 0);
  const allSettled = balances.length === 0;

  function handleSettleUp(
    userId: string,
    amount: number,
    direction: "owed_to_you" | "you_owe"
  ) {
    router.push(
      `/(app)/expenses/settle?userId=${userId}&amount=${Math.abs(amount).toFixed(2)}&direction=${direction}` as never
    );
  }

  function handleVenmoRequest(venmoUsername: string, amount: number) {
    const username = venmoUsername.replace(/^@/, "");
    const note = `RoomY: Balance settlement for ${household?.name ?? "household"}`;
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
    <ScrollView
      className="flex-1 bg-surface-50"
      contentContainerClassName="px-4 pt-4 pb-24"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Balance Dashboard */}
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-3 text-lg font-bold text-gray-800">Balances</Text>

        {allSettled && !loading ? (
          /* Zero state */
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
            {/* Owed to you section */}
            {owedToYou.length > 0 && (
              <View className="mb-3">
                <Text className="mb-2 text-sm font-semibold text-green-600">
                  Owed to you
                </Text>
                {owedToYou.map((entry, index) => (
                  <View
                    key={entry.user_id}
                    className="mb-2 flex-row items-center rounded-xl bg-surface-50 p-3"
                  >
                    {/* Avatar */}
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

                    {/* Name and amount */}
                    <View className="mr-2 flex-1">
                      <Text className="text-sm font-medium text-gray-800">
                        {entry.profile?.display_name ?? "Unknown"}
                      </Text>
                      <Text className="text-base font-bold text-green-600">
                        {formatCurrency(entry.net_amount)}
                      </Text>
                    </View>

                    {/* Action buttons */}
                    <View className="flex-row gap-2">
                      {entry.profile?.venmo_username && (
                        <Pressable
                          className="rounded-lg px-3 py-2 active:opacity-70"
                          style={{ backgroundColor: "#3D95CE" }}
                          onPress={() =>
                            handleVenmoRequest(
                              entry.profile!.venmo_username!,
                              entry.net_amount
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
                          handleSettleUp(
                            entry.user_id,
                            entry.net_amount,
                            "owed_to_you"
                          )
                        }
                      >
                        <Text className="text-xs font-semibold text-white">
                          Settle Up
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* You owe section */}
            {youOwe.length > 0 && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-red-500">
                  You owe
                </Text>
                {youOwe.map((entry, index) => (
                  <View
                    key={entry.user_id}
                    className="mb-2 flex-row items-center rounded-xl bg-surface-50 p-3"
                  >
                    {/* Avatar */}
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

                    {/* Name and amount */}
                    <View className="mr-2 flex-1">
                      <Text className="text-sm font-medium text-gray-800">
                        {entry.profile?.display_name ?? "Unknown"}
                      </Text>
                      <Text className="text-base font-bold text-red-500">
                        {formatCurrency(Math.abs(entry.net_amount))}
                      </Text>
                    </View>

                    {/* Settle Up button */}
                    <Pressable
                      className="rounded-lg bg-primary-500 px-3 py-2 active:bg-primary-600"
                      onPress={() =>
                        handleSettleUp(
                          entry.user_id,
                          entry.net_amount,
                          "you_owe"
                        )
                      }
                    >
                      <Text className="text-xs font-semibold text-white">
                        Settle Up
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Expense History placeholder - Plan 02-02 will replace this */}
      <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
        <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
        <Text className="mt-3 text-base font-medium text-gray-400">
          Expense history
        </Text>
        <Text className="mt-1 text-center text-sm text-gray-300">
          Loading expense history...
        </Text>
      </View>
    </ScrollView>
  );
}
