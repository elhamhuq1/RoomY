import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings/index"
        options={{
          headerShown: true,
          title: "Settings",
          headerTintColor: "#f9a825",
          headerStyle: { backgroundColor: "#fefdfb" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/profile"
        options={{
          headerShown: true,
          title: "Profile",
          headerTintColor: "#f9a825",
          headerStyle: { backgroundColor: "#fefdfb" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/modules"
        options={{
          headerShown: true,
          title: "Modules",
          headerTintColor: "#f9a825",
          headerStyle: { backgroundColor: "#fefdfb" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings/members"
        options={{
          headerShown: true,
          title: "Members",
          headerTintColor: "#f9a825",
          headerStyle: { backgroundColor: "#fefdfb" },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
