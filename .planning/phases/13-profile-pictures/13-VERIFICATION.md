---
phase: 13-profile-pictures
verified: 2026-03-14T04:30:00Z
status: passed
score: 18/18 must-haves verified
re_verification: false
gaps: []
accepted_deviations:
  - truth: "User can tap avatar in settings to open action sheet with Take Photo / Choose from Library / Edit / Remove Photo options when photo exists"
    status: accepted
    reason: "Edit button deliberately removed during UAT — user identified it as redundant (duplicated Take Photo and Choose from Library which are already top-level options). Expo SDK 54 lacks a native crop-existing-image UI, so Edit could not offer distinct value. User approved the simplified action sheet."
human_verification:
  - test: "End-to-end upload flow on device"
    expected: "Photo uploads from gallery, displays across all screens, cache-busted URL is used, photo persists after app restart"
    why_human: "Supabase Storage RLS and network upload cannot be verified programmatically"
  - test: "Camera permission denial"
    expected: "Alert.alert('Error', 'Camera access is needed to take a profile photo.') appears when camera permission is denied"
    why_human: "Requires device permission flow to test"
  - test: "Realtime avatar propagation"
    expected: "When one household member changes their avatar, other members on the home screen see the update immediately without refreshing"
    why_human: "Requires two logged-in devices or accounts"
  - test: "Brand ring visual consistency"
    expected: "Wintergreen (#2D6A4F) ring appears at 2px for small/medium avatars and 3px for xl/2xl across all screens"
    why_human: "Visual verification only"
---

# Phase 13: Profile Pictures Verification Report

**Phase Goal:** Let users upload profile pictures via camera or gallery, displayed across the entire app.
**Verified:** 2026-03-14T04:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | Avatar component renders uploaded photo when avatarUrl prop is provided | VERIFIED | `Avatar.tsx:82-93` — renders `<Image source={{ uri: avatarUrl! }} ... cachePolicy="disk">` when `hasImage` is true |
| 2  | Avatar component falls back to gradient+initials when no avatarUrl | VERIFIED | `Avatar.tsx:94-111` — LinearGradient with initials rendered when `!hasImage` |
| 3  | Avatar component shows brand-colored wintergreen ring around all avatars | VERIFIED | `Avatar.tsx:71-81` — outer View with `borderWidth: ringWidth`, `borderColor: '#2D6A4F'` wraps all avatar content |
| 4  | pickAndUploadAvatar picks image with square crop, resizes to max 512x512, uploads to Supabase Storage | VERIFIED | `lib/avatar-upload.ts:32-83` — `aspect: [1,1]`, resize via manipulateAsync if >512, uploads to `supabase.storage.from('avatars')` with upsert |
| 5  | removeAvatar deletes image from storage and clears avatar_url in profile | VERIFIED | `lib/avatar-upload.ts:89-105` — lists folder, removes files, then `.update({ avatar_url: null })` |
| 6  | Camera permission is requested before launching camera | VERIFIED | `lib/avatar-upload.ts:19-24` — `requestCameraPermissionsAsync()` checked, throws `CAMERA_PERMISSION_DENIED` if denied |
| 7  | User can tap avatar in settings to open action sheet with Take Photo / Choose from Library / Edit / Remove Photo options when photo exists | FAILED | `AvatarUpload.tsx:80-94` — 'Edit' button is absent from the action sheet when avatarUrl is set. Actual options: Take Photo, Choose from Library, Remove Photo, Cancel |
| 8  | User can tap avatar in onboarding to open action sheet with Take Photo / Choose from Library options | VERIFIED | `AvatarUpload.tsx:88-93` — correct options shown when no photo exists |
| 9  | Camera badge appears bottom-right on avatar in onboarding (always visible) | VERIFIED | `AvatarUpload.tsx:26,101-117` — `showBadgeAlways` prop controls visibility; onboarding passes `showBadgeAlways={true}` |
| 10 | Camera badge appears on avatar in settings only when no photo is set | VERIFIED | `AvatarUpload.tsx:26` — `showBadge = showBadgeAlways \|\| !avatarUrl`; settings does not pass `showBadgeAlways` so badge hides when photo exists |
| 11 | Removing a photo shows a confirmation dialog before proceeding | VERIFIED | `AvatarUpload.tsx:58-78` — `Alert.alert('Remove profile photo?', ...)` with Cancel/Remove destructive button |
| 12 | Permission denial shows an alert explaining why access is needed | VERIFIED | `AvatarUpload.tsx:35-38` — catches `CAMERA_PERMISSION_DENIED`, calls `onError('Camera access is needed to take a profile photo.')` |
| 13 | Upload failure shows an Alert with 'Try Again' button that re-invokes the same handler | VERIFIED | `AvatarUpload.tsx:39-43,50-55` — both `handleCamera` and `handleGallery` show `Alert.alert('Upload Failed', ..., [{ text: 'Try Again', onPress: () => handleCamera() }])` |
| 14 | Onboarding avatar updates live with gradient+initials as user types name | VERIFIED | `app/(onboarding)/profile.tsx:89-98` — `name={displayName \|\| '?'}` passed to AvatarUpload, which passes to Avatar for gradient rendering |
| 15 | Profile pictures appear on all screens where Avatar is used | VERIFIED | All 13 files in Plan 03 confirmed with `avatarUrl` prop wired: MembersCard, BalanceMemberRow, ExpenseRow, RoommateSection, WeeklyTimeline, GroceryItemRow, chores.tsx, expenses.tsx, groceries.tsx, dispute.tsx, member-history.tsx, settings/members.tsx, member-welcome.tsx |
| 16 | Profile data queries include avatar_url where they previously selected only id and display_name | VERIFIED | expenses.tsx:202,339; member-history.tsx:219; groceries.tsx:75,150 — all narrow profile selects include `avatar_url` |
| 17 | Users without photos still see gradient+initials everywhere | VERIFIED | Avatar prop is optional (`avatarUrl?: string \| null`); all call sites either pass it or leave it undefined — fallback fires in both cases |
| 18 | Other members' avatar changes are pushed via Supabase Realtime and update immediately without reload | VERIFIED | `app/(app)/(tabs)/index.tsx:154-183` — `supabase.channel('profiles-avatars-...')` subscribes to `postgres_changes` on `profiles` table, UPDATE events update `setMembers` state |

