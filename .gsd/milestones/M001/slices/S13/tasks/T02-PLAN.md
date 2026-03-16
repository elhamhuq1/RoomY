# T02: 13-profile-pictures 02

**Slice:** S13 — **Milestone:** M001

## Description

Create the AvatarUpload component with camera badge and action sheet, then integrate it into the settings profile page and onboarding display name step.

Purpose: Give users the actual UI to upload, change, and remove profile pictures in the two designated locations.
Output: AvatarUpload component, updated settings/profile.tsx and onboarding/profile.tsx with avatar upload capability.

## Must-Haves

- [x] "User can tap avatar in settings to open action sheet with Take Photo / Choose from Library / Edit / Remove Photo options when photo exists"
- [x] "User can tap avatar in onboarding to open action sheet with Take Photo / Choose from Library options"
- [x] "Camera badge appears bottom-right on avatar in onboarding (always visible)"
- [x] "Camera badge appears on avatar in settings only when no photo is set"
- [x] "Removing a photo shows a confirmation dialog before proceeding"
- [x] "Permission denial shows an alert explaining why access is needed"
- [x] "Upload failure shows an Alert with 'Try Again' button that re-invokes the same handler"
- [x] "Onboarding avatar updates live with gradient+initials as user types name"

## Files

- `components/ui/AvatarUpload.tsx`
- `components/ui/index.ts`
- `app/(app)/settings/profile.tsx`
- `app/(onboarding)/profile.tsx`
