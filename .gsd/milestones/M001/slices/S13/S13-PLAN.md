# S13: Profile Pictures

**Goal:** Install image-related packages, set up Supabase Storage bucket with RLS policies, create the avatar upload utility, and upgrade the Avatar component to display uploaded photos with a brand-colored ring.
**Demo:** Install image-related packages, set up Supabase Storage bucket with RLS policies, create the avatar upload utility, and upgrade the Avatar component to display uploaded photos with a brand-colored ring.

## Must-Haves


## Tasks

- [x] **T01: 13-profile-pictures 01** `est:3min`
  - Install image-related packages, set up Supabase Storage bucket with RLS policies, create the avatar upload utility, and upgrade the Avatar component to display uploaded photos with a brand-colored ring.

Purpose: Establish the foundation layer that all avatar upload UI and progressive adoption depends on.
Output: Working avatar-upload.ts utility, upgraded Avatar.tsx with avatarUrl support, Supabase Storage ready for uploads.
- [x] **T02: 13-profile-pictures 02** `est:2min`
  - Create the AvatarUpload component with camera badge and action sheet, then integrate it into the settings profile page and onboarding display name step.

Purpose: Give users the actual UI to upload, change, and remove profile pictures in the two designated locations.
Output: AvatarUpload component, updated settings/profile.tsx and onboarding/profile.tsx with avatar upload capability.
- [x] **T03: 13-profile-pictures 03** `est:6min`
  - Pass avatarUrl to every Avatar component across the entire app so uploaded profile pictures display everywhere. Update profile queries that only select id+display_name to also include avatar_url.

Purpose: Complete the progressive adoption so profile pictures appear on all screens, not just settings and onboarding.
Output: All Avatar usages across the app display uploaded photos when available.

## Files Likely Touched

- `package.json`
- `package-lock.json`
- `lib/avatar-upload.ts`
- `components/ui/Avatar.tsx`
- `components/ui/AvatarUpload.tsx`
- `components/ui/index.ts`
- `app/(app)/settings/profile.tsx`
- `app/(onboarding)/profile.tsx`
- `components/home/MembersCard.tsx`
- `components/expenses/BalanceMemberRow.tsx`
- `components/expenses/ExpenseRow.tsx`
- `components/expenses/RoommateSection.tsx`
- `components/home/WeeklyTimeline.tsx`
- `components/groceries/GroceryItemRow.tsx`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/chores/dispute.tsx`
- `app/(onboarding)/member-welcome.tsx`
- `app/(app)/settings/members.tsx`
- `app/(app)/expenses/member-history.tsx`
- `app/(app)/(tabs)/index.tsx`
