import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { IconContainer } from '@/components/ui/IconContainer';
import { colors } from '@/lib/theme/colors';

interface UnsettledBalance {
  userId: string;
  displayName: string;
  amount: number;
}

interface OverdueChore {
  id: string;
  name: string;
  assigneeName: string;
}

interface PendingDispute {
  id: string;
  choreName: string;
}

interface ChoreDueToday {
  id: string;
  name: string;
  assigneeName: string;
}

interface AttentionFeedProps {
  unsettledBalances: UnsettledBalance[];
  overdueChores: OverdueChore[];
  pendingDisputes: PendingDispute[];
  choresDueToday: ChoreDueToday[];
}

type AttentionItem = {
  key: string;
  title: string;
  metadata: string;
  icon: string;
  variant: 'warning' | 'error' | 'brand';
  route: string;
};

function buildAttentionItems(props: AttentionFeedProps): AttentionItem[] {
  const items: AttentionItem[] = [];

  // Priority 1: Unsettled balances
  for (const balance of props.unsettledBalances) {
    const absAmount = Math.abs(balance.amount).toFixed(2);
    const isOwed = balance.amount > 0;
    items.push({
      key: `balance-${balance.userId}`,
      title: isOwed
        ? `${balance.displayName} owes you $${absAmount}`
        : `You owe ${balance.displayName} $${absAmount}`,
      metadata: isOwed ? 'Outstanding balance' : 'Unsettled expense',
      icon: 'wallet',
      variant: 'warning',
      route: '/(app)/(tabs)/expenses',
    });
  }

  // Priority 2: Overdue chores
  for (const chore of props.overdueChores) {
    items.push({
      key: `overdue-${chore.id}`,
      title: `${chore.name} is overdue`,
      metadata: `Assigned to ${chore.assigneeName}`,
      icon: 'alert-circle',
      variant: 'error',
      route: '/(app)/(tabs)/chores',
    });
  }

  // Priority 3: Pending disputes
  for (const dispute of props.pendingDisputes) {
    items.push({
      key: `dispute-${dispute.id}`,
      title: `Disputed: ${dispute.choreName}`,
      metadata: 'Pending resolution',
      icon: 'flag',
      variant: 'error',
      route: `/(app)/chores/dispute?completionId=${dispute.id}`,
    });
  }

  // Priority 4: Chores due today
  for (const chore of props.choresDueToday) {
    items.push({
      key: `today-${chore.id}`,
      title: chore.name,
      metadata: `Due today - ${chore.assigneeName}`,
      icon: 'checkbox',
      variant: 'brand',
      route: '/(app)/(tabs)/chores',
    });
  }

  return items;
}

export function AttentionFeed(props: AttentionFeedProps) {
  const router = useRouter();
  const items = buildAttentionItems(props);
  const isEmpty =
    props.unsettledBalances.length === 0 &&
    props.overdueChores.length === 0 &&
    props.pendingDisputes.length === 0 &&
    props.choresDueToday.length === 0;

  return (
    <View className="mt-4 px-5">
      <Text className="text-section-heading font-heading-semi text-neutral-text mb-3">
        Needs Your Attention
      </Text>

      {isEmpty ? (
        <View className="items-center py-6">
          <Image
            source={require('@/assets/empty-states/attention-feed-all-caught-up.png')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text className="text-section-heading font-heading-semi text-neutral-text mt-3">
            All caught up!
          </Text>
          <Text className="font-sans text-body text-neutral-secondary mt-1">
            Nothing needs your attention right now
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {items.map((item) => (
            <Card key={item.key} className="p-0">
              <Pressable
                className="flex-row items-center p-3 active:opacity-80"
                onPress={() => router.push(item.route as never)}
              >
                <IconContainer name={item.icon} variant={item.variant} />
                <View className="flex-1 mx-3">
                  <Text
                    className="text-card-title font-heading-semi text-neutral-text"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="font-sans text-metadata text-neutral-secondary mt-0.5">
                    {item.metadata}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.neutral.tertiary}
                />
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}
