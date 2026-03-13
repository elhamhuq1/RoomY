# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.
**Current focus:** Phase 10 - Onboarding Flow

## Current Position

Phase: 10 of 10 (Onboarding Flow)
Plan: 1 of 4 in current phase
Status: In Progress
Last activity: 2026-03-13 - Completed 10-01 onboarding assets and welcome carousel restyle

Progress: [#####...............] 25% (v1.1 Phase 10: 1/4 plans)

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
- Last 5 plans: 2min, 2min, 20min, 4min, 2min
- Trend: Gap closure plans consistently fast (2-4min, pre-diagnosed changes)

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 06 Design System | 4 | 31min | 7.8min |
| 07 Home Screen | 4 | 17min | 4.3min |
| 08 Expenses Screen | 3/3 | 8min | 2.7min |
| 09 Groceries + Chores | 2/2 | 6min | 3.0min |

*Updated after each plan completion*
| Phase 07 P01 | 4min | 2 tasks | 3 files |
| Phase 07 P02 | 4min | 1 task | 2 files |
| Phase 07 P03 | 5min | 2 tasks | 3 files |
| Phase 07 P04 | 4min | 2 tasks | 5 files |
| Phase 08 P01 | 3min | 2 tasks | 8 files |
| Phase 08 P02 | 3min | 2 tasks | 1 file |
| Phase 08 P03 | 2min | 2 tasks | 4 files |
| Phase 09 P01 | 3min | 2 tasks | 6 files |
| Phase 09 P02 | 3min | 2 tasks | 5 files |
| Phase 10 P01 | 2min | 2 tasks | 12 files |

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
- [Phase quick]: Floodfill from 7 seed points for logo background removal (4 corners + 3 interior trapped regions)
- [08-03]: Chevron affordance 16px Ionicons neutral.secondary, dynamically toggled by isExpanded
- [08-03]: RoommateSection member fetch runs after critical Promise.all to avoid slowing initial load
- [08-03]: Guard for empty memberUserIds avoids unnecessary profile query for solo members
- [09-01]: Removed Keyboard.dismiss() from addItem for fast multi-item entry per CONTEXT.md
- [09-01]: Circle checkbox inline in GroceryItemRow (grocery-specific, not extracted as separate component)
- [09-01]: Profile batch fetch after fetchItems; realtime INSERT fetches single unknown profiles incrementally
- [09-02]: Disputed count replaces Overdue count in stats row per CONTEXT.md
- [09-02]: Personal best calculated by scanning all completions for longest consecutive non-reverted run
- [09-02]: Emoji icon mapping uses case-insensitive keyword includes matching with clipboard fallback
- [09-02]: 400ms setTimeout delay after completion RPC for visual feedback before refetch
- [10-01]: ONBOARDING_CREAM set to #F5F0EB (closest match to illustration backgrounds)
- [10-01]: Renamed 'Sign in' to 'Log in' on welcome screen per CONTEXT.md decision
- [10-01]: Platform-aware glassmorphism: rgba(255,255,255,0.3) iOS, rgba(255,255,255,0.7) Android

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Add RoomY logo as app icon and splash screen | 2026-03-12 | 8a6885d | [1-add-roomy-logo-as-app-icon-and-splash-sc](./quick/1-add-roomy-logo-as-app-icon-and-splash-sc/) |

### Blockers/Concerns

- [Resolved 10-01]: expo-blur intensity mapping -- using intensity=25 with tint="light", Platform-aware inner bg opacity
- [Resolved 06-03]: Colored shadow -- used iOS shadow props (shadowColor, shadowOffset, shadowOpacity, shadowRadius) directly in FAB.tsx
- [Resolved 06-01]: NativeWind fontSize tuples work with fontWeight/letterSpacing in Tailwind config extend
- [Resolved 06-02]: Deterministic member color via hashString(userId) % 8 gradient pairs -- simple charCodeAt hash, no DB storage needed
- [Resolved 10-01]: Gradient interpolation scope -- static cream background per CONTEXT.md (no per-slide gradient needed)

## Session Continuity

Last session: 2026-03-13
Stopped at: Completed 10-01-PLAN.md -- Onboarding assets, StepProgressBar, and welcome carousel restyle
Resume file: None
