import React from 'react';
import { Text, Pressable, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';

interface SectionHeaderProps {
  label: string;
  count: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({
  label,
  count,
  collapsible = false,
  expanded = true,
  onToggle,
}: SectionHeaderProps) {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle?.();
  };

  return (
    <Pressable
      className="flex-row items-center justify-between px-4 py-2"
      onPress={collapsible ? handleToggle : undefined}
      disabled={!collapsible}
    >
      <Text className="text-overline text-neutral-secondary uppercase">
        {label} ({count})
      </Text>
      {collapsible && (
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.neutral.secondary}
        />
      )}
    </Pressable>
  );
}
