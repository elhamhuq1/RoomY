import { colors } from "@/lib/theme/colors";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import {
  QuickAddInput,
  GroceryItemRow,
  EmptyState,
  CategoryPicker,
} from "@/components/groceries";
import { SectionHeader } from "@/components/ui";
import type { GroceryItem } from "@/lib/types/database";
import { DEPARTMENTS } from "@/lib/constants/grocery-departments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
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
  const [categoryPickerItem, setCategoryPickerItem] = useState<GroceryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [creatorProfiles, setCreatorProfiles] = useState<
    Record<string, { id: string; display_name: string; avatar_url: string | null }>
  >({});

  const inputRef = useRef<TextInput>(null);
  const creatorProfilesRef = useRef(creatorProfiles);
  creatorProfilesRef.current = creatorProfiles;

  // -------------------------------------------------------------------------
  // Profile batch fetch for creator avatars
  // -------------------------------------------------------------------------

  const fetchCreatorProfiles = useCallback(
    async (groceryItems: GroceryItem[]) => {
      const creatorIds = [
        ...new Set(groceryItems.map((i: GroceryItem) => i.created_by)),
      ];
      if (creatorIds.length === 0) return;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", creatorIds);

      if (profiles) {
        const profileMap: Record<
          string,
          { id: string; display_name: string; avatar_url: string | null }
        > = {};
        profiles.forEach((p) => {
          profileMap[p.id] = p;
        });
        setCreatorProfiles(profileMap);
      }
    },
    []
  );

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
      const typedData = data as GroceryItem[];
      setItems(typedData);
      fetchCreatorProfiles(typedData);
    }
    setLoading(false);
  }, [household?.id, fetchCreatorProfiles]);

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
            // Fetch profile for unknown creator
            if (!creatorProfilesRef.current[newItem.created_by]) {
              supabase
                .from("profiles")
                .select("id, display_name, avatar_url")
                .eq("id", newItem.created_by)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setCreatorProfiles((prev) => ({
                      ...prev,
                      [data.id]: data,
                    }));
                  }
                });
            }
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
  // Longer stale time (2 min) since realtime handles most updates
  // -------------------------------------------------------------------------

  useCachedFetch(fetchItems, {
    staleTime: 120_000,
    deps: [household?.id],
  });

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
      unit_price: null,
      source: 'manual',
      category: 'other',
      assigned_to: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    setItems((prev) => [optimistic, ...prev]);
    setNewItemName("");

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

  const deleteItem = useCallback(
    async (itemId: string) => {
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
    },
    [items]
  );

  // -------------------------------------------------------------------------
  // Update quantity (optimistic) -- used by edit modal
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
  // Change category (optimistic) -- used by category picker
  // -------------------------------------------------------------------------

  const handleCategoryChange = useCallback(
    async (newCategory: string) => {
      if (!categoryPickerItem) return;

      const itemId = categoryPickerItem.id;
      const oldCategory = categoryPickerItem.category;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, category: newCategory } : i
        )
      );
      setCategoryPickerItem(null);

      const { error } = await supabase
        .from("grocery_items")
        .update({ category: newCategory })
        .eq("id", itemId);

      if (error) {
        // Rollback on failure
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, category: oldCategory } : i
          )
        );
      }
    },
    [categoryPickerItem]
  );

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  // Deduplicate items by id (safety net against realtime race conditions)
  const dedupedItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }, [items]);

  const uncheckedItems = dedupedItems
    .filter((i) => !i.is_checked && !i.archived_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const checkedItems = dedupedItems
    .filter((i) => i.is_checked && !i.archived_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const hasCheckedItems = checkedItems.length > 0;
  const isEmpty = dedupedItems.length === 0 && !loading;

  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    for (const item of uncheckedItems) {
      const cat = item.category || 'other';
      (groups[cat] ??= []).push(item);
    }
    return groups;
  }, [uncheckedItems]);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Quick-add input */}
      <QuickAddInput
        value={newItemName}
        onChangeText={setNewItemName}
        onSubmit={addItem}
      />

      {/* Action buttons */}
      <View className="mx-4 mt-2 mb-1 flex-row gap-2">
        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-brand bg-white py-2 px-1 active:bg-brand-light"
          onPress={() => router.push('/(app)/groceries/scan-receipt')}
        >
          <Ionicons name="camera-outline" size={16} color={colors.brand.DEFAULT} />
          <Text className="ml-1 text-xs font-heading-semi text-brand">
            Scan Receipt
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-brand bg-white py-2 px-1 active:bg-brand-light"
          onPress={() => router.push('/(app)/groceries/import-recipe')}
        >
          <Ionicons name="restaurant-outline" size={16} color={colors.brand.DEFAULT} />
          <Text className="ml-1 text-xs font-heading-semi text-brand">
            Shop Recipe
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-brand bg-white py-2 px-1 active:bg-brand-light"
          onPress={() => router.push('/(app)/groceries/search-products')}
        >
          <Ionicons name="search-outline" size={16} color={colors.brand.DEFAULT} />
          <Text className="ml-1 text-xs font-heading-semi text-brand">
            Search Products
          </Text>
        </Pressable>
      </View>

      {/* Empty state */}
      {isEmpty && <EmptyState />}

      {/* Item list */}
      {!isEmpty && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: hasCheckedItems ? 80 : 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Department-grouped sections */}
          {uncheckedItems.length > 0 && (
            <View className="mt-3">
              {DEPARTMENTS.map((dept) => {
                const deptItems = groupedItems[dept.id];
                if (!deptItems || deptItems.length === 0) return null;
                const isExpanded = !collapsedDepts.has(dept.id);
                return (
                  <View key={dept.id} className="mb-2">
                    <SectionHeader
                      label={dept.label}
                      icon={dept.icon}
                      count={deptItems.length}
                      collapsible
                      expanded={isExpanded}
                      onToggle={() =>
                        setCollapsedDepts((prev) => {
                          const next = new Set(prev);
                          if (next.has(dept.id)) {
                            next.delete(dept.id);
                          } else {
                            next.add(dept.id);
                          }
                          return next;
                        })
                      }
                    />
                    {isExpanded && (
                      <View className="mx-4 rounded-card border border-neutral-border overflow-hidden">
                        {deptItems.map((item, index) => (
                          <View
                            key={item.id}
                            className={
                              index < deptItems.length - 1
                                ? "border-b border-neutral-border"
                                : ""
                            }
                          >
                            <GroceryItemRow
                              item={item}
                              isChecked={false}
                              creatorName={
                                creatorProfiles[item.created_by]?.display_name ?? "?"
                              }
                              creatorId={item.created_by}
                              creatorAvatarUrl={creatorProfiles[item.created_by]?.avatar_url}
                              onToggle={() => toggleCheck(item)}
                              onEdit={() =>
                                setEditingItem({
                                  id: item.id,
                                  name: item.name,
                                  quantity: item.quantity,
                                })
                              }
                              onDelete={() => deleteItem(item.id)}
                              onLongPress={() => setCategoryPickerItem(item)}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* DONE section (collapsible) */}
          {hasCheckedItems && (
            <View className="mt-6">
              <SectionHeader
                label="DONE"
                count={checkedItems.length}
                collapsible
                expanded={doneExpanded}
                onToggle={() => setDoneExpanded((prev) => !prev)}
              />
              {doneExpanded && (
                <View className="mx-4 rounded-card border border-neutral-border overflow-hidden">
                  {checkedItems.map((item, index) => (
                    <View
                      key={item.id}
                      className={
                        index < checkedItems.length - 1
                          ? "border-b border-neutral-border"
                          : ""
                      }
                    >
                      <GroceryItemRow
                        item={item}
                        isChecked={true}
                        creatorName={
                          creatorProfiles[item.created_by]?.display_name ?? "?"
                        }
                        creatorId={item.created_by}
                        creatorAvatarUrl={creatorProfiles[item.created_by]?.avatar_url}
                        onToggle={() => toggleCheck(item)}
                        onEdit={() =>
                          setEditingItem({
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                          })
                        }
                        onDelete={() => deleteItem(item.id)}
                        onLongPress={() => setCategoryPickerItem(item)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Complete Trip button -- sticky bottom */}
      {hasCheckedItems && (
        <View className="border-t border-neutral-border bg-[#F5F0EB] px-4 pb-6 pt-3">
          <Pressable
            className="flex-row items-center justify-center rounded-2xl bg-brand py-4 active:bg-brand-dark"
            onPress={() => router.push("/(app)/groceries/complete-trip")}
          >
            <Ionicons
              name="cart"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-lg font-heading text-white">Complete Trip</Text>
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
              <Text className="mb-4 text-lg font-heading text-neutral-text">
                Edit Item
              </Text>

              {/* Name */}
              <Text className="mb-1 text-sm font-medium text-neutral-secondary">
                Name
              </Text>
              <TextInput
            className="font-sans mb-4 rounded-xl border border-neutral-border bg-neutral-bg px-4 py-2.5 text-base text-neutral-text"
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
              <Text className="mb-2 text-sm font-medium text-neutral-secondary">
                Quantity
              </Text>
              <View className="mb-6 flex-row items-center">
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-l-xl border border-neutral-border bg-neutral-bg active:bg-neutral-surface"
                  onPress={() =>
                    setEditingItem((prev) =>
                      prev
                        ? { ...prev, quantity: Math.max(1, prev.quantity - 1) }
                        : prev
                    )
                  }
                >
                  <Ionicons name="remove" size={20} color={colors.neutral.secondary} />
                </Pressable>
                <View className="h-10 items-center justify-center border-y border-neutral-border bg-white px-6">
                  <Text className="text-lg font-heading-semi text-neutral-text">
                    {editingItem?.quantity ?? 1}
                  </Text>
                </View>
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-r-xl border border-neutral-border bg-neutral-bg active:bg-neutral-surface"
                  onPress={() =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, quantity: prev.quantity + 1 } : prev
                    )
                  }
                >
                  <Ionicons name="add" size={20} color={colors.neutral.secondary} />
                </Pressable>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 items-center rounded-xl border border-neutral-border py-3 active:bg-neutral-bg"
                  onPress={() => setEditingItem(null)}
                >
                  <Text className="text-base font-medium text-neutral-secondary">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-xl bg-brand py-3 active:bg-brand-dark"
                  onPress={saveEdit}
                >
                  <Text className="text-base font-heading text-white">Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category picker modal */}
      <CategoryPicker
        visible={!!categoryPickerItem}
        currentCategory={categoryPickerItem?.category ?? 'other'}
        onSelect={handleCategoryChange}
        onDismiss={() => setCategoryPickerItem(null)}
      />
    </KeyboardAvoidingView>
  );
}
