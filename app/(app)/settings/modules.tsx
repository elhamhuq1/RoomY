import { colors } from "@/lib/theme/colors";
import { useState } from "react";
import {
  View,
  Text,
  Switch,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

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

export default function ModuleSettingsScreen() {
  const { user, household, householdSettings, refreshProfile } = useSession();
  const [groceriesEnabled, setGroceriesEnabled] = useState(
    householdSettings?.groceries_enabled ?? false
  );
  const [choresEnabled, setChoresEnabled] = useState(
    householdSettings?.chores_enabled ?? false
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  function getToggleValue(key: string): boolean {
    switch (key) {
      case "expenses":
        return true;
      case "groceries":
        return groceriesEnabled;
      case "chores":
        return choresEnabled;
      default:
        return false;
    }
  }

  async function handleToggle(key: string) {
    if (!household?.id) return;

    setError("");
    setSaving(key);

    let newGroceries = groceriesEnabled;
    let newChores = choresEnabled;

    switch (key) {
      case "groceries":
        newGroceries = !groceriesEnabled;
        setGroceriesEnabled(newGroceries);
        break;
      case "chores":
        newChores = !choresEnabled;
        setChoresEnabled(newChores);
        break;
    }

    try {
      const { error: updateError } = await supabase
        .from("household_settings")
        .update({
          groceries_enabled: newGroceries,
          chores_enabled: newChores,
          updated_by: user!.id,
        })
        .eq("household_id", household.id);

      if (updateError) {
        // Revert on error
        switch (key) {
          case "groceries":
            setGroceriesEnabled(!newGroceries);
            break;
          case "chores":
            setChoresEnabled(!newChores);
            break;
        }
        setError(updateError.message);
        return;
      }

      // Refresh context so tab bar updates immediately
      await refreshProfile();
    } catch {
      // Revert on error
      switch (key) {
        case "groceries":
          setGroceriesEnabled(!newGroceries);
          break;
        case "chores":
          setChoresEnabled(!newChores);
          break;
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <View className="flex-1 bg-neutral-bg">
      <ScrollView
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header text */}
        <Text className="mb-2 text-base text-gray-500">
          Toggle modules on or off. Changes apply immediately.
        </Text>
        <Text className="mb-6 text-sm text-gray-400">
          Any household member can change these settings.
        </Text>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Module toggle cards */}
        <View className="gap-4">
          {MODULES.map((mod) => {
            const isOn = getToggleValue(mod.key);
            const isSaving = saving === mod.key;
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
                <View className="mr-3 flex-1">
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

                {/* Toggle or saving indicator */}
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
                ) : (
                  <Switch
                    value={isOn}
                    onValueChange={() => handleToggle(mod.key)}
                    disabled={mod.locked || saving !== null}
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
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
