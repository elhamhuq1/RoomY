import { colors, AVATAR_COLORS } from "@/lib/theme/colors";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { ROOMS, ROOM_MAP } from "@/lib/constants/chore-rooms";
import { Avatar } from "@/components/ui";
import type { Profile, Room } from "@/lib/types/database";
import type { RoomInfo } from "@/lib/constants/chore-rooms";
import DateTimePicker from "@react-native-community/datetimepicker";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
  { value: "once", label: "One-time" },
] as const;

const EFFORT_LEVELS = [
  { value: 1 as const, label: "⚡1", sublabel: "Easy" },
  { value: 2 as const, label: "⚡2", sublabel: "Medium" },
  { value: 3 as const, label: "⚡3", sublabel: "Hard" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Frequency = "daily" | "weekly" | "monthly" | "custom" | "once";

interface MemberItem {
  userId: string;
  profile: Profile;
  selected: boolean;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AddChoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    suggestedName?: string;
    suggestedFrequency?: string;
    suggestedRoom?: string;
    suggestedEffort?: string;
  }>();
  const { user, household } = useSession();

  // Form state
  const [name, setName] = useState(params.suggestedName ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    (params.suggestedFrequency as Frequency) ?? "weekly"
  );
  const [customDays, setCustomDays] = useState("3");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Room state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Effort state
  const [effortPoints, setEffortPoints] = useState<1 | 2 | 3>(() => {
    const parsed = parseInt(params.suggestedEffort ?? "", 10);
    return parsed === 1 || parsed === 2 || parsed === 3 ? parsed : 1;
  });

  // Create room modal state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<string>("general");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // One-time date state
  const [oneTimeDate, setOneTimeDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // -------------------------------------------------------------------------
  // Room ordering helper — match ROOMS constant order, unknowns at end
  // -------------------------------------------------------------------------

  const sortRooms = useCallback((roomList: Room[]): Room[] => {
    const orderMap = new Map(ROOMS.map((r, i) => [r.id, i]));
    return [...roomList].sort((a, b) => {
      const aIdx = orderMap.get(a.room_type) ?? 999;
      const bIdx = orderMap.get(b.room_type) ?? 999;
      return aIdx - bIdx;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Fetch members (two-query pattern)
  // -------------------------------------------------------------------------

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

      if (profilesData) {
        const memberItems: MemberItem[] = (profilesData as Profile[]).map(
          (p) => ({
            userId: p.id,
            profile: p,
            selected: true, // all checked by default
          })
        );
        setMembers(memberItems);
      }
    }
    setLoadingMembers(false);
  }, [household?.id]);

  // -------------------------------------------------------------------------
  // Fetch rooms
  // -------------------------------------------------------------------------

  const fetchRooms = useCallback(async () => {
    if (!household?.id) return;

    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("household_id", household.id);

    if (data) {
      const typed = data as Room[];
      setRooms(sortRooms(typed));
      // Default: suggestedRoom param > General room > first room
      const general = typed.find((r) => r.room_type === "general");
      setSelectedRoomId(
        params.suggestedRoom || general?.id || typed[0]?.id || null
      );
    }
    setLoadingRooms(false);
  }, [household?.id, params.suggestedRoom, sortRooms]);

  useEffect(() => {
    fetchMembers();
    fetchRooms();
  }, [fetchMembers, fetchRooms]);

  // -------------------------------------------------------------------------
  // Toggle member selection
  // -------------------------------------------------------------------------

  const toggleMember = useCallback((userId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === userId ? { ...m, selected: !m.selected } : m
      )
    );
  }, []);

  // -------------------------------------------------------------------------
  // Create room
  // -------------------------------------------------------------------------

  const handleCreateRoom = useCallback(async () => {
    const trimmed = newRoomName.trim();
    if (!trimmed || !household?.id || !user?.id) return;

    setCreatingRoom(true);
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        household_id: household.id,
        name: trimmed,
        room_type: newRoomType,
        is_private: newRoomPrivate,
        created_by: user.id,
      })
      .select()
      .single();

    setCreatingRoom(false);

    if (error) {
      Alert.alert("Error", "Failed to create room. Please try again.");
      return;
    }

    const created = data as Room;
    setRooms((prev) => sortRooms([...prev, created]));
    setSelectedRoomId(created.id);
    setShowCreateRoom(false);
    setNewRoomName("");
    setNewRoomType("general");
    setNewRoomPrivate(false);
  }, [newRoomName, newRoomType, newRoomPrivate, household?.id, user?.id, sortRooms]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a chore name.");
      return;
    }
    if (!household?.id || !user?.id) return;

    if (!selectedRoomId) {
      Alert.alert("Room required", "Please select a room for this chore.");
      return;
    }

    const selectedMembers = isPrivateRoom
      ? [{ userId: user.id }]
      : members.filter((m) => m.selected);
    if (selectedMembers.length === 0) {
      Alert.alert(
        "Members required",
        "At least one member must be in the rotation."
      );
      return;
    }

    const customIntervalDays =
      frequency === "custom" ? parseInt(customDays, 10) || 3 : null;

    // Shuffle selected member IDs for random rotation order
    const shuffled = selectedMembers
      .map((m) => m.userId)
      .sort(() => Math.random() - 0.5);

    const firstAssignee = shuffled[0];

    // Compute first due date based on frequency
    let dueDate: Date;
    if (frequency === "once") {
      dueDate = oneTimeDate;
    } else {
      const now = new Date();
      dueDate = new Date(now);
      if (frequency === "daily") dueDate.setDate(dueDate.getDate() + 1);
      else if (frequency === "weekly") dueDate.setDate(dueDate.getDate() + 7);
      else if (frequency === "monthly") dueDate.setMonth(dueDate.getMonth() + 1);
      else if (frequency === "custom") dueDate.setDate(dueDate.getDate() + (parseInt(customDays, 10) || 3));
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("chores")
      .insert({
        household_id: household.id,
        name: trimmedName,
        frequency,
        custom_interval_days: customIntervalDays,
        rotation_order: shuffled,
        current_assignee_index: 0,
        current_assignee: firstAssignee,
        next_due_at: dueDate.toISOString(),
        created_by: user.id,
        room_id: selectedRoomId,
        effort_points: effortPoints,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", "Failed to create chore. Please try again.");
      return;
    }

    router.back();
  }, [name, frequency, customDays, members, household?.id, user?.id, router, selectedRoomId, effortPoints]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const selectedCount = members.filter((m) => m.selected).length;
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const isPrivateRoom = selectedRoom?.is_private === true;
  const canSubmit =
    name.trim().length > 0 &&
    (isPrivateRoom || selectedCount > 0) &&
    selectedRoomId !== null &&
    !submitting;

  const getRoomIcon = (roomType: string): string => {
    return ROOM_MAP[roomType]?.icon ?? "grid";
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Chore name */}
        <View className="px-4 pt-6">
          <Text className="mb-1 text-sm font-medium text-gray-500">
            Chore Name
          </Text>
          <TextInput
            className="font-sans rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
            placeholder="Chore name"
            placeholderTextColor={colors.neutral.tertiary}
            value={name}
            onChangeText={setName}
            autoFocus={false}
            returnKeyType="next"
          />
        </View>

        {/* Room picker */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">Room</Text>
          {loadingRooms ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.DEFAULT}
              style={{ marginTop: 4 }}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {/* + New Room pill (always first) */}
              <Pressable
                className="flex-row items-center rounded-xl border border-dashed border-gray-300 px-3.5 py-2.5"
                onPress={() => setShowCreateRoom(true)}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={colors.neutral.tertiary}
                  style={{ marginRight: 4 }}
                />
                <Text className="text-sm font-medium text-gray-500">
                  New Room
                </Text>
              </Pressable>
              {rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const icon = getRoomIcon(room.room_type);
                return (
                  <Pressable
                    key={room.id}
                    className={`flex-row items-center rounded-xl px-3.5 py-2.5 ${
                      isSelected
                        ? "bg-brand"
                        : "bg-white border border-gray-200"
                    }`}
                    onPress={() => setSelectedRoomId(room.id)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={16}
                      color={isSelected ? "#fff" : colors.neutral.tertiary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {room.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Frequency picker */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Frequency
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f.value}
                className={`items-center rounded-xl px-4 py-2.5 ${
                  frequency === f.value
                    ? "bg-brand"
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => setFrequency(f.value)}
              >
                <Text
                  className={`text-sm font-medium ${
                    frequency === f.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom interval input */}
          {frequency === "custom" && (
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="font-sans text-sm text-gray-500">Every</Text>
              <TextInput
                className="font-sans w-16 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-base text-gray-800"
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text className="font-sans text-sm text-gray-500">days</Text>
            </View>
          )}

          {/* One-time date picker */}
          {frequency === "once" && (
            <View className="mt-3">
              <Text className="font-sans mb-2 text-sm text-gray-500">Due date</Text>
              <Pressable
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => {
                  // Use native date input on Android; on iOS show inline picker
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.neutral.tertiary} style={{ marginRight: 8 }} />
                <Text className="font-sans text-base text-gray-800">
                  {oneTimeDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={oneTimeDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_event: any, selectedDate?: Date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setOneTimeDate(selectedDate);
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Effort picker */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Effort
          </Text>
          <View className="flex-row gap-2">
            {EFFORT_LEVELS.map((e) => {
              const isSelected = effortPoints === e.value;
              return (
                <Pressable
                  key={e.value}
                  className={`flex-1 items-center rounded-xl py-2.5 ${
                    isSelected
                      ? "bg-brand"
                      : "bg-white border border-gray-200"
                  }`}
                  onPress={() => setEffortPoints(e.value)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {e.label}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isSelected ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {e.sublabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Member selection — hidden for private rooms (owner-only) */}
        {!isPrivateRoom && (
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Rotation Members ({selectedCount} selected)
          </Text>

          {loadingMembers ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.DEFAULT}
              style={{ marginTop: 12 }}
            />
          ) : (
            <View className="overflow-hidden rounded-xl">
              {members.map((member, index) => (
                <Pressable
                  key={member.userId}
                  className={`flex-row items-center bg-white px-4 py-3 active:bg-gray-50 ${
                    index < members.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onPress={() => toggleMember(member.userId)}
                >
                  {/* Avatar */}
                  <View className="mr-3">
                    <Avatar
                      name={member.profile.display_name}
                      userId={member.userId}
                      avatarUrl={member.profile.avatar_url}
                      size="sm"
                    />
                  </View>

                  {/* Name */}
                  <Text className="font-sans flex-1 text-base text-gray-800">
                    {member.profile.display_name}
                    {member.userId === user?.id ? " (you)" : ""}
                  </Text>

                  {/* Checkbox */}
                  <Ionicons
                    name={member.selected ? "checkbox" : "square-outline"}
                    size={24}
                    color={member.selected ? colors.brand.DEFAULT : "#d1d5db"}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
        )}
      </ScrollView>

      {/* Submit button */}
      <View className="border-t border-neutral-border bg-[#F5F0EB] px-4 pb-6 pt-3">
        <Pressable
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            canSubmit
              ? "bg-brand active:bg-brand-dark"
              : "bg-gray-200"
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="add-circle"
                size={22}
                color={canSubmit ? "#fff" : colors.neutral.tertiary}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`text-lg font-heading ${
                  canSubmit ? "text-white" : "text-gray-400"
                }`}
              >
                Create Chore
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* Create Room Modal                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        visible={showCreateRoom}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateRoom(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowCreateRoom(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white pb-8 pt-4"
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-gray-300" />
            </View>

            <Text className="mb-4 px-6 text-lg font-heading text-gray-800">
              Create Room
            </Text>

            {/* Room name input */}
            <View className="mb-4 px-6">
              <Text className="mb-1 text-sm font-medium text-gray-500">
                Room Name
              </Text>
              <TextInput
                className="font-sans rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
                placeholder="e.g. Master Bedroom"
                placeholderTextColor={colors.neutral.tertiary}
                value={newRoomName}
                onChangeText={setNewRoomName}
              />
            </View>

            {/* Room type picker */}
            <View className="mb-4 px-6">
              <Text className="mb-2 text-sm font-medium text-gray-500">
                Room Type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {ROOMS.map((rt) => {
                  const isSelected = newRoomType === rt.id;
                  return (
                    <Pressable
                      key={rt.id}
                      className={`items-center rounded-xl px-3 py-2 ${
                        isSelected
                          ? "bg-brand"
                          : "bg-white border border-gray-200"
                      }`}
                      onPress={() => setNewRoomType(rt.id)}
                    >
                      <Ionicons
                        name={rt.icon as any}
                        size={20}
                        color={isSelected ? "#fff" : colors.neutral.tertiary}
                      />
                      <Text
                        className={`mt-0.5 text-xs font-medium ${
                          isSelected ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {rt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Private toggle */}
            <View className="mb-6 flex-row items-center justify-between px-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700">
                  Private Room
                </Text>
                <Text className="text-xs text-gray-400">
                  Only visible to you (e.g. your bedroom)
                </Text>
              </View>
              <Switch
                value={newRoomPrivate}
                onValueChange={setNewRoomPrivate}
                trackColor={{
                  false: "#d1d5db",
                  true: colors.brand.DEFAULT,
                }}
                thumbColor="#fff"
              />
            </View>

            {/* Create button */}
            <View className="px-6">
              <Pressable
                className={`items-center rounded-2xl py-3.5 ${
                  newRoomName.trim()
                    ? "bg-brand active:bg-brand-dark"
                    : "bg-gray-200"
                }`}
                onPress={handleCreateRoom}
                disabled={!newRoomName.trim() || creatingRoom}
              >
                {creatingRoom ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`text-base font-heading ${
                      newRoomName.trim() ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Create Room
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
