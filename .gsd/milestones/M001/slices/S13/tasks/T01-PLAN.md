# T01: 13-profile-pictures 01

**Slice:** S13 — **Milestone:** M001

## Description

Install image-related packages, set up Supabase Storage bucket with RLS policies, create the avatar upload utility, and upgrade the Avatar component to display uploaded photos with a brand-colored ring.

Purpose: Establish the foundation layer that all avatar upload UI and progressive adoption depends on.
Output: Working avatar-upload.ts utility, upgraded Avatar.tsx with avatarUrl support, Supabase Storage ready for uploads.

## Must-Haves

- [x] "Avatar component renders uploaded photo when avatarUrl prop is provided"
- [x] "Avatar component falls back to gradient+initials when no avatarUrl"
- [x] "Avatar component shows brand-colored wintergreen ring around all avatars"
- [x] "pickAndUploadAvatar utility picks image with square crop, resizes to max 512x512, and uploads to Supabase Storage"
- [x] "removeAvatar utility deletes image from storage and clears avatar_url in profile"
- [x] "Camera permission is requested before launching camera"

## Files

- `package.json`
- `package-lock.json`
- `lib/avatar-upload.ts`
- `components/ui/Avatar.tsx`
