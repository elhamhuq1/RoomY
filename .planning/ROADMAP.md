# Roadmap: RoomY

## Milestones

- **v1.0 MVP** - Phases 1-4 (shipped)
- **v1.1 UI Redesign** - Phases 6-10 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED</summary>

- [x] **Phase 1: Foundation** - Auth, household creation/joining, onboarding quiz, and secure data model
- [x] **Phase 2: Expense Splitting** - Add expenses, view balances, settle up via Venmo deep link
- [x] **Phase 3: Groceries** - Shared grocery list with real-time sync and one-tap cost splitting
- [x] **Phase 3.1: Chores** - Chore assignment, completion tracking, fair rotation with effort weighting
- [x] **Phase 4: Engagement** - Push notifications across all modules and shared household calendar

Plans:
- [x] 01-01: Project scaffolding, database schema, Supabase client, auth context, protected routes
- [x] 01-02: Auth screens (welcome, sign-up, sign-in, forgot password, Google/Apple)
- [x] 01-03: Onboarding wizard (profile, household create/join, module quiz)
- [x] 01-04: Dashboard with dynamic tabs, empty states, settings screens
- [x] 02-01: Database schema (expenses, splits, settlements tables), balance function, RLS policies
- [x] 02-02: Add expense form, expense history list, expense detail with edit/delete
- [x] 02-03: Balance dashboard with net amounts, settle-up screen with Venmo deep link
- [x] 02-04: User acceptance testing of complete expense splitting flow
- [x] 02-05: Gap closure: settlement balance inversion, $ alignment, keyboard dismiss, Venmo note
- [x] 03-01: Database schema, real-time grocery list screen
- [x] 03-02: Complete Trip expense conversion flow, trip history archive
- [x] 03-03: Gap closure: edit modal keyboard, swipe-to-delete UX, section labels
- [x] 03.1-01: Database schema, main chore list with create/complete/claim
- [x] 03.1-02: Swap requests, dispute system, contribution dashboard
- [x] 04-01: Shared household calendar with month grid, color-coded dots
- [x] 04-02: Notification Edge Functions for expense and chore push
- [x] 04-03: Client-side push registration, notification handler, preferences
- [x] 04-04: Gap closure: event list scroll, push token crash fix

</details>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (6.1, 7.2): Urgent insertions (marked with INSERTED)
- Phase 5: Reserved (v1.0 gap closure, not yet executed)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 6: Design System + Components** - Design tokens, shared component library, and navigation chrome
- [ ] **Phase 7: Home Screen** - Calendar, balance summary, attention feed, weekly timeline (UAT gap closure in progress)
- [ ] **Phase 8: Expenses Screen** - Balance cards, differentiated history rows, date group headers (UAT gap closure in progress)
- [ ] **Phase 9: Groceries + Chores** - Section headers, checkboxes, avatars, emoji icons, stats, dispute styling
- [ ] **Phase 10: Onboarding Flow** - Welcome carousel, styled auth, avatar preview, setup cards, progress bar

## Phase Details

### Phase 6: Design System + Components
**Goal**: Every screen has access to a consistent design token system and reusable component library, and the app's persistent navigation chrome reflects the new brand identity
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: DSYS-01, DSYS-02, DSYS-03, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, NAVG-01, NAVG-02
**Success Criteria** (what must be TRUE):
  1. App renders with green brand palette throughout -- no orange hex values remain in the codebase
  2. Typography classes produce visually distinct hierarchy across all 8 presets (page title through badge) when applied to test content
  3. Shared components (Avatar, Card, Badge, Button, IconContainer, Toggle) render correctly in isolation and accept their documented props
  4. Tab bar shows green active icons, tertiary inactive icons, white background with top border, and 84px height
  5. FAB renders as a 52px rounded square with brand background and colored shadow
**Plans:** 4/4 plans complete

Plans:
- [x] 06-01-PLAN.md — Design tokens (colors, typography, elevation) and full orange-to-green palette migration
- [x] 06-02-PLAN.md — Shared UI components (Avatar, Card, Badge, Button, IconContainer, Toggle)
- [x] 06-03-PLAN.md — Tab bar branded styling and FAB component
- [x] 06-04-PLAN.md — Visual verification checkpoint on device

### Phase 7: Home Screen
**Goal**: The daily landing screen gives users an at-a-glance view of their household, finances, schedule, and pending tasks
**Depends on**: Phase 6
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06
**Success Criteria** (what must be TRUE):
  1. Home screen shows a greeting that changes based on time of day (morning/afternoon/evening) with the current date
  2. Members card displays household name, avatar row for all members, and a working invite link
  3. Week-strip calendar shows 7 days with today highlighted and event dots, and expands to a full month view on tap
  4. Balance summary card renders with dark gradient background showing the net dollar amount and action buttons
  5. "Needs your attention" feed shows actionable cards for pending chores and disputes that the user can act on
