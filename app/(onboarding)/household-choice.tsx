import { View, Text, Pressable, Image } from "react-native";
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
            style={{
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 16,
            }}
          >
            <Image
              source={ONBOARDING_IMAGES.createHouseholdIcon}
              style={{ width: 64, height: 64, marginBottom: 10 }}
              resizeMode="contain"
            />
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
          </Pressable>

          {/* Join Household */}
          <Pressable
            onPress={() => router.push("/(onboarding)/join-household")}
            style={{
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 16,
            }}
          >
            <Image
              source={ONBOARDING_IMAGES.joinHouseholdIcon}
              style={{ width: 64, height: 64, marginBottom: 10 }}
              resizeMode="contain"
            />
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
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
