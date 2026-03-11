import { View, Text } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50">
      <Text className="text-3xl font-bold text-primary-500">Welcome to RoomY</Text>
      <Text className="mt-4 text-lg text-gray-600">
        Manage your household together
      </Text>
    </View>
  );
}
