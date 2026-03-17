import React from 'react';
import { View, Text, Image } from 'react-native';
import { Card } from '@/components/ui/Card';
import { BalanceMemberRow } from './BalanceMemberRow';
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
}

export function BalanceSection({
  balances,
  currentUserId,
  onSettle,
  onRemind,
}: BalanceSectionProps) {
  // Filter out current user and zero-balance members
  const visibleBalances = balances.filter(
    (b) => b.user_id !== currentUserId && b.net_amount !== 0
  );

  return (
    <Card className="mb-4">
      <Text className="text-section-heading font-heading-semi text-neutral-text mb-3">
        Balances
      </Text>

      {visibleBalances.length === 0 ? (
        <View className="items-center py-6">
          <Image
            source={require('@/assets/empty-states/balance-all-settled.png')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text className="mt-3 text-body text-neutral-text font-heading-semi">
            All settled up!
          </Text>
          <Text className="font-sans mt-1 text-metadata text-neutral-secondary">
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
                avatarUrl={entry.profile?.avatar_url}
                amount={amount}
                isOwedToYou={isOwedToYou}
                onAction={() => {
                  if (isOwedToYou) {
                    onRemind(displayName, amount);
                  } else {
                    onSettle(entry.user_id, amount);
                  }
                }}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}