**Plans:** 4 plans (3 complete + 1 gap closure)

Plans:
- [x] 07-01-PLAN.md — Greeting header, members card, and balance summary card components
- [x] 07-02-PLAN.md — Collapsible week-strip calendar with updated dot colors
- [x] 07-03-PLAN.md — Attention feed, weekly timeline, and full home screen assembly
- [ ] 07-04-PLAN.md — Gap closure: fix empty timeline, hide settled balance buttons, preserve refresh date

### Phase 8: Expenses Screen
**Goal**: Users can visually distinguish between expenses and settlements at a glance, with clear balance information per member
**Depends on**: Phase 6
**Requirements**: XPUI-01, XPUI-02, XPUI-03
**Success Criteria** (what must be TRUE):
  1. Balance section shows member rows with avatars, owe amounts, and working remind/settle action buttons
  2. Expense rows display with amber icon containers and bold amounts, while settlement rows display with green icons and dimmed text
  3. History entries are grouped under overline-styled date headers (TODAY, YESTERDAY, EARLIER)
**Plans:** 3 plans (2 complete + 1 gap closure)

Plans:
- [x] 08-01-PLAN.md — Expense child components and parent screen rewrite with design system, inline expand, and pagination
- [x] 08-02-PLAN.md — Per-member expense breakdown screen and visual verification
- [ ] 08-03-PLAN.md — Gap closure: chevron expand affordance and "Expenses by Roommate" all-members section

### Phase 9: Groceries + Chores
**Goal**: Grocery and chore screens use consistent design system components with clear visual states for item status, member attribution, and task urgency
**Depends on**: Phase 6
**Requirements**: GRUI-01, GRUI-02, GRUI-03, GRUI-04, CHUI-01, CHUI-02, CHUI-03, CHUI-04
**Success Criteria** (what must be TRUE):
  1. Grocery list splits into "TO GET" and "DONE" sections with item counts in overline headers
  2. Grocery items show circle checkboxes (empty when unchecked, brand-filled with checkmark when checked) and a member avatar showing who added each item
  3. Quick-add input uses card-styled field with a branded square add button
  4. Chores screen shows a stats row with pending (warning), disputed (danger), and streak (brand + fire emoji) cards
  5. Chore rows display emoji icons in rounded icon containers, and disputed chores use danger-tinted backgrounds with red borders
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Grocery presentational components and parent screen rewrite with circle checkboxes, avatars, collapsible DONE section
- [ ] 09-02-PLAN.md — Chore presentational components and parent screen rewrite with stats cards, emoji icons, dispute styling

### Phase 10: Onboarding Flow
**Goal**: New users experience a polished, trustworthy first impression that guides them through account creation and household setup with clear visual progress
**Depends on**: Phase 6
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07, ONBD-08
**Success Criteria** (what must be TRUE):
  1. Welcome screen displays a 3-slide carousel with gradient hero sections, glassmorphism logo container, and emoji feature badges
  2. Sign-up screen renders styled form inputs with a branded primary button and properly styled social auth buttons
  3. Display name screen shows a live avatar preview that updates its initial as the user types
  4. Setup choice and household screens use large styled cards with gradient icon containers and branded inputs
  5. Onboarding flow shows a 3-segment step progress bar that fills as the user advances through applicable screens
**Plans:** 2/4 plans executed

Plans:
- [ ] 10-01-PLAN.md — Infrastructure setup (images, expo-blur, StepProgressBar) and welcome carousel restyle
- [ ] 10-02-PLAN.md — Auth screens restyle (sign-up, sign-in, forgot-password) with "Sign In" to "Log In" rename
- [ ] 10-03-PLAN.md — Profile, household choice, and create-household name form with illustrations and progress bar
- [ ] 10-04-PLAN.md — Invite code celebration, join-household, member-welcome, and module-quiz restyle

## Progress

**Execution Order:**
Phases execute in numeric order: 6 -> 7 -> 8 -> 9 -> 10
(Phases 7, 8, 9, 10 all depend on Phase 6; Phases 8 and 9 have no cross-dependencies)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | - |
| 2. Expense Splitting | v1.0 | 5/5 | Complete | - |
| 3. Groceries | v1.0 | 3/3 | Complete | - |
| 3.1. Chores | v1.0 | 2/2 | Complete | - |
| 4. Engagement | v1.0 | 4/4 | Complete | - |
| 5. (Reserved) | v1.0 | - | Skipped | - |
| 6. Design System + Components | v1.1 | Complete    | 2026-03-12 | 2026-03-12 |
| 7. Home Screen | v1.1 | 3/4 (gap closure) | In progress | - |
| 8. Expenses Screen | v1.1 | 2/3 (gap closure) | In progress | - |
| 9. Groceries + Chores | v1.1 | 0/2 | Planned | - |
| 10. Onboarding Flow | 2/4 | In Progress|  | - |
