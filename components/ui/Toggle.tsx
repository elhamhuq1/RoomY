import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { colors } from '@/lib/theme/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  locked?: boolean;
}

const SPRING_CONFIG = { damping: 15, stiffness: 300 };

export function Toggle({ value, onChange, locked = false }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, SPRING_CONFIG);
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#E2E8F0', colors.brand.DEFAULT] // neutral.border -> brand
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(progress.value * 20, SPRING_CONFIG),
      },
    ],
  }));

  const handlePress = () => {
    if (locked) return;
    const newValue = !value;
    onChange(newValue);
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: locked ? 0.5 : 1 }}>
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            padding: 2,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
