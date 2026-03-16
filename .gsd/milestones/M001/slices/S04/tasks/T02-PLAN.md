# T02: 03.1-chores 02

**Slice:** S04 — **Milestone:** M001

## Description

Add swap requests, dispute system, and contribution dashboard to complete the chore management feature.

Purpose: Complete the chore lifecycle -- users can negotiate swaps, dispute questionable completions (with 24h auto-revert), and view a fairness dashboard showing who's doing their share. This delivers the full promise of fair, transparent chore rotation.

Output: Swap request screen, contribution dashboard screen, updated chore list with dispute and swap UI.

## Must-Haves

- [x] "User can request a chore swap with another member and the other member can accept or decline"
- [x] "User can flag a completion as disputed and it auto-reverts after 24 hours if unresolved"
- [x] "User can view a contribution dashboard showing completion counts and streaks per member"
- [x] "Dashboard supports this-week and this-month time period views"
- [x] "Disputed completions show a visual badge on the chore list"

## Files

- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/chores/dashboard.tsx`
- `app/(app)/chores/swap-request.tsx`
