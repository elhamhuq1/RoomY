import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';

export type IconContainerVariant =
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

const VARIANT_STYLES: Record<
  IconContainerVariant,
  { bgClass: string; iconColor: string }
> = {
  brand: { bgClass: 'bg-brand-light', iconColor: colors.brand.dark },
  success: { bgClass: 'bg-green-100', iconColor: '#16A34A' }, // green-600
  warning: { bgClass: 'bg-amber-100', iconColor: '#D97706' }, // amber-600
  error: { bgClass: 'bg-red-100', iconColor: '#DC2626' }, // red-600
  info: { bgClass: 'bg-blue-100', iconColor: '#2563EB' }, // blue-600
  neutral: { bgClass: 'bg-neutral-surface', iconColor: colors.neutral.secondary },
};

interface IconContainerProps {
  name: string;
  variant?: IconContainerVariant;
  size?: number;
}

export function IconContainer({
  name,
  variant = 'brand',
  size = 20,
}: IconContainerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <View
      className={`${styles.bgClass} rounded-xl items-center justify-center`}
      style={{ width: 40, height: 40 }}
    >
      <Ionicons name={name as any} size={size} color={styles.iconColor} />
    </View>
  );
}
