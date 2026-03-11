# Pitfalls Research

**Domain:** Roommate household management app (expense splitting, chores, grocery lists)
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (domain pitfalls well-documented via competitor user feedback and system design literature; Venmo deep link specifics are LOW confidence due to undocumented API)

## Critical Pitfalls

### Pitfall 1: Venmo Deep Links Are Undocumented and Fragile

**What goes wrong:**
Venmo has no official public deep link API. The `venmo://paycharge?txn=pay&recipients=...&amount=...&note=...` scheme was reverse-engineered from the mobile app. Venmo has broken these links before without warning (reported broken in late 2024). There is no callback or webhook to confirm whether the user actually completed the payment. The app will open Venmo but has zero visibility into what happens next.

**Why it happens:**
After PayPal acquired Venmo, they stopped onboarding new API customers. Deep links are an undocumented internal feature, not a supported integration point. Developers treat them as a stable API when they are not.

**How to avoid:**
- Design the payment flow as "fire and forget" from day one. The deep link is a convenience shortcut, not a source of truth.
- Never mark a debt as "paid" automatically when the deep link is tapped. Instead, require manual confirmation ("I paid this" / "I received this") from both parties.
- Store the Venmo username per user, but validate the format client-side only (no server-side Venmo API to call).
- Build a fallback for when deep links break: show the amount owed and recipient username so the user can manually open Venmo. Display a "copy payment details" button.
- Abstract the payment link behind an interface so you can swap Venmo for another provider later (Zelle, Cash App) without rewriting the settlement flow.

**Warning signs:**
- Users report "Venmo opens but the amount/note is empty" -- the URL format changed.
- iOS and Android behave differently with the same deep link.
- Linking works in development but fails in production builds (Expo Linking configuration issue).

**Phase to address:**
Phase 1 (Foundation) -- define the payment abstraction layer. Phase 2 (Expense splitting) -- implement with manual confirmation as the default flow.

---

### Pitfall 2: Balance Calculations Become Inconsistent Without Transactional Integrity

**What goes wrong:**
Two roommates add expenses at the same time. Both read the current balance, compute their update, and write back. One update overwrites the other. Over time, running totals drift from the sum of individual transactions. Users see different balances on different devices. Trust in the app evaporates -- the core value proposition ("see exactly who owes what") is destroyed.

**Why it happens:**
Developers compute balances client-side or use non-transactional database writes. With Supabase (likely backend), using individual `update` calls instead of database-level transactions or computed views leaves a window for race conditions. The "last write wins" default in most real-time databases is incompatible with financial data.

**How to avoid:**
- Never store running balances as a mutable field. Instead, derive balances by summing the immutable expense/payment ledger. Use a PostgreSQL view or function: `SELECT SUM(amount) FROM transactions WHERE ...`
- Treat the expense ledger as append-only. Edits create a new reversal + correction entry, not an in-place mutation. This is the double-entry bookkeeping principle.
- If you must cache balances for performance, use database triggers or materialized views that recompute from the ledger, never client-side aggregation as the source of truth.
- Use Supabase RPC (database functions) for any operation that touches balances, so the computation happens atomically inside PostgreSQL.

**Warning signs:**
- Two users adding expenses simultaneously produces incorrect totals.
- Balance displayed differs from manually summing the transaction list.
- "Settle up" leaves a non-zero residual balance.

**Phase to address:**
Phase 1 (Foundation) -- design the ledger-based data model. This is the most important architectural decision in the entire project. Getting this wrong means a rewrite.

---

### Pitfall 3: Row-Level Security Disabled or Misconfigured on Supabase

**What goes wrong:**
RLS is disabled by default on new Supabase tables. Without it, any authenticated user can read and modify any household's data. In January 2025, 170+ apps built with AI tools were found to have fully exposed Supabase databases (CVE-2025-48757) because RLS was never enabled. Even when enabled, policy misconfigurations can leak data across households or block legitimate operations with cryptic "new row violates row-level security policy" errors.

