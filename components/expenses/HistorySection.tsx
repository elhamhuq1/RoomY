import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ExpenseRow } from './ExpenseRow';
import { SettlementRow } from './SettlementRow';
import type { Expense, Settlement } from '@/lib/types/database';
import type { SplitWithProfile } from './ExpenseRow';

export type HistoryItem =
  | { type: 'expense'; data: Expense; payerName: string }
  | {
      type: 'settlement';
      data: Settlement;
      paidByName: string;
      paidToName: string;
    };

export type GroupedHistory = {
  label: string;
  items: HistoryItem[];
};

interface HistorySectionProps {
  groups: GroupedHistory[];
  expandedId: string | null;
  splitsCache: Record<string, SplitWithProfile[]>;
  onExpensePress: (id: string) => void;
  currentUserId: string;
}

export function HistorySection({
  groups,
  expandedId,
  splitsCache,
  onExpensePress,
}: HistorySectionProps) {
  return (
    <View>
      {groups.map((group) => (
        <View key={group.label} className="mb-4">
          <Text className="text-overline text-neutral-secondary uppercase mb-2">
            {group.label}
          </Text>
          <Card className="p-0">
            {group.items.map((item, idx) => {
              const isLast = idx === group.items.length - 1;

              if (item.type === 'settlement') {
                return (
                  <SettlementRow
                    key={item.data.id}
                    settlement={item.data}
                    paidByName={item.paidByName}
                    paidToName={item.paidToName}
                    isLast={isLast}
                  />
                );
              }

              return (
                <ExpenseRow
                  key={item.data.id}
                  expense={item.data}
                  payerName={item.payerName}
                  isExpanded={expandedId === item.data.id}
                  splits={splitsCache[item.data.id] ?? null}
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
