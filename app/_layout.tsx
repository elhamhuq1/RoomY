// Root layout: AuthProvider + Stack with Protected guards + notification setup
// Source: Expo Router protected routes docs (Pattern 3 from RESEARCH.md)
import { colors } from "@/lib/theme/colors";
import "@/global.css";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useSession } from "@/lib/auth-context";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  registerForPushNotifications,
  setupNotificationChannels,
} from "@/lib/notifications";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Register push token and set up deep-link handler for notification taps. */
function useNotificationSetup(userId: string | undefined) {
  const router = useRouter();
  const responseListener = useRef<ReturnType<
    typeof Notifications.addNotificationResponseReceivedListener
  > | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Set up channels (Android) and register push token
    setupNotificationChannels().catch((err) =>
      console.error("Notification channel setup failed:", err)
    );
    registerForPushNotifications(userId).catch((err) =>
      console.error("Push token registration failed:", err)
    );

    // Listen for notification taps to deep-link into the app
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string | undefined
        >;
        if (data.type === "expense" && data.expenseId) {
          router.push(("/(app)/expenses/" + data.expenseId) as never);
        } else if (data.type === "chore") {
          router.push("/(app)/(tabs)/chores" as never);
        }
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId, router]);
}

function RootNavigator() {
  const { session, household, loading } = useSession();

  const isAuthenticated = !!session;
  const hasCompletedOnboarding = !!household;

  // Register push token and notification tap handler when authenticated
  useNotificationSetup(isAuthenticated ? session.user.id : undefined);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.neutral.bg }}>
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