**Why it happens:**
RLS is opt-in, not opt-out. During rapid development, tables get created, the app works in testing (because the dev is the only user), and nobody notices that every user can see every household's expenses. The `service_role` key gets accidentally used in client code, bypassing RLS entirely.

**How to avoid:**
- Enable RLS on every table immediately upon creation. No exceptions.
- Use a household membership check in every policy: `auth.uid() IN (SELECT user_id FROM household_members WHERE household_id = target.household_id)`.
- Never use the `service_role` key in React Native client code. Use the `anon` key with RLS policies.
- Write RLS policy tests before writing application code. Test that User A cannot read User B's household data.
- Create a pre-deployment checklist item: "Run `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;`" to find tables without RLS.

**Warning signs:**
- App works perfectly in single-user testing but shows other households' data when a second test user is added.
- Supabase dashboard shows RLS as "Disabled" on any table.
- Using `supabase.from('expenses').select('*')` returns data from all households, not just the current user's.

**Phase to address:**
Phase 1 (Foundation) -- RLS policies must be the first thing built after the schema. Every subsequent phase must maintain RLS as a hard invariant.

---

### Pitfall 4: Debt Simplification Algorithm Surprises Users

**What goes wrong:**
In a 3+ person household, naive pairwise splitting creates unnecessary transactions. The "optimal" solution (minimize total number of transactions via graph-based debt simplification) creates payments between people who never directly transacted, confusing users. "Why do I owe Sarah $30? I never bought anything with her." Finding the true minimum number of transactions is NP-complete, meaning naive brute-force solutions will not scale and approximations may not match user expectations.

**Why it happens:**
Developers either skip simplification entirely (leading to a tangled web of micro-debts) or implement maximum-flow simplification without explaining it to users. The mathematical optimum and the socially intuitive result are different things.

**How to avoid:**
- For a small household (2-4 people), use the simple net-balance approach: compute each person's net balance (total credits minus total debts), then match the biggest debtor to the biggest creditor iteratively. This is O(n log n) and produces near-optimal results for small groups.
- Show users both views: "detailed" (every individual debt) and "simplified" (net balances). Let them toggle.
- Always show the derivation: "You owe Sarah $30 because: you owe the household $50 total, and Sarah is owed $30 by the household."
- Do NOT introduce debt simplification in MVP. Start with simple pairwise tracking. Add simplification as a later enhancement when users have more than 2 roommates and request it.

**Warning signs:**
- Users ask "why do I owe X to someone I didn't share an expense with?"
- The settle-up flow shows a confusing web of arrows between all members.
- Edge cases: what happens when simplification produces a $0.01 rounding discrepancy?

**Phase to address:**
Phase 2 (Expense splitting) -- implement simple net-balance only. Phase 3+ -- add optional simplification view with clear explanations.

---

### Pitfall 5: Roommate Departure Corrupts Historical Data

**What goes wrong:**
A roommate moves out. The app either: (a) deletes their account and orphans all their expense records, breaking balance calculations; (b) keeps them as a full member, cluttering active views; or (c) was never designed to handle this, causing crashes or undefined behavior when a household member reference points to a deleted user.

**Why it happens:**
Developers model households as a static list of members and never plan for membership changes. Foreign key constraints on `user_id` in expense tables cause cascading deletes or constraint violations. The data model conflates "current member" with "historical participant."

**How to avoid:**
- Use a `household_members` junction table with `joined_at` and `left_at` timestamps. A member with `left_at IS NOT NULL` is a former member.
- Never hard-delete users from a household. Soft-delete (set `left_at`) preserves referential integrity.
- Before allowing departure, enforce balance settlement: the leaving member's net balance must be zero, or the app must prompt a final settlement.
- Historical views (past expenses) show the departed member's name. Active views (current balances, chore rotation) exclude them.
- Foreign keys in expense records point to the user record (which is never deleted), not the household_members record.

**Warning signs:**
- No `left_at` or `status` field on the household membership table.
- Deleting a test user causes foreign key errors in the expense table.
- The chore rotation crashes or assigns tasks to departed members.

**Phase to address:**
Phase 1 (Foundation) -- the data model must support membership changes from day one. This is not a "nice to have later" feature.

