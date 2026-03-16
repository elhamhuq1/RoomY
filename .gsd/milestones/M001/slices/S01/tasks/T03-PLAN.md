# T03: 01-foundation 03

**Slice:** S01 — **Milestone:** M001

## Description

Build the complete onboarding wizard: profile setup, household create-or-join fork, invite code sharing, join confirmation, and module quiz with toggle cards. This is the linear wizard flow specified by the user.

Purpose: Delivers AUTH-02 (profile), AUTH-03 (create household + invite code), AUTH-04 (join household via code), and AUTH-05 (module quiz). After this plan, users can form households and configure their app experience.

Output: Seven onboarding screens implementing the full wizard: profile -> household-choice -> (create-household | join-household -> member-welcome) -> module-quiz -> dashboard redirect.

## Must-Haves

- [x] "User can set a display name during onboarding"
- [x] "User sees an equal fork to create or join a household (neither feels secondary)"
- [x] "User can create a household and see a shareable invite code"
- [x] "User can share the invite code via native share sheet"
- [x] "User can join a household by entering an invite code"
- [x] "Joining user sees a welcome screen with household name and existing members"
- [x] "User can toggle grocery and chore modules on/off (expenses always on)"
- [x] "Completing the onboarding wizard navigates to the dashboard"

## Files

- `app/(onboarding)/_layout.tsx`
- `app/(onboarding)/profile.tsx`
- `app/(onboarding)/household-choice.tsx`
- `app/(onboarding)/create-household.tsx`
- `app/(onboarding)/join-household.tsx`
- `app/(onboarding)/member-welcome.tsx`
- `app/(onboarding)/module-quiz.tsx`
