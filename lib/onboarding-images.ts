/**
 * Onboarding screen illustration images and constants.
 * All requires are static for Metro bundler compatibility.
 */

/** Cream background color matching illustration backgrounds */
export const ONBOARDING_CREAM = '#F5F0EB';

/** Static require map for all onboarding illustrations */
export const ONBOARDING_IMAGES = {
  splitExpenses: require('@/assets/onboarding/split-expenses.jpg'),
  sharedGrocery: require('@/assets/onboarding/shared-grocery.jpg'),
  choreRotation: require('@/assets/onboarding/chore-rotation.jpg'),
  displayName: require('@/assets/onboarding/display-name.jpg'),
  setupHome: require('@/assets/onboarding/setup-home.jpg'),
  nameHousehold: require('@/assets/onboarding/name-household.jpg'),
  inviteCode: require('@/assets/onboarding/invite-code.jpg'),
} as const;
