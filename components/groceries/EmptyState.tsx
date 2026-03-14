import React from 'react';
import { View, Text, Image } from 'react-native';

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Image
        source={require('@/docs/empty-state-images/grocery-empty-list.png')}
        style={{ width: 140, height: 140, marginBottom: 24 }}
        resizeMode="contain"
      />
      <Text className="text-section-heading font-heading-semi text-neutral-text">
        Your grocery list is empty
      </Text>
      <Text className="text-body text-neutral-secondary mt-3 text-center">
        Add items above to get started
      </Text>
    </View>
  );
}
