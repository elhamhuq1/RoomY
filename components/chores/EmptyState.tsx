import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/theme/colors';

// ---------------------------------------------------------------------------
// Suggested chores (emoji-based)
// ---------------------------------------------------------------------------

const SUGGESTED_CHORES = [
  { name: 'Dishes', emoji: "\uD83C\uDF7D\uFE0F", frequency: 'daily' },
  { name: 'Take out trash', emoji: "\uD83D\uDDD1\uFE0F", frequency: 'weekly' },
  { name: 'Vacuum', emoji: "\uD83E\uDDF9", frequency: 'weekly' },
  { name: 'Clean bathroom', emoji: "\uD83D\uDEBF", frequency: 'weekly' },
  { name: 'Mop floors', emoji: "\uD83E\uDDF9", frequency: 'weekly' },
  { name: 'Wipe counters', emoji: "\u2728", frequency: 'daily' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onSelectSuggestion: (name: string, frequency: string) => void;
  onCreateCustom: () => void;
}

export function EmptyState({ onSelectSuggestion, onCreateCustom }: EmptyStateProps) {
  return (
    <View className="flex-1 bg-neutral-bg">
      <View className="items-center px-8 pt-12">
        <Image
          source={require('@/docs/empty-state-images/chore-main-empty-state.png')}
          style={{ width: 140, height: 140, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className="text-section-heading font-heading-semi text-neutral-text">
          No chores yet!
        </Text>
        <Text className="mt-2 text-center text-body text-neutral-secondary leading-6">
          Add some chores to keep your home running smoothly
        </Text>
      </View>

      {/* Suggested chores grid */}
      <View className="mt-8 px-4">
        <Text className="text-overline text-neutral-secondary uppercase mb-3">
          Suggested Chores
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {SUGGESTED_CHORES.map((suggestion) => (
            <Pressable
              key={suggestion.name}
              className="w-[47%]"
              onPress={() => onSelectSuggestion(suggestion.name, suggestion.frequency)}
            >
              <Card className="flex-row items-center px-3 py-3.5">
                <View className="h-8 w-8 rounded-xl bg-brand-light items-center justify-center mr-2.5">
                  <Text style={{ fontSize: 16 }}>{suggestion.emoji}</Text>
                </View>
                <Text className="flex-1 text-sm font-medium text-neutral-text" numberOfLines={1}>
                  {suggestion.name}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Custom chore button */}
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 py-3.5 active:bg-gray-50"
          onPress={onCreateCustom}
        >
          <Ionicons name="add" size={20} color={colors.neutral.tertiary} />
          <Text className="ml-2 text-metadata text-neutral-secondary">
            Create custom chore
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
