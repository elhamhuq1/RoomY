import React from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';

interface GreetingHeaderProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({ userName }: GreetingHeaderProps) {
  return (
    <View className="px-5 pt-4">
      <Text className="text-page-title font-heading text-neutral-text">
        {getGreeting()}, {userName}
      </Text>
      <Text className="font-sans text-metadata text-neutral-secondary mt-1">
        {format(new Date(), 'EEEE, MMMM d')}
      </Text>
    </View>
  );
}
