import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ExpensesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50 px-8">
      <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary-100">
        <Ionicons name="wallet" size={48} color="#f9a825" />
      </View>
      <Text className="text-2xl font-bold text-gray-800">Expenses</Text>
      <Text className="mt-3 text-center text-base leading-6 text-gray-500">
        Split bills and track who owes what. Coming in Phase 2!
      </Text>
    </View>
  );
}
