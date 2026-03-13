import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme/colors';

export interface StepProgressBarProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Whether to show the back button (default true) */
  showBack?: boolean;
}

function SegmentBar({ filled, active }: { filled: boolean; active: boolean }) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    } else {
      progress.value = withTiming(filled ? 1 : 0, { duration: 200 });
    }
  }, [filled, active]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={{
        flex: 1,
        height: 3,
        backgroundColor: '#E2E8F0',
        borderRadius: 1.5,
        marginHorizontal: 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 1.5,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

export function StepProgressBar({
  currentStep,
  totalSteps = 3,
  onBack,
  showBack = true,
}: StepProgressBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
      }}
    >
      {showBack && onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.neutral.text} />
        </Pressable>
      ) : showBack ? (
        <View style={{ width: 40 }} />
      ) : null}

      {Array.from({ length: totalSteps }).map((_, i) => (
        <SegmentBar
          key={i}
          filled={i < currentStep}
          active={i === currentStep}
        />
      ))}
    </View>
  );
}
