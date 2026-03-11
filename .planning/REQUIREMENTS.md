# Requirements: RoomY

**Defined:** 2026-03-10
**Core Value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Household

- [x] **AUTH-01**: User can sign up and sign in with email/password
- [x] **AUTH-02**: User can create a profile with display name and Venmo username
- [x] **AUTH-03**: User can create a household and receive an invite code
- [x] **AUTH-04**: User can join a household by entering an invite code
- [x] **AUTH-05**: User completes onboarding quiz that configures enabled modules

### Expenses & Balances

- [ ] **EXPN-01**: User can add an expense with description, amount, and who paid
- [ ] **EXPN-02**: Expense is automatically split equally among household members
- [ ] **EXPN-03**: User can view balance dashboard showing who owes whom
- [ ] **EXPN-04**: User can view scrollable expense history
- [ ] **EXPN-05**: User can settle up by recording a payment
- [ ] **EXPN-06**: User can send a Venmo request with one tap from balance screen

### Groceries

- [ ] **GROC-01**: User can add items to a shared grocery list
- [ ] **GROC-02**: User can check off items from the grocery list in real-time
- [ ] **GROC-03**: When shopping is complete, user can auto-create a split expense from the total

### Chores

- [ ] **CHOR-01**: User can create and assign chores to household members
- [ ] **CHOR-02**: User can mark chores as completed
- [ ] **CHOR-03**: Chores automatically rotate among members with effort weighting
- [ ] **CHOR-04**: User can view chore contribution history per member

### Engagement

- [ ] **PUSH-01**: User receives push notifications for new expenses
- [ ] **PUSH-02**: User receives push notifications for chore reminders
- [ ] **PUSH-03**: User receives push notifications for grocery list updates
- [ ] **CALC-01**: User can view a shared household calendar
- [ ] **CALC-02**: Recurring expense due dates and chore schedules appear on calendar

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Expenses

- **EXPN-07**: Recurring expenses auto-create monthly (rent, utilities, subscriptions)
- **EXPN-08**: Debt simplification algorithm minimizes number of payments for 3+ people
- **EXPN-09**: User can set custom split percentages for specific expenses

### Engagement

- **ENGM-01**: User can view activity feed showing all household actions
- **ENGM-02**: Full modular feature system with per-module settings

### Infrastructure

- **INFR-01**: Offline support with sync for grocery list and expense entry

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in payment processing (Stripe) | Not a business, no merchant account -- Venmo deep links cover the need |
| Receipt scanning / OCR | Mediocre accuracy, API cost -- manual entry takes 10 seconds for small households |
| In-app chat / messaging | Roommates already have iMessage/WhatsApp group chats |
| Gamification / points system | Patronizing for adults -- transparent contribution history is more effective |
| Social features beyond household | This is a household tool, not a social network |
| Multi-currency support | USD only -- target users are in the same US household |
| AI-powered suggestions | Decision space too small for AI to add value in 2-4 person households |
| Income-based splitting | Requires sensitive financial disclosure, creates social friction |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| EXPN-01 | Phase 2 | Pending |
| EXPN-02 | Phase 2 | Pending |
| EXPN-03 | Phase 2 | Pending |
| EXPN-04 | Phase 2 | Pending |
| EXPN-05 | Phase 2 | Pending |
| EXPN-06 | Phase 2 | Pending |
| GROC-01 | Phase 3 | Pending |
| GROC-02 | Phase 3 | Pending |
| GROC-03 | Phase 3 | Pending |
| CHOR-01 | Phase 3 | Pending |
| CHOR-02 | Phase 3 | Pending |
| CHOR-03 | Phase 3 | Pending |
| CHOR-04 | Phase 3 | Pending |
| PUSH-01 | Phase 4 | Pending |
| PUSH-02 | Phase 4 | Pending |
| PUSH-03 | Phase 4 | Pending |
| CALC-01 | Phase 4 | Pending |
| CALC-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