**Score:** 17/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/avatar-upload.ts` | Pick, upload, remove avatar utility | VERIFIED | 106 lines; exports `pickAndUploadAvatar` and `removeAvatar`; full pipeline implemented |
| `components/ui/Avatar.tsx` | Avatar with optional avatarUrl, expo-image, brand ring | VERIFIED | 114 lines; accepts `avatarUrl?: string \| null`; imports `{ Image } from 'expo-image'`; brand ring via outer View |
| `components/ui/AvatarUpload.tsx` | Avatar with camera badge + action sheet | VERIFIED (partial) | 121 lines; camera badge, action sheet, permission/error handling present; 'Edit' option missing from photo-exists branch |
| `app/(app)/settings/profile.tsx` | Profile settings with AvatarUpload | VERIFIED | Lines 88-102: `<AvatarUpload userId size="2xl" onUploadComplete onError>` with avatar state and refreshProfile |
| `app/(onboarding)/profile.tsx` | Onboarding display name with AvatarUpload | VERIFIED | Lines 89-103: `<AvatarUpload showBadgeAlways={true} size="2xl">` above name input |
| `components/home/MembersCard.tsx` | Avatar with avatarUrl for household members | VERIFIED | Line 59: `avatarUrl={member.avatar_url}` |
| `components/expenses/BalanceMemberRow.tsx` | Avatar with avatarUrl for balance rows | VERIFIED | Lines 15-16, 32: `avatarUrl` prop, passed to Avatar |
| `components/expenses/ExpenseRow.tsx` | Avatar with avatarUrl for expense list rows | VERIFIED | `SplitWithProfile.profile.avatar_url`; line 127: `avatarUrl={split.profile?.avatar_url}` |
| `components/expenses/RoommateSection.tsx` | Avatar with avatarUrl for roommate sections | VERIFIED | Lines 11, 37: `avatar_url` in interface, `avatarUrl={member.avatar_url}` |
| `components/home/WeeklyTimeline.tsx` | Avatar with avatarUrl for timeline events | VERIFIED | Line 17: `assigneeAvatarUrl?: string \| null` in interface; line 146: `avatarUrl={item.assigneeAvatarUrl}` |
| `components/groceries/GroceryItemRow.tsx` | Avatar with avatarUrl for grocery item creators | VERIFIED | Lines 14, 96: `creatorAvatarUrl` prop; `avatarUrl={creatorAvatarUrl}` |
| `app/(app)/(tabs)/index.tsx` | Realtime subscription for profiles avatar_url changes | VERIFIED | Lines 154-183: Supabase Realtime channel subscribing to profiles UPDATE events |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/avatar-upload.ts` | `supabase.storage.from('avatars')` | `upload()` with upsert:true and cache-busted public URL | VERIFIED | Lines 62-73: `.storage.from('avatars').upload(...)` + `.getPublicUrl()` + `?t=${Date.now()}` |
| `components/ui/Avatar.tsx` | `expo-image` | `<Image>` with `cachePolicy="disk"` | VERIFIED | Line 4: `import { Image } from 'expo-image'`; line 83: `<Image ... cachePolicy="disk">` |
| `components/ui/AvatarUpload.tsx` | `lib/avatar-upload.ts` | `pickAndUploadAvatar` and `removeAvatar` calls | VERIFIED | Line 5: `import { pickAndUploadAvatar, removeAvatar } from '@/lib/avatar-upload'`; called in handleCamera, handleGallery, handleRemove |
| `app/(app)/settings/profile.tsx` | `components/ui/AvatarUpload.tsx` | `<AvatarUpload>` with `onUploadComplete` callback | VERIFIED | Line 16: `import { AvatarUpload } from '@/components/ui'`; lines 88-98: AvatarUpload rendered |
| `app/(onboarding)/profile.tsx` | `components/ui/AvatarUpload.tsx` | `<AvatarUpload showBadgeAlways>` | VERIFIED | Line 18: import; line 89-94: `<AvatarUpload ... showBadgeAlways={true}>` |
| `components/home/MembersCard.tsx` | `components/ui/Avatar.tsx` | `avatarUrl={member.avatar_url}` prop from profile data | VERIFIED | Line 59: `<Avatar ... avatarUrl={member.avatar_url} />` |
| `app/(app)/(tabs)/expenses.tsx` | `profiles` table | `select('id, display_name, avatar_url')` | VERIFIED | Lines 202, 339: both narrow queries include `avatar_url` |
| `app/(app)/(tabs)/index.tsx` | `supabase.channel` | Realtime subscription to profiles UPDATE events | VERIFIED | Lines 157-178: `.channel(...).on('postgres_changes', { event: 'UPDATE', table: 'profiles' }, ...)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PROF-01 | 13-01 | User can upload a profile picture from photo library (gallery) | SATISFIED | `lib/avatar-upload.ts` `pickAndUploadAvatar(userId, 'gallery')` calls `launchImageLibraryAsync` |
| PROF-02 | 13-01 | User can take a profile picture with camera | SATISFIED | `lib/avatar-upload.ts` `pickAndUploadAvatar(userId, 'camera')` calls `launchCameraAsync` after permission check |
| PROF-03 | 13-01 | Image is cropped to square before upload | SATISFIED | `lib/avatar-upload.ts:34-36` — `allowsEditing: true`, `aspect: [1, 1]` |
| PROF-04 | 13-01 | Image uploads to Supabase Storage with user-scoped RLS policies | SATISFIED | Storage upload in `lib/avatar-upload.ts:61-68`; RLS migration at `supabase/migrations/00009_create_avatars_bucket.sql` |
| PROF-05 | 13-01, 13-03 | Avatar component shows uploaded photo when available, falls back to gradient+initials | SATISFIED | `Avatar.tsx:59,82-111` — `hasImage` gates photo vs gradient render; all call sites pass `avatarUrl` |
| PROF-06 | 13-02 | Profile picture can be set during onboarding (display name step) | SATISFIED | `app/(onboarding)/profile.tsx:89-98` — AvatarUpload with `showBadgeAlways` integrated |
| PROF-07 | 13-02 | Profile picture can be changed in settings | SATISFIED | `app/(app)/settings/profile.tsx:88-102` — AvatarUpload with avatar state and refreshProfile |
| PROF-08 | 13-01, 13-03 | Updated photo appears across all screens without app restart (cache busting) | SATISFIED | Cache-busted URL with `?t=${Date.now()}` stored in profile; avatarUrl propagated to all 13 Avatar call sites |
| PROF-09 | 13-01, 13-02 | Camera/gallery permissions handled gracefully with user-friendly messaging | SATISFIED | `lib/avatar-upload.ts:19-24` — throws `CAMERA_PERMISSION_DENIED`; `AvatarUpload.tsx:35-38` — calls `onError` with user-friendly message |

All 9 requirements (PROF-01 through PROF-09) are accounted for. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/ui/AvatarUpload.tsx` | 80-94 | Missing 'Edit' action sheet option | Warning | 'Edit' was a plan must-have and CONTEXT.md locked decision. Was removed during human verification as "redundant." Functionally users can still re-pick from top-level options, but the UX diverges from the locked specification. |

