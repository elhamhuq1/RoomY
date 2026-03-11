import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HouseholdChoiceScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface-50 px-8 pt-20">
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
          className="flex-row items-center rounded-2xl border-2 border-surface-200 bg-white p-6 shadow-sm active:border-primary-400 active:bg-primary-50"
          onPress={() => router.push("/(onboarding)/create-household")}
        >
          <View className="mr-5 h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Ionicons name="home-outline" size={32} color="#f9a825" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              Create a Household
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Start fresh and invite your roommates
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </Pressable>

        {/* Join with Invite Code */}
        <Pressable
          className="flex-row items-center rounded-2xl border-2 border-surface-200 bg-white p-6 shadow-sm active:border-primary-400 active:bg-primary-50"
          onPress={() => router.push("/(onboarding)/join-household")}
        >
          <View className="mr-5 h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Ionicons name="key-outline" size={32} color="#f9a825" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              I Have an Invite Code
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Join a household a roommate already created
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}
