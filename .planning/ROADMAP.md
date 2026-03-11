# Roadmap: RoomY

## Overview

RoomY delivers a roommate household management app in four phases: first establish identity and household membership (the prerequisite for everything), then build the core expense splitting and Venmo settlement loop (the primary value), then layer on groceries and chores (the secondary modules), and finally wire up push notifications and a shared calendar (engagement and polish). Each phase delivers a complete, testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, household creation/joining, onboarding quiz, and secure data model
- [ ] **Phase 2: Expense Splitting** - Add expenses, view balances, settle up via Venmo deep link
- [ ] **Phase 3: Groceries & Chores** - Shared grocery list with cost splitting, chore assignment with rotation
- [ ] **Phase 4: Engagement** - Push notifications across all modules and shared household calendar

## Phase Details

### Phase 1: Foundation
**Goal**: Users can create accounts, form a household with roommates, and configure which features they need
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password, sign in, and remain authenticated across app restarts
  2. User can create a profile with display name and Venmo username visible to household members
  3. User can create a household and share an invite code that another user enters to join
  4. User completes a short onboarding quiz and sees only the modules they enabled (expenses, groceries, chores)
  5. Household data is isolated -- users cannot see other households' data (RLS enforced)
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffolding, database schema, Supabase client, auth context, protected routes
- [ ] 01-02-PLAN.md — Auth screens (welcome, sign-up, sign-in, forgot password, Google/Apple)
- [ ] 01-03-PLAN.md — Onboarding wizard (profile, household create/join, module quiz)
- [ ] 01-04-PLAN.md — Dashboard with dynamic tabs, empty states, settings screens

### Phase 2: Expense Splitting
**Goal**: Users can log shared expenses, see who owes whom, and settle debts with one tap via Venmo
**Depends on**: Phase 1
**Requirements**: EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06
**Success Criteria** (what must be TRUE):
  1. User can add an expense with description, amount, and payer -- it is automatically split equally among all household members
  2. User can view a balance dashboard showing net amounts owed between each pair of roommates
  3. User can scroll through a history of all past expenses
  4. User can record a payment to settle a debt, and the balance dashboard updates accordingly
  5. User can tap "Request via Venmo" on the balance screen and be taken to Venmo with the amount and recipient pre-filled
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Database schema (expenses, splits, settlements tables), balance function, RLS policies, TypeScript types
- [ ] 02-02-PLAN.md — Add expense form with member selection, expense history list, expense detail with edit/delete
- [ ] 02-03-PLAN.md — Balance dashboard with net amounts, settle-up screen with Venmo deep link
- [ ] 02-04-PLAN.md — User acceptance testing of complete expense splitting flow

### Phase 3: Groceries & Chores
**Goal**: Users can coordinate grocery shopping with a shared real-time list and manage household chores with fair rotation
**Depends on**: Phase 1, Phase 2 (grocery cost splitting creates expenses)
**Requirements**: GROC-01, GROC-02, GROC-03, CHOR-01, CHOR-02, CHOR-03, CHOR-04
**Success Criteria** (what must be TRUE):
  1. User can add items to a shared grocery list and see other members' additions appear in real-time
  2. User can check off grocery items and, when shopping is done, convert the trip total into a split expense with one tap
  3. User can create chores, assign them to household members, and mark them complete
  4. Chores automatically rotate among members using effort weighting so that workload is distributed fairly over time
  5. User can view a chore contribution dashboard showing each member's effort history
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Engagement
**Goal**: Users stay informed about household activity through push notifications and can see upcoming obligations on a shared calendar
**Depends on**: Phase 2, Phase 3
**Requirements**: PUSH-01, PUSH-02, PUSH-03, CALC-01, CALC-02
**Success Criteria** (what must be TRUE):
  1. User receives a push notification when a new expense is added by another household member
  2. User receives push notifications for chore reminders and grocery list updates
  3. User can view a shared household calendar showing upcoming events
  4. Recurring expense due dates and chore schedules appear automatically on the calendar
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/4 | In Progress | - |
| 2. Expense Splitting | 0/0 | Not started | - |
| 3. Groceries & Chores | 0/0 | Not started | - |
| 4. Engagement | 0/0 | Not started | - |
