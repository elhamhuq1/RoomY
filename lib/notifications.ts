// Push notification utilities: token registration, permission handling, Android channels
// Source: Expo Notifications docs + Plan 04-03

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

/**
 * Register for push notifications and store token in profiles table.
 * Returns the Expo push token string, or null if registration fails
 * (not a physical device, permission denied, etc.).
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log(
      "Push notifications require a physical device. Skipping registration."
    );
    return null;
  }

  // Check existing permission
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted.");
    return null;
  }

  // Get Expo push token
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.log(
      "Push notifications: no EAS projectId found. " +
      "Push token registration requires an EAS-configured build. " +
      "Skipping registration."
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Store token in profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", userId);

    if (error) {
      console.error("Failed to store push token:", error.message);
    } else {
      console.log("Push token registered:", token);
    }

    return token;
  } catch (err) {
    console.error("Push token registration failed:", err);
    return null;
  }
}

/**
 * Set up Android notification channels for expenses and chores.
 * No-op on iOS (channels are Android-only).
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("expenses", {
    name: "Expenses",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3b82f6",
  });

  await Notifications.setNotificationChannelAsync("chores", {
    name: "Chore Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: "#22c55e",
  });
}
