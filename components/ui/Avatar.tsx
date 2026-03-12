import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 72,
};

const FONT_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
};

const GRADIENT_PAIRS: [string, string][] = [
  ['#10B981', '#059669'], // emerald
  ['#3B82F6', '#2563EB'], // blue
  ['#8B5CF6', '#7C3AED'], // violet
  ['#EC4899', '#DB2777'], // pink
  ['#F59E0B', '#D97706'], // amber
  ['#EF4444', '#DC2626'], // red
  ['#06B6D4', '#0891B2'], // cyan
  ['#84CC16', '#65A30D'], // lime
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getGradientForUser(userId: string): [string, string] {
  return GRADIENT_PAIRS[hashString(userId) % GRADIENT_PAIRS.length];
}

interface AvatarProps {
  userId: string;
  name: string;
  size?: AvatarSize;
}

export function Avatar({ userId, name, size = 'md' }: AvatarProps) {
  const [startColor, endColor] = getGradientForUser(userId);
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={{
        shadowColor: startColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize, fontWeight: '600' }}>
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
}
