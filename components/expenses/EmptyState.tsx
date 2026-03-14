import React from 'react';
import { View, Text, Image } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onAddExpense: () => void;
}

export function EmptyState({ onAddExpense }: EmptyStateProps) {
  return (
    <Card className="items-center py-8">
      <Image
        source={require('@/docs/empty-state-images/expense-main-empty-state.png')}
        style={{ width: 140, height: 140, marginBottom: 16 }}
        resizeMode="contain"
      />
      <Text className="text-section-heading font-heading-semi text-neutral-text">
        No expenses yet
      </Text>
      <Text className="font-sans mt-1 text-center text-body text-neutral-secondary">
        Add your first expense to start tracking
      </Text>
      <View className="mt-4">
        <Button title="Add Expense" onPress={onAddExpense} />
      </View>
    </Card>
  );
}
