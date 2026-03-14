import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/theme/colors';

export interface RoommateMember {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
}

interface RoommateSectionProps {
  members: RoommateMember[];
  onMemberPress: (userId: string) => void;
}

export function RoommateSection({ members, onMemberPress }: RoommateSectionProps) {
  return (
    <Card className="mb-4">
      <Text className="text-section-heading font-heading-semi text-neutral-text mb-3">
        Expenses by Roommate
      </Text>
      {members.map((member, index) => (
        <Pressable
          key={member.user_id}
          className={`flex-row items-center py-3 ${
            index < members.length - 1 ? 'border-b border-neutral-border' : ''
          }`}
          onPress={() => onMemberPress(member.user_id)}
        >
          <Avatar
            userId={member.user_id}
            name={member.display_name}
            size="sm"
            avatarUrl={member.avatar_url}
          />
          <Text className="ml-3 flex-1 text-card-title font-heading-semi text-neutral-text">
            {member.display_name}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.neutral.secondary}
          />
        </Pressable>
      ))}
    </Card>
  );
}
