import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { BalanceMemberRow } from './BalanceMemberRow';
import { colors } from '@/lib/theme/colors';
import type { Profile } from '@/lib/types/database';

export type BalanceEntry = {
  user_id: string;
  net_amount: number;
  profile: Profile | null;
};

interface BalanceSectionProps {
  balances: BalanceEntry[];
  currentUserId: string;
  onSettle: (userId: string, amount: number) => void;
  onRemind: (memberName: string, amount: number) => void;
  onMemberPress: (userId: string) => void;
}

export function BalanceSection({
  balances,
  currentUserId,
  onSettle,
  onRemind,
  onMemberPress,
}: BalanceSectionProps) {
  // Filter out current user and zero-balance members
  const visibleBalances = balances.filter(
    (b) => b.user_id !== currentUserId && b.net_amount !== 0
  );

  return (
    <Card className="mb-4">
      <Text className="text-section-heading text-neutral-text mb-3">
        Balances
      </Text>

      {visibleBalances.length === 0 ? (
        <View className="items-center py-6">
          <Ionicons
            name="checkmark-circle"
            size={48}
            color={colors.semantic.success}
          />
          <Text className="mt-3 text-body text-neutral-text font-semibold">
            All settled up!
          </Text>
          <Text className="mt-1 text-metadata text-neutral-secondary">
            No outstanding balances with your roommates.
          </Text>
        </View>
      ) : (
        <View>
          {visibleBalances.map((entry) => {
            const displayName =
              entry.profile?.display_name ?? 'Unknown';
            // Positive net_amount for another member means they owe you
            const isOwedToYou = entry.net_amount > 0;
            const amount = Math.abs(entry.net_amount);

            return (
              <BalanceMemberRow
                key={entry.user_id}
                userId={entry.user_id}
                displayName={displayName}
                amount={amount}
                isOwedToYou={isOwedToYou}
                onAction={() => {
                  if (isOwedToYou) {
                    onRemind(displayName, amount);
                  } else {
                    onSettle(entry.user_id, amount);
                  }
                }}
                onMemberPress={() => onMemberPress(entry.user_id)}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}
