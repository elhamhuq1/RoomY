# Project Research Summary

**Project:** RoomY — Roommate Household Management App
**Domain:** Mobile app for expense splitting, shared grocery lists, chore tracking, and household coordination
**Researched:** 2026-03-10
**Confidence:** HIGH (stack, architecture), MEDIUM-HIGH (features, pitfalls)

## Executive Summary

RoomY is a React Native mobile app targeting the well-understood "household management" category — but it carves out a clear niche: modular, opt-in features personalized through an onboarding quiz, with Venmo deep-link settlement as a first-class citizen. The dominant competitor (Splitwise) is losing users through aggressive monetization; all-in-one competitors (Flatastic, OurHome) overwhelm users with undifferentiated feature sets. The recommended approach is Expo SDK 55 + Supabase, a stack with official integration guides, relational data modeling that perfectly fits the expense/balance domain, and free tiers sufficient for personal use. Two developers on Linux and macOS can collaborate effectively with EAS Build handling cross-platform iOS/Android builds.

The architectural pattern is a layered feature-module system: thin Expo Router route files import from self-contained feature modules (expenses, groceries, chores, household), which expose custom hooks wrapping TanStack Query and Supabase. Zustand handles ephemeral UI state. Supabase Realtime provides live sync for collaborative tables (grocery lists, chore boards) without additional infrastructure. The data model must treat expense records as an immutable ledger — balances are always derived, never stored as mutable fields — and Row Level Security must be enabled on every table from day one. These are not refactorable decisions; getting them wrong means a rewrite.

The top risks are: (1) Venmo's deep link API is undocumented and fragile — design the settlement flow as "fire and forget" with manual payment confirmation from day one; (2) concurrent balance writes without transactional integrity will produce drifting totals that destroy user trust; (3) RLS misconfiguration will expose all households' financial data (CVE-2025-48757 affected 170+ apps in 2025). None of these are difficult to prevent if addressed in Phase 1. The safest build order is: Foundation (auth + schema + RLS) → Core (expenses + balances + Venmo settlement) → Secondary features in parallel (groceries, chores) → Polish (notifications, onboarding quiz, calendar).

## Key Findings

### Recommended Stack

The stack is fully determined with high confidence. Expo SDK 55 (React Native 0.83, React 19.2) is the only viable choice for a cross-platform app where one developer is on Linux — EAS Build enables cloud iOS compilation without a Mac. Supabase is the ideal backend: PostgreSQL's relational model matches expenses/balances/members perfectly, and the official Expo integration guide covers auth, realtime, and storage. NativeWind v5 (preview) is the one medium-confidence choice — it is the correct forward path for React Native 0.81+ but has not reached stable release; a fallback plan to v4 or vanilla StyleSheet exists.

**Core technologies:**
- Expo SDK 55 + React Native 0.83: Cross-platform mobile framework — mandatory for Linux/macOS two-dev team via EAS Build
- Supabase (PostgreSQL + Auth + Realtime + Edge Functions): Full backend — relational model fits expense/balance domain; free tier covers personal use
- Expo Router v7: File-based navigation — bundled with SDK 55, provides automatic deep linking for Venmo and Supabase auth callbacks
- TanStack Query v5: Server state management — caching, optimistic updates, and background refetch for all Supabase data
- Zustand v5: Client state — 1KB store for UI concerns (onboarding quiz state, active household, filter preferences)
- NativeWind v5 (preview): Tailwind-based styling — zero runtime cost, both devs likely know Tailwind from web
- React Hook Form v7 + Zod v4: Forms and validation — minimal re-renders, TypeScript-first schema validation
- expo-secure-store: Encrypted auth token storage — required; AsyncStorage in plaintext is a security vulnerability
- expo-notifications: Push notifications — requires development build, not Expo Go
- expo-linking: Deep linking — critical for Venmo payment requests and Supabase auth email callbacks

