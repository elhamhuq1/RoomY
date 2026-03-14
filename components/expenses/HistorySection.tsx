import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ExpenseRow } from './ExpenseRow';
import type { Expense } from '@/lib/types/database';
import type { SplitWithProfile, PayerBalanceMap } from './ExpenseRow';

export type HistoryItem = {
  type: 'expense';
  data: Expense;
  payerName: string;
};

export type GroupedHistory = {
  label: string;
  items: HistoryItem[];
};

interface HistorySectionProps {
  groups: GroupedHistory[];
  expandedId: string | null;
  splitsCache: Record<string, SplitWithProfile[]>;
  payerBalancesCache: Record<string, PayerBalanceMap>;
  onExpensePress: (id: string) => void;
  currentUserId: string;
}

export function HistorySection({
  groups,
  expandedId,
  splitsCache,
  payerBalancesCache,
  onExpensePress,
}: HistorySectionProps) {
  return (
    <View>
      {groups.map((group) => (
        <View key={group.label} className="mb-4">
          <Text className="font-sans text-overline text-neutral-secondary uppercase mb-2">
            {group.label}
          </Text>
          <Card className="p-0">
            {group.items.map((item, idx) => {
              const isLast = idx === group.items.length - 1;

              return (
                <ExpenseRow
                  key={item.data.id}
                  expense={item.data}
                  payerName={item.payerName}
                  isExpanded={expandedId === item.data.id}
                  splits={splitsCache[item.data.id] ?? null}
                  payerBalances={payerBalancesCache[item.data.paid_by] ?? null}
                  onPress={() => onExpensePress(item.data.id)}
                  isLast={isLast}
                />
              );
            })}
          </Card>
        </View>
      ))}
    </View>
  );
}