---

### Pitfall 6: Chore Fairness Perceived as Unfair Despite Being Mathematically Correct

**What goes wrong:**
A round-robin chore rotation assigns "clean the bathroom" to the same person every other week, while another person always gets "take out the trash" (a 2-minute task). The rotation is technically fair (equal number of assignments) but perceived as deeply unfair because chore difficulty and time vary wildly. Users stop using the chore feature, and then stop using the app entirely.

**Why it happens:**
Fairness in scheduling is a longitudinal property -- it cannot be captured by a single rotation instance. Developers implement simple round-robin or random assignment without weighting chores by effort. Academic research confirms that treating each scheduling decision in isolation leads to "persistent unfairness" over time.

**How to avoid:**
- Assign effort weights to chores (e.g., "clean bathroom" = 3 points, "take out trash" = 1 point). Rotate to equalize total effort points over time, not just task count.
- Let the household customize weights during onboarding. What feels "hard" is subjective and varies by household.
- Show a fairness dashboard: "This week: Alice 7 points, Bob 5 points. This month: Alice 22, Bob 24." Transparency defuses complaints.
- Allow chore swaps and trades. The system proposes, the humans dispose. Rigid automation breeds resentment.
- Keep chore history so that when someone says "I always clean the bathroom," the app can show the actual data.

**Warning signs:**
- Users manually reassigning chores outside the app.
- Chore completion rates dropping over time.
- Complaints that the system "isn't fair" despite equal assignment counts.