**Critical version notes:** Node.js 22 LTS required (SDK 55 requires ≥20.19.4). Do not use NativeWind v4 stable (incompatible with Reanimated v4 + New Architecture). Do not use react-test-renderer (deprecated, broken with React 19.2).

### Expected Features

The feature research analyzed 10+ competitors with MEDIUM-HIGH confidence. Splitwise sets the bar for expense splitting; Flatastic/OurHome/Dwell cover household management. No competitor combines all three modules with a modular opt-in system.

**Must have (table stakes) — v1:**
- User authentication and profiles (with Venmo username field) — every multi-user app requires identity
- Household creation and invite system (6-digit code or deep link) — nothing works without this
- Add and track shared expenses (who paid, how much, for what) — the core promise
- Balance tracking dashboard ("you owe Jordan $23.50") — the core payoff
- Equal expense splitting — the 80% case for roommates
- Settle up with Venmo deep link — one-tap request from balance screen, free, no competitor does it well
- Expense history — scrollable, filterable log
- Push notifications for new expenses — apps without push lose 77% of users in 3 days
- Onboarding quiz (3-4 questions) — RoomY's most unique UX concept; no competitor does this

**Should have (competitive) — v1.x:**
- Recurring expenses — users manually re-enter rent twice before expecting automation
- Shared grocery list with real-time sync — second most-requested household feature
- Grocery cost auto-splitting — bridges grocery and expense modules; no competitor does this
- Chore assignment and rotation with effort weighting — third pillar of household management
- Activity feed / household log — transparent accountability without social features
- Debt simplification algorithm — optimization for 3+ person households

**Defer (v2+):**
- Shared household calendar — Google Calendar already exists; build only if requested
- Full modular feature system with per-module settings — v1 uses simple tab visibility
- Offline-first sync — complex conflict resolution; personal use app is always on home wifi
- Custom split percentages — needed for households with unequal rent; low priority for v1
- Multiple households per user — common need but adds data model complexity

**Anti-features (explicitly excluded):** Built-in payment processing (Stripe), receipt OCR, income-based splitting, in-app chat, gamification/points, AI suggestions, multi-currency. See FEATURES.md for rationale on each.

### Architecture Approach

The architecture is a clean three-tier system: Expo mobile client → Supabase backend, with no intermediate server to maintain. The client is organized into thin Expo Router route files that compose self-contained feature modules (expenses, groceries, chores, household/auth). Each module owns its hooks, types, components, and utils. A single Supabase client singleton in `lib/supabase.ts` is the only connection point to the backend. TanStack Query is the exclusive owner of server state; Zustand handles client-only ephemeral state. This separation is non-negotiable — mixing them creates untestable, inconsistent state.

**Major components:**
1. Expo Router (app/) — Navigation skeleton; thin route files only, no business logic
2. Feature Modules (features/) — Self-contained per-feature logic: hooks wrapping TanStack Query + Supabase, TypeScript types, utility functions
3. Supabase Client (lib/supabase.ts) — Single client instance; Auth + PostgreSQL + Realtime + Edge Functions
4. TanStack Query — Server state cache; query keys namespaced by feature + householdId; mutations invalidate related queries
5. Zustand Stores (stores/) — Ephemeral client state: onboarding quiz progress, UI toggles, active household selection
6. PostgreSQL + RLS — Data layer; Row Level Security enforces household isolation at the database level regardless of client bugs
7. Supabase Realtime — WebSocket subscriptions on grocery_items, expenses, chores tables only (not every table)
8. Supabase Edge Functions — Server-side logic: chore rotation cron, push notification dispatch, invite code management

**Key patterns:** Feature hook as service layer (screens call hooks, never supabase directly); household-scoped RLS on every shared table; realtime subscriptions invalidate TanStack Query cache (not update it directly); ledger-based balance computation (never mutable running totals).

### Critical Pitfalls

