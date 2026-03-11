# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.
**Current focus:** Phase 3: Groceries

## Current Position

**Phase:** 3.1 of 4 (Chores)
**Current Plan:** Not started
**Total Plans in Phase:** 0
**Status:** Ready to execute
**Last Activity:** 2026-03-11

**Progress:** [████████░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 6min | 2 tasks | 24 files |
| Phase 01 P02 | 3min | 2 tasks | 6 files |
| Phase 01 P03 | 3min | 2 tasks | 7 files |
| Phase 02 P01 | 1min | 2 tasks | 2 files |
| Phase 02 P03 | 4min | 2 tasks | 3 files |
| Phase 02 P02 | 5min | 2 tasks | 4 files |
| Phase 02 P05 | 20min | 3 tasks | 4 files |
| Phase 03 P01 | 4min | 2 tasks | 6 files |
| Phase 03 P02 | 5min | 2 tasks | 5 files |
| Phase 03 P03 | 4min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 4-phase structure derived from 23 requirements across 6 categories
- [Roadmap]: Groceries and chores combined into one phase (quick depth)
- [Roadmap]: Push notifications and calendar combined into engagement phase
- [Phase 01]: Used Expo SDK 55 instead of 54 -- NativeWind v4 and all deps compatible
- [Phase 01]: expo-sqlite/localStorage for Supabase sessions, detectSessionInUrl: false for RN
- [Phase 01]: Added .npmrc with legacy-peer-deps=true for expo-router peer dep conflicts
- [Phase 01]: Social auth via signInWithIdToken with native SDKs (not OAuth browser redirect)
- [Phase 01]: Apple Sign-In button styled per Apple HIG (black bg); router.replace for auth cross-navigation
- [Phase 01]: Used React Native Share API (not expo-sharing) for invite code sharing -- simpler text-only API
- [Phase 01]: refreshProfile triggers Stack.Protected guard redirect rather than manual router.replace to (app)
- [Phase 02]: All expense RLS policies use get_user_household_ids() to avoid infinite recursion
- [Phase 02]: Balances computed via DB function (never stored as mutable columns)
- [Phase 02]: Any household member can edit/delete any expense (per user decision)
- [Phase 02]: HTTPS Venmo URL as primary deep link (not venmo:// scheme) for Expo Go compatibility
- [Phase 02]: Manual mark-as-settled after Venmo return (no auto-detection per user decision)
- [Phase 02]: Settle amount field allows exceeding balance with warning for pre-payment
- [Phase 02]: useFocusEffect for auto-refresh when returning from add/edit expense screens
- [Phase 02]: Edit mode uses delete-then-insert for splits (simpler than tracking individual row updates)
- [Phase 02]: Venmo note encoding: deferred remaining + sign issue; user accepted minor cosmetic gap
- [Phase 02]: ScrollView uses inline style={{ flex: 1 }} instead of NativeWind className to avoid bounce-back regression
- [Phase 03]: ReanimatedSwipeable for swipe-to-delete (not deprecated Swipeable)
- [Phase 03]: ScrollView with inline style for grocery list (not FlatList -- small lists)
- [Phase 03]: Edit modal for name + quantity changes; quantity stepper visible on each row
- [Phase 03]: Realtime INSERT dedup by ID prevents double-add from optimistic + realtime
- [Phase 03]: GestureHandlerRootView added to root layout for gesture handler support
- [Phase 03]: Duplicated AVATAR_COLORS/getInitials from expenses/add.tsx rather than extracting shared module
- [Phase 03]: Expandable trip cards in history (tap to toggle items) rather than always-visible lists
- [Phase 03]: useFocusEffect added to grocery list for reliable refetch after trip completion
- [Phase 03]: Used swipeableMethods from renderRightActions callback instead of ref-based approach for cleaner swipeable control
- [Phase 03]: Modal-internal KeyboardAvoidingView for keyboard safety (Modal renders in separate native hierarchy)

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Venmo deep link API is undocumented -- validate on physical devices at start of Phase 2
- [Research]: NativeWind v5 is in preview -- monitor for breaking changes during Phase 1, fallback to v4.2.2
- [Research]: Supabase Edge Function cron (free tier) -- verify availability before designing chore rotation in Phase 3

## Session Continuity

**Last session:** 2026-03-11T20:01:20.966Z
**Stopped at:** Completed 03-03-PLAN.md
**Resume file:** None
