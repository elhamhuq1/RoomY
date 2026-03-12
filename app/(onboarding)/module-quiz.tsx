import { colors } from "@/lib/theme/colors";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-context";

type ModuleConfig = {
  key: "expenses" | "groceries" | "chores";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  locked: boolean;
};

const MODULES: ModuleConfig[] = [
  {
    key: "expenses",
    title: "Expenses",
    description: "Split bills and track who owes what",
    icon: "wallet-outline",
    locked: true,
  },
  {
    key: "groceries",
    title: "Groceries",
    description: "Shared shopping list with cost splitting",
    icon: "cart-outline",
    locked: false,
  },
  {
    key: "chores",
    title: "Chores",
    description: "Fair chore rotation with effort tracking",
    icon: "brush-outline",
    locked: false,
  },
];

export default function ModuleQuizScreen() {
  const { user, refreshProfile } = useSession();
  const [groceriesEnabled, setGroceriesEnabled] = useState(false);
  const [choresEnabled, setChoresEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [householdId, setHouseholdId] = useState<string | null>(null);

  // Fetch the user's household ID
  useEffect(() => {
    async function fetchHouseholdId() {
      if (!user?.id) return;
      const { data } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setHouseholdId(data.household_id);
      }
    }
    fetchHouseholdId();
  }, [user?.id]);

  function getToggleValue(key: string): boolean {
    switch (key) {
      case "expenses":
        return true; // always on
      case "groceries":
        return groceriesEnabled;
      case "chores":
        return choresEnabled;
      default:
        return false;
    }
  }

  function handleToggle(key: string) {
    switch (key) {
      case "groceries":
        setGroceriesEnabled((v) => !v);
        break;
      case "chores":
        setChoresEnabled((v) => !v);
        break;
    }
  }

  async function handleContinue() {
    if (!householdId) {
      setError("Could not find your household. Please try again.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Save module settings
      const { error: updateError } = await supabase
        .from("household_settings")
        .update({
          groceries_enabled: groceriesEnabled,
          chores_enabled: choresEnabled,
          updated_by: user!.id,
        })
        .eq("household_id", householdId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Refresh auth context so household is non-null -> triggers redirect to (app)
      await refreshProfile();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        contentContainerClassName="flex-grow px-8 pt-20 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-gray-800">
            Choose Your Modules
          </Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            You can always change these later in Settings
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Module toggle cards */}
        <View className="mb-8 gap-4">
          {MODULES.map((mod) => {
            const isOn = getToggleValue(mod.key);
            return (
              <View
                key={mod.key}
                className={`flex-row items-center rounded-2xl border-2 bg-white p-5 shadow-sm ${
                  isOn ? "border-brand" : "border-neutral-border"
                }`}
              >
                {/* Icon */}
                <View
                  className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${
                    isOn ? "bg-brand-light" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name={mod.icon}
                    size={28}
                    color={isOn ? colors.brand.DEFAULT : colors.neutral.tertiary}
                  />
                </View>

                {/* Title + description */}
                <View className="flex-1 mr-3">
                  <Text className="text-lg font-bold text-gray-800">
                    {mod.title}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">
                    {mod.description}
                  </Text>
                  {mod.locked ? (
                    <Text className="mt-1 text-xs font-medium text-brand">
                      Always enabled
                    </Text>
                  ) : null}
                </View>

                {/* Toggle */}
                <Switch
                  value={isOn}
                  onValueChange={() => handleToggle(mod.key)}
                  disabled={mod.locked || loading}
                  trackColor={{
                    false: Platform.OS === "ios" ? undefined : "#d1d5db",
                    true: colors.brand.DEFAULT,
                  }}
                  thumbColor={
                    Platform.OS === "android"
                      ? isOn
                        ? "#fff"
                        : "#f4f3f4"
                      : undefined
                  }
                  ios_backgroundColor="#e5e7eb"
                />
              </View>
            );
          })}
        </View>

        {/* Continue button */}
        <Pressable
          className={`items-center rounded-2xl py-4 ${
            loading ? "bg-brand/50" : "bg-brand-light0 active:bg-brand-dark"
          }`}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">
              Let's Go!
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
