import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';
import { Card } from '@/components/ui/Card';

interface QuickAddInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export function QuickAddInput({ value, onChangeText, onSubmit }: QuickAddInputProps) {
  const hasText = value.trim().length > 0;

  return (
    <Card className="mx-4 mt-4 p-0">
      <View className="flex-row items-center p-2">
        <TextInput
            className="font-sans flex-1 px-3 py-2 text-body text-neutral-text"
          placeholder="Add an item..."
          placeholderTextColor={colors.neutral.tertiary}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
        />
        <Pressable
          className={`h-10 w-10 rounded-xl items-center justify-center ${
            hasText ? 'bg-brand' : 'bg-neutral-surface'
          }`}
          onPress={onSubmit}
          disabled={!hasText}
        >
          <Ionicons
            name="add"
            size={22}
            color={hasText ? '#fff' : colors.neutral.tertiary}
          />
        </Pressable>
      </View>
    </Card>
  );
}
