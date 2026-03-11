# Feature Research

**Domain:** Roommate household management (expenses, groceries, chores, calendar)
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (based on competitor analysis of 10+ apps, multiple corroborating sources)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **User authentication and profiles** | Every multi-user app requires identity; users expect to log in and have their own account | MEDIUM | OAuth (Google/Apple) preferred over email/password for speed. Each user needs a display name, avatar, and Venmo username stored in profile. |
| **Household creation and invite system** | Users must be able to create a household and invite roommates via a shareable code or link | MEDIUM | Standard pattern: creator gets a 6-digit code or deep link to share. New users join by entering code. Must handle edge cases: what if someone joins the wrong household, leaves, gets removed. |
| **Add and track shared expenses** | This is the core promise of every expense-splitting app. Splitwise, Tricount, SplitPal all do this. Users expect to log who paid, how much, and for what. | MEDIUM | Must support: description, amount, who paid, split method (equal by default). Timestamps and categories are expected. |
| **Balance tracking (who owes whom)** | Users expect a clear "Who's Up, Who's Down" dashboard showing net balances. Splitwise popularized this. Without it, expense tracking has no payoff. | MEDIUM | Display net balance per person (green for owed, red for owing). Debt simplification algorithm recommended to minimize number of payments needed. |
| **Equal expense splitting** | The default splitting method. Every competitor supports this. Users assume it works out of the box. | LOW | Split evenly among all household members. This is the 80% case for roommates. |
| **Settle up / payment flow** | Users expect a way to mark debts as settled. Splitwise, SplitPal, and Tricount all offer this. | LOW | At minimum: "Record a payment" between two people. RoomY adds Venmo deep links on top. |
| **Shared grocery list** | Flatastic, OurHome, Dwell, and dedicated grocery apps all offer this. Roommates expect to collaborate on what to buy. | MEDIUM | Must support: add items, check off items, real-time sync across devices. Items should persist until explicitly removed (not just checked). |
| **Push notifications** | Users expect to be notified when expenses are added, when they owe money, when grocery items are added, and when chores are due. Without notifications, the app is invisible. | MEDIUM | Expo supports push notifications via expo-notifications. Critical for engagement -- apps without push lose 77% of users in 3 days. |
| **Expense history** | Users expect to scroll back and see past expenses. This builds trust and resolves disputes. | LOW | Chronological list with filters by category, person, or date range. |
| **Recurring expenses** | Rent, utilities, internet, streaming subscriptions -- these happen monthly. Splitwise, Tricount, and others support auto-creation. Users will manually re-enter monthly bills at most twice before they expect automation. | MEDIUM | Auto-create expense on schedule (monthly, weekly, custom). Needs notification when auto-created so users can adjust amounts (utility bills vary). |

### Differentiators (Competitive Advantage)

