import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { GroceryItem } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Quantity Stepper
// ---------------------------------------------------------------------------

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center rounded-lg bg-surface-100">
      <Pressable
        className="px-3 py-2 active:bg-surface-200"
        onPress={() => onChange(Math.max(1, value - 1))}
      >
        <Ionicons name="remove" size={16} color="#9ca3af" />
      </Pressable>
      <Text className="min-w-[20px] text-center text-sm font-semibold text-gray-800">
        {value}
      </Text>
      <Pressable
        className="px-3 py-2 active:bg-surface-200"
        onPress={() => onChange(value + 1)}
      >
        <Ionicons name="add" size={16} color="#9ca3af" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Swipe Delete Action
// ---------------------------------------------------------------------------

function RightSwipeAction({ onDelete }: { onDelete: () => void }) {
  return (
    <Pressable
      className="w-20 items-center justify-center bg-red-500"
      onPress={onDelete}
    >
      <Ionicons name="trash" size={22} color="#fff" />
      <Text className="mt-1 text-xs font-medium text-white">Delete</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function GroceriesScreen() {
  const router = useRouter();
  const { user, household } = useSession();

  // State
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    quantity: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const inputRef = useRef<TextInput>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchItems = useCallback(async () => {
    if (!household?.id) return;

    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("household_id", household.id)
      .is("trip_id", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as GroceryItem[]);
    }
    setLoading(false);
  }, [household?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // -------------------------------------------------------------------------
  // Realtime subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!household?.id) return;

    const channel = supabase
      .channel(`grocery-${household.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
          filter: `household_id=eq.${household.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as GroceryItem;
            // Only add active items (not archived)
            if (newItem.trip_id !== null) return;
            // Deduplicate: if item already exists (optimistic add), replace it
            setItems((prev) =>
              prev.some((i) => i.id === newItem.id)
                ? prev.map((i) => (i.id === newItem.id ? newItem : i))
                : [newItem, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as GroceryItem;
            // If archived, remove from active list
            if (updated.trip_id !== null) {
              setItems((prev) => prev.filter((i) => i.id !== updated.id));
            } else {
              setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
            }
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((i) => i.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household?.id]);

  // -------------------------------------------------------------------------
  // Refetch on screen focus (in case realtime events were missed)
  // -------------------------------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  // -------------------------------------------------------------------------
  // Add item (optimistic)
  // -------------------------------------------------------------------------

  const addItem = useCallback(async () => {
    const trimmed = newItemName.trim();
    if (!trimmed || !household?.id || !user?.id) return;

    const tempId = generateTempId();
    const optimistic: GroceryItem = {
      id: tempId,
      household_id: household.id,
      name: trimmed,
      quantity: 1,
      is_checked: false,
      trip_id: null,
      archived_at: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    setItems((prev) => [optimistic, ...prev]);
    setNewItemName("");
    Keyboard.dismiss();

    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        household_id: household.id,
        name: trimmed,
        quantity: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Remove optimistic item on failure
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      return;
    }

    // Replace temp with real data (realtime will also fire but dedup handles it)
    if (data) {
      setItems((prev) =>
        prev.map((i) => (i.id === tempId ? (data as GroceryItem) : i))
      );
    }
  }, [newItemName, household?.id, user?.id]);

  // -------------------------------------------------------------------------
  // Toggle check (optimistic)
  // -------------------------------------------------------------------------

  const toggleCheck = useCallback(async (item: GroceryItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_checked: !i.is_checked } : i
      )
    );

    const { error } = await supabase
      .from("grocery_items")
      .update({ is_checked: !item.is_checked })
      .eq("id", item.id);

    if (error) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_checked: item.is_checked } : i
        )
      );
    }
  }, []);

  // -------------------------------------------------------------------------
  // Delete item (optimistic)
  // -------------------------------------------------------------------------

  const deleteItem = useCallback(async (itemId: string) => {
    const deleted = items.find((i) => i.id === itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", itemId);

    if (error && deleted) {
      // Re-add on error
      setItems((prev) => [...prev, deleted]);
    }
  }, [items]);

  // -------------------------------------------------------------------------
  // Update quantity (optimistic)
  // -------------------------------------------------------------------------

  const updateQuantity = useCallback(
    async (item: GroceryItem, newQuantity: number) => {
      const oldQuantity = item.quantity;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      );

      const { error } = await supabase
        .from("grocery_items")
        .update({ quantity: newQuantity })
        .eq("id", item.id);

      if (error) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity: oldQuantity } : i
          )
        );
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Edit item (name + quantity via modal)
  // -------------------------------------------------------------------------

  const saveEdit = useCallback(async () => {
    if (!editingItem) return;
    const { id, name, quantity } = editingItem;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const original = items.find((i) => i.id === id);
    if (!original) {
      setEditingItem(null);
      return;
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, name: trimmedName, quantity } : i
      )
    );
    setEditingItem(null);

    const { error } = await supabase
      .from("grocery_items")
      .update({ name: trimmedName, quantity })
      .eq("id", id);

    if (error) {
      // Revert
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, name: original.name, quantity: original.quantity }
            : i
        )
      );
    }
  }, [editingItem, items]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const uncheckedItems = items
    .filter((i) => !i.is_checked && !i.archived_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const checkedItems = items
    .filter((i) => i.is_checked && !i.archived_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const hasCheckedItems = checkedItems.length > 0;
  const isEmpty = items.length === 0 && !loading;

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderItemRow(item: GroceryItem, isChecked: boolean) {
    return (
      <ReanimatedSwipeable
        key={item.id}
        renderRightActions={(_progress, _translation, swipeableMethods) => (
          <RightSwipeAction
            onDelete={() => {
              swipeableMethods.close();
              deleteItem(item.id);
            }}
          />
        )}
        overshootRight={false}
        rightThreshold={80}
      >
        <Pressable
          className={`flex-row items-center bg-white px-4 py-3 ${
            isChecked ? "opacity-50" : ""
          }`}
          onPress={() =>
            setEditingItem({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
            })
          }
        >
          {/* Checkbox */}
          <Pressable
            className="mr-3"
            onPress={() => toggleCheck(item)}
            hitSlop={8}
          >
            <Ionicons
              name={isChecked ? "checkbox" : "square-outline"}
              size={24}
              color={isChecked ? "#9ca3af" : "#f9a825"}
            />
          </Pressable>

          {/* Name */}
          <Text
            className={`flex-1 text-base ${
              isChecked
                ? "text-gray-400 line-through"
                : "text-gray-800"
            }`}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Quantity stepper (only for unchecked items) */}
          {!isChecked && (
            <QuantityStepper
              value={item.quantity}
              onChange={(v) => updateQuantity(item, v)}
            />
          )}

          {/* Quantity badge for checked items */}
          {isChecked && item.quantity > 1 && (
            <Text className="ml-2 text-sm text-gray-400">x{item.quantity}</Text>
          )}

          {/* Tap-to-edit affordance */}
          <Ionicons
            name="pencil-outline"
            size={16}
            color="#d1d5db"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </ReanimatedSwipeable>
    );
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Add item input */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3">
        <TextInput
          ref={inputRef}
          className="flex-1 rounded-xl border border-gray-200 bg-surface-50 px-4 py-2.5 text-base text-gray-800"
          placeholder="Add an item..."
          placeholderTextColor="#9ca3af"
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable
          className="ml-3 active:opacity-70"
          onPress={addItem}
          disabled={!newItemName.trim()}
        >
          <Ionicons
            name="add-circle"
            size={36}
            color={newItemName.trim() ? "#f9a825" : "#d1d5db"}
          />
        </Pressable>
      </View>

      {/* Empty state */}
      {isEmpty && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary-100">
            <Ionicons name="cart" size={48} color="#f9a825" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            Your grocery list is empty
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-gray-500">
            Add items to get started
          </Text>
        </View>
      )}

      {/* Item list */}
      {!isEmpty && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: hasCheckedItems ? 80 : 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Unchecked items */}
          {uncheckedItems.length > 0 && (
            <View className="mt-3">
              <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                To Buy
              </Text>
              <View className="mx-4 overflow-hidden rounded-xl">
                {uncheckedItems.map((item, index) => (
                  <View
                    key={item.id}
                    className={
                      index < uncheckedItems.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    {renderItemRow(item, false)}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Checked items (Completed section) */}
          {hasCheckedItems && (
            <View className="mt-6">
              <Text className="mb-2 px-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                Completed
              </Text>
              <View className="mx-4 overflow-hidden rounded-xl">
                {checkedItems.map((item, index) => (
                  <View
                    key={item.id}
                    className={
                      index < checkedItems.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    {renderItemRow(item, true)}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Complete Trip button -- sticky bottom */}
      {hasCheckedItems && (
        <View className="border-t border-gray-100 bg-white px-4 pb-6 pt-3">
          <Pressable
            className="flex-row items-center justify-center rounded-2xl bg-primary-500 py-4 active:bg-primary-600"
            onPress={() => router.push("/(app)/groceries/complete-trip")}
          >
            <Ionicons
              name="cart"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-lg font-bold text-white">Complete Trip</Text>
          </Pressable>
        </View>
      )}

      {/* Edit modal */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            className="flex-1 items-center justify-center bg-black/40"
            onPress={() => setEditingItem(null)}
          >
            <Pressable
              className="mx-8 w-full max-w-sm rounded-2xl bg-white p-6"
              onPress={() => {}}
            >
              <Text className="mb-4 text-lg font-bold text-gray-800">
                Edit Item
              </Text>

              {/* Name */}
              <Text className="mb-1 text-sm font-medium text-gray-500">
                Name
              </Text>
              <TextInput
                className="mb-4 rounded-xl border border-gray-200 bg-surface-50 px-4 py-2.5 text-base text-gray-800"
                value={editingItem?.name ?? ""}
                onChangeText={(text) =>
                  setEditingItem((prev) =>
                    prev ? { ...prev, name: text } : prev
                  )
                }
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />

              {/* Quantity */}
              <Text className="mb-2 text-sm font-medium text-gray-500">
                Quantity
              </Text>
              <View className="mb-6 flex-row items-center">
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-l-xl border border-gray-200 bg-surface-50 active:bg-surface-200"
                  onPress={() =>
                    setEditingItem((prev) =>
                      prev
                        ? { ...prev, quantity: Math.max(1, prev.quantity - 1) }
                        : prev
                    )
                  }
                >
                  <Ionicons name="remove" size={20} color="#6b7280" />
                </Pressable>
                <View className="h-10 items-center justify-center border-y border-gray-200 bg-white px-6">
                  <Text className="text-lg font-semibold text-gray-800">
                    {editingItem?.quantity ?? 1}
                  </Text>
                </View>
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-r-xl border border-gray-200 bg-surface-50 active:bg-surface-200"
                  onPress={() =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, quantity: prev.quantity + 1 } : prev
                    )
                  }
                >
                  <Ionicons name="add" size={20} color="#6b7280" />
                </Pressable>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 items-center rounded-xl border border-gray-200 py-3 active:bg-gray-50"
                  onPress={() => setEditingItem(null)}
                >
                  <Text className="text-base font-medium text-gray-600">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-xl bg-primary-500 py-3 active:bg-primary-600"
                  onPress={saveEdit}
                >
                  <Text className="text-base font-bold text-white">Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
