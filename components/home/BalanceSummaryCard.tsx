import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors } from '@/lib/theme/colors';

interface BalanceSummaryCardProps {
  netAmount: number;
  onSettleUp: () => void;
  onRequest: () => void;
  onCardPress: () => void;
}

export function BalanceSummaryCard({
  netAmount,
  onSettleUp,
  onRequest,
  onCardPress,
}: BalanceSummaryCardProps) {
  const isOwed = netAmount > 0;
  const isOwe = netAmount < 0;
  const isSettled = netAmount === 0;

  const formattedAmount = Math.abs(netAmount).toFixed(2);

  const amountColor = isOwed
    ? colors.brand.DEFAULT
    : isOwe
      ? colors.semantic.error
      : colors.brand.DEFAULT;

  const amountText = isOwed
    ? `You're owed $${formattedAmount}`
    : isOwe
      ? `You owe $${formattedAmount}`
      : 'All settled up';

  return (
    <Pressable onPress={onCardPress} className="mx-5 mt-4">
      <View className="bg-transparent rounded-card border border-neutral-border p-5">
        {/* Balance label */}
        <Text className="font-sans text-overline uppercase"
          style={{ color: colors.neutral.secondary }}
        >
          YOUR BALANCE
        </Text>

        {/* Amount display */}
        <View className="mt-2 flex-row items-center">
          {isSettled && (
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.brand.DEFAULT}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className="text-key-number font-heading"
            style={{ color: amountColor }}
          >
            {amountText}
          </Text>
        </View>

        {/* Action buttons - conditional on balance direction */}
        {isOwe && (
          <View className="mt-4">
            <Button
              title="Settle Up"
              variant="primary"
              onPress={onSettleUp}
              className="w-full"
            />
          </View>
        )}
        {isOwed && (
          <View className="mt-4">
            <Button
              title="Request"
              variant="primary"
              onPress={onRequest}
              className="w-full"
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}
