# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.
**Current focus:** Phase 8 - Expenses Screen

## Current Position

Phase: 8 of 10 (Expenses Screen)
Plan: 2 of 2 in current phase -- PHASE COMPLETE
Status: Phase Complete
Last activity: 2026-03-12 -- Completed 08-02 Per-member breakdown and visual verification

Progress: [####################] 100% (v1.1 Phase 8: 2/2 plans)

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 18
- Total execution time: ~72 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 4 | 15min | 3.8min |
| 02 Expenses | 5 | 30min | 6.0min |
| 03 Groceries | 3 | 13min | 4.3min |
| 03.1 Chores | 2 | 8min | 4.0min |
| 04 Engagement | 4 | 13min | 3.3min |

**Recent Trend:**
- Last 5 plans: 2min, 2min, 2min, 20min, 4min
- Trend: Gap closure plan fast (4min, all code changes pre-diagnosed)

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 06 Design System | 4 | 31min | 7.8min |
| 07 Home Screen | 4 | 17min | 4.3min |
| 08 Expenses Screen | 2/2 | 6min | 3.0min |

*Updated after each plan completion*
| Phase 07 P01 | 4min | 2 tasks | 3 files |
| Phase 07 P02 | 4min | 1 task | 2 files |
| Phase 07 P03 | 5min | 2 tasks | 3 files |
| Phase 07 P04 | 4min | 2 tasks | 5 files |
| Phase 08 P01 | 3min | 2 tasks | 8 files |
| Phase 08 P02 | 3min | 2 tasks | 1 file |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap v1.1]: 5 phases (6-10) derived from 36 requirements across 8 categories
- [Roadmap v1.1]: DSYS + COMP + NAVG combined into Phase 6 (foundation must come first)
- [Roadmap v1.1]: GRUI + CHUI combined into Phase 9 (both low complexity, similar patterns)
- [Roadmap v1.1]: Onboarding last (Phase 10) -- seen once per user, benefits from components tested on main screens
- [Roadmap v1.1]: Phase 5 reserved for potential v1.0 gap closure
- [Roadmap v1.1]: Presentation-layer only -- no backend changes in any phase
- [06-01]: Brand green (#10B981) kept separate from semantic success (#22C55E)
- [06-01]: headerTintColor uses neutral.text for readability over brand expression
- [06-01]: AVATAR_COLORS temporary arrays until Avatar component in Plan 02
- [06-02]: 8 gradient hue families for avatar differentiation (emerald, blue, violet, pink, amber, red, cyan, lime)
- [06-02]: Card uses Platform.OS check for Android elevation alongside NativeWind shadow class
- [06-02]: Toggle syncs animation via useEffect on value prop change for controlled component behavior
- [06-02]: IconContainer hardcodes color-600 hex for Ionicons color prop (cannot use NativeWind classes)
- [06-03]: Groceries tab excluded from FAB (has inline text input for adding items)
- [06-03]: Existing in-screen FABs left in place; deduplication deferred to later phases
- [06-04]: Old inline FABs removed from expenses/chores during UAT -- overlapping with layout FAB was a real UX bug, not deferrable
- [07-01]: BalanceSummaryCard uses inline borderRadius style on LinearGradient for reliability over NativeWind className
- [07-01]: MembersCard handles solo vs multi-member invite prominence inline via conditional rendering
- [07-01]: Section components are presentational only -- accept typed props, no data fetching inside
- [07-02]: Custom week-strip + Calendar toggle used instead of ExpandableCalendar to avoid ScrollView gesture conflicts
- [07-02]: Expense dot color changed from blue (#3b82f6) to red/coral (#EF4444) per design spec
- [07-03]: Unsettled balances shown from current user's perspective by inverting other members' net_amount
- [07-03]: Solo creator state simplified to GreetingHeader + MembersCard only (no empty data sections)
- [07-03]: Centralized data fetching pattern: parent screen fetches all data in Promise.all, passes to presentational children
- [07-04]: Balance buttons hidden when settled (user override of original "visible but muted" CONTEXT.md decision)
- [07-04]: myNetAmount via .reduce() summing all RPC pairwise rows (not .find() for own user_id which was always undefined)
- [07-04]: weekChores uses projectChoreDates for recurring frequency projection instead of filtering single next_due_at
- [07-04]: fetchAllData scoped to selectedDate month so pull-to-refresh preserves calendar context
- [08-01]: Separated touch zones (left Pressable for row, right Button for action) to avoid RN event bubbling
- [08-01]: Card p-0 override for HistorySection cards since items manage their own px-4 padding
- [08-02]: Reused ExpenseRow/SettlementRow from Plan 01 barrel export for member-history screen consistency
- [08-02]: All Phase 8 requirements (XPUI-01, XPUI-02, XPUI-03) visually verified via 10-point UAT checklist

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: expo-blur intensity mapping (CSS blur 12px -> intensity ~25-35) requires visual tuning in Phase 10
- [Resolved 06-03]: Colored shadow -- used iOS shadow props (shadowColor, shadowOffset, shadowOpacity, shadowRadius) directly in FAB.tsx
- [Resolved 06-01]: NativeWind fontSize tuples work with fontWeight/letterSpacing in Tailwind config extend
- [Resolved 06-02]: Deterministic member color via hashString(userId) % 8 gradient pairs -- simple charCodeAt hash, no DB storage needed
- [Research]: Gradient interpolation scope for onboarding carousel (static-per-slide vs scroll-handler) -- decide during Phase 10 planning

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 08-02-PLAN.md -- Phase 8 complete (per-member breakdown + visual verification)
Resume file: None
