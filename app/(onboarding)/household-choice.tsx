import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, StepProgressBar } from "@/components/ui";
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

        {/* Option cards */}
        <View style={{ gap: 16 }}>
          {/* Create Household */}
          <Pressable onPress={() => router.push("/(onboarding)/create-household")}>
            <Card className="p-5">
              <View style={{ alignItems: "center" }}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="home" size={24} color="#fff" />
                </LinearGradient>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.neutral.text,
                    marginBottom: 4,
                  }}
                >
                  Create Household
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.neutral.secondary,
                    textAlign: "center",
                  }}
                >
                  Start a new home and invite roommates
                </Text>
              </View>
            </Card>
          </Pressable>

          {/* Join Household */}
          <Pressable onPress={() => router.push("/(onboarding)/join-household")}>
            <Card className="p-5">
              <View style={{ alignItems: "center" }}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="key" size={24} color="#fff" />
                </LinearGradient>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.neutral.text,
                    marginBottom: 4,
                  }}
                >
                  Join Household
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.neutral.secondary,
                    textAlign: "center",
                  }}
                >
                  Enter an invite code from your roommate
                </Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
