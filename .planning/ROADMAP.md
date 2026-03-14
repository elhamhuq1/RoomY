# Roadmap: RoomY

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-10)
- ✅ **v1.1 UI Redesign** — Phases 6-10 (shipped 2026-03-13)
- 🔄 **v1.2 Polish & Identity** — Phases 11-14

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-10</summary>

- [x] Phase 1: Foundation (4/4 plans) — Auth, household creation/joining, onboarding quiz, secure data model
- [x] Phase 2: Expense Splitting (5/5 plans) — Add expenses, view balances, settle up via Venmo deep link
- [x] Phase 3: Groceries (3/3 plans) — Shared grocery list with real-time sync and one-tap cost splitting
- [x] Phase 3.1: Chores (2/2 plans) — Chore assignment, completion tracking, fair rotation with effort weighting
- [x] Phase 4: Engagement (4/4 plans) — Push notifications across all modules and shared household calendar

</details>

<details>
<summary>✅ v1.1 UI Redesign (Phases 6-10) — SHIPPED 2026-03-13</summary>

- [x] Phase 6: Design System + Components (4/4 plans) — Design tokens, shared component library, navigation chrome
- [x] Phase 7: Home Screen (4/4 plans) — Calendar, balance summary, attention feed, weekly timeline
- [x] Phase 8: Expenses Screen (3/3 plans) — Balance cards, differentiated history rows, per-member breakdown
- [x] Phase 9: Groceries + Chores (2/2 plans) — Circle checkboxes, avatars, emoji icons, stats cards, dispute styling
- [x] Phase 10: Onboarding Flow (4/4 plans) — Glassmorphism carousel, styled auth, gradient cards, step progress bar

</details>

### v1.2 Polish & Identity (Phases 11-14)

- [ ] Phase 11: Visual Foundation (3 plans)
  - [ ] 11-01-PLAN.md — Token foundation: wintergreen palette + AVATAR_COLORS export + Card + Avatar
  - [ ] 11-02-PLAN.md — App-wide migration: hardcoded hex cleanup + AVATAR_COLORS consolidation + container restyling
  - [ ] 11-03-PLAN.md — System chrome: tab bar, headers, StatusBar, splash + visual verification
- [ ] Phase 12: Empty State Illustrations
- [ ] Phase 13: Profile Pictures
- [ ] Phase 14: Google OAuth

---

### Phase 11: Visual Foundation
**Goal:** Shift the entire app's visual identity to wintergreen palette with cream background and outline cards.

**Requirements:** VIS-01 through VIS-06, CARD-01 through CARD-03

**Why first:** Every subsequent phase builds on the final palette. Illustrations and avatar UI must match the wintergreen look. Token changes propagate to ~90% of the app automatically.

