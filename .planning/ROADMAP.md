# Roadmap: RoomY

## Overview

RoomY delivers a roommate household management app in five phases: first establish identity and household membership (the prerequisite for everything), then build the core expense splitting and Venmo settlement loop (the primary value), then add groceries and chores as separate parallel phases (enabling two developers to work simultaneously), and finally wire up push notifications and a shared calendar (engagement and polish). Each phase delivers a complete, testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, household creation/joining, onboarding quiz, and secure data model
- [ ] **Phase 2: Expense Splitting** - Add expenses, view balances, settle up via Venmo deep link
- [ ] **Phase 3: Groceries** - Shared grocery list with real-time sync and one-tap cost splitting
- [ ] **Phase 3.1: Chores** - Chore assignment, completion tracking, fair rotation with effort weighting
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
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Database schema (expenses, splits, settlements tables), balance function, RLS policies, TypeScript types
- [ ] 02-02-PLAN.md — Add expense form with member selection, expense history list, expense detail with edit/delete
- [ ] 02-03-PLAN.md — Balance dashboard with net amounts, settle-up screen with Venmo deep link
- [ ] 02-04-PLAN.md — User acceptance testing of complete expense splitting flow
- [x] 02-05-PLAN.md — Gap closure: fix settlement balance inversion, $ alignment, keyboard dismiss, Venmo note format

### Phase 3: Groceries
**Goal**: Users can coordinate grocery shopping with a shared real-time list and convert shopping trips into split expenses
**Depends on**: Phase 1, Phase 2 (grocery cost splitting creates expenses)
**Requirements**: GROC-01, GROC-02, GROC-03
**Success Criteria** (what must be TRUE):
  1. User can add items to a shared grocery list and see other members' additions appear in real-time
  2. User can check off grocery items and, when shopping is done, convert the trip total into a split expense with one tap
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Database schema (grocery_items, grocery_trips tables, RLS, realtime), TypeScript types, real-time grocery list screen
- [ ] 03-02-PLAN.md — Complete Trip expense conversion flow, trip history archive, end-to-end verification

### Phase 3.1: Chores — INSERTED
**Goal**: Users can manage household chores with assignment, completion tracking, and fair automatic rotation
**Depends on**: Phase 1 (household membership)
**Requirements**: CHOR-01, CHOR-02, CHOR-03, CHOR-04
**Success Criteria** (what must be TRUE):
  1. User can create chores, assign them to household members, and mark them complete
  2. Chores automatically rotate among members using round-robin so that workload is distributed fairly over time
  3. User can view a chore contribution dashboard showing each member's effort history
**Plans**: 2 plans

Plans:
- [ ] 03.1-01-PLAN.md — Database schema (chores, completions, swap_requests tables, RLS, RPC functions, pg_cron), TypeScript types, main chore list with create/complete/claim
- [ ] 03.1-02-PLAN.md — Swap requests, dispute system with 24h auto-revert, contribution dashboard with week/month views

### Phase 4: Engagement
**Goal**: Users stay informed about household activity through push notifications and can see upcoming obligations on a shared calendar
**Depends on**: Phase 2, Phase 3, Phase 3.1
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
Phases execute in numeric order: 1 -> 2 -> 3 & 3.1 (parallel) -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/4 | In Progress | - |
| 2. Expense Splitting | 4/5 | In Progress | - |
| 3. Groceries | 1/2 | In Progress | - |
| 3.1. Chores | 0/2 | Not started | - |
| 4. Engagement | 0/0 | Not started | - |
