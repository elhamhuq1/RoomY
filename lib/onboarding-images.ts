/**
 * Onboarding screen illustration images and constants.
 * All requires are static for Metro bundler compatibility.
 */

/** Cream background color matching illustration backgrounds */
export const ONBOARDING_CREAM = '#F5F0EB';

/** Static require map for all onboarding illustrations */
export const ONBOARDING_IMAGES = {
  splitExpenses: require('@/assets/onboarding/split-expenses.png'),
  sharedGrocery: require('@/assets/onboarding/shared-grocery.png'),
  choreRotation: require('@/assets/onboarding/chore-rotation.png'),
  displayName: require('@/assets/onboarding/display-name.png'),
  setupHome: require('@/assets/onboarding/setup-home.png'),
  nameHousehold: require('@/assets/onboarding/name-household.png'),
  inviteCode: require('@/assets/onboarding/invite-code.png'),
  createHouseholdIcon: require('@/assets/onboarding/create-household-icon.png'),
  joinHouseholdIcon: require('@/assets/onboarding/join-household-icon.png'),
} as const;
