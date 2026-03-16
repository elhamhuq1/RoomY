# T03: 13-profile-pictures 03

**Slice:** S13 — **Milestone:** M001

## Description

Pass avatarUrl to every Avatar component across the entire app so uploaded profile pictures display everywhere. Update profile queries that only select id+display_name to also include avatar_url.

Purpose: Complete the progressive adoption so profile pictures appear on all screens, not just settings and onboarding.
Output: All Avatar usages across the app display uploaded photos when available.

## Must-Haves

- [x] "Profile pictures appear on all screens where Avatar is used"
- [x] "Users without photos still see gradient+initials everywhere"
- [x] "Avatar shows brand-colored ring consistently across all screens"
- [x] "Profile data queries include avatar_url where they previously selected only id and display_name"
- [x] "Other members' avatar changes are pushed via Supabase Realtime and update immediately without reload"

## Files

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
