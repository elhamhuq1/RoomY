// Notification preferences: per-type toggles for expenses and chores
// Persists to notification_preferences table via upsert

import { colors } from "@/lib/theme/colors";
import { useEffect, useState } from "react";
import { View, Text, Switch, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function NotificationsSettingsScreen() {
  const { session } = useSession();
  const userId = session?.user?.id;

  const [expensesEnabled, setExpensesEnabled] = useState(true);
  const [choresEnabled, setChoresEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch current preferences on mount
  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("expenses_enabled, chores_enabled")
        .eq("user_id", userId)
        .single();

      if (data) {
        setExpensesEnabled(data.expenses_enabled);
        setChoresEnabled(data.chores_enabled);
      }
      // If no row exists, defaults are true (first visit)
      setLoading(false);
    })();
  }, [userId]);

  async function handleToggle(
    field: "expenses_enabled" | "chores_enabled",
    newValue: boolean
  ) {
    if (!userId) return;

    // Optimistic update
    const prevExpenses = expensesEnabled;
    const prevChores = choresEnabled;

    if (field === "expenses_enabled") {
      setExpensesEnabled(newValue);
    } else {
      setChoresEnabled(newValue);
    }

    const payload = {
      user_id: userId,
      expenses_enabled: field === "expenses_enabled" ? newValue : expensesEnabled,
      chores_enabled: field === "chores_enabled" ? newValue : choresEnabled,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(payload);

    if (error) {
      console.error("Failed to save notification preference:", error.message);
      // Revert on error
      setExpensesEnabled(prevExpenses);
      setChoresEnabled(prevChores);
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
    <View className="flex-1 bg-neutral-bg px-6 pt-6">
      {/* Toggle card */}
      <View className="rounded-card bg-transparent border border-neutral-border">
        {/* Expenses toggle */}
        <View className="flex-row items-center border-b border-neutral-border px-5 py-4">
          <View className="mr-4 h-10 w-10 items-center justify-center">
            <Image
              source={require('@/assets/expenses-icon.png')}
              style={{ width: 28, height: 28 }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-800">
              Expenses
            </Text>
            <Text className="font-sans text-sm text-gray-400">
              New expenses added by roommates
            </Text>
          </View>
          <Switch
            value={expensesEnabled}
            onValueChange={(val) => handleToggle("expenses_enabled", val)}
            trackColor={{ false: "#d1d5db", true: colors.brand.DEFAULT }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Chores toggle */}
        <View className="flex-row items-center px-5 py-4">
          <View className="mr-4 h-10 w-10 items-center justify-center">
            <Image
              source={require('@/assets/chores-tab-icon.png')}
              style={{ width: 28, height: 28 }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-800">Chores</Text>
            <Text className="font-sans text-sm text-gray-400">
              Reminders for chores due today
            </Text>
          </View>
          <Switch
            value={choresEnabled}
            onValueChange={(val) => handleToggle("chores_enabled", val)}
            trackColor={{ false: "#d1d5db", true: colors.brand.DEFAULT }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Info text */}
      <Text className="font-sans mt-4 px-2 text-sm leading-5 text-gray-400">
        Notifications are sent to this device only. Use your phone's settings to
        manage Do Not Disturb.
      </Text>
    </View>
  );
}