1. **Mutable balance fields (data model)** — Never store computed balances as a DB field. Derive them from an immutable expense/payment ledger using a PostgreSQL view or function. Race conditions between concurrent writes will corrupt balances and destroy user trust. Address in Phase 1; getting this wrong means a rewrite. Prevention: design `expense_splits` as append-only; use Supabase RPC for all balance-touching operations.

2. **RLS disabled or misconfigured** — Supabase disables RLS by default. One misconfigured table exposes all households' financial data (CVE-2025-48757 hit 170+ apps in 2025). Prevention: enable RLS on every table immediately on creation; never use the service_role key in client code; write RLS policy tests before application code; run `SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity` as a pre-deploy check.

3. **Venmo deep link fragility** — Venmo's URL scheme is undocumented and has broken without warning. Prevention: design the payment flow as "fire and forget" — the deep link is a convenience shortcut only. Never mark a debt as paid automatically on link tap. Always require manual confirmation from both parties. Build a "copy payment details" fallback. Abstract behind a payment interface to enable swapping Venmo for Zelle/Cash App.

4. **Roommate departure corrupts historical data** — Hard-deleting a user from a household orphans their expense records and breaks balance calculations. Prevention: soft-delete only (set `left_at` timestamp on `household_members`); enforce settlement before departure; foreign keys in expense records point to `auth.users` (never deleted), not the membership record. Design this into the schema in Phase 1.

5. **Chore fairness: mathematically equal but perceived unfair** — Round-robin by task count ignores that cleaning a bathroom takes 10x longer than taking out trash. Build effort weighting from the start; do not plan to add it later. Show a fairness dashboard (effort points per person per week/month). Allow chore swaps. Fairness is a longitudinal property — it cannot be evaluated per-assignment.

## Implications for Roadmap

Based on the dependency chain in FEATURES.md and the build order in ARCHITECTURE.md, a 4-phase structure is the right approach. The architecture research explicitly documents this ordering; it is not just a suggestion.

### Phase 1: Foundation

**Rationale:** Auth + household membership + secure data model are strict prerequisites for every other feature. RLS policies, the ledger-based balance schema, and soft-delete membership must be built here or retrofitted painfully later. The onboarding quiz (even a simplified version) belongs here to establish the modular feature system pattern.

**Delivers:** A working app where users can sign up, create or join a household via invite code, and see an empty dashboard. This is the "skeleton" every subsequent phase builds on.

**Addresses (from FEATURES.md):** User authentication and profiles; household creation and invite system; onboarding quiz (3-question version enabling expense/grocery/chore modules)

**Avoids (from PITFALLS.md):** RLS misconfiguration (enable on all tables now); roommate departure data corruption (soft-delete schema from day one); invite link security (48-hour expiry, single-use tokens); balance inconsistency (design immutable ledger schema before writing a single expense)

**Research flag:** Standard patterns — official Supabase + Expo auth guides cover this completely. Skip research-phase for this phase.

### Phase 2: Core Value (Expense Splitting + Settlement)

**Rationale:** The primary value proposition is "log expense, see balance, settle up via Venmo." This must work flawlessly before secondary features (groceries, chores) are built. Venmo deep link integration is the key differentiator and must be tested on physical devices (iOS and Android) early.

**Delivers:** The expense splitting core loop: add expense → equal split computed → balance dashboard updated → one-tap Venmo settlement request. Also includes expense history, recurring expenses, and push notifications for new expenses.

**Addresses (from FEATURES.md):** Add and track shared expenses; balance tracking dashboard; equal expense splitting; settle up with Venmo deep link; expense history; push notifications for new expenses; recurring expenses

**Uses (from STACK.md):** TanStack Query mutations with optimistic updates; Supabase RPC for balance computation; expo-linking for Venmo deep links; expo-notifications (development build required); Supabase Edge Functions for notification dispatch

**Avoids (from PITFALLS.md):** Venmo deep link fragility (manual confirmation required, fallback UI); balance race conditions (Supabase RPC for atomic writes); debt simplification confusion (simple net-balance only in this phase, no graph simplification yet); concurrent balance write tests

