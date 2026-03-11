import { View, Text } from "react-native";

export default function DashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50">
      <Text className="text-2xl font-bold text-primary-500">Dashboard</Text>
      <Text className="mt-4 text-lg text-gray-600">
        Your household at a glance
      </Text>
    </View>
  );
}
