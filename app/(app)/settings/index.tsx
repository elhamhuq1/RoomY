import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";

type SettingsRow = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  destructive?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, household, signOut } = useSession();

  function handleSignOut() {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const rows: SettingsRow[] = [
    {
      key: "profile",
      title: "Profile",
      subtitle: profile?.display_name ?? "Set up your profile",
      icon: "person-outline",
      route: "/(app)/settings/profile",
    },
    {
      key: "members",
      title: "Members",
      subtitle: "Manage household & invite code",
      icon: "people-outline",
      route: "/(app)/settings/members",
    },
    {
      key: "signout",
      title: "Sign Out",
      subtitle: "",
      icon: "log-out-outline",
      action: handleSignOut,
      destructive: true,
    },
  ];

  return (
    <View className="flex-1 bg-surface-50 px-6 pt-6">
      {/* User card */}
      <View className="mb-6 flex-row items-center rounded-2xl bg-white p-5 shadow-sm">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-primary-500">
          <Text className="text-lg font-bold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">
            {profile?.display_name ?? "Your Profile"}
          </Text>
          <Text className="text-sm text-gray-400">
            {household?.name ?? "No household"}
          </Text>
        </View>
      </View>

      {/* Settings rows */}
      <View className="rounded-2xl bg-white shadow-sm">
        {rows.map((row, index) => (
          <Pressable
            key={row.key}
            className={`flex-row items-center px-5 py-4 active:bg-surface-100 ${
              index < rows.length - 1 ? "border-b border-surface-200" : ""
            }`}
            onPress={() => {
              if (row.action) {
                row.action();
              } else if (row.route) {
                router.push(row.route as never);
              }
            }}
          >
            <View
              className={`mr-4 h-10 w-10 items-center justify-center rounded-xl ${
                row.destructive ? "bg-red-50" : "bg-surface-100"
              }`}
            >
              <Ionicons
                name={row.icon}
                size={22}
                color={row.destructive ? "#ef4444" : "#6b7280"}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`text-base font-medium ${
                  row.destructive ? "text-red-500" : "text-gray-800"
                }`}
              >
                {row.title}
              </Text>
              {row.subtitle ? (
                <Text className="text-sm text-gray-400">{row.subtitle}</Text>
              ) : null}
            </View>
            {!row.destructive && (
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