**Research flag:** Venmo deep link integration needs device testing early. Not well-documented officially (LOW confidence source). Plan to test on physical iOS and Android in this phase and verify URL format before building the full settlement UI around it.

### Phase 3: Secondary Features (Groceries + Chores)

**Rationale:** These two features are independent of each other and can be built in parallel by two developers. Both depend on Phase 1 (household membership) but not on Phase 2 (expenses). The grocery cost auto-splitting bridge feature connects Phase 2 and Phase 3 and should be the last item in this phase.

**Delivers:** Shared grocery list with real-time sync; chore assignment with effort-weighted rotation; grocery cost auto-splitting; activity feed; debt simplification (optional view); chore contribution dashboard.

**Addresses (from FEATURES.md):** Shared grocery list; grocery cost auto-splitting; chore assignment and tracking; chore rotation; activity feed; debt simplification

**Implements (from ARCHITECTURE.md):** Supabase Realtime subscriptions on `grocery_items` and `chores` tables; chore rotation Edge Function (cron-triggered); cross-module invalidation (grocery purchase triggers expense query invalidation)

**Avoids (from PITFALLS.md):** Chore fairness perception (build effort weighting now, not later); real-time subscription leaks (unsubscribe in useEffect cleanup); N+1 query on grocery list (eager-load household member profiles once)

**Research flag:** Chore rotation scheduling via Supabase Edge Functions cron syntax is not the most-documented pattern. May benefit from a targeted research spike on Edge Function scheduling.

### Phase 4: Polish and Completeness

**Rationale:** These features increase engagement and polish but have no blocking dependencies on each other. They should only be built after Phase 2 and 3 are validated and stable.

**Delivers:** Full push notification coverage across all modules; shared household calendar integrated with recurring expenses and chore schedules; custom expense split percentages; multiple household support; full modular feature system with per-module settings.

**Addresses (from FEATURES.md v2+):** Shared household calendar; full modular feature system; custom split percentages; multiple households per user

**Avoids (from PITFALLS.md):** Notification spam (per-category notification settings); onboarding abandonment (track quiz completion funnel, add skip option with sensible defaults)

**Research flag:** Multiple households per user requires revisiting the RLS policy design (policies currently assume one active household). This is a non-trivial schema change. Flag for dedicated research before implementation.

### Phase Ordering Rationale

- **Everything depends on household membership**, which depends on auth. The dependency graph in FEATURES.md makes Phase 1 non-negotiable.
- **Expenses must precede the grocery/chore bridge** — grocery cost auto-splitting requires both the grocery module and the expense module to be stable.
- **Groceries and chores are independent** — two developers can build them in parallel in Phase 3, which is efficient.
- **Notifications are deliberately in Phase 2** (basic) and Phase 4 (comprehensive) — basic expense notifications are table stakes; full notification coverage is polish. This avoids deferring notifications entirely while not blocking the expense core on notification infrastructure.
- **The onboarding quiz is in Phase 1** (simplified) so the modular tab visibility pattern is established early, even if full per-module settings come in Phase 4.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Venmo deep links):** Undocumented API with LOW-confidence sources. Test on physical devices before building the full settlement UI. Prepare fallback "copy payment details" UI from the start.
- **Phase 3 (Edge Functions cron for chore rotation):** Supabase Edge Functions with scheduled cron triggers are less-documented than standard query patterns. A spike may be warranted.
- **Phase 4 (multi-household RLS):** Extending RLS policies to support users in multiple households changes the foundational security model. Research before implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (auth + schema + RLS):** Official Expo + Supabase guides cover this completely. HIGH-confidence sources for every component.
- **Phase 2 (expense splitting core):** TanStack Query mutations with Supabase RPC is a well-documented pattern. Debt simplification algorithm is well-understood for small groups.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified via official docs and npm. Only NativeWind v5 is MEDIUM (preview status). Fallback documented. |
| Features | MEDIUM-HIGH | Competitor analysis is thorough (10+ apps). Feature dependency map is well-reasoned. Some competitor confidence is MEDIUM (app store reviews, not official docs). |
| Architecture | HIGH | Official Expo + Supabase guides confirm every major pattern. RLS, realtime subscription, and feature-hook patterns are well-documented with multiple corroborating sources. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (RLS, balance consistency) backed by HIGH-confidence sources including a real CVE. Venmo deep link pitfall is LOW-confidence due to undocumented API. Chore fairness backed by academic source. |

