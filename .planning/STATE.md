# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.
**Current focus:** Phase 7 - Home Screen

## Current Position

Phase: 7 of 10 (Home Screen)
Plan: 2 of 3 in current phase
Status: Executing
Last activity: 2026-03-12 -- Completed 07-02 CalendarSection component with red/coral expense dots

Progress: [##############......] 67% (v1.1 Phase 7: 2/3 plans)

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
- Last 5 plans: 3min, 2min, 2min, 2min, 20min
- Trend: UAT plan took longer (human-in-loop verification + 3 bug fixes)

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 06 Design System | 4 | 31min | 7.8min |
| 07 Home Screen | 2 | 8min | 4.0min |

*Updated after each plan completion*
| Phase 07 P01 | 4min | 2 tasks | 3 files |

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
Stopped at: Completed 07-01-PLAN.md
Resume file: None
