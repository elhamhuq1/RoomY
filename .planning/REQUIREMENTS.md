# Requirements: RoomY

**Defined:** 2026-03-10
**Core Value:** Roommates can see exactly who owes what and settle up with one tap -- no awkward conversations, no mental math, no forgotten debts.

## v1 Requirements (Complete)

All v1.0 requirements shipped and validated.

### Authentication & Household

- [x] **AUTH-01**: User can sign up and sign in with email/password
- [x] **AUTH-02**: User can create a profile with display name and Venmo username
- [x] **AUTH-03**: User can create a household and receive an invite code
- [x] **AUTH-04**: User can join a household by entering an invite code
- [x] **AUTH-05**: User completes onboarding quiz that configures enabled modules

### Expenses & Balances

- [x] **EXPN-01**: User can add an expense with description, amount, and who paid
- [x] **EXPN-02**: Expense is automatically split equally among household members
- [x] **EXPN-03**: User can view balance dashboard showing who owes whom
- [x] **EXPN-04**: User can view scrollable expense history
- [x] **EXPN-05**: User can settle up by recording a payment
- [x] **EXPN-06**: User can send a Venmo request with one tap from balance screen

### Groceries

- [x] **GROC-01**: User can add items to a shared grocery list
- [x] **GROC-02**: User can check off items from the grocery list in real-time
- [x] **GROC-03**: When shopping is complete, user can auto-create a split expense from the total

### Chores

- [x] **CHOR-01**: User can create and assign chores to household members
- [x] **CHOR-02**: User can mark chores as completed
- [x] **CHOR-03**: Chores automatically rotate among members with effort weighting
- [x] **CHOR-04**: User can view chore contribution history per member

### Engagement

- [x] **PUSH-01**: User receives push notifications for new expenses
- [x] **PUSH-02**: User receives push notifications for chore reminders
- [x] **PUSH-03**: User receives push notifications for grocery list updates
- [x] **CALC-01**: User can view a shared household calendar
- [x] **CALC-02**: Recurring expense due dates and chore schedules appear on calendar

## v1.1 Requirements — UI Redesign

Presentation-layer redesign. All backend logic, data models, and navigation structure stay untouched.

### Design System

- [x] **DSYS-01**: App uses an intentional color token system (brand green, semantic colors, neutrals) replacing all hardcoded orange values
- [x] **DSYS-02**: App uses a consistent typography scale with 8 defined presets (page title, key number, section heading, card title, body, metadata, overline, badge)
- [x] **DSYS-03**: App uses a two-tier elevation system (shadow, shadowMd) consistently across all cards and interactive elements

### Shared Components

- [x] **COMP-01**: Avatar component renders gradient circles with member-unique colors, supports 6 sizes, and shows colored shadow
- [x] **COMP-02**: Card component provides consistent container styling (white bg, border, radius, shadow, padding) across all screens
- [x] **COMP-03**: Badge component renders pill-shaped status indicators with semantic color variants
- [x] **COMP-04**: Button component provides primary (filled) and outline variants with consistent sizing
- [x] **COMP-05**: Icon container component renders 40x40 rounded squares with semantic background colors
- [x] **COMP-06**: Toggle switch component animates between on/off states with brand coloring and locked state support

### Onboarding

- [ ] **ONBD-01**: Welcome screen shows a 3-slide carousel with gradient hero sections, glassmorphism logo, and emoji feature badges
- [ ] **ONBD-02**: Sign up screen uses styled form inputs, branded primary button, and properly styled social auth buttons
- [ ] **ONBD-03**: Display name screen shows a live avatar preview that updates as the user types
- [ ] **ONBD-04**: Setup choice screen presents create/join options as large cards with gradient icon containers
- [ ] **ONBD-05**: Household name screen shows a branded house icon and styled input
- [ ] **ONBD-06**: Invite code screen shows a celebration layout with prominent code display and share/continue buttons
- [ ] **ONBD-07**: Module selection screen uses toggle cards with visual active/inactive states
- [ ] **ONBD-08**: Onboarding flow shows a 3-segment step progress bar on applicable screens

### Home Screen

- [x] **HOME-01**: Home screen shows a time-aware greeting header with date and settings icon button
- [x] **HOME-02**: Home screen shows a members card with household name overline, avatar row, and invite link
- [x] **HOME-03**: Home screen shows a collapsible week-strip calendar with event dots, expandable to full month
- [x] **HOME-04**: Home screen shows a dark gradient balance summary card with dollar amount and action buttons
- [ ] **HOME-05**: Home screen shows a "needs your attention" feed with actionable cards for pending chores, disputes, and updates
- [ ] **HOME-06**: Home screen shows a "this week" vertical timeline with chore items, member avatars, and completion status

