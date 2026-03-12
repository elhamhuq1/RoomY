import { colors } from "@/lib/theme/colors";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, DateData } from "react-native-calendars";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Profile, Expense, Chore } from "@/lib/types/database";
import {
  buildMarkedDates,
  getEventsForDate,
  type CalendarEvent,
} from "@/lib/calendar-utils";

import * as Clipboard from "expo-clipboard";

// Colors for member initials avatars
const AVATAR_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type MemberWithProfile = {
  user_id: string;
  role: "creator" | "member";
  profiles: Profile;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { household, householdSettings, user } = useSession();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);

  const inviteCode = household?.invite_code ?? "";
  const formattedCode = inviteCode
    ? inviteCode.slice(0, 4) + " " + inviteCode.slice(4)
    : "";

  const fetchMembers = useCallback(async () => {
    if (!household?.id) return;

    const { data: membersData } = await supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", household.id);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const combined = membersData.map((member) => ({
        ...member,
        profiles: (profilesData?.find((p) => p.id === member.user_id) as Profile) ?? {
          id: member.user_id,
          display_name: "Unknown",
        },
      })) as MemberWithProfile[];

      setMembers(combined);
    } else {
      setMembers([]);
    }
    setLoading(false);
  }, [household?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Fetch calendar data (expenses + chores for visible month)
  const fetchCalendarData = useCallback(async () => {
    if (!household?.id) return;

    const monthStart = startOfMonth(currentMonth).toISOString();
    const monthEnd = endOfMonth(currentMonth).toISOString();

    const [expensesRes, choresRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("household_id", household.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd),
      supabase
        .from("chores")
        .select("*")
        .eq("household_id", household.id)
        .eq("is_active", true),
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (choresRes.data) setChores(choresRes.data as Chore[]);
  }, [household?.id, currentMonth]);

  // Refetch calendar data when month changes
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Refresh calendar data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [fetchCalendarData])
  );

  // Compute marked dates for calendar
  const markedDates = useMemo(() => {
    const marks = buildMarkedDates(expenses, chores, currentMonth);
    // Add selected date highlight
    if (!marks[selectedDate]) {
      marks[selectedDate] = { dots: [] };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.brand.DEFAULT,
    };
    return marks;
  }, [expenses, chores, currentMonth, selectedDate]);

  // Compute events for selected date
  const selectedDateEvents = useMemo(
    () => getEventsForDate(selectedDate, expenses, chores),
    [selectedDate, expenses, chores]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMembers(), fetchCalendarData()]);
    setRefreshing(false);
  }, [fetchMembers, fetchCalendarData]);

  async function handleShare() {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join my household on RoomY! Use code: ${inviteCode}`,
      });
    } catch {
      // User cancelled or share failed
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  const isSoloCreator = members.length <= 1;

  // Solo creator empty state
  if (isSoloCreator) {
    return (
      <ScrollView
        className="flex-1 bg-neutral-bg"
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friendly icon */}
        <View className="mb-6 items-center">
          <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-brand-light">
            <Ionicons name="people" size={56} color={colors.brand.DEFAULT} />
          </View>
          <Text className="text-3xl font-bold text-gray-800">
            Your household is ready!
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-gray-500">
            Share this invite code with your roommates so they can join{" "}
            <Text className="font-semibold text-gray-700">
              {household?.name}
            </Text>
          </Text>
        </View>

        {/* Invite code display */}
        <View className="mb-6 items-center rounded-2xl bg-white p-8 shadow-sm">
          <Text className="mb-2 text-sm font-medium text-gray-400">
            INVITE CODE
          </Text>
          <Text
            className="text-4xl font-bold tracking-widest text-brand-dark"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formattedCode}
          </Text>
          <Text className="mt-3 text-xs text-gray-400">
            Code expires in 7 days. You can regenerate it in Settings.
          </Text>
        </View>

        {/* Share button */}
        <Pressable
          className="mb-3 flex-row items-center justify-center rounded-2xl bg-brand-light0 py-4 active:bg-brand-dark"
          onPress={handleShare}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text className="text-lg font-bold text-white">
            Share with Roommates
          </Text>
        </Pressable>

        {/* Copy code button */}
        <Pressable
          className="flex-row items-center justify-center rounded-2xl border-2 border-brand py-4 active:bg-brand-light"
          onPress={handleCopyCode}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={20}
            color={colors.brand.DEFAULT}
            style={{ marginRight: 8 }}
          />
          <Text className="text-lg font-bold text-brand-dark">
            {copied ? "Copied!" : "Copy Code"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Normal state (2+ members)
  const groceriesEnabled = householdSettings?.groceries_enabled ?? false;
  const choresEnabled = householdSettings?.chores_enabled ?? false;

  type ModuleCardConfig = {
    key: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    status: string;
    route: string;
    enabled: boolean;
  };

  const moduleCards: ModuleCardConfig[] = [
    {
      key: "expenses",
      title: "Expenses",
      icon: "wallet",
      status: "No expenses yet",
      route: "/(app)/(tabs)/expenses",
      enabled: true,
    },
    ...(groceriesEnabled
      ? [
          {
            key: "groceries",
            title: "Groceries",
            icon: "cart" as keyof typeof Ionicons.glyphMap,
            status: "No items yet",
            route: "/(app)/(tabs)/groceries",
            enabled: true,
          },
        ]
      : []),
    ...(choresEnabled
      ? [
          {
            key: "chores",
            title: "Chores",
            icon: "checkbox" as keyof typeof Ionicons.glyphMap,
            status: "No chores yet",
            route: "/(app)/(tabs)/chores",
            enabled: true,
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      className="flex-1 bg-neutral-bg"
      contentContainerClassName="px-6 pt-6 pb-12"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Text className="text-2xl font-bold text-gray-800">
        {household?.name}
      </Text>

      {/* Member avatars row */}
      <View className="mt-4 flex-row items-center">
        {members.map((member, index) => (
          <View
            key={member.user_id}
            className="mr-3 items-center"
          >
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  AVATAR_COLORS[index % AVATAR_COLORS.length],
              }}
            >
              <Text className="text-sm font-bold text-white">
                {getInitials(
                  member.profiles?.display_name ?? "?"
                )}
              </Text>
            </View>
            <Text
              className="mt-1 text-xs text-gray-500"
              numberOfLines={1}
            >
              {member.profiles?.display_name?.split(" ")[0] ?? "?"}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar */}
      <View className="mt-6">
        <Text className="mb-3 text-lg font-semibold text-gray-700">
          Calendar
        </Text>
        <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            onMonthChange={(month: DateData) => {
              setCurrentMonth(new Date(month.year, month.month - 1, 1));
            }}
            enableSwipeMonths={true}
            theme={{
              calendarBackground: "#ffffff",
              todayTextColor: colors.brand.DEFAULT,
              selectedDayBackgroundColor: colors.brand.DEFAULT,
              selectedDayTextColor: "#ffffff",
              arrowColor: colors.brand.DEFAULT,
              dotStyle: { marginTop: 2 },
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />
        </View>

        {/* Day detail list */}
        <View className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          {selectedDateEvents.length > 0 ? (
            <ScrollView
              style={{ maxHeight: 280 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {selectedDateEvents.map((event) => (
                <Pressable
                  key={`${event.type}-${event.id}`}
                  className="flex-row items-center border-b border-neutral-border px-4 py-3 active:bg-neutral-bg"
                  onPress={() => router.push(event.deepLink as never)}
                >
                  <Ionicons
                    name={event.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={event.color}
                    style={{ marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-800">
                      {event.title}
                    </Text>
                    <Text className="text-sm text-gray-400">
                      {event.detail}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#d1d5db"
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-6">
              <Text className="text-sm text-gray-400">
                No events on this day
              </Text>
            </View>
          )}
        </View>

        {/* Color legend */}
        <View className="mt-3 flex-row items-center justify-center gap-6">
          <View className="flex-row items-center">
            <View className="mr-2 h-3 w-3 rounded-full bg-[#3b82f6]" />
            <Text className="text-xs text-gray-500">Expenses</Text>
          </View>
          <View className="flex-row items-center">
            <View className="mr-2 h-3 w-3 rounded-full bg-[#22c55e]" />
            <Text className="text-xs text-gray-500">Chores</Text>
          </View>
        </View>
      </View>

      {/* Module cards */}
      <Text className="mb-3 mt-6 text-lg font-semibold text-gray-700">
        Modules
      </Text>
      <View className="gap-3">
        {moduleCards.map((card) => (
          <Pressable
            key={card.key}
            className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm active:bg-neutral-surface"
            onPress={() => router.push(card.route as never)}
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-brand-light">
              <Ionicons name={card.icon} size={24} color={colors.brand.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                {card.title}
              </Text>
              <Text className="text-sm text-gray-400">{card.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
