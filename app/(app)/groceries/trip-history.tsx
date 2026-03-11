import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { GroceryTrip, GroceryItem } from "@/lib/types/database";

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type TripWithItems = GroceryTrip & {
  items: GroceryItem[];
};

export default function TripHistoryScreen() {
  const { household } = useSession();

  const [trips, setTrips] = useState<TripWithItems[]>([]);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    if (!household?.id) return;

    // Fetch trips
    const { data: tripsData, error: tripsError } = await supabase
      .from("grocery_trips")
      .select("*")
      .eq("household_id", household.id)
      .order("completed_at", { ascending: false });

    if (tripsError || !tripsData) {
      setLoading(false);
      return;
    }

    const typedTrips = tripsData as GroceryTrip[];

    if (typedTrips.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    // Fetch all items for all trips in one query
    const tripIds = typedTrips.map((t) => t.id);
    const { data: itemsData } = await supabase
      .from("grocery_items")
      .select("*")
      .in("trip_id", tripIds)
      .order("name");

    const typedItems = (itemsData as GroceryItem[]) ?? [];

    // Group items by trip_id
    const itemsByTrip: Record<string, GroceryItem[]> = {};
    for (const item of typedItems) {
      if (item.trip_id) {
        if (!itemsByTrip[item.trip_id]) {
          itemsByTrip[item.trip_id] = [];
        }
        itemsByTrip[item.trip_id].push(item);
      }
    }

    // Combine trips with their items
    const tripsWithItems: TripWithItems[] = typedTrips.map((trip) => ({
      ...trip,
      items: itemsByTrip[trip.id] ?? [],
    }));

    setTrips(tripsWithItems);
    setLoading(false);
  }, [household?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 px-8">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary-100">
          <Ionicons name="time-outline" size={48} color="#f9a825" />
        </View>
        <Text className="text-2xl font-bold text-gray-800">
          No completed trips yet
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-gray-500">
          Complete a grocery trip to see it here
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {trips.map((trip) => {
          const isExpanded = expandedTripId === trip.id;
          return (
            <Pressable
              key={trip.id}
              className="mb-3 rounded-xl bg-white p-4 shadow-sm"
              onPress={() =>
                setExpandedTripId(isExpanded ? null : trip.id)
              }
            >
              {/* Trip header */}
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <Ionicons name="cart" size={20} color="#f9a825" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    {formatCurrency(Number(trip.total_amount))}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {formatDate(trip.completed_at)}
                    {" \u00B7 "}
                    {trip.items.length} item{trip.items.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#9ca3af"
                />
              </View>

              {/* Expanded item list */}
              {isExpanded && trip.items.length > 0 && (
                <View className="mt-3 border-t border-gray-100 pt-3">
                  {trip.items.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-center py-1.5"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#9ca3af"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="flex-1 text-sm text-gray-600">
                        {item.name}
                      </Text>
                      {item.quantity > 1 && (
                        <Text className="text-xs text-gray-400">
                          x{item.quantity}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
