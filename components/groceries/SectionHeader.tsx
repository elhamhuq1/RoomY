import React from 'react';
import { Text, Pressable, LayoutAnimation, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';

interface SectionHeaderProps {
  label: string;
  count: number;
  icon?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({
  label,
  count,
  icon,
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
      <View className="flex-row items-center gap-1.5">
        {icon && (
          <Ionicons
            name={icon as any}
            size={14}
            color={colors.neutral.secondary}
          />
        )}
        <Text className="font-sans text-overline text-neutral-secondary uppercase">
          {label} ({count})
        </Text>
      </View>
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
