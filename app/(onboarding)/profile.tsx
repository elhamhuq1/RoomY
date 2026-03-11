import { View, Text } from "react-native";

export default function ProfileSetupScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50">
      <Text className="text-2xl font-bold text-primary-500">Profile Setup</Text>
      <Text className="mt-4 text-lg text-gray-600">
        Tell us about yourself
      </Text>
    </View>
  );
}
