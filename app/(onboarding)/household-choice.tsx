import { colors } from "@/lib/theme/colors";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HouseholdChoiceScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-neutral-bg px-8 pt-20">
      {/* Header */}
      <View className="mb-12 items-center">
        <Text className="text-3xl font-bold text-gray-800">
          Set Up Your Home
        </Text>
        <Text className="mt-2 text-center text-base text-gray-500">
          How would you like to get started?
        </Text>
      </View>

      {/* Two equal-weight option cards */}
      <View className="flex-1 justify-center gap-5 pb-24">
        {/* Create a Household */}
        <Pressable
          className="flex-row items-center rounded-2xl border-2 border-neutral-border bg-white p-6 shadow-sm active:border-brand active:bg-brand-light"
          onPress={() => router.push("/(onboarding)/create-household")}
        >
          <View className="mr-5 h-16 w-16 items-center justify-center rounded-2xl bg-brand-light">
            <Ionicons name="home-outline" size={32} color={colors.brand.DEFAULT} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              Create a Household
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Start fresh and invite your roommates
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.neutral.tertiary} />
        </Pressable>

        {/* Join with Invite Code */}
        <Pressable
          className="flex-row items-center rounded-2xl border-2 border-neutral-border bg-white p-6 shadow-sm active:border-brand active:bg-brand-light"
          onPress={() => router.push("/(onboarding)/join-household")}
        >
          <View className="mr-5 h-16 w-16 items-center justify-center rounded-2xl bg-brand-light">
            <Ionicons name="key-outline" size={32} color={colors.brand.DEFAULT} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              I Have an Invite Code
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Join a household a roommate already created
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.neutral.tertiary} />
        </Pressable>
      </View>
    </View>
  );
}
