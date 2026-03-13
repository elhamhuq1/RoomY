import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ONBOARDING_IMAGES, ONBOARDING_CREAM } from '@/lib/onboarding-images';

const VALUE_PROPS = [
  {
    image: ONBOARDING_IMAGES.splitExpenses,
    title: 'Split Expenses Fairly',
    description:
      'Track shared costs and settle up with one tap. No more awkward money conversations.',
  },
  {
    image: ONBOARDING_IMAGES.sharedGrocery,
    title: 'Shared Grocery Lists',
    description:
      'Keep one list everyone can add to. Never buy duplicate milk again.',
  },
  {
    image: ONBOARDING_IMAGES.choreRotation,
    title: 'Chore Rotation',
    description:
      'Take turns fairly with automatic chore scheduling. Everyone does their part.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    },
    [width],
  );

  const imageHeight = height * 0.3;

  return (
    <View style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      {/* Fixed header: glassmorphism logo + title + tagline */}
      <View style={{ alignItems: 'center', paddingTop: 64, paddingBottom: 12 }}>
        <BlurView
          intensity={25}
          tint="light"
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              ...Platform.select({
                ios: { backgroundColor: 'rgba(255,255,255,0.3)' },
                android: { backgroundColor: 'rgba(255,255,255,0.7)' },
              }),
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={require('@/assets/android-icon-foreground.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
          </View>
        </BlurView>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#1E293B',
            marginTop: 12,
          }}
        >
          RoomY
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#64748B',
            marginTop: 4,
          }}
        >
          Living together, made easy
        </Text>
      </View>

      {/* Carousel */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {VALUE_PROPS.map((prop, index) => (
            <View
              key={index}
              style={{ width, alignItems: 'center', paddingHorizontal: 32 }}
            >
              {/* Illustration hero ~50% of slide area */}
              <Image
                source={prop.image}
                style={{
                  width: width - 64,
                  height: imageHeight,
                }}
                resizeMode="contain"
              />

              {/* Title */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#1E293B',
                  textAlign: 'center',
                  marginTop: 16,
                }}
              >
                {prop.title}
              </Text>

              {/* Subtitle */}
              <Text
                style={{
                  fontSize: 15,
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 22,
                  maxWidth: 300,
                }}
                numberOfLines={2}
              >
                {prop.description}
              </Text>


            </View>
          ))}
        </ScrollView>

        {/* Page indicator dots */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          {VALUE_PROPS.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor:
                  index === activeIndex ? '#10B981' : '#D1D5DB',
              }}
            />
          ))}
        </View>
      </View>

      {/* CTA section */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 48, paddingTop: 24, alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push('/(auth)/sign-up')}
          style={{
            backgroundColor: '#10B981',
            borderRadius: 999,
            paddingVertical: 16,
            width: '100%',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
            Get Started
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Already have an account?{' '}
            <Text style={{ fontWeight: '600', color: '#059669' }}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
