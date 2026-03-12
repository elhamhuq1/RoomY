import { colors } from "@/lib/theme/colors";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, View } from "react-native";
import { useSession } from "@/lib/auth-context";
import { FAB } from "@/components/ui/FAB";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { householdSettings } = useSession();

  const groceriesEnabled = householdSettings?.groceries_enabled ?? false;
  const choresEnabled = householdSettings?.chores_enabled ?? false;

  const getFABConfig = () => {
    if (pathname.includes('/expenses')) return { icon: 'add', onPress: () => router.push('/(app)/expenses/add' as never) };
    if (pathname.includes('/chores')) return { icon: 'add', onPress: () => router.push('/(app)/chores/add' as never) };
    return null; // No FAB on home or groceries tab (groceries has inline add)
  };

  const fabConfig = getFABConfig();

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand.DEFAULT,
        tabBarInactiveTintColor: colors.neutral.tertiary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.neutral.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerShadowVisible: false,
        headerTintColor: colors.neutral.text,
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(app)/settings")}
            className="mr-4"
          >
            <Ionicons name="settings-outline" size={24} color={colors.neutral.tertiary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: "Groceries",
          href: groceriesEnabled ? "/(app)/(tabs)/groceries" : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() => router.push("/(app)/groceries/trip-history" as never)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="time-outline" size={24} color={colors.neutral.tertiary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/settings" as never)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="settings-outline" size={24} color={colors.neutral.tertiary} />
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
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Chore Actions Guide",
                    "✅  Complete — Mark your chore as done. It rotates to the next person.\n\n" +
                    "🤚  Claim — Volunteer to take over someone else's chore.\n\n" +
                    "🔄  Swap — Request to trade a chore with another member. They can accept or decline.\n\n" +
                    "🚩  Dispute — Flag a completion you think wasn't actually done. Auto-reverts after 24 hours.\n\n" +
                    "📊  Dashboard — See everyone's completion stats and streaks.",
                    [{ text: "Got it" }]
                  )
                }
                style={{ marginRight: 8 }}
              >
                <Ionicons name="information-circle-outline" size={24} color={colors.neutral.tertiary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/chores/swap-request" as never)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="swap-horizontal-outline" size={24} color={colors.neutral.tertiary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/chores/dashboard" as never)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="stats-chart-outline" size={24} color={colors.neutral.tertiary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/settings" as never)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="settings-outline" size={24} color={colors.neutral.tertiary} />
              </Pressable>
            </View>
          ),
        }}
      />
    </Tabs>
    {fabConfig && <FAB icon={fabConfig.icon} onPress={fabConfig.onPress} />}
    </View>
  );
}
