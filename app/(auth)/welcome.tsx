import { colors } from "@/lib/theme/colors";
import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const VALUE_PROPS = [
  {
    icon: "wallet-outline" as const,
    title: "Split Expenses Fairly",
    description:
      "Track shared costs and settle up with one tap. No more awkward money conversations.",
  },
  {
    icon: "cart-outline" as const,
    title: "Shared Grocery Lists",
    description:
      "Keep one list everyone can add to. Never buy duplicate milk again.",
  },
  {
    icon: "checkbox-outline" as const,
    title: "Chore Rotation",
    description:
      "Take turns fairly with automatic chore scheduling. Everyone does their part.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    },
    [width],
  );

  return (
    <View className="flex-1 bg-neutral-bg">
      {/* Header area */}
      <View className="items-center pt-20 pb-6">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-brand-light">
          <Ionicons name="home" size={40} color={colors.brand.DEFAULT} />
        </View>
        <Text className="text-4xl font-bold text-gray-800">RoomY</Text>
        <Text className="mt-2 text-lg text-gray-500">
          Living together, made easy
        </Text>
      </View>

      {/* Value prop carousel */}
      <View className="flex-1 justify-center">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {VALUE_PROPS.map((prop, index) => (
            <View
              key={index}
              style={{ width }}
              className="items-center justify-center px-8"
            >
              <View className="w-full items-center rounded-2xl bg-white p-8 shadow-sm">
                <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-brand-light">
                  <Ionicons name={prop.icon} size={44} color={colors.brand.DEFAULT} />
                </View>
                <Text className="mb-3 text-center text-2xl font-bold text-gray-800">
                  {prop.title}
                </Text>
                <Text className="text-center text-base leading-6 text-gray-500">
                  {prop.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Page indicator dots */}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          {VALUE_PROPS.map((_, index) => (
            <View
              key={index}
              className={`h-2.5 rounded-full ${
                index === activeIndex
                  ? "w-8 bg-brand"
                  : "w-2.5 bg-gray-300"
              }`}
            />
          ))}
        </View>
      </View>

      {/* CTA buttons */}
      <View className="px-8 pb-12 pt-6">
        <Pressable
          className="mb-4 items-center rounded-2xl bg-brand py-4 active:bg-brand-dark"
          onPress={() => router.push("/(auth)/sign-up")}
        >
          <Text className="text-lg font-bold text-white">Get Started</Text>
        </Pressable>

        <Pressable
          className="items-center py-3"
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text className="text-base text-gray-500">
            Already have an account?{" "}
            <Text className="font-semibold text-brand-dark">Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
