import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme/colors';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  const baseClasses = 'rounded-full py-3 px-6 items-center justify-center flex-row';
  const variantClasses = isPrimary
    ? 'bg-brand'
    : 'border-2 border-brand bg-transparent';
  const disabledClass = disabled ? 'opacity-50' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${disabledClass} ${className}`}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.8 : disabled ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.white : colors.brand.DEFAULT}
        />
      ) : (
        <Text
          className={`text-body font-heading-semi ${
            isPrimary ? 'text-white' : 'text-brand'
          }`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
