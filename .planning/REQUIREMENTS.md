# Requirements: RoomY v1.2 Polish & Identity

**Defined:** 2026-03-13
**Core Value:** Roommates can see exactly who owes what and settle up with one tap — no awkward conversations, no mental math, no forgotten debts.

## v1.2 Requirements

### Visual Identity

- [x] **VIS-01**: App background is cream (#F5F0EB) on all post-login screens, matching onboarding
- [x] **VIS-02**: Brand green shifted to wintergreen (#2D6A4F) across entire app — buttons, badges, tab bar, FAB, toggles, spinners
- [x] **VIS-03**: All hardcoded emerald hex values (#10B981, #059669, #D1FAE5) replaced with wintergreen equivalents
- [x] **VIS-04**: Duplicated AVATAR_COLORS arrays consolidated into single shared import
- [x] **VIS-05**: Avatar gradient pairs updated to wintergreen palette
- [x] **VIS-06**: System chrome (status bar area, tab bar, headers, splash) matches cream background with no visible seams

### Card Redesign

- [x] **CARD-01**: Default Card component uses transparent background with gray outline border, no shadow
- [x] **CARD-02**: Gradient balance card and dark invite code card retain their distinctive elevated styling
- [x] **CARD-03**: No card in the app displays both shadow and outline simultaneously

### Empty States

- [ ] **EMPTY-01**: Expenses tab shows `expense-main-empty-state.png` illustration when no expenses exist
- [ ] **EMPTY-02**: Groceries tab shows `grocery-empty-list.png` illustration when list is empty
- [ ] **EMPTY-03**: Chores tab shows `chore-main-empty-state.png` illustration when no chores exist
- [ ] **EMPTY-04**: Home attention feed shows `attention-feed-all-caught-up.png` when no pending items
- [ ] **EMPTY-05**: Balance section shows `balance-all-settled.png` when all settled
- [ ] **EMPTY-06**: Chore dashboard shows `chore-dashboard-stats.png` for empty stats
- [ ] **EMPTY-07**: Chore swap request shows `chore-swap-request.png` when no requests
- [ ] **EMPTY-08**: Member expense history shows `expense-member-history.png` when empty
- [ ] **EMPTY-09**: Grocery trip history shows `grocery-trip-history.png` when empty

### Profile Pictures

- [x] **PROF-01**: User can upload a profile picture from photo library (gallery)
- [x] **PROF-02**: User can take a profile picture with camera
- [x] **PROF-03**: Image is cropped to square before upload
- [x] **PROF-04**: Image uploads to Supabase Storage with user-scoped RLS policies
- [x] **PROF-05**: Avatar component shows uploaded photo when available, falls back to gradient+initials
- [ ] **PROF-06**: Profile picture can be set during onboarding (display name step)
- [ ] **PROF-07**: Profile picture can be changed in settings
- [x] **PROF-08**: Updated photo appears across all screens without app restart (cache busting)
- [x] **PROF-09**: Camera/gallery permissions handled gracefully with user-friendly messaging

### Google OAuth

- [ ] **AUTH-01**: User can sign in with Google via browser-based OAuth flow
- [ ] **AUTH-02**: Google OAuth works in Expo Go (expo-web-browser approach)
- [ ] **AUTH-03**: Google-authenticated users automatically get profile picture from Google metadata
- [ ] **AUTH-04**: OAuth redirect URLs configured in Supabase Dashboard

## Deferred

- **Dark mode** — doubles design surface area; token architecture supports it later
- **Animated empty state transitions** — nice-to-have, not MVP
- **Custom crop UI** — expo-image-picker's built-in crop is sufficient
- **Video/animated avatars** — unnecessary complexity for household app

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom image crop/rotate UI | Multi-week rabbit hole; OS crop UI is sufficient |
| Image filters/effects | Zero value for roommate management app |
| Server-side image processing | Overkill for 2-person household; client resize sufficient |
| Firebase for Google Auth | Already using Supabase for everything |
| Lottie animations for empty states | Native dependency, Expo Go incompatible |
| Development build migration | expo-web-browser approach avoids this entirely |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | Phase 11 | Complete |
| VIS-02 | Phase 11 | Complete |
| VIS-03 | Phase 11 | Complete |
| VIS-04 | Phase 11 | Complete |
| VIS-05 | Phase 11 | Complete |
| VIS-06 | Phase 11 | Complete |
| CARD-01 | Phase 11 | Complete |
| CARD-02 | Phase 11 | Complete |
| CARD-03 | Phase 11 | Complete |
| EMPTY-01 | Phase 12 | Pending |
| EMPTY-02 | Phase 12 | Pending |
| EMPTY-03 | Phase 12 | Pending |
| EMPTY-04 | Phase 12 | Pending |
| EMPTY-05 | Phase 12 | Pending |
| EMPTY-06 | Phase 12 | Pending |
| EMPTY-07 | Phase 12 | Pending |
| EMPTY-08 | Phase 12 | Pending |
| EMPTY-09 | Phase 12 | Pending |
| PROF-01 | Phase 13 | Complete |
| PROF-02 | Phase 13 | Complete |
| PROF-03 | Phase 13 | Complete |
| PROF-04 | Phase 13 | Complete |
| PROF-05 | Phase 13 | Complete |
| PROF-06 | Phase 13 | Pending |
| PROF-07 | Phase 13 | Pending |
| PROF-08 | Phase 13 | Complete |
| PROF-09 | Phase 13 | Complete |
| AUTH-01 | Phase 14 | Pending |
| AUTH-02 | Phase 14 | Pending |
| AUTH-03 | Phase 14 | Pending |
| AUTH-04 | Phase 14 | Pending |

**Coverage:**
- v1.2 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after initial definition*
