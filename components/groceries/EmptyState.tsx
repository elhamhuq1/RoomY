import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-24 w-24 rounded-full bg-brand-light items-center justify-center mb-6">
        <Ionicons name="cart" size={48} color={colors.brand.DEFAULT} />
      </View>
      <Text className="text-section-heading font-heading-semi text-neutral-text">
        Your grocery list is empty
      </Text>
      <Text className="text-body text-neutral-secondary mt-3 text-center">
        Add items above to get started
      </Text>
    </View>
  );
}