Features that set RoomY apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Onboarding quiz that recommends modules** | No competitor does this. Most apps dump all features on users at once. A quiz that asks "Do you split groceries? Do you rotate chores?" and enables only relevant modules reduces overwhelm and gets users to their "aha moment" faster. Headspace and Duolingo use this pattern successfully. | MEDIUM | 3-5 questions. Output: which modules are enabled (expenses, groceries, chores, calendar). Can be changed later in settings. This is RoomY's most distinctive UX idea. |
| **Modular feature system** | Paired with the quiz. Users only see features they opted into. A household that only splits bills never sees chore tracking clutter. No major competitor offers this -- Flatastic, OurHome, and Dwell show all features to all users. | HIGH | Requires thoughtful UI architecture -- navigation and screens must adapt based on enabled modules. Worth the complexity because it directly addresses the #1 complaint about all-in-one apps: feature overload. |
| **One-tap Venmo request via deep links** | Splitwise and SplitPal offer Venmo integration, but it requires their premium tier or is buried in menus. Making "Request via Venmo" a prominent, one-tap action from the balance screen is a genuine UX win. The Venmo deep link API supports txn=charge, amount, note, and recipients parameters. | LOW | Use `venmo://paycharge?txn=charge&recipients={username}&amount={amount}&note={note}` on mobile. Fall back to `https://venmo.com/{username}?txn=charge&amount={amount}&note={note}` on web. Requires each user to store their Venmo username in profile. |
| **Chore rotation with fairness tracking** | OurHome and Flatastic track chores but rotation is manual. Automatic rotation ("this week it's Alex's turn to clean the bathroom, next week it's Jordan's") with visible contribution history eliminates the "I always do everything" argument. | MEDIUM | Rotation algorithm: round-robin per chore, with skip/swap capability. Contribution dashboard shows completed vs. assigned per person over time. |
| **Grocery cost auto-splitting** | No competitor automatically splits grocery purchases. Most require manual expense entry after shopping. RoomY can tie grocery list completion to expense creation: "Jordan bought the groceries ($47.50) -- split among household?" | MEDIUM | When someone checks off all items and enters total, auto-create a split expense. This bridges the grocery list and expense tracking modules, creating a uniquely seamless flow. |
| **Activity feed / household log** | Dwell introduced this well -- a transparent log of all household actions. Most competitors lack a unified activity view. Shows "Jordan added $45 for groceries," "Alex completed 'Clean kitchen'," "Sam added milk to the grocery list." | LOW | Simple reverse-chronological feed of all actions. Builds household awareness and accountability without being intrusive. |
| **Shared household calendar** | OurFlat and Flatify offer this, but most expense-focused apps (Splitwise, Tricount) do not. For roommates, knowing when someone is out of town, having a guest over, or when rent is due is genuinely useful. | MEDIUM | Basic shared calendar with events visible to all household members. Color-code by person. Integrate with recurring expense due dates and chore schedules. |
| **Offline support with sync** | Flatastic advertises offline support. For a household app used at home (usually on wifi), this is less critical, but graceful offline handling prevents data loss when adding expenses on the go (e.g., at the grocery store). | HIGH | Requires conflict resolution strategy for concurrent edits. Expo + a real-time backend (Supabase, Firebase) can handle this, but it adds significant complexity. Defer to v1.x unless the backend naturally supports it. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Built-in payment processing (Stripe/in-app payments)** | "Pay directly in the app!" sounds convenient | Requires merchant account, regulatory compliance (money transmitter licenses), PCI compliance, and massive liability for a personal project. Splitwise spent years on this and still primarily uses Venmo/PayPal links. The PROJECT.md correctly rules this out. | Venmo deep links. Zero regulatory burden, zero payment infrastructure, and Venmo is already how the target users pay each other. |
| **Receipt scanning / OCR** | "Just take a photo!" is appealing | OCR accuracy is mediocre (Splitwise Pro's OCR still needs manual corrections). Requires a paid OCR API or ML model, adds significant complexity, and the failure mode (wrong amounts) is worse than manual entry. For a 2-person household, manual entry takes 10 seconds. | Manual expense entry with quick-add patterns (recent expenses, templates for recurring items). Revisit OCR only if the app scales to larger groups. |
| **Income-based splitting** | "Split by income ratio for fairness" | Requires users to share sensitive financial information. Creates social friction -- roommates may not want to disclose income. The Fair Share Calculator exists as a standalone tool for this. Adding it to a household app makes every expense entry a potential conflict. | Equal splitting as default. Support custom split percentages for specific expenses (e.g., one person has the bigger bedroom, pays 55% of rent). Let roommates negotiate this offline and enter the split once. |
| **Social features beyond the household** | "See what other households are doing" or "Add friends from other households" | This is a household management tool, not a social network. Social features dilute focus, create privacy concerns (who can see my expenses?), and add moderation burden. PROJECT.md correctly rules this out. | Keep the app household-scoped. One user can be in multiple households if needed (e.g., home + vacation group). |
| **In-app chat / messaging** | "We need to communicate about expenses" | Roommates already have iMessage, WhatsApp, or group chats. Building another chat app inside RoomY duplicates existing tools, adds notification fatigue, and is a huge engineering effort for little value. Flatastic's "Shouts" feature gets mixed reviews. | Comments on specific items (expenses, chores, grocery items). Push notifications link directly to the relevant item. For general communication, roommates use their existing group chat. |
| **Gamification / points system** | "Make chores fun with points!" | Points systems create perverse incentives (doing easy chores for points, ignoring hard ones). They require a reward redemption system that adds complexity. OurHome and Nipto use this but reviews are mixed -- adults find it patronizing. | Contribution tracking with visible history. Show who has done what over time. Social accountability (your roommates can see your track record) is more effective than artificial points for adults. |
| **AI-powered suggestions** | "AI should suggest what to buy or who should do what" | Adds complexity, requires ML infrastructure, and the suggestions will be wrong often enough to be annoying. For a 2-4 person household, the decision space is too small for AI to add value. | Smart defaults based on history (e.g., pre-fill grocery items bought frequently, suggest the same expense split as last time). Pattern-based, not AI-based. |
| **Multi-currency support** | "Support international roommates" | Adds significant complexity to balance calculations and expense tracking. For v1, the target users are in the same US household using USD. | Hardcode USD for v1. Add multi-currency only if there is demonstrated demand. |

## Feature Dependencies

```
[User Auth & Profiles]
    |-- requires --> nothing (foundation)
    |
[Household Creation & Invites]
    |-- requires --> [User Auth & Profiles]
    |
[Expense Tracking]
    |-- requires --> [Household Creation & Invites]
    |
[Balance Tracking / Who Owes Who]
    |-- requires --> [Expense Tracking]
    |
[Debt Simplification Algorithm]
    |-- requires --> [Balance Tracking]
    |
[Venmo Deep Link Settlement]
    |-- requires --> [Balance Tracking] + [User Profiles w/ Venmo username]
    |
[Recurring Expenses]
    |-- requires --> [Expense Tracking]
    |
[Shared Grocery List]
    |-- requires --> [Household Creation & Invites]
    |
[Grocery Cost Auto-Splitting]
    |-- requires --> [Shared Grocery List] + [Expense Tracking]
    |
[Chore Assignment & Tracking]
    |-- requires --> [Household Creation & Invites]
    |
[Chore Rotation]
    |-- requires --> [Chore Assignment & Tracking]
    |
[Shared Calendar]
    |-- requires --> [Household Creation & Invites]
    |   |-- enhances --> [Recurring Expenses] (show due dates)
    |   |-- enhances --> [Chore Rotation] (show chore schedule)
    |
[Onboarding Quiz]
    |-- requires --> [User Auth & Profiles]
    |-- configures --> [Modular Feature System]
    |
[Modular Feature System]
    |-- enhances --> all feature modules (controls visibility)
    |
[Activity Feed]
    |-- requires --> [Household Creation & Invites]
    |-- enhances --> all feature modules (logs all actions)
    |
[Push Notifications]
    |-- requires --> [User Auth & Profiles]
    |-- enhances --> all feature modules (alerts for everything)
```

### Dependency Notes

- **Everything requires Household Creation**, which requires Auth. This is the critical path -- nothing works until users can create/join a household.
- **Balance Tracking requires Expense Tracking**: Balances are derived from expenses. You cannot show "who owes whom" without logged expenses.
- **Venmo settlement requires Balance Tracking + Venmo usernames in profiles**: Both must exist before the one-tap pay flow works.
- **Grocery Cost Auto-Splitting bridges two modules**: This is the first cross-module feature and should be built after both modules are independently stable.
- **Onboarding Quiz configures the Modular Feature System**: The quiz must be built alongside the module toggle system. Building one without the other has no value.
- **Calendar enhances but doesn't block other features**: Calendar is an additive layer that can be built independently and connected to recurring expenses and chore schedules later.
- **Activity Feed and Push Notifications are horizontal concerns**: They touch every module but can be wired in incrementally. Start with expense notifications, then add grocery and chore notifications.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the core loop of "log expense, see balance, settle up."

- [ ] **User authentication** -- Sign up / sign in with email or OAuth
- [ ] **User profiles with Venmo username** -- Foundation for settlement
- [ ] **Household creation and invite codes** -- Must support at least 2-6 members
- [ ] **Add expenses with equal splitting** -- The core action
- [ ] **Balance tracking dashboard** -- The core payoff ("you owe Jordan $23.50")
- [ ] **Settle up with Venmo deep link** -- One-tap request/pay via Venmo
- [ ] **Expense history** -- Scrollable list of past expenses
- [ ] **Push notifications for new expenses** -- Keep the household informed
- [ ] **Onboarding quiz (simplified)** -- Even 2-3 questions to set up enabled modules

### Add After Validation (v1.x)

Features to add once the expense-splitting core is proven and stable.

- [ ] **Recurring expenses** -- Add once users complain about re-entering rent monthly
- [ ] **Shared grocery list** -- Second most-requested roommate feature after expenses
- [ ] **Grocery cost auto-splitting** -- Bridge grocery and expense modules
- [ ] **Chore assignment and tracking** -- Third pillar of household management
- [ ] **Chore rotation** -- Add once basic chore tracking proves useful
- [ ] **Activity feed** -- Increases household awareness
- [ ] **Debt simplification algorithm** -- Optimization for 3+ person households (less critical for 2 people)

### Future Consideration (v2+)

Features to defer until the app proves its value.

- [ ] **Shared household calendar** -- Nice to have but Google Calendar already exists; build only if users request it
- [ ] **Modular feature system (full implementation)** -- v1 can use simple tab visibility; full module system with per-module settings is v2
- [ ] **Offline support with sync** -- Only if users report data loss issues
- [ ] **Custom split percentages** -- For households where one person pays more rent
- [ ] **Expense categories and spending insights** -- Analytics layer on top of expense data
- [ ] **Multiple households per user** -- For users in more than one living situation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User auth & profiles | HIGH | MEDIUM | P1 |
| Household creation & invites | HIGH | MEDIUM | P1 |
| Add & track expenses | HIGH | MEDIUM | P1 |
| Balance tracking dashboard | HIGH | MEDIUM | P1 |
| Venmo deep link settlement | HIGH | LOW | P1 |
| Expense history | MEDIUM | LOW | P1 |
| Push notifications | HIGH | MEDIUM | P1 |
| Onboarding quiz (basic) | MEDIUM | LOW | P1 |
| Recurring expenses | HIGH | MEDIUM | P2 |
| Shared grocery list | HIGH | MEDIUM | P2 |
| Grocery cost auto-splitting | MEDIUM | MEDIUM | P2 |
| Chore assignment & tracking | MEDIUM | MEDIUM | P2 |
| Chore rotation | MEDIUM | MEDIUM | P2 |
| Activity feed | LOW | LOW | P2 |
| Debt simplification | MEDIUM | MEDIUM | P2 |
| Shared calendar | MEDIUM | HIGH | P3 |
| Full modular system | MEDIUM | HIGH | P3 |
| Offline support | LOW | HIGH | P3 |
| Custom split percentages | LOW | LOW | P3 |
| Expense categories/insights | LOW | MEDIUM | P3 |
| Multiple households | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- the expense splitting core loop
- P2: Should have, add in v1.x -- completes the "household management" promise
- P3: Nice to have, future consideration -- polish and scale features

## Competitor Feature Analysis

| Feature | Splitwise | Flatastic | Dwell | OurHome | RoomY Approach |
|---------|-----------|-----------|-------|---------|-------------------|
| Expense tracking | Core feature, very mature | Basic, secondary to chores | Yes, with comments | No | Core feature with streamlined UX |
| Splitting methods | Equal, uneven, percentage, itemized | Equal only | Equal | N/A | Equal for v1; custom percentages in v2 |
| Debt simplification | Yes (network flow algorithm) | No | No | No | Add in v1.x; greedy algorithm is sufficient for small groups |
| Recurring expenses | Yes | Yes | No | No | P2, auto-create with notification |
| Venmo/PayPal integration | Yes (premium emphasis) | No | No | No | Core feature, free, one-tap from balance screen |
| Shared grocery list | No | Yes, with real-time sync | Yes (shared lists) | Yes | P2, with auto-cost-splitting bridge |
| Chore management | No | Yes, with points | Yes, with scheduling | Yes, with gamification | P2, rotation-based without gamification |
| Shared calendar | No | No | No (whiteboard instead) | Yes | P3 |
| Activity feed | Limited | No | Yes (activity log) | No | P2, unified household log |
| In-app chat | No | Yes ("Shouts") | Comments on items | Yes | No -- comments on items only |
| Onboarding quiz | No | No | No | No | P1, the key differentiator |
| Modular features | No | No | No | No | P1 (basic), P3 (full) |
| Offline support | No | Yes | Unknown | Unknown | P3 |
| Receipt scanning | Yes (premium) | No | No | No | No -- anti-feature for v1 |
| Free tier limits | 5 expenses/day, ads, delays | Ads in free tier | Fully free | Fully free | Fully free (personal use) |

### Key Competitive Insights

1. **Splitwise owns expense splitting but is antagonizing users** with daily limits, ads, and paywalls. This creates an opening for a free, focused alternative.
2. **No competitor combines expenses + groceries + chores with modular opt-in.** They either do expenses (Splitwise, Tricount) or household management (Flatastic, OurHome) or try to do everything with no customization (Dwell).
3. **Venmo deep links are underused.** Splitwise buries payment links; most household apps ignore payment integration entirely. Making Venmo settlement a first-class, one-tap action is a genuine differentiator.
4. **The onboarding quiz is unique.** No competitor personalizes the feature set based on household needs. This is RoomY's most novel UX concept.
5. **Gamification is a trap.** OurHome and Nipto use points, but adult roommates find it patronizing. Contribution visibility (transparent history) is more effective.

## Sources

- [Splitwise](https://www.splitwise.com/) -- Industry standard for expense splitting (MEDIUM confidence, multiple corroborating reviews)
- [Flatastic](https://play.google.com/store/apps/details?id=com.flatastic.app) -- All-in-one household app with chores, expenses, grocery lists (MEDIUM confidence)
- [Dwell](https://heydwell.com/) -- Free roommate organizer with expenses, chores, shared lists, activity log (MEDIUM confidence)
- [OurHome](http://ourhomeapp.com/) -- Family/roommate task management with gamification (MEDIUM confidence)
- [Flatify](https://flatify-app.com/en/) -- Chore-focused household management (MEDIUM confidence)
- [SplitPal](https://splitpal.io/) -- Expense splitting with receipt scanning (MEDIUM confidence)
- [Venmo Deep Linking Documentation](https://venmo.com/paymentlinks/) -- Official Venmo payment links API (HIGH confidence)
- [Venmo Deeplinking Blog Post](https://blog.alexbeals.com/posts/venmo-deeplinking) -- Detailed deep link URL scheme documentation (MEDIUM confidence)
- [Splitwise Debt Simplification Algorithm](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688) -- Network flow approach to minimizing transactions (MEDIUM confidence)
- [NNGroup Mobile Onboarding Patterns](https://www.nngroup.com/articles/mobile-app-onboarding/) -- Authoritative UX research on onboarding (HIGH confidence)
- [Splitwise Alternatives Comparison](https://partytab.app/blog/best-splitwise-alternatives) -- Documents Splitwise free tier limitations driving user churn (MEDIUM confidence)
- [Cashinator](https://www.cashinator.net/flatshare-expense-tracker/) -- Roommate-specific expense tracker (LOW confidence, single source)

---
*Feature research for: Roommate household management (RoomY)*
*Researched: 2026-03-10*