**Overall confidence:** HIGH

### Gaps to Address

- **Venmo deep link stability:** The URL scheme works as of 2026-03-10 per community sources but Venmo can break it without notice. Validate on physical devices at the start of Phase 2. Build the abstraction layer so swapping to Zelle or Cash App deep links requires minimal code change.
- **NativeWind v5 stability:** Preview status means possible breaking changes or edge cases. Monitor the NativeWind GitHub releases during Phase 1. If issues arise during project setup, fall back to NativeWind v4.2.2 with the documented Reanimated v4 patch.
- **Edge Function cron availability:** Supabase Edge Function scheduled crons are available on Pro tier. Verify free tier cron access before designing chore rotation around it; have a fallback (client-triggered rotation check on app launch) ready.
- **Debt simplification UX:** The greedy net-balance algorithm is sufficient for 2-6 people, but how to explain cross-party settlements ("you owe Sarah $30 because...") needs UX design before implementation. Users find unexplained simplification confusing.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — SDK 55 features, React Native 0.83, Node requirements
- [Expo Router v55 Blog Post](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web) — Router v7 features, native tabs
- [Expo Documentation: Using Supabase](https://docs.expo.dev/guides/using-supabase/) — Official integration guide
- [Supabase Docs: Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — Auth + client setup
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policies; CVE-2025-48757 documentation
- [Expo Documentation: Push Notifications](https://docs.expo.dev/push-notifications/push-notifications-setup/) — Notification requirements (dev build required)
- [Expo Documentation: SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — Encrypted storage API
- [NativeWind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) — v5 preview install steps
- [TanStack Query React Native Docs](https://tanstack.com/query/v5/docs/react/react-native) — RN-specific setup
- [Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) — Official project structure guide (January 2026)

### Secondary (MEDIUM confidence)
- [Splitwise](https://www.splitwise.com/) — Feature baseline and competitive bar for expense splitting
- [Flatastic](https://play.google.com/store/apps/details?id=com.flatastic.app), [Dwell](https://heydwell.com/), [OurHome](http://ourhomeapp.com/) — Competitor feature analysis
- [Splitwise Debt Simplification Algorithm (Medium)](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688) — NP-completeness of debt simplification; greedy net-balance sufficiency for small groups
- [TanStack Query with Supabase (Makerkit)](https://makerkit.dev/blog/saas/supabase-react-query) — Community guide verified against TanStack docs
- [Multi-Tenant RLS on Supabase (Antstack)](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) — Household-scoped RLS policy patterns
- [Splitwise Alternatives Comparison (PartyTab)](https://partytab.app/blog/best-splitwise-alternatives) — Splitwise free tier limitations driving user churn
- [Schedules Need to be Fair Over Time (Springer)](https://link.springer.com/chapter/10.1007/978-3-032-11108-1_3) — Academic source: fairness is a longitudinal property
- [Mobile App Churn Rate Benchmarks 2025 (UXCam)](https://uxcam.com/blog/mobile-app-churn-rate/) — 120-second onboarding threshold, 77% churn without push notifications

### Tertiary (LOW confidence)
- [Venmo Deep Linking (Alex Beals)](https://blog.alexbeals.com/posts/venmo-deeplinking) — URL scheme format; community-discovered, undocumented API. Validate on real devices before relying on it.
- [Venmo Payment Links](https://venmo.com/paymentlinks/) — Semi-official web link format; more stable than mobile deep links

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
