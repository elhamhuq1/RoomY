import { colors } from "@/lib/theme/colors";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-context";
import { Toggle, StepProgressBar } from "@/components/ui";
import { ONBOARDING_CREAM, ONBOARDING_IMAGES } from "@/lib/onboarding-images";

type ModuleConfig = {
  key: "expenses" | "groceries" | "chores";
  title: string;
  description: string;
  image: ImageSourcePropType;
  locked: boolean;
};

const MODULES: ModuleConfig[] = [
  {
    key: "expenses",
    title: "Expenses",
    description: "Split bills and track who owes what",
    image: ONBOARDING_IMAGES.expensesIcon,
    locked: true,
  },
  {
    key: "groceries",
    title: "Groceries",
    description: "Shared shopping list with cost splitting",
    image: ONBOARDING_IMAGES.groceriesIcon,
    locked: false,
  },
  {
    key: "chores",
    title: "Chores",
    description: "Fair chore rotation with effort tracking",
    image: ONBOARDING_IMAGES.choresIcon,
    locked: false,
  },
];

export default function ModuleQuizScreen() {
  const router = useRouter();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      <StepProgressBar
        currentStep={2}
        totalSteps={3}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 32,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + subtitle */}
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: colors.neutral.text,
              textAlign: "center",
            }}
          >
            Choose Your Modules
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.neutral.secondary,
              textAlign: "center",
              marginTop: 6,
            }}
          >
            Pick what you want to manage
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Module toggle cards */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {MODULES.map((mod) => {
            const isOn = getToggleValue(mod.key);
            return (
              <View
                key={mod.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
              >
                {/* Icon image */}
                <Image
                  source={mod.image}
                  style={{ width: 48, height: 48, marginRight: 14 }}
                  resizeMode="contain"
                />

                {/* Title + description */}
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: colors.neutral.text,
                    }}
                  >
                    {mod.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.neutral.secondary,
                      marginTop: 2,
                    }}
                  >
                    {mod.description}
                  </Text>
                  {mod.locked ? (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.brand.DEFAULT,
                        marginTop: 4,
                      }}
                    >
                      Always enabled
                    </Text>
                  ) : null}
                </View>

                {/* Toggle */}
                <Toggle
                  value={isOn}
                  onChange={() => handleToggle(mod.key)}
                  locked={mod.locked || loading}
                />
              </View>
            );
          })}
        </View>

        {/* Finish Setup button */}
        <Pressable
          className={`items-center rounded-2xl py-4 ${
            loading ? "bg-brand/50" : "bg-brand active:bg-brand-dark"
          }`}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">
              Finish Setup
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
