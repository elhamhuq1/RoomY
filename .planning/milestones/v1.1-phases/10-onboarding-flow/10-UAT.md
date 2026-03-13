---
status: testing
phase: 10-onboarding-flow
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md]
started: 2026-03-13T17:20:00Z
updated: 2026-03-13T17:20:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: StepProgressBar Animation
expected: |
  On onboarding screens (profile, household-choice, create-household, join-household, module-quiz), a thin 3-segment progress bar appears at the top. The current segment animates its fill from left to right. Previous segments are fully filled green. Future segments are gray. Back button (chevron) appears on screens after profile.
awaiting: user response

## Tests

### 1. Welcome Carousel with Glassmorphism Logo
expected: Welcome screen has cream background. Glassmorphism logo container with RoomY logo pinned above carousel. 3 swipeable slides with illustration heroes (~50% height), titles, subtitles, and emoji feature badge pills. Active page dot is wide green pill, inactive dots are small gray circles. "Get Started" button and "Log in" link at bottom.
result: issue
reported: "Wrong logo (should be android-icon-foreground.png), images need to be transparent PNGs, remove emoji badge pills, Get Started button should be centered pill shape"
severity: major

### 2. StepProgressBar Animation
expected: On onboarding screens (profile, household-choice, create-household, join-household, module-quiz), a thin 3-segment progress bar appears at the top. The current segment animates its fill from left to right. Previous segments are fully filled green. Future segments are gray. Back button (chevron) appears on screens after profile.
result: [pending]

### 3. Sign-Up Screen Restyle
expected: Sign-up screen has cream background, small glassmorphism logo at top, "Create Account" title. Form inputs (Email, Password, Confirm Password) have gray fill (#F5F5F5) by default and switch to white bg with green border when focused. "Create Account" green button. Social auth buttons below an "or" divider: Google (white bg, colored G) and Apple (black bg, white logo, iOS only). "Already have an account? Log in" link at bottom.
result: [pending]

### 4. Sign-In (Log In) Screen Restyle
expected: Sign-in screen mirrors sign-up layout with cream bg, glassmorphism logo, "Welcome Back" title, "Log in to your account" subtitle. "Log In" button text (not "Sign In"). Same inset input styling and social auth buttons. "Forgot password?" link present. "Don't have an account? Sign up" at bottom.
result: [pending]

### 5. Forgot Password Screen
expected: Cream background, small glassmorphism logo, "Reset Password" title, inset-style email input. "Send Reset Link" button. "Back to Log In" link at bottom (not "Back to Sign In"). After sending, success state also has cream background.
result: [pending]

### 6. Profile Screen with Live Avatar
expected: Cream background, StepProgressBar at step 1 (first segment filling), no back button. Display-name.jpg illustration as hero. "What's your name?" title. A live Avatar preview that updates its displayed initial letter as you type your display name. When empty, shows "?" or placeholder. Inset-style input (gray default, green border on focus). "Continue" button disabled when name is empty.
result: [pending]

### 7. Household Choice Screen
expected: Cream background, StepProgressBar at step 2 (second segment), back button present. Setup-home.jpg illustration. "Set Up Your Home" title. Two large cards: "Create Household" with green gradient house icon, and "Join Household" with violet gradient key icon. Each card has a title and description. Tapping each navigates to the correct screen.
result: [pending]

### 8. Create Household Name Form
expected: Cream background, StepProgressBar at step 2, back button present. Name-household.jpg illustration. Branded house icon above title. "Name Your Household" title. Inset input with placeholder "e.g., The Lake House". "Create Household" button disabled when name is empty.
result: [pending]

### 9. Invite Code Celebration Screen
expected: After creating a household, celebration screen appears with cream background and NO progress bar. Invite-code.jpg illustration replaces the old green checkmark. "You're All Set!" title. Dark gradient card (#1E293B to #0F172A) displaying the invite code in large white text with spaced formatting (ABCD EFGH). "Share with Roommates" primary button opens OS share sheet. "Copy code" text link copies to clipboard (shows "Copied!" briefly). "Continue Setup" button at bottom.
result: [pending]

### 10. Join Household Screen
expected: Cream background, StepProgressBar at step 2, back button present. "Join Household" title. Inset-style invite code input (gray default, green border on focus). "Join" button. Entering a valid code and tapping Join works as before.
result: [pending]

### 11. Member Welcome Screen
expected: After joining a household, celebration screen with cream background and NO progress bar. "You're in!" celebratory message. Household name displayed. Member list with colored Avatar components. "Continue" button navigates to module quiz.
result: [pending]

### 12. Module Quiz Screen
expected: Cream background, StepProgressBar at step 3 (third segment filling), back button present. Module toggle cards using Toggle components (not native Switch) inside Card containers. Expenses toggle locked on. Groceries and Chores toggles are interactive. "Finish Setup" button at bottom completes onboarding.
result: [pending]

### 13. Sign In to Log In Rename Complete
expected: No user-visible text reads "Sign In" anywhere in the auth or onboarding flow. All instances say "Log In" or "Log in" instead. Check: welcome screen link, sign-in button, sign-in subtitle, sign-up footer link, forgot-password back link.
result: [pending]

## Summary

total: 13
passed: 0
issues: 1
pending: 12
skipped: 0

## Gaps

[none yet]
