import { colors } from "@/lib/theme/colors";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
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
      <View className="flex-1 items-center justify-center bg-neutral-bg">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-8">
        <Image
          source={require('@/assets/empty-states/grocery-trip-history.png')}
          style={{ width: 140, height: 140, marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-2xl font-heading text-gray-800">
          No completed trips yet
        </Text>
        <Text className="font-sans mt-3 text-center text-base leading-6 text-gray-500">
          Complete a grocery trip to see it here
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-bg">
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
              className="mb-3 rounded-card bg-transparent border border-neutral-border p-4"
              onPress={() =>
                setExpandedTripId(isExpanded ? null : trip.id)
              }
            >
              {/* Trip header */}
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                  <Ionicons name="cart" size={20} color={colors.brand.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-heading-semi text-gray-800">
                    {formatCurrency(Number(trip.total_amount))}
                  </Text>
                  <Text className="font-sans text-sm text-gray-400">
                    {formatDate(trip.completed_at)}
                    {" \u00B7 "}
                    {trip.items.length} item{trip.items.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.neutral.tertiary}
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
                        color={colors.neutral.tertiary}
                        style={{ marginRight: 8 }}
                      />
                      <Text className="font-sans flex-1 text-sm text-gray-600">
                        {item.name}
                      </Text>
                      {item.unit_price != null && item.unit_price > 0 ? (
                        <Text className="font-sans text-xs text-gray-500">
                          {item.quantity > 1
                            ? `x${item.quantity} · ${formatCurrency(item.unit_price)} each`
                            : formatCurrency(item.unit_price)}
                        </Text>
                      ) : (
                        item.quantity > 1 && (
                          <Text className="font-sans text-xs text-gray-400">
                            x{item.quantity}
                          </Text>
                        )
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