**Phase to address:**
Phase 3 (Chores) -- build with effort weighting from the start. Do not ship simple round-robin and plan to "add weights later" because users will form negative opinions of the feature before the fix ships.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing computed balances as a mutable DB field | Faster reads, simpler queries | Balance drift, race conditions, audit impossibility | Never for financial data |
| Hard-coding Venmo as the only payment option | Faster to ship | Locked in to undocumented API; can't support Zelle/Cash App users | MVP only, if behind an abstraction interface |
| Skipping RLS during prototyping | Faster iteration, fewer "policy violation" errors | Security vulnerability; retrofitting RLS onto existing tables is painful | Never -- enable from day one, even in development |
| Client-side balance computation | Works fine for 1 user testing | Inconsistent balances between devices, no single source of truth | Never |
| Single "household" without multi-household support | Simpler data model | Rewrite needed when any user wants to be in 2 households (common: home + vacation) | MVP only, but design the schema to support it |
| Skipping push notification setup | Avoids iOS/Android config complexity | Chore reminders and expense notifications are table stakes; app feels dead without them | Acceptable in Phase 1, but must be Phase 2 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Venmo deep links | Assuming the link format is stable; marking debts as paid on link tap | Treat as a convenience shortcut only; require manual payment confirmation from both parties; build a fallback "copy details" flow |
| Supabase Realtime | Subscribing to entire tables instead of filtered channels | Subscribe to `household_id`-filtered channels; use RLS to enforce server-side filtering; unsubscribe on component unmount to avoid memory leaks |
| Expo Push Notifications | Testing in Expo Go (notifications do not work there); using simulator | Test on physical devices with development builds; handle token rotation; set up foreground notification handler explicitly |
| Supabase Auth | Storing session tokens insecurely; not handling token refresh | Use `supabase-js` built-in session management with `expo-secure-store`; handle auth state changes reactively |
| Expo Linking (for Venmo) | Not configuring `app.json` scheme properly | Register a custom URL scheme; test deep links in both development and production builds; handle the case where Venmo is not installed |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all household expenses on app launch | Slow startup, high memory use | Paginate expenses; load current month by default, lazy-load history | 200+ expenses (a few months of active use) |
| Real-time subscriptions without cleanup | Memory leaks, phantom updates, battery drain | Unsubscribe in useEffect cleanup; use a subscription manager | After navigating between screens 10+ times |
| Recomputing balances on every render | UI jank, wasted CPU | Use `useMemo` or derive balances in a database view/function; cache results | 50+ transactions with 3+ members |
| Fetching full user profiles for every expense item | N+1 query pattern; slow list rendering | Eager-load household member profiles once; reference from cache | 20+ expenses on screen |
| Unoptimized FlatList for expense/chore lists | Stuttering scroll, high memory | Use `keyExtractor`, `getItemLayout`, `windowSize` tuning; avoid inline arrow functions in `renderItem` | 100+ list items |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS disabled on Supabase tables | Any authenticated user can read/modify any household's financial data | Enable RLS on every table; test with multiple test users in different households |
| Service role key in client bundle | Full database access to anyone who decompiles the app | Only use `anon` key in client code; service role key stays server-side only |
| No validation on expense amounts | Users can input negative amounts to manipulate balances | Validate amounts > 0 server-side in a database function or edge function; client validation alone is insufficient |
| Household invite links without expiry | Old links allow unauthorized people to join a household | Expire invite tokens after 48 hours and single use; require existing member approval for joins |
| Storing Venmo usernames as "payment accounts" | If leaked, enables targeted payment requests from strangers | Venmo usernames are semi-public anyway, but minimize storage; never store Venmo passwords or tokens (you won't have them, but be explicit about this) |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring all roommates to sign up before the first user can do anything | Adoption dies -- one roommate creates an account, can't use the app, gives up before the others join | Let a single user start tracking expenses immediately; add roommates later; show value before requiring group participation |
| Onboarding quiz is too long or confusing | Users abandon before reaching the main app; 120-second onboarding threshold | Keep quiz to 3-4 questions max; allow skipping with sensible defaults; let users change settings later |
| No empty states -- blank screens when no expenses/chores exist | New users feel lost, don't know what to do next | Show contextual prompts: "Add your first shared expense" with a prominent button; use illustrations to make empty states feel intentional |
| Notification spam for every minor event | Users disable all notifications, then miss important ones (rent is due) | Categorize notifications (urgent: bills due; normal: new expense added; low: chore reminder); let users configure per-category |
| Settlement flow requires exact amounts | Roommates often settle with round numbers ("just give me $20"); app shows $19.73 as unsettled | Allow partial settlements and "forgive remaining balance" option; handle rounding gracefully |
| Showing cents when users think in whole dollars | "$47.33" split 3 ways is "$15.78 each" with a penny left over -- who pays it? | Always round in a deterministic way (e.g., first person listed pays the extra penny); document the rounding rule; consider a "round up to nearest dollar" option |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Expense splitting:** Often missing handling for unequal splits (one person had a larger share) -- verify the app supports both equal and custom percentage/amount splits
- [ ] **Recurring expenses:** Often missing handling for amount changes (rent increases) -- verify recurring expenses can be edited without affecting past entries
- [ ] **Chore rotation:** Often missing skip/swap functionality (person is traveling) -- verify a member can skip a turn and the rotation adjusts
- [ ] **Balance display:** Often missing the distinction between "what I owe total" vs "what I owe each person" -- verify both views exist
- [ ] **Household invites:** Often missing the "what if they don't have the app" flow -- verify the invite works via SMS/link for new users
- [ ] **Settlement:** Often missing partial payment support -- verify a user can pay part of what they owe without marking the full debt as settled
- [ ] **Offline behavior:** Often missing graceful degradation -- verify the app shows cached data and queues actions when offline, not just a blank screen or crash
- [ ] **Push notifications:** Often missing foreground handling -- verify notifications display correctly when the app is open, not just when backgrounded
- [ ] **Roommate departure:** Often missing entirely -- verify a member can leave a household and historical data remains intact

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Balance inconsistency (mutable balances drifted) | HIGH | Freeze the app, audit all transactions, recompute balances from the ledger, migrate to derived-balance architecture; communicate to users that balances were corrected |
| RLS not enabled (data exposed) | MEDIUM | Enable RLS immediately; audit access logs; notify affected users; write policies for all tables; run penetration test |
| Venmo deep links break | LOW | Show manual fallback UI (copy username + amount); swap to alternative payment deep link if available; update the URL format |
| Chore unfairness complaints | LOW | Add effort weights retroactively; show historical fairness data to prove or disprove claims; allow manual rebalancing |
| Roommate departure crashes app | MEDIUM | Add soft-delete migration; backfill `left_at` timestamps; fix foreign key references; deploy hotfix |
| Onboarding abandonment (quiz too long) | LOW | A/B test shorter quiz; add "skip for now" option; track completion funnel in analytics |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Balance inconsistency | Phase 1 (Data model) | Write a test: add 10 concurrent expenses, verify final balance equals sum of all amounts |
| RLS misconfiguration | Phase 1 (Auth + schema) | Test with 2 users in different households; User A must not see User B's data |
| Venmo deep link fragility | Phase 2 (Expense settlement) | Test on both iOS and Android physical devices; test with Venmo uninstalled; verify fallback UI appears |
| Debt simplification confusion | Phase 2+ (Expense splitting) | User test with 3+ people; verify explanations appear alongside simplified debts |
| Roommate departure | Phase 1 (Data model) | Remove a test user from a household; verify historical expenses still display correctly and balances recompute |
| Chore unfairness | Phase 3 (Chores) | Run a 4-week simulation; verify effort points are within 10% across all members |
| Onboarding abandonment | Phase 1 (Onboarding) | Track quiz completion rate; verify app is usable if quiz is skipped entirely |
| Push notification failures | Phase 2 (Notifications) | Test on physical device in foreground, background, and killed states; verify token refresh handling |
| Concurrent expense entry | Phase 2 (Expense splitting) | Two devices add expenses simultaneously; verify no data loss or balance drift |
| Invite link security | Phase 1 (Household creation) | Verify expired/used invite links are rejected; verify non-members cannot access household data via old links |

## Sources

- [Venmo Deeplinking - Vox Silva (Alex Beals)](https://blog.alexbeals.com/posts/venmo-deeplinking) -- PRIMARY source for Venmo deep link format and known breakage (LOW confidence due to undocumented API)
- [Venmo Deeplinking - Gabe O'Leary](https://gabeoleary.com/posts/venmo-deeplinking-including-from-web-apps) -- Confirms web vs native deep link differences
- [Algorithm Behind Splitwise's Debt Simplification - Mithun Mohan K (Medium)](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688) -- Debt simplification is NP-complete; net-balance approach is sufficient for small groups
- [Splitwise App Feedback Report - Kimola](https://kimola.com/reports/splitwise-app-feedback-report-uncover-user-insights-google-play-en-144452) -- Real user complaints about UI confusion, unclear balances
- [Explore Why Splitwise Users are Drifting Away - Kimola](https://kimola.com/reports/explore-why-splitwise-users-are-drifting-away-get-insights-now-app-store-in-155789) -- Monetization backlash, feature gating drove user abandonment
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS is disabled by default; CVE-2025-48757 affected 170+ apps (HIGH confidence)
- [Supabase Security 2025 Retro](https://supabase.com/blog/supabase-security-2025-retro) -- Confirms safer defaults and tooling improvements
- [Expo Push Notifications Setup Docs](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- Notifications do not work in Expo Go; physical device required (HIGH confidence)
- [Local-first Architecture with Expo](https://docs.expo.dev/guides/local-first/) -- Expo's official guide to offline-first patterns
- [Offline vs Real-Time Sync - Adalo](https://www.adalo.com/posts/offline-vs-real-time-sync-managing-data-conflicts) -- Last-write-wins is insufficient for financial data
- [Schedules Need to be Fair Over Time - Springer](https://link.springer.com/chapter/10.1007/978-3-032-11108-1_3) -- Academic source: fairness is a longitudinal property, cannot be captured per-instance
- [Mobile App Churn Rate Benchmarks 2025 - UXCam](https://uxcam.com/blog/mobile-app-churn-rate/) -- 25% app abandonment after single use; 120-second onboarding threshold
- [System Design of Splitwise Backend - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/system-design-of-backend-for-expense-sharing-apps-like-splitwise/) -- Concurrent balance updates must be thread-safe

---
*Pitfalls research for: RoomY -- Roommate household management app*
*Researched: 2026-03-10*
