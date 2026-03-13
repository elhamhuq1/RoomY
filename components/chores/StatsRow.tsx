import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';

interface StatsRowProps {
  pendingCount: number;
  disputedCount: number;
  streak: number;
  personalBest: number;
}

export function StatsRow({ pendingCount, disputedCount, streak, personalBest }: StatsRowProps) {
  const displayStreak = streak === 0 && personalBest === 0 ? '-' : String(streak);
  const displayBest = streak === 0 && personalBest === 0 ? 'Best: --' : `Best: ${personalBest}`;

  return (
    <View className="flex-row gap-3 px-4 pt-4 pb-2">
      {/* Pending */}
      <Card className="flex-1 items-center py-3">
        <Text className="text-key-number text-brand">{pendingCount}</Text>
        <Text className="text-metadata text-neutral-secondary">Pending</Text>
      </Card>

      {/* Disputed */}
      <Card className="flex-1 items-center py-3">
        <Text className="text-key-number text-semantic-error">{disputedCount}</Text>
        <Text className="text-metadata text-neutral-secondary">Disputed</Text>
      </Card>

      {/* Streak */}
      <Card className="flex-1 items-center py-3">
        <View className="flex-row items-center">
          <Text className="text-key-number text-brand">{displayStreak}</Text>
          <Text style={{ fontSize: 20, marginLeft: 4 }}>{"🔥"}</Text>
        </View>
        <Text className="text-metadata text-neutral-secondary">{displayBest}</Text>
      </Card>
    </View>
  );
}
