import React from 'react';
import { View, Text } from 'react-native';
import { IconContainer } from '@/components/ui/IconContainer';
import type { Settlement } from '@/lib/types/database';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface SettlementRowProps {
  settlement: Settlement;
  paidByName: string;
  paidToName: string;
  isLast: boolean;
}

export function SettlementRow({
  settlement,
  paidByName,
  paidToName,
  isLast,
}: SettlementRowProps) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        !isLast ? 'border-b border-neutral-border' : ''
      }`}
    >
      <View className="mr-3">
        <IconContainer name="checkmark-circle" variant="success" />
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-card-title font-heading-semi text-neutral-secondary">
          {paidByName} paid {paidToName}
        </Text>
      </View>
      <Text className="text-body text-neutral-secondary">
        {formatCurrency(Number(settlement.amount))}
      </Text>
    </View>
  );
}
