import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/lib/theme/colors';

interface EmptyStateProps {
  onAddExpense: () => void;
}

export function EmptyState({ onAddExpense }: EmptyStateProps) {
  return (
    <Card className="items-center py-8">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-light">
        <Ionicons
          name="wallet-outline"
          size={48}
          color={colors.brand.DEFAULT}
        />
      </View>
      <Text className="text-section-heading text-neutral-text">
        No expenses yet
      </Text>
      <Text className="mt-1 text-center text-body text-neutral-secondary">
        Add your first expense to start tracking
      </Text>
      <View className="mt-4">
        <Button title="Add Expense" onPress={onAddExpense} />
      </View>
    </Card>
  );
}
