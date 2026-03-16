---
id: S12
parent: M001
milestone: M001
provides:
  - "9 empty state illustrations wired into app screens"
  - "Expense main empty state illustration"
  - "Grocery empty list illustration"
  - "Chore main empty state illustration"
  - "Attention feed all-caught-up illustration"
  - "Balance all-settled illustration"
  - "Chore dashboard stats illustration"
  - "Chore swap request illustration"
  - "Member expense history illustration"
  - "Grocery trip history illustration"
requires: []
affects: []
key_files:
  - components/expenses/EmptyState.tsx
  - components/groceries/EmptyState.tsx
  - components/chores/EmptyState.tsx
  - components/home/AttentionFeed.tsx
  - components/home/WeeklyTimeline.tsx
  - components/expenses/BalanceSection.tsx
  - app/(app)/chores/dashboard.tsx
  - app/(app)/chores/swap-request.tsx
  - app/(app)/expenses/member-history.tsx
  - app/(app)/groceries/trip-history.tsx
key_decisions:
  - "Illustrations stored in docs/empty-state-images/ and referenced via require()"
  - "Each illustration replaces the previous icon-circle placeholder pattern"
  - "Images loaded as static assets via Metro bundler require() calls"
patterns_established:
  - "Empty state illustration pattern: Image component with require() from docs/empty-state-images/"
  - "All empty states use consistent sizing and centering"
observability_surfaces: []
drill_down_paths: []
duration: ~5min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# S12: Empty State Illustrations

**All 9 module empty states replaced with charming illustrations — expenses, groceries, chores, balance, attention feed, dashboard, swap requests, member history, trip history**

## What Happened

Replaced icon-circle placeholder empty states across the entire app with illustration images. 5 component-level empty states updated (expenses, groceries, chores, attention feed, balance section) and 4 route-level empty states updated (chore dashboard, swap requests, member expense history, grocery trip history). Images sourced from docs/empty-state-images/ directory. Additional fixes applied for calendar empty state and weekly timeline empty state.

Key commits: `9092e9f` (5 component empty states), `a9a0c38` (4 route-level empty states), `b5dc686` (calendar + weekly timeline fixes).
