import { colors } from "@/lib/theme/colors";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerBackTitle: "Back" }} />
      <Stack.Screen
        name="expenses/add"
        options={{
          headerShown: true,
          title: "Add Expense",
          headerBackTitle: "Expenses",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="expenses/[id]"
        options={{
          headerShown: true,
          title: "Expense",
          headerBackTitle: "Expenses",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="expenses/settle"
        options={{
          headerShown: true,
          title: "Settle Up",
          headerBackTitle: "Expenses",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="expenses/member-history"
        options={{
          headerShown: true,
          title: "Member History",
          headerBackTitle: "Expenses",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={{
          headerShown: true,
          title: "Settings",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/profile"
        options={{
          headerShown: true,
          title: "Profile",
          headerBackTitle: "Settings",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/modules"
        options={{
          headerShown: true,
          title: "Modules",
          headerBackTitle: "Settings",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/members"
        options={{
          headerShown: true,
          title: "Members",
          headerBackTitle: "Settings",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="groceries/complete-trip"
        options={{
          headerShown: true,
          title: "Complete Trip",
          headerBackTitle: "Groceries",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="groceries/trip-history"
        options={{
          headerShown: true,
          title: "Trip History",
          headerBackTitle: "Groceries",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="chores/add"
        options={{
          headerShown: true,
          title: "Add Chore",
          headerBackTitle: "Chores",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="chores/swap-request"
        options={{
          headerShown: true,
          title: "Swap Requests",
          headerBackTitle: "Chores",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="chores/dashboard"
        options={{
          headerShown: true,
          title: "Chore Dashboard",
          headerBackTitle: "Chores",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="chores/dispute"
        options={{
          headerShown: true,
          title: "Dispute",
          headerBackTitle: "Chores",
          headerTintColor: colors.neutral.text,
          headerStyle: { backgroundColor: colors.neutral.bg },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
