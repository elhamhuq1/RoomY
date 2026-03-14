import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface BalanceMemberRowProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  amount: number;
  isOwedToYou: boolean;
  onAction: () => void;
}

export function BalanceMemberRow({
  userId,
  displayName,
  avatarUrl,
  amount,
  isOwedToYou,
  onAction,
}: BalanceMemberRowProps) {
  return (
    <View className="flex-row items-center py-3">
      <View className="flex-row items-center flex-1 mr-2">
        <Avatar userId={userId} name={displayName} size="md" avatarUrl={avatarUrl} />
        <View className="ml-3 flex-1">
          <Text className="text-card-title font-heading-semi text-neutral-text">
            {displayName}
          </Text>
          <Text
            className={`text-body font-bold ${
              isOwedToYou ? 'text-semantic-success' : 'text-semantic-error'
            }`}
          >
            {isOwedToYou
              ? `owes you ${formatCurrency(amount)}`
              : `you owe ${formatCurrency(amount)}`}
          </Text>
        </View>
      </View>
      <Button
        title={isOwedToYou ? 'Remind' : 'Settle'}
        variant={isOwedToYou ? 'outline' : 'primary'}
        onPress={onAction}
        className="py-2 px-4"
      />
    </View>
  );
}
