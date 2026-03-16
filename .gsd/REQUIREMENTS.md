# Requirements

## Active

## Validated

### EMPTY-01 — Expenses tab shows `expense-main-empty-state.png` illustration when no expenses exist

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Expenses tab shows `expense-main-empty-state.png` illustration when no expenses exist. Verified: components/expenses/EmptyState.tsx uses require() with the illustration asset.

### EMPTY-02 — Groceries tab shows `grocery-empty-list.png` illustration when list is empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Groceries tab shows `grocery-empty-list.png` illustration when list is empty. Verified: components/groceries/EmptyState.tsx uses require() with the illustration asset.

### EMPTY-03 — Chores tab shows `chore-main-empty-state.png` illustration when no chores exist

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Chores tab shows `chore-main-empty-state.png` illustration when no chores exist. Verified: components/chores/EmptyState.tsx uses require() with the illustration asset.

### EMPTY-04 — Home attention feed shows `attention-feed-all-caught-up.png` when no pending items

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Home attention feed shows `attention-feed-all-caught-up.png` when no pending items. Verified: components/home/AttentionFeed.tsx uses require() with the illustration asset.

### EMPTY-05 — Balance section shows `balance-all-settled.png` when all settled

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Balance section shows `balance-all-settled.png` when all settled. Verified: components/expenses/BalanceSection.tsx uses require() with the illustration asset.

### EMPTY-06 — Chore dashboard shows `chore-dashboard-stats.png` for empty stats

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Chore dashboard shows `chore-dashboard-stats.png` for empty stats. Verified: app/(app)/chores/dashboard.tsx uses require() with the illustration asset.

### EMPTY-07 — Chore swap request shows `chore-swap-request.png` when no requests

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Chore swap request shows `chore-swap-request.png` when no requests. Verified: app/(app)/chores/swap-request.tsx uses require() with the illustration asset.

### EMPTY-08 — Member expense history shows `expense-member-history.png` when empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Member expense history shows `expense-member-history.png` when empty. Verified: app/(app)/expenses/member-history.tsx uses require() with the illustration asset.

### EMPTY-09 — Grocery trip history shows `grocery-trip-history.png` when empty

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S12

Grocery trip history shows `grocery-trip-history.png` when empty. Verified: app/(app)/groceries/trip-history.tsx uses require() with the illustration asset.

### AUTH-01 — User can sign in with Google via browser-based OAuth flow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S14

User can sign in with Google via browser-based OAuth flow. Verified: lib/auth-utils.ts exports signInWithGoogle() using expo-web-browser + supabase.auth.signInWithOAuth.

### AUTH-02 — Google OAuth works in Expo Go (expo-web-browser approach)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S14

Google OAuth works in Expo Go (expo-web-browser approach). Verified: No native module plugins (@react-native-google-signin, expo-apple-authentication) in app.json; uses expo-web-browser which works in Expo Go.

### VIS-01 — App background is cream (#F5F0EB) on all post-login screens, matching onboarding

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

App background is cream (#F5F0EB) on all post-login screens, matching onboarding

### VIS-02 — Brand green shifted to wintergreen (#2D6A4F) across entire app — buttons, badges, tab bar, FAB, toggles, spinners

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

Brand green shifted to wintergreen (#2D6A4F) across entire app — buttons, badges, tab bar, FAB, toggles, spinners

### VIS-03 — All hardcoded emerald hex values (#10B981, #059669, #D1FAE5) replaced with wintergreen equivalents

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

All hardcoded emerald hex values (#10B981, #059669, #D1FAE5) replaced with wintergreen equivalents

### VIS-04 — Duplicated AVATAR_COLORS arrays consolidated into single shared import

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

Duplicated AVATAR_COLORS arrays consolidated into single shared import

### VIS-05 — Avatar gradient pairs updated to wintergreen palette

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

Avatar gradient pairs updated to wintergreen palette

### VIS-06 — System chrome (status bar area, tab bar, headers, splash) matches cream background with no visible seams

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

System chrome (status bar area, tab bar, headers, splash) matches cream background with no visible seams

### CARD-01 — Default Card component uses transparent background with gray outline border, no shadow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

Default Card component uses transparent background with gray outline border, no shadow

### CARD-02 — Gradient balance card and dark invite code card retain their distinctive elevated styling

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

Gradient balance card and dark invite code card retain their distinctive elevated styling

### CARD-03 — No card in the app displays both shadow and outline simultaneously

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S11

No card in the app displays both shadow and outline simultaneously

### PROF-01 — User can upload a profile picture from photo library (gallery)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

User can upload a profile picture from photo library (gallery)

### PROF-02 — User can take a profile picture with camera

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

User can take a profile picture with camera

### PROF-03 — Image is cropped to square before upload

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Image is cropped to square before upload

### PROF-04 — Image uploads to Supabase Storage with user-scoped RLS policies

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Image uploads to Supabase Storage with user-scoped RLS policies

### PROF-05 — Avatar component shows uploaded photo when available, falls back to gradient+initials

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Avatar component shows uploaded photo when available, falls back to gradient+initials

### PROF-06 — Profile picture can be set during onboarding (display name step)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Profile picture can be set during onboarding (display name step)

### PROF-07 — Profile picture can be changed in settings

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Profile picture can be changed in settings

### PROF-08 — Updated photo appears across all screens without app restart (cache busting)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Updated photo appears across all screens without app restart (cache busting)

### PROF-09 — Camera/gallery permissions handled gracefully with user-friendly messaging

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S13

Camera/gallery permissions handled gracefully with user-friendly messaging

## Deferred

### AUTH-03 — Google-authenticated users automatically get profile picture from Google metadata

- Status: deferred
- Class: enhancement
- Source: inferred
- Primary Slice: S14

Google OAuth provides user metadata but auto-setting avatar_url from Google profile picture was not implemented. Users can upload manually via the profile picture feature.

### AUTH-04 — OAuth redirect URLs configured in Supabase Dashboard

- Status: deferred
- Class: operational
- Source: inferred
- Primary Slice: S14

Redirect URLs must be configured manually in Supabase Dashboard. Documented in setup requirements but not automatable from client code.

## Out of Scope
