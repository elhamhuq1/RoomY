import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { Avatar } from "@/components/ui";

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
  const { user, profile, household, signOut } = useSession();

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
      key: "notifications",
      title: "Notifications",
      subtitle: "Manage push notification preferences",
      icon: "notifications-outline",
      route: "/(app)/settings/notifications",
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
    <View className="flex-1 bg-neutral-bg px-6 pt-6">
      {/* User card */}
      <View className="mb-6 flex-row items-center rounded-card bg-transparent border border-neutral-border p-5">
        <View className="mr-4">
          <Avatar
            userId={user?.id ?? ""}
            name={profile?.display_name ?? "?"}
            size="lg"
            avatarUrl={profile?.avatar_url}
          />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-heading-semi text-gray-800">
            {profile?.display_name ?? "Your Profile"}
          </Text>
          <Text className="font-sans text-sm text-gray-400">
            {household?.name ?? "No household"}
          </Text>
        </View>
      </View>

      {/* Settings rows */}
      <View className="rounded-card bg-transparent border border-neutral-border">
        {rows.map((row, index) => (
          <Pressable
            key={row.key}
            className={`flex-row items-center px-5 py-4 active:bg-neutral-surface ${
              index < rows.length - 1 ? "border-b border-neutral-border" : ""
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
                row.destructive ? "bg-red-50" : "bg-neutral-surface"
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
                <Text className="font-sans text-sm text-gray-400">{row.subtitle}</Text>
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
