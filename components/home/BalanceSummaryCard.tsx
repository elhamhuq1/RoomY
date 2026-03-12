import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

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
    ? '#22C55E' // semantic success green
    : isOwe
      ? '#EF4444' // semantic error red
      : '#FFFFFF'; // white for settled

  const amountText = isOwed
    ? `You're owed $${formattedAmount}`
    : isOwe
      ? `You owe $${formattedAmount}`
      : 'All settled up';

  return (
    <Pressable onPress={onCardPress} className="mx-5 mt-4">
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 20 }}
      >
        {/* Balance label */}
        <Text
          className="text-overline uppercase"
          style={{ color: '#94A3B8' }}
        >
          YOUR BALANCE
        </Text>

        {/* Amount display */}
        <View className="mt-2 flex-row items-center">
          {isSettled && (
            <Ionicons
              name="checkmark-circle"
              size={28}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className="text-key-number"
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
              variant="outline"
              onPress={onRequest}
              className="w-full"
            />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}
