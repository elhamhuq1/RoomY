import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant =
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  neutral: { bg: 'bg-neutral-surface', text: 'text-neutral-secondary' },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <View className={`${styles.bg} rounded-full px-2.5 py-0.5`}>
      <Text className={`${styles.text} font-sans text-badge`}>{label}</Text>
    </View>
  );
}
