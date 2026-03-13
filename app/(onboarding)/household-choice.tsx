import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgressBar } from "@/components/ui";
import { ONBOARDING_CREAM, ONBOARDING_IMAGES } from "@/lib/onboarding-images";
import { colors } from "@/lib/theme/colors";

export default function HouseholdChoiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ONBOARDING_CREAM }}>
      <StepProgressBar
        currentStep={1}
        totalSteps={3}
        onBack={() => router.back()}
      />

      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        {/* Illustration hero */}
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Image
            source={ONBOARDING_IMAGES.setupHome}
            style={{ width: "100%", height: 240 }}
            resizeMode="contain"
          />
        </View>

        {/* Title + subtitle */}
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: colors.neutral.text,
              textAlign: "center",
            }}
          >
            Set Up Your Home
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.neutral.secondary,
              textAlign: "center",
              marginTop: 6,
            }}
          >
            Create a new household or join an existing one
          </Text>
        </View>

        {/* Options */}
        <View style={{ gap: 24 }}>
          {/* Create Household */}
          <Pressable
            onPress={() => router.push("/(onboarding)/create-household")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
            })}
          >
            <Image
              source={ONBOARDING_IMAGES.createHouseholdIcon}
              style={{ width: 56, height: 56, marginRight: 16 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.neutral.text,
                  marginBottom: 2,
                }}
              >
                Create Household
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.neutral.secondary,
                }}
              >
                Start a new home and invite roommates
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.tertiary} />
          </Pressable>

          {/* Join Household */}
          <Pressable
            onPress={() => router.push("/(onboarding)/join-household")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
            })}
          >
            <Image
              source={ONBOARDING_IMAGES.joinHouseholdIcon}
              style={{ width: 56, height: 56, marginRight: 16 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.neutral.text,
                  marginBottom: 2,
                }}
              >
                Join Household
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.neutral.secondary,
                }}
              >
                Enter an invite code from your roommate
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.tertiary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
