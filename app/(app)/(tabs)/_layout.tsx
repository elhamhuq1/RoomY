import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useSession } from "@/lib/auth-context";

export default function TabsLayout() {
  const router = useRouter();
  const { householdSettings } = useSession();

  const groceriesEnabled = householdSettings?.groceries_enabled ?? false;
  const choresEnabled = householdSettings?.chores_enabled ?? false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f9a825",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fefdfb",
          borderTopColor: "#faf3e8",
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        headerStyle: {
          backgroundColor: "#fefdfb",
        },
        headerShadowVisible: false,
        headerTintColor: "#374151",
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(app)/settings")}
            className="mr-4"
          >
            <Ionicons name="settings-outline" size={24} color="#9ca3af" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: "Groceries",
          href: groceriesEnabled ? "/(app)/(tabs)/groceries" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() => router.push("/(app)/groceries/trip-history" as never)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="time-outline" size={24} color="#9ca3af" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/settings" as never)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="settings-outline" size={24} color="#9ca3af" />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          title: "Chores",
          href: choresEnabled ? "/(app)/(tabs)/chores" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
