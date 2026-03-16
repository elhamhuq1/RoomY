import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/auth-context';
import { DEPARTMENT_MAP } from '@/lib/constants/grocery-departments';

// ------- Types -------

interface StoreResult {
  locationId: string;
  name: string;
  chain: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface ProductResult {
  productId: string;
  name: string;
  brand: string;
  price: number | null;
  promoPrice: number | null;
  size: string;
  aisle: string;
  department: string;
}

// ------- Main Screen -------

export default function SearchProductsScreen() {
  const { user, household, householdSettings, refreshProfile } = useSession();

  // Store selection state
  const [storeId, setStoreId] = useState<string | null>(
    householdSettings?.kroger_location_id ?? null
  );
  const [storeName, setStoreName] = useState<string | null>(
    householdSettings?.kroger_location_name ?? null
  );
  const [zipCode, setZipCode] = useState('');
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  // Product search state
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Track which products were just added (productId → timestamp)
  const [addedIds, setAddedIds] = useState<Record<string, number>>({});

  // Ref for debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync store from householdSettings on mount / change
  useEffect(() => {
    if (householdSettings?.kroger_location_id) {
      setStoreId(householdSettings.kroger_location_id);
      setStoreName(householdSettings.kroger_location_name ?? null);
    }
  }, [householdSettings?.kroger_location_id, householdSettings?.kroger_location_name]);

  // ------- Store search -------

  const findStores = useCallback(async () => {
    const trimmed = zipCode.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setStoresError('Please enter a valid 5-digit zip code.');
      return;
    }

    setStoresLoading(true);
    setStoresError(null);
    setStores([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-stores', {
        body: { zipCode: trimmed },
      });

      if (error) {
        console.error('[search-products] store search invoke error:', error);
        setStoresError('Failed to search stores. Please try again.');
        return;
      }

      if (data?.error) {
        setStoresError(data.error);
        return;
      }

      const results: StoreResult[] = data?.stores ?? [];
      if (results.length === 0) {
        setStoresError('No Kroger stores found near this zip code.');
      } else {
        setStores(results);
      }
    } catch (err) {
      console.error('[search-products] store search error:', err);
      setStoresError('Something went wrong. Please try again.');
    } finally {
      setStoresLoading(false);
    }
  }, [zipCode]);

  // ------- Store selection -------

  const selectStore = useCallback(
    async (store: StoreResult) => {
      if (!household?.id) return;

      // Optimistic update
      setStoreId(store.locationId);
      setStoreName(store.name);
      setStores([]);

      // Persist to household_settings
      const { error } = await supabase
        .from('household_settings')
        .update({
          kroger_location_id: store.locationId,
          kroger_location_name: store.name,
        })
        .eq('household_id', household.id);

      if (error) {
        console.error('[search-products] failed to persist store:', error);
        Alert.alert('Error', 'Failed to save store selection. Please try again.');
        setStoreId(null);
        setStoreName(null);
        return;
      }

      // Refresh auth context so householdSettings picks up the change
      refreshProfile();
    },
    [household?.id, refreshProfile]
  );

  const changeStore = useCallback(() => {
    setStoreId(null);
    setStoreName(null);
    setSearchTerm('');
    setProducts([]);
    setHasSearched(false);
    setProductsError(null);
  }, []);

  // ------- Product search (debounced) -------

  useEffect(() => {
    if (!storeId || searchTerm.trim().length < 2) {
      setProducts([]);
      setHasSearched(false);
      setProductsError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setProductsLoading(true);
      setProductsError(null);
      setHasSearched(true);

      try {
        const { data, error } = await supabase.functions.invoke('search-products', {
          body: { term: searchTerm.trim(), locationId: storeId },
        });

        if (error) {
          console.error('[search-products] product search invoke error:', error);
          setProductsError('Failed to search products. Please try again.');
          return;
        }

        if (data?.error) {
          setProductsError(data.error);
          return;
        }

        setProducts(data?.products ?? []);
      } catch (err) {
        console.error('[search-products] product search error:', err);
        setProductsError('Something went wrong. Please try again.');
      } finally {
        setProductsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, storeId]);

  // ------- Add to grocery list -------

  const addToList = useCallback(
    async (product: ProductResult) => {
      if (!household?.id || !user?.id) return;

      // Compose name: "Brand Name" or just "Name" if brand matches or is empty
      const displayName =
        product.brand && !product.name.toLowerCase().startsWith(product.brand.toLowerCase())
          ? `${product.brand} ${product.name}`
          : product.name;

      try {
        const { error } = await supabase.from('grocery_items').insert({
          household_id: household.id,
          name: displayName,
          quantity: 1,
          created_by: user.id,
          source: 'kroger',
          category: product.department || 'other',
        });

        if (error) {
          console.error('[search-products] add item error:', error);
          Alert.alert('Error', 'Failed to add item to your list.');
          return;
        }

        // Show "Added!" confirmation briefly
        setAddedIds((prev) => ({ ...prev, [product.productId]: Date.now() }));
        setTimeout(() => {
          setAddedIds((prev) => {
            const next = { ...prev };
            delete next[product.productId];
            return next;
          });
        }, 1500);
      } catch (err) {
        console.error('[search-products] add item error:', err);
        Alert.alert('Error', 'Something went wrong adding the item.');
      }
    },
    [household?.id, user?.id]
  );

  // ------- Render helpers -------

  const renderStoreSelection = () => (
    <View className="px-4 pt-4">
      <Text className="text-lg font-heading-semi text-neutral-text mb-2">
        Select a Kroger Store
      </Text>
      <Text className="text-sm text-neutral-secondary mb-3">
        Enter your zip code to find nearby Kroger stores.
      </Text>

      <View className="flex-row gap-2 mb-3">
        <TextInput
          className="flex-1 rounded-xl border-2 border-neutral-border bg-white px-4 py-3 text-base text-neutral-text font-body"
          placeholder="Zip code (e.g. 45140)"
          placeholderTextColor={colors.neutral.tertiary}
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="number-pad"
          maxLength={5}
          returnKeyType="search"
          onSubmitEditing={findStores}
        />
        <Pressable
          className="items-center justify-center rounded-xl bg-brand px-5 active:opacity-80"
          onPress={findStores}
          disabled={storesLoading}
        >
          {storesLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text className="text-sm font-heading-semi text-white">Find Stores</Text>
          )}
        </Pressable>
      </View>

      {storesError && (
        <View className="rounded-xl bg-white border-2 border-neutral-border p-4 mb-3">
          <Text className="text-sm text-neutral-secondary text-center">{storesError}</Text>
          <Pressable className="mt-2 items-center" onPress={findStores}>
            <Text className="text-sm font-heading-semi text-brand">Try Again</Text>
          </Pressable>
        </View>
      )}

      {stores.map((store) => (
        <Pressable
          key={store.locationId}
          className="mb-2 rounded-xl border-2 border-neutral-border bg-white p-4 active:bg-neutral-bg"
          onPress={() => selectStore(store)}
        >
          <Text className="text-base font-heading-semi text-neutral-text">
            {store.name}
          </Text>
          <Text className="text-sm text-neutral-secondary mt-0.5">
            {store.chain}
          </Text>
          <Text className="text-xs text-neutral-tertiary mt-0.5">
            {store.address.addressLine1}, {store.address.city}, {store.address.state}{' '}
            {store.address.zipCode}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderStoreHeader = () => (
    <View className="mx-4 mt-4 mb-2 flex-row items-center justify-between rounded-xl border-2 border-brand bg-white px-4 py-3">
      <View className="flex-1 mr-2">
        <Text className="text-xs text-neutral-secondary">Shopping at</Text>
        <Text className="text-base font-heading-semi text-neutral-text" numberOfLines={1}>
          {storeName}
        </Text>
      </View>
      <Pressable onPress={changeStore} className="active:opacity-70">
        <Text className="text-sm font-heading-semi text-brand">Change Store</Text>
      </Pressable>
    </View>
  );

  const renderProductSearch = () => (
    <View className="px-4 pt-2">
      {/* Search input */}
      <View className="flex-row items-center rounded-xl border-2 border-neutral-border bg-white px-3 py-2 mb-3">
        <Ionicons name="search-outline" size={18} color={colors.neutral.tertiary} />
        <TextInput
          className="flex-1 ml-2 text-base text-neutral-text font-body"
          placeholder="Search products..."
          placeholderTextColor={colors.neutral.tertiary}
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          autoFocus
        />
        {searchTerm.length > 0 && (
          <Pressable onPress={() => setSearchTerm('')} className="ml-1 active:opacity-70">
            <Ionicons name="close-circle" size={18} color={colors.neutral.tertiary} />
          </Pressable>
        )}
      </View>

      {/* Loading */}
      {productsLoading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
          <Text className="text-sm text-neutral-secondary mt-2">Searching...</Text>
        </View>
      )}

      {/* Error */}
      {productsError && !productsLoading && (
        <View className="rounded-xl bg-white border-2 border-neutral-border p-4 mb-3">
          <Text className="text-sm text-neutral-secondary text-center">{productsError}</Text>
          <Pressable
            className="mt-2 items-center"
            onPress={() => {
              // Force re-search by toggling term
              const t = searchTerm;
              setSearchTerm('');
              setTimeout(() => setSearchTerm(t), 50);
            }}
          >
            <Text className="text-sm font-heading-semi text-brand">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!productsLoading && !productsError && hasSearched && products.length === 0 && (
        <View className="items-center py-8">
          <Ionicons name="search" size={40} color={colors.neutral.tertiary} />
          <Text className="text-sm text-neutral-secondary mt-2">No products found</Text>
        </View>
      )}
    </View>
  );

  const renderProductRow = (product: ProductResult) => {
    const justAdded = !!addedIds[product.productId];
    const deptInfo = DEPARTMENT_MAP[product.department];
    const hasPromo =
      product.promoPrice !== null &&
      product.price !== null &&
      product.promoPrice < product.price;

    return (
      <View
        key={product.productId}
        className="mx-4 mb-2 rounded-xl border-2 border-neutral-border bg-white p-3 flex-row items-center"
      >
        {/* Info */}
        <View className="flex-1 mr-2">
          <Text className="text-sm font-heading-semi text-neutral-text" numberOfLines={1}>
            {product.name}
          </Text>
          {!!product.brand && (
            <Text className="text-xs text-neutral-secondary" numberOfLines={1}>
              {product.brand}
            </Text>
          )}

          {/* Price row */}
          <View className="flex-row items-center mt-1 gap-2">
            {product.price !== null ? (
              hasPromo ? (
                <>
                  <Text className="text-sm font-heading-semi text-brand">
                    ${product.promoPrice!.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-neutral-tertiary line-through">
                    ${product.price.toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text className="text-sm font-heading-semi text-neutral-text">
                  ${product.price.toFixed(2)}
                </Text>
              )
            ) : (
              <Text className="text-xs text-neutral-tertiary">Price unavailable</Text>
            )}
            {!!product.size && (
              <Text className="text-xs text-neutral-secondary">{product.size}</Text>
            )}
          </View>

          {/* Aisle + department */}
          <View className="flex-row items-center mt-1 gap-2">
            <Text className="text-xs text-neutral-tertiary">
              {product.aisle || 'Aisle N/A'}
            </Text>
            {deptInfo && (
              <View className="rounded-full bg-brand-light px-2 py-0.5">
                <Text className="text-[10px] font-heading-semi text-brand">
                  {deptInfo.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Add button */}
        <Pressable
          onPress={() => addToList(product)}
          disabled={justAdded}
          className="items-center justify-center w-10 h-10 active:opacity-70"
        >
          {justAdded ? (
            <Ionicons name="checkmark-circle" size={28} color={colors.semantic.success} />
          ) : (
            <Ionicons name="add-circle-outline" size={28} color={colors.brand.DEFAULT} />
          )}
        </Pressable>
      </View>
    );
  };

  // ------- Main render -------

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {storeId ? (
          <>
            {renderStoreHeader()}
            {renderProductSearch()}
            {products.map(renderProductRow)}
          </>
        ) : (
          renderStoreSelection()
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
