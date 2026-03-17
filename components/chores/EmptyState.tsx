import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/theme/colors';
import { ROOMS } from '@/lib/constants/chore-rooms';
import { CHORE_TEMPLATES } from '@/lib/constants/chore-templates';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onSelectRoom: (roomType: string) => void;
  onCreateCustom: () => void;
}

export function EmptyState({ onSelectRoom, onCreateCustom }: EmptyStateProps) {
  const roomsWithTemplates = ROOMS.filter(r => (CHORE_TEMPLATES[r.id]?.length ?? 0) > 0);

  return (
    <View className="flex-1 bg-neutral-bg">
      {/* Illustration + messaging */}
      <View className="items-center px-8 pt-12">
        <Image
          source={require('@/assets/empty-states/chore-main-empty-state.png')}
          style={{ width: 140, height: 140, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className="text-section-heading font-heading-semi text-neutral-text">
          No chores yet!
        </Text>
        <Text className="font-sans mt-2 text-center text-body text-neutral-secondary leading-6">
          Pick a room to get started with ready-made templates
        </Text>
      </View>

      {/* Room-based template cards */}
      <View className="mt-8 px-4">
        <Text className="font-sans text-overline text-neutral-secondary uppercase mb-3">
          Add by Room
        </Text>
        {roomsWithTemplates.map((room) => (
          <Pressable
            key={room.id}
            onPress={() => onSelectRoom(room.id)}
            className="mb-2"
          >
            <Card className="flex-row items-center px-3 py-3.5">
              <Ionicons
                name={room.icon as any}
                size={24}
                color={colors.brand.DEFAULT}
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-neutral-text">{room.label}</Text>
                <Text className="text-xs text-neutral-secondary">
                  {CHORE_TEMPLATES[room.id].length} templates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </Card>
          </Pressable>
        ))}

        {/* Custom chore button */}
        <Pressable
          className="mt-2 flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 py-3.5 active:bg-gray-50"
          onPress={onCreateCustom}
        >
          <Ionicons name="add" size={20} color={colors.neutral.tertiary} />
          <Text className="font-sans ml-2 text-metadata text-neutral-secondary">
            Create custom chore
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
