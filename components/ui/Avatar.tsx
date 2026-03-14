import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

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
  ['#2D6A4F', '#1B4332'], // wintergreen (default/fallback)
  ['#C17F59', '#A3654A'], // terracotta
  ['#D4A24E', '#B8893D'], // amber
  ['#5A6872', '#44535C'], // slate
  ['#7B5E7B', '#634B63'], // plum
  ['#3D7A8A', '#2E6270'], // ocean
  ['#A0705A', '#8A5E4A'], // clay
  ['#8FA38B', '#738A6F'], // sage
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
  avatarUrl?: string | null;
}

export function Avatar({ userId, name, size = 'md', avatarUrl }: AvatarProps) {
  const [startColor, endColor] = getGradientForUser(userId);
  const [imageError, setImageError] = useState(false);
  const hasImage = !!avatarUrl && !imageError;
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const ringWidth = dim >= 56 ? 3 : 2;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={{
        width: dim + ringWidth * 2,
        height: dim + ringWidth * 2,
        borderRadius: (dim + ringWidth * 2) / 2,
        borderWidth: ringWidth,
        borderColor: '#2D6A4F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {hasImage ? (
        <Image
          source={{ uri: avatarUrl! }}
          style={{
            width: dim,
            height: dim,
            borderRadius: dim / 2,
          }}
          contentFit="cover"
          cachePolicy="disk"
          onError={() => setImageError(true)}
        />
      ) : (
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
      )}
    </View>
  );
}
