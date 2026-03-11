import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types/database";

// Colors for avatar
const AVATAR_COLORS = [
  "#f9a825",
  "#66bb6a",
  "#42a5f5",
  "#ab47bc",
  "#ef5350",
  "#26a69a",
  "#ff7043",
  "#5c6bc0",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export default function SettleScreen() {
  const router = useRouter();
  const { user, household } = useSession();
  const params = useLocalSearchParams<{
    userId: string;
    amount: string;
    direction: string;
    description?: string;
    date?: string;
  }>();

  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [amountText, setAmountText] = useState(params.amount ?? "0.00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [venmoSent, setVenmoSent] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const originalAmount = parseFloat(params.amount ?? "0");
  const direction = params.direction as "owed_to_you" | "you_owe";
  const otherUserId = params.userId ?? "";

  // Fetch the other person's profile
  useEffect(() => {
    async function fetchProfile() {
      if (!otherUserId) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single();
      if (data) {
        setOtherProfile(data as Profile);
      }
      setLoadingProfile(false);
    }
    fetchProfile();
  }, [otherUserId]);

  const parsedAmount = parseFloat(amountText) || 0;
  const isValidAmount = parsedAmount > 0;
  const exceedsOriginal = parsedAmount > originalAmount;

  function handleAmountChange(text: string) {
    // Allow digits and one decimal point, max 2 decimal places
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return; // Multiple decimal points
    if (parts[1] && parts[1].length > 2) return; // More than 2 decimal places
    setAmountText(cleaned);
    setError(null);
  }

  async function handleRecordPayment() {
    if (!isValidAmount || !user?.id || !household?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      // Determine payer and payee based on direction
      const paid_by = direction === "you_owe" ? user.id : otherUserId;
      const paid_to = direction === "you_owe" ? otherUserId : user.id;

      const { error: insertError } = await supabase
        .from("settlements")
        .insert({
          household_id: household.id,
          paid_by,
          paid_to,
          amount: parsedAmount,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Brief success state, then go back
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      setError("Failed to record payment. Please try again.");
      setSubmitting(false);
    }
  }

  function handleRequestVenmo() {
    if (!otherProfile?.venmo_username) return;

    const username = otherProfile.venmo_username.replace(/^@/, "");
    const desc = params.description?.replace(/\+/g, ' ') ?? '';
    const note = desc && params.date
      ? `${desc} - ${new Date(params.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}`
      : `RoomY: Settlement for ${household?.name ?? "household"}`;
    const url = `https://venmo.com/${username}?txn=charge&amount=${parsedAmount.toFixed(2)}&note=${encodeURIComponent(note)}`;

    Linking.openURL(url);
    setVenmoSent(true);
  }

  const otherName = otherProfile?.display_name ?? "Roommate";

  if (loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 px-8">
        <Ionicons name="checkmark-circle" size={72} color="#66bb6a" />
        <Text className="mt-4 text-xl font-bold text-gray-800">
          Payment Recorded!
        </Text>
        <Text className="mt-2 text-base text-gray-500">
          {formatCurrency(parsedAmount)} settled with {otherName}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header area with avatar and name */}
        <View className="mb-6 items-center">
          <View
            className="mb-3 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: AVATAR_COLORS[0] }}
          >
            <Text className="text-2xl font-bold text-white">
              {getInitials(otherName)}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-800">{otherName}</Text>
        </View>

        {/* Direction label */}
        <View className="mb-6 items-center">
          <Text className="text-base text-gray-500">
            {direction === "you_owe"
              ? `You owe ${otherName}`
              : `${otherName} owes you`}
          </Text>
          <Text className="mt-1 text-sm text-gray-400">
            Original balance: {formatCurrency(originalAmount)}
          </Text>
        </View>

        {/* Amount field */}
        <View className="mb-2 rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Settlement Amount
          </Text>
          <View className="flex-row items-center">
            <Text className="mr-1 text-3xl font-bold text-gray-800">$</Text>
            <TextInput
              className="flex-1 text-3xl font-bold text-gray-800"
              value={amountText}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#d1d5db"
              selectTextOnFocus
            />
          </View>
          {exceedsOriginal && (
            <Text className="mt-2 text-xs text-yellow-600">
              This exceeds the outstanding balance of{" "}
              {formatCurrency(originalAmount)}. You can still proceed if
              pre-paying.
            </Text>
          )}
        </View>

        {/* Error message */}
        {error && (
          <View className="mb-4 rounded-xl bg-red-50 p-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="mt-4 gap-3">
          {/* Record Payment - primary */}
          <Pressable
            className={`flex-row items-center justify-center rounded-2xl py-4 ${
              !isValidAmount || submitting
                ? "bg-gray-300"
                : "bg-primary-500 active:bg-primary-600"
            }`}
            onPress={handleRecordPayment}
            disabled={!isValidAmount || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-lg font-bold text-white">
                  {venmoSent ? "Mark as Settled" : "Record Payment"}
                </Text>
              </>
            )}
          </Pressable>

          {/* Request via Venmo - secondary */}
          {otherProfile?.venmo_username ? (
            <Pressable
              className="flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
              style={{ backgroundColor: "#3D95CE" }}
              onPress={handleRequestVenmo}
              disabled={!isValidAmount || submitting}
            >
              <Ionicons
                name="logo-venmo"
                size={22}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text className="text-lg font-bold text-white">
                Request via Venmo
              </Text>
            </Pressable>
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-gray-200 py-4">
              <Text className="text-sm text-gray-400">
                {otherName} hasn&apos;t added their Venmo username yet
              </Text>
            </View>
          )}
        </View>

        {/* Venmo return state */}
        {venmoSent && (
          <View className="mt-4 rounded-2xl bg-blue-50 p-4">
            <Text className="text-center text-sm text-blue-700">
              Returned from Venmo? Tap &quot;Mark as Settled&quot; above to
              record the payment in RoomY.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
