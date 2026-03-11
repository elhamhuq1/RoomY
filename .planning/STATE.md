# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.
**Current focus:** Phase 2: Expense Splitting

## Current Position

**Phase:** 2 of 4 (Expense Splitting)
**Current Plan:** Not started
**Total Plans in Phase:** 5
**Status:** Milestone complete
**Last Activity:** 2026-03-11

**Progress:** [████████░░] 78%

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Venmo deep link API is undocumented -- validate on physical devices at start of Phase 2
- [Research]: NativeWind v5 is in preview -- monitor for breaking changes during Phase 1, fallback to v4.2.2
- [Research]: Supabase Edge Function cron (free tier) -- verify availability before designing chore rotation in Phase 3

## Session Continuity

**Last session:** 2026-03-11T15:15:55.601Z
**Stopped at:** Completed 02-05-PLAN.md
**Resume file:** None