No TODO/FIXME comments found. No stub implementations found. No empty return bodies found.

### Human Verification Required

#### 1. Supabase Storage upload and RLS

**Test:** Go to Settings > Profile, tap the avatar, choose "Choose from Library", select a photo and crop it. Verify it uploads successfully.
**Expected:** Photo appears in the avatar area. Check Supabase Dashboard Storage > avatars bucket — file should be at `{user_id}/avatar.jpeg`.
**Why human:** Network upload and Supabase Storage RLS cannot be verified without a live device.

#### 2. Camera permission denial flow

**Test:** On a device with camera permission denied for the app, tap the avatar in Settings and choose "Take Photo."
**Expected:** An error alert appears with the message "Camera access is needed to take a profile photo."
**Why human:** Requires device permission state manipulation.

#### 3. Cross-screen photo display

**Test:** After uploading a photo in Settings, navigate to Home, Expenses, Chores, and Groceries screens.
**Expected:** Your uploaded photo appears everywhere an Avatar shows your user.
**Why human:** Requires live app state and visual confirmation.

#### 4. Realtime propagation between household members

**Test:** On two devices logged in as different household members, have one member change their avatar in Settings.
**Expected:** The other member's Home screen MembersCard updates the avatar immediately without refresh.
**Why human:** Requires two active sessions and real Supabase Realtime connection.

