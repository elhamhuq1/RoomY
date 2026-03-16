import { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { colors } from '@/lib/theme/colors';
import { supabase } from '@/lib/supabase';
import { captureReceiptImage } from '@/lib/receipt-capture';

// ------- Types -------

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: string; // stored as string for editing; parsed on confirm
}

type ScreenPhase = 'capture' | 'scanning' | 'error' | 'review';

// ------- Helpers -------

let nextId = 1;
function makeId(): string {
  return `ri_${nextId++}`;
}

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function computeTotal(items: ReceiptItem[]): number {
  return items.reduce((sum, it) => sum + parsePrice(it.price) * it.quantity, 0);
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

// ------- Swipe delete action -------

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <Pressable
      className="w-20 items-center justify-center bg-red-500 rounded-r-xl"
      onPress={onDelete}
    >
      <Ionicons name="trash" size={22} color="#fff" />
      <Text className="mt-1 text-xs font-medium text-white">Delete</Text>
    </Pressable>
  );
}

// ------- Main Screen -------

export default function ScanReceiptScreen() {
  const router = useRouter();

  const [phase, setPhase] = useState<ScreenPhase>('capture');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanningText, setScanningText] = useState('Scanning receipt...');

  // ---- Capture ----

  const handleCapture = useCallback(
    async (source: 'camera' | 'gallery') => {
      try {
        const result = await captureReceiptImage(source);
        if (!result) return; // cancelled

        setPhase('scanning');
        setScanningText('Scanning receipt...');

        const { data, error } = await supabase.functions.invoke(
          'scan-receipt',
          {
            body: {
              imageBase64: result.base64,
              mimeType: result.mimeType,
            },
          }
        );

        if (error) {
          // supabase.functions.invoke wraps non-2xx as FunctionsHttpError
          // The body may contain our structured error
          const message =
            data?.error ?? error.message ?? 'Receipt scanning failed';
          setErrorMessage(message);
          setPhase('error');
          return;
        }

        if (!data?.items || !Array.isArray(data.items)) {
          setErrorMessage('Unexpected response from receipt scanner.');
          setPhase('error');
          return;
        }

        // Hydrate items with local IDs for list editing
        const parsed: ReceiptItem[] = data.items.map(
          (it: { name: string; quantity: number; price: number }) => ({
            id: makeId(),
            name: it.name,
            quantity: it.quantity,
            price: it.price.toFixed(2),
          })
        );

        setItems(parsed);
        setPhase('review');
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Something went wrong';
        if (msg === 'CAMERA_PERMISSION_DENIED') {
          Alert.alert(
            'Camera Access Required',
            'Please allow camera access in your device settings to scan receipts.'
          );
          return;
        }
        setErrorMessage(msg);
        setPhase('error');
      }
    },
    []
  );

  // ---- Item editing ----

  const updateItem = useCallback(
    (id: string, field: keyof Pick<ReceiptItem, 'name' | 'price'>, value: string) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
      );
    },
    []
  );

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = it.quantity + delta;
        return next >= 1 ? { ...it, quantity: next } : it;
      })
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: makeId(), name: '', quantity: 1, price: '0.00' },
    ]);
  }, []);

  // ---- Confirm ----

  const handleConfirm = useCallback(() => {
    const validItems = items.filter(
      (it) => it.name.trim().length > 0 && parsePrice(it.price) > 0
    );
    if (validItems.length === 0) {
      Alert.alert('No Items', 'Add at least one item with a name and price.');
      return;
    }

    const total = computeTotal(validItems);
    const serialized = validItems.map((it) => ({
      name: it.name.trim(),
      quantity: it.quantity,
      price: parsePrice(it.price),
    }));

    router.navigate({
      pathname: '/(app)/groceries/assign-items',
      params: {
        receiptItems: JSON.stringify(serialized),
        receiptTotal: total.toFixed(2),
      },
    });
  }, [items, router]);

  // ---- Retry ----

  const handleRetry = useCallback(() => {
    setErrorMessage('');
    setPhase('capture');
  }, []);

  // ---- Price input handler ----

  const handlePriceChange = useCallback(
    (id: string, text: string) => {
      // Allow digits and one decimal point, max 2 decimal places
      const cleaned = text.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) return;
      if (parts[1] && parts[1].length > 2) return;
      updateItem(id, 'price', cleaned);
    },
    [updateItem]
  );

  // =============== RENDER ===============

  // ---- Capture phase ----
  if (phase === 'capture') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-light">
            <Ionicons name="receipt-outline" size={40} color={colors.brand.DEFAULT} />
          </View>
          <Text className="text-center text-lg font-heading text-neutral-text">
            Scan a Receipt
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-secondary">
            Take a photo or choose from your gallery
          </Text>
        </View>

        <Pressable
          className="mb-3 w-full flex-row items-center justify-center rounded-2xl border-2 border-brand bg-white py-4 active:bg-brand-light"
          onPress={() => handleCapture('camera')}
        >
          <Ionicons name="camera-outline" size={22} color={colors.brand.DEFAULT} />
          <Text className="ml-2 text-base font-heading-semi text-brand">
            Take Photo
          </Text>
        </Pressable>

        <Pressable
          className="w-full flex-row items-center justify-center rounded-2xl border-2 border-brand bg-white py-4 active:bg-brand-light"
          onPress={() => handleCapture('gallery')}
        >
          <Ionicons name="image-outline" size={22} color={colors.brand.DEFAULT} />
          <Text className="ml-2 text-base font-heading-semi text-brand">
            Choose from Gallery
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---- Scanning phase ----
  if (phase === 'scanning') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        <Text className="mt-4 text-base text-neutral-secondary">{scanningText}</Text>
      </View>
    );
  }

  // ---- Error phase ----
  if (phase === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <View className="w-full rounded-2xl bg-red-50 px-5 py-6">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="alert-circle" size={22} color={colors.semantic.error} />
            <Text className="ml-2 text-base font-heading-semi text-red-700">
              Scan Failed
            </Text>
          </View>
          <Text className="text-sm text-red-600">{errorMessage}</Text>
        </View>

        <Pressable
          className="mt-6 w-full flex-row items-center justify-center rounded-2xl border-2 border-brand bg-white py-4 active:bg-brand-light"
          onPress={handleRetry}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.brand.DEFAULT} />
          <Text className="ml-2 text-base font-heading-semi text-brand">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---- Review phase ----
  const total = computeTotal(items);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {/* Total header */}
        <View className="mb-4 rounded-xl bg-brand-light px-4 py-3">
          <Text className="text-center text-sm text-brand-dark">
            {items.length} item{items.length !== 1 ? 's' : ''} found
          </Text>
          <Text className="text-center text-xl font-heading-semi text-brand-dark">
            {formatCurrency(total)}
          </Text>
        </View>

        {/* Item rows */}
        {items.map((item, index) => (
          <ReanimatedSwipeable
            key={item.id}
            renderRightActions={(_progress, _translation, swipeableMethods) => (
              <DeleteAction
                onDelete={() => {
                  swipeableMethods.close();
                  deleteItem(item.id);
                }}
              />
            )}
            overshootRight={false}
            rightThreshold={80}
          >
            <View
              className={`bg-white px-4 py-3 ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === items.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100'
              }`}
            >
              {/* Name */}
              <TextInput
                className="font-sans text-base text-neutral-text"
                style={{ paddingVertical: 0 }}
                placeholder="Item name"
                placeholderTextColor={colors.neutral.tertiary}
                value={item.name}
                onChangeText={(text) => updateItem(item.id, 'name', text)}
              />

              {/* Quantity + Price row */}
              <View className="mt-2 flex-row items-center justify-between">
                {/* Quantity stepper */}
                <View className="flex-row items-center rounded-lg border border-gray-200">
                  <Pressable
                    className="px-3 py-1"
                    onPress={() => updateQuantity(item.id, -1)}
                    hitSlop={4}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={
                        item.quantity <= 1
                          ? colors.neutral.tertiary
                          : colors.neutral.text
                      }
                    />
                  </Pressable>
                  <Text className="font-sans min-w-[24px] text-center text-sm text-neutral-text">
                    {item.quantity}
                  </Text>
                  <Pressable
                    className="px-3 py-1"
                    onPress={() => updateQuantity(item.id, 1)}
                    hitSlop={4}
                  >
                    <Ionicons name="add" size={16} color={colors.neutral.text} />
                  </Pressable>
                </View>

                {/* Price input */}
                <View className="flex-row items-center rounded-lg border border-gray-200 px-2 py-1">
                  <Text className="font-sans text-sm text-gray-400">$</Text>
                  <TextInput
                    className="font-sans w-20 text-right text-sm text-neutral-text"
                    style={{ paddingVertical: 0 }}
                    placeholder="0.00"
                    placeholderTextColor={colors.neutral.tertiary}
                    keyboardType="decimal-pad"
                    value={item.price}
                    onChangeText={(text) => handlePriceChange(item.id, text)}
                  />
                </View>
              </View>
            </View>
          </ReanimatedSwipeable>
        ))}

        {/* Add Item button */}
        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-xl border border-dashed border-neutral-tertiary bg-white py-3 active:bg-neutral-surface"
          onPress={addItem}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.brand.DEFAULT} />
          <Text className="ml-2 text-sm font-heading-semi text-brand">
            Add Item
          </Text>
        </Pressable>

        {/* Confirm button */}
        <Pressable
          className="mt-6 flex-row items-center justify-center rounded-2xl bg-brand py-4 active:bg-brand-dark"
          onPress={handleConfirm}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text className="ml-2 text-lg font-heading text-white">
            Confirm Items
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