**Scope:**
1. Consolidate 8 duplicated AVATAR_COLORS arrays into shared import
2. Update brand tokens in `tailwind.config.js` and `lib/theme/colors.ts` (#10B981 → #2D6A4F family)
3. Update `neutral.bg` to cream (#F5F0EB) in both token files
4. Update Avatar.tsx GRADIENT_PAIRS to wintergreen
5. Grep and replace all hardcoded emerald hex values (#10B981, #059669, #D1FAE5)
6. Update Card.tsx: transparent bg, gray outline, no shadow, no elevation
7. Update system chrome: tab bar, headers, StatusBar, scene container backgrounds
8. Verify gradient balance card and dark invite code card retain distinctive styling

**Success criteria:**
- `grep -r '#10B981\|#059669\|#D1FAE5' --include='*.tsx' --include='*.ts' app/ components/ lib/` returns zero results
- No visible color seam between content and system chrome on any screen
- No card shows both shadow and outline simultaneously
- App looks cohesive on cream background with wintergreen accents

**Plans:** 1/3 plans executed

Plans:
- [ ] 11-01-PLAN.md — Token foundation: wintergreen palette, AVATAR_COLORS export, Card + Avatar components
- [ ] 11-02-PLAN.md — App-wide migration: hardcoded hex replacement, AVATAR_COLORS consolidation, container restyling
- [ ] 11-03-PLAN.md — System chrome: tab bar, headers, StatusBar, splash background + visual verification

---

### Phase 12: Empty State Illustrations
**Goal:** Replace icon-circle empty states with charming illustrations throughout the app.

**Requirements:** EMPTY-01 through EMPTY-09

**Why second:** Illustrations should be viewed against the final palette (Phase 11). Independent of profile pictures — can run in parallel with Phase 13 if desired.

**Scope:**
1. Copy 9 PNG illustrations from `docs/empty-state-images/` to `assets/empty-states/`
2. Create `lib/empty-state-images.ts` with static `require()` map (follows onboarding pattern)
3. Replace Ionicon-in-circle with `<Image>` in each empty state component
4. Add empty states for screens that don't have them yet (attention feed, balance settled, chore dashboard, swap requests, member history, trip history)

**Success criteria:**
- All 9 empty states display their corresponding illustration
- Illustrations render correctly on both iOS and Android
- Adding first item to any list transitions from empty state to content
- Bundle size increase under 500KB total for all illustrations

**Estimated plans:** 2-3

---

### Phase 13: Profile Pictures
**Goal:** Let users upload profile pictures via camera or gallery, displayed across the entire app.

**Requirements:** PROF-01 through PROF-09

**Why third:** Depends on final palette (Phase 11) for avatar styling. Backend setup (Supabase Storage) can be done first, then client code.

**Scope:**
1. Install `expo-image-picker`, `expo-file-system`, `base64-arraybuffer`, `expo-image`
2. Create Supabase Storage `avatars` bucket with path-based RLS policies
3. Create `lib/avatar-upload.ts` utility (pick → crop → base64 → upload → update profile)
4. Modify `Avatar.tsx`: add optional `avatarUrl` prop, show `<Image>` when available, fallback to gradient+initials
5. Create `AvatarUpload.tsx` component (Avatar + camera icon overlay + ActionSheet)
6. Integrate in `settings/profile.tsx` (change photo)
7. Integrate in `onboarding/profile.tsx` (set photo during setup)
8. Progressive adoption: pass `avatarUrl` to Avatar in screens that already have profile data
9. Handle permissions, loading states, error states, cache busting

**Success criteria:**
- User can pick from gallery or take photo, photo uploads and displays
- Photo appears on all screens with Avatar component
- Users without photos still see gradient+initials
- Uploading new photo replaces old one immediately (no stale cache)
- Camera/gallery permission denial handled gracefully
- Works in Expo Go on both iOS and Android

**Estimated plans:** 3-4

---

### Phase 14: Google OAuth
**Goal:** Enable Google sign-in via browser-based OAuth flow that works in Expo Go.

**Requirements:** AUTH-01 through AUTH-04

**Why last:** Changes auth flow. All other features should be stable first. Independent of visual/profile work.

**Scope:**
1. Install `expo-web-browser`
2. Replace `signInWithGoogle()` in `lib/auth-utils.ts` with expo-web-browser + `signInWithOAuth` flow
3. Configure Supabase Dashboard: add Expo redirect URL to allowlist, verify Google provider settings
4. Add timeout wrapper around `setSession()` for known hang issue
5. Google-authenticated users automatically get avatar from Google metadata (already handled by DB trigger)
6. Test full flow: button tap → browser → Google consent → redirect → session established

**Success criteria:**
- User can sign in with Google and land in onboarding or home screen
- Works in Expo Go on both iOS and Android
- Email/password auth continues to work as before
- Google users get their Google profile picture automatically

**Estimated plans:** 1-2

---

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (6.1, 7.2): Urgent insertions (marked with INSERTED)
- Phase 5: Reserved (v1.0 gap closure, not executed)

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-03-09 |
| 2. Expense Splitting | v1.0 | 5/5 | Complete | 2026-03-09 |
| 3. Groceries | v1.0 | 3/3 | Complete | 2026-03-10 |
| 3.1. Chores | v1.0 | 2/2 | Complete | 2026-03-10 |
| 4. Engagement | v1.0 | 4/4 | Complete | 2026-03-10 |
| 6. Design System + Components | v1.1 | 4/4 | Complete | 2026-03-12 |
| 7. Home Screen | v1.1 | 4/4 | Complete | 2026-03-12 |
| 8. Expenses Screen | v1.1 | 3/3 | Complete | 2026-03-12 |
| 9. Groceries + Chores | v1.1 | 2/2 | Complete | 2026-03-13 |
| 10. Onboarding Flow | v1.1 | 4/4 | Complete | 2026-03-13 |
| 11. Visual Foundation | 1/3 | In Progress|  | — |
| 12. Empty State Illustrations | v1.2 | — | Planned | — |
| 13. Profile Pictures | v1.2 | — | Planned | — |
| 14. Google OAuth | v1.2 | — | Planned | — |
