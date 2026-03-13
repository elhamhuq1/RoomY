import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconContainer } from '@/components/ui/IconContainer';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/lib/theme/colors';
import type { Expense } from '@/lib/types/database';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

export type SplitWithProfile = {
  id: string;
  user_id: string;
  share_amount: string;
  profile: { display_name: string } | null;
};

/** Net balance between the payer and each split member (from payer's perspective). */
export type PayerBalanceMap = Record<string, number>;

interface ExpenseRowProps {
  expense: Expense;
  payerName: string;
  isExpanded: boolean;
  splits: SplitWithProfile[] | null;
  payerBalances: PayerBalanceMap | null;
  onPress: () => void;
  isLast: boolean;
}

export function ExpenseRow({
  expense,
  payerName,
  isExpanded,
  splits,
  payerBalances,
  onPress,
  isLast,
}: ExpenseRowProps) {
  const dateStr = new Date(expense.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View>
      <Pressable
        className={`flex-row items-center px-4 py-3 ${
          !isLast && !isExpanded ? 'border-b border-neutral-border' : ''
        }`}
        onPress={onPress}
      >
        <View className="mr-3">
          <IconContainer name="receipt-outline" variant="warning" />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-card-title font-heading-semi text-neutral-text">
            {expense.description}
          </Text>
          <Text className="text-metadata text-neutral-secondary">
            Paid by {payerName} - {dateStr}
          </Text>
        </View>
        <Text className="text-body font-bold text-neutral-text">
          {formatCurrency(Number(expense.amount))}
        </Text>
        <View className="ml-2">
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.neutral.secondary}
          />
        </View>
      </Pressable>

      {isExpanded && (
        <View
          className={`px-4 pb-3 bg-neutral-surface ${
            !isLast ? 'border-b border-neutral-border' : ''
          }`}
        >
          {splits === null ? (
            <View className="items-center py-3">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            splits.map((split) => {
              const isPayer = split.user_id === expense.paid_by;

              // Determine payment status for non-payer members
              let statusLabel: string | null = null;
              let statusColor: string = colors.semantic.success;
              let statusIcon: 'checkmark-circle' | 'time-outline' = 'checkmark-circle';

              if (isPayer) {
                statusLabel = 'Paid';
                statusColor = colors.semantic.success;
                statusIcon = 'checkmark-circle';
              } else if (payerBalances) {
                // payerBalances[user_id] = net balance from payer's perspective
                // positive = this member still owes the payer overall
                // zero or absent = settled overall
                // negative = payer owes them (overpaid)
                const netOwed = payerBalances[split.user_id] ?? 0;
                if (netOwed > 0) {
                  statusLabel = `Owes ${formatCurrency(netOwed)}`;
                  statusColor = colors.semantic.warning;
                  statusIcon = 'time-outline';
                } else {
                  statusLabel = 'Settled';
                  statusColor = colors.semantic.success;
                  statusIcon = 'checkmark-circle';
                }
              }

              return (
                <View
                  key={split.id}
                  className="flex-row items-center py-2"
                >
                  <Avatar
                    userId={split.user_id}
                    name={split.profile?.display_name ?? '?'}
                    size="sm"
                  />
                  <Text className="ml-2 flex-1 text-metadata text-neutral-secondary">
                    {split.profile?.display_name ?? 'Unknown'}
                  </Text>
                  <Text className="text-metadata font-semibold text-neutral-text">
                    {formatCurrency(Number(split.share_amount))}
                  </Text>
                  {statusLabel && (
                    <View className="flex-row items-center ml-2">
                      <Ionicons
                        name={statusIcon}
                        size={14}
                        color={statusColor}
                      />
                      <Text
                        className="ml-1 text-metadata font-semibold"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}
