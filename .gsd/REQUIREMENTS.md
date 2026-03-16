# Requirements

## Active

### GROC-01 — User can photograph a grocery receipt from the complete-trip screen

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S01

### GROC-02 — Receipt photo is processed by Edge Function via Gemini Vision OCR

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S01

### GROC-03 — Extracted line items (name, quantity, price) shown for review before confirming

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S01

### GROC-04 — Receipt total auto-populates the trip amount field

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S01

### GROC-05 — Per-item prices stored with trip for itemized cost visibility in history

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S01

### GROC-06 — User can paste a YouTube recipe URL to import ingredients

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S02

### GROC-07 — Edge Function extracts ingredients from YouTube transcript via Gemini

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S02

### GROC-08 — Extracted ingredients shown for selection before adding to grocery list

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S02

### GROC-09 — Imported items appear on all roommates' lists via existing realtime sync

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S02
- Supporting Slices: S01 (establishes `source` column pattern)

### GROC-10 — Grocery items have a category/department field

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S03
- Supporting Slices: S01 (migration may include column)

### GROC-11 — Grocery list displays items grouped by department for efficient shopping

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S03

### GROC-12 — Items from recipe import and Kroger search are auto-categorized

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S03
- Supporting Slices: S02, S04

### GROC-13 — Users can manually change an item's category

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S03

### GROC-14 — User can search Kroger products when adding items to the list

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S04

### GROC-15 — Search results show product name, brand, price, size, and aisle location

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S04

### GROC-16 — Adding a Kroger product auto-assigns its category from Kroger's taxonomy

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S04

### GROC-17 — User can select a nearby Kroger-family store for location-specific results

- Status: active
- Class: core-capability
- Source: M002-CONTEXT
- Primary Slice: S04

## Validated

### EMPTY-01 — Expenses tab shows `expense-main-empty-state.png` illustration when no expenses exist

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit 9092e9f — image wired into components/expenses/EmptyState.tsx

### EMPTY-02 — Groceries tab shows `grocery-empty-list.png` illustration when list is empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit 9092e9f — image wired into components/groceries/EmptyState.tsx

### EMPTY-03 — Chores tab shows `chore-main-empty-state.png` illustration when no chores exist

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit 9092e9f — image wired into components/chores/EmptyState.tsx

### EMPTY-04 — Home attention feed shows `attention-feed-all-caught-up.png` when no pending items

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit 9092e9f — image wired into components/home/AttentionFeed.tsx

### EMPTY-05 — Balance section shows `balance-all-settled.png` when all settled

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit 9092e9f — image wired into components/expenses/BalanceSection.tsx

### EMPTY-06 — Chore dashboard shows `chore-dashboard-stats.png` for empty stats

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit a9a0c38 — image wired into app/(app)/chores/dashboard.tsx

### EMPTY-07 — Chore swap request shows `chore-swap-request.png` when no requests

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit a9a0c38 — image wired into app/(app)/chores/swap-request.tsx

### EMPTY-08 — Member expense history shows `expense-member-history.png` when empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit a9a0c38 — image wired into app/(app)/expenses/member-history.tsx

### EMPTY-09 — Grocery trip history shows `grocery-trip-history.png` when empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12
- Validated by: S12 commit a9a0c38 — image wired into app/(app)/groceries/trip-history.tsx

### AUTH-01 — User can sign in with Google via browser-based OAuth flow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S14
- Validated by: S14 commit 4d8765d — expo-web-browser signInWithOAuth replaces native Google Sign-In

### AUTH-02 — Google OAuth works in Expo Go (expo-web-browser approach)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S14
- Validated by: S14 commit 4d8765d — uses expo-web-browser (no native modules), works in Expo Go

### AUTH-03 — Google-authenticated users automatically get profile picture from Google metadata

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S14
- Validated by: S14 commit 4d7557d — Google avatar flows through Supabase user_metadata

### VIS-01 — App background is cream (#F5F0EB) on all post-login screens, matching onboarding

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 03 visual verification approved by user

### VIS-02 — Brand green shifted to wintergreen (#2D6A4F) across entire app — buttons, badges, tab bar, FAB, toggles, spinners

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 01 token update + Plan 02 propagation

### VIS-03 — All hardcoded emerald hex values (#10B981, #059669, #D1FAE5) replaced with wintergreen equivalents

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 02 — zero hardcoded emerald hex remaining in app/, components/, lib/

### VIS-04 — Duplicated AVATAR_COLORS arrays consolidated into single shared import

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 02 — 8 files consolidated to shared import from @/lib/theme/colors

### VIS-05 — Avatar gradient pairs updated to wintergreen palette

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 01 commit 91ebf29

### VIS-06 — System chrome (status bar area, tab bar, headers, splash) matches cream background with no visible seams

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 03 — tab bar, StatusBar, splash all cream; user visual approval

### CARD-01 — Default Card component uses transparent background with gray outline border, no shadow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 01 commit 91ebf29

### CARD-02 — Gradient balance card and dark invite code card retain their distinctive elevated styling

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 02 CARD-02 verification

### CARD-03 — No card in the app displays both shadow and outline simultaneously

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11
- Validated by: S11 Plan 02 CARD-03 verification

### PROF-01 — User can upload a profile picture from photo library (gallery)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 02 — AvatarUpload with gallery pick

### PROF-02 — User can take a profile picture with camera

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 02 — AvatarUpload with camera pick

### PROF-03 — Image is cropped to square before upload

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 01 — allowsEditing: true in ImagePicker

### PROF-04 — Image uploads to Supabase Storage with user-scoped RLS policies

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 01 — avatars bucket with 4 RLS policies in migration 00009

### PROF-05 — Avatar component shows uploaded photo when available, falls back to gradient+initials

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 01 commit 2007a8b — Avatar with optional avatarUrl prop

### PROF-06 — Profile picture can be set during onboarding (display name step)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 02 commit 3a340a5 — AvatarUpload in onboarding profile screen

### PROF-07 — Profile picture can be changed in settings

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 02 commit 3a340a5 — AvatarUpload in settings profile screen

### PROF-08 — Updated photo appears across all screens without app restart (cache busting)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 01 — timestamp query param for cache busting + Plan 03 realtime subscription

### PROF-09 — Camera/gallery permissions handled gracefully with user-friendly messaging

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13
- Validated by: S13 Plan 02 — AvatarUpload handles permission denial with messaging

## Deferred

### AUTH-04 — OAuth redirect URLs configured in Supabase Dashboard

- Status: deferred
- Class: core-capability
- Source: inferred
- Primary Slice: S14
- Deferred reason: Dashboard configuration step — not automatable within the codebase, documented in setup instructions

## Out of Scope