#### 5. Brand ring visual quality

**Test:** View avatars at all sizes (xs in WeeklyTimeline, sm in GroceryItemRow, md in MembersCard, lg in settings/members, 2xl in settings/profile).
**Expected:** Wintergreen ring is visible at 2px for xs/sm/md/lg and 3px for xl/2xl sizes.
**Why human:** Visual pixel verification only.

### Gaps Summary

One gap was found against the plan's must-have truths:

**The 'Edit' action sheet option was removed from AvatarUpload.tsx.** The 13-02-PLAN.md truth explicitly stated the action sheet should show "Take Photo / Choose from Library / Edit / Remove Photo" when a photo exists. CONTEXT.md also listed "Edit" as a locked decision. The implementation shows "Take Photo / Choose from Library / Remove Photo / Cancel" — the Edit sub-menu (which served as a semantic separator for "change existing photo") is absent.

This is a minor UX deviation. The core upload and remove flows work correctly — users can still change their photo using the top-level Take Photo and Choose from Library options. The functional goal is achieved; the specific action sheet structure diverges from the spec.

**Resolution options:** Either (a) restore the Edit button per the locked spec, or (b) formally accept the simplified action sheet as the new spec and update CONTEXT.md accordingly.

---

_Verified: 2026-03-14T04:30:00Z_
_Verifier: Claude (gsd-verifier)_