### Expenses UI

- [ ] **XPUI-01**: Expenses screen shows balance cards with member rows, owe amounts, and remind/settle actions
- [ ] **XPUI-02**: Expense history visually differentiates expenses (amber icon, bold amount) from settlements (green icon, dimmed text)
- [ ] **XPUI-03**: Expense history uses overline-styled date group headers (TODAY, YESTERDAY, EARLIER)

### Groceries UI

- [ ] **GRUI-01**: Grocery list splits into "TO GET" and "DONE" sections with item counts in overline headers
- [ ] **GRUI-02**: Grocery items show circle checkboxes (unchecked: empty circle, checked: brand fill with checkmark)
- [ ] **GRUI-03**: Grocery item rows show a member avatar indicating who added each item
- [ ] **GRUI-04**: Quick-add input uses card-styled input field with a branded square add button

### Chores UI

- [ ] **CHUI-01**: Chores screen shows a stats row with pending (warning), disputed (danger), and streak (brand + fire emoji) cards
- [ ] **CHUI-02**: Chore rows show emoji icons in rounded icon containers mapped by chore type
- [ ] **CHUI-03**: Chores screen separates "YOUR CHORES" from "HOUSEHOLD" sections with overline headers
- [ ] **CHUI-04**: Disputed chore rows use danger-tinted background and border for visual urgency

### Navigation

- [x] **NAVG-01**: Tab bar uses branded styling (84px height, white bg, green active color, tertiary inactive)
- [x] **NAVG-02**: FAB uses rounded-square shape (52px, 16px radius) with brand background and colored shadow

## Future Requirements

Deferred beyond v1.1. Tracked but not in current roadmap.

### Expenses

- **EXPN-07**: Recurring expenses auto-create monthly (rent, utilities, subscriptions)
- **EXPN-08**: Debt simplification algorithm minimizes number of payments for 3+ people
- **EXPN-09**: User can set custom split percentages for specific expenses

### Engagement

- **ENGM-01**: User can view activity feed showing all household actions
- **ENGM-02**: Full modular feature system with per-module settings

### Infrastructure

- **INFR-01**: Offline support with sync for grocery list and expense entry

### Visual Polish

- **VISL-01**: Dark mode support with full token variant
- **VISL-02**: Skeleton loading screens
- **VISL-03**: Custom pull-to-refresh animation

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
| Dark mode | Doubles design surface area; build tokens to support later but don't implement now |
| Custom icon library | Ionicons already covers all needed glyphs; keep existing |
| Custom fonts | System fonts are intentional per design spec for performance and native feel |
| Backend changes | Presentation-layer only milestone |
| New features | This milestone is purely visual redesign |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSYS-01 | Phase 6 | Complete |
| DSYS-02 | Phase 6 | Complete |
| DSYS-03 | Phase 6 | Complete |
| COMP-01 | Phase 6 | Complete |
| COMP-02 | Phase 6 | Complete |
| COMP-03 | Phase 6 | Complete |
| COMP-04 | Phase 6 | Complete |
| COMP-05 | Phase 6 | Complete |
| COMP-06 | Phase 6 | Complete |
| NAVG-01 | Phase 6 | Complete |
| NAVG-02 | Phase 6 | Complete |
| HOME-01 | Phase 7 | Complete |
| HOME-02 | Phase 7 | Complete |
| HOME-03 | Phase 7 | Complete |
| HOME-04 | Phase 7 | Complete |
| HOME-05 | Phase 7 | Pending |
| HOME-06 | Phase 7 | Pending |
| XPUI-01 | Phase 8 | Pending |
| XPUI-02 | Phase 8 | Pending |
| XPUI-03 | Phase 8 | Pending |
| GRUI-01 | Phase 9 | Pending |
| GRUI-02 | Phase 9 | Pending |
| GRUI-03 | Phase 9 | Pending |
| GRUI-04 | Phase 9 | Pending |
| CHUI-01 | Phase 9 | Pending |
| CHUI-02 | Phase 9 | Pending |
| CHUI-03 | Phase 9 | Pending |
| CHUI-04 | Phase 9 | Pending |
| ONBD-01 | Phase 10 | Pending |
| ONBD-02 | Phase 10 | Pending |
| ONBD-03 | Phase 10 | Pending |
| ONBD-04 | Phase 10 | Pending |
| ONBD-05 | Phase 10 | Pending |
| ONBD-06 | Phase 10 | Pending |
| ONBD-07 | Phase 10 | Pending |
| ONBD-08 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-12 after v1.1 roadmap creation*
