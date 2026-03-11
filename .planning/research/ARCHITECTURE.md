# Architecture Research

**Domain:** Roommate household management (expense splitting, shared lists, chore tracking)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+---------------------------------------------------------------+
|                     Mobile Client (Expo)                      |
|  +----------+  +-----------+  +--------+  +--------+         |
|  | Expenses |  | Groceries |  | Chores |  | Settle |         |
|  +----+-----+  +-----+-----+  +---+----+  +---+----+         |
|       |              |             |           |              |
|  +----+--------------+-------------+-----------+----+         |
|  |              Expo Router (Tabs + Stacks)         |         |
|  +----+--------------+-------------+-----------+----+         |
|       |              |             |           |              |
|  +----+--------------+-------------+-----------+----+         |
|  |          Feature Service Layer (hooks)           |         |
|  |       TanStack Query + Zustand local state       |         |
|  +----+--------------+-------------+-----------+----+         |
|       |              |             |           |              |
|  +----+--------------+-------------+-----------+----+         |
|  |             Supabase Client (SDK)                |         |
|  |     Auth | Database | Realtime | Storage         |         |
|  +--------------------------+-----------------------+         |
+------------------------------|----------------------------+---+
                               |
                    HTTPS / WebSocket
                               |
+------------------------------v--------------------------------+
|                    Supabase Backend                            |
|  +-------------+  +-------------+  +-----------+              |
|  |   Auth      |  |  Realtime   |  |  Storage  |              |
|  |  (JWT +     |  | (WebSocket  |  | (Avatars, |              |
|  |  Sessions)  |  |  channels)  |  |  receipts)|              |
|  +------+------+  +------+------+  +-----+-----+              |
|         |                |               |                    |
|  +------+----------------+---------------+------+             |
|  |              PostgreSQL + RLS                 |             |
|  |                                               |             |
|  |  households | members | expenses | balances   |             |
|  |  groceries  | chores  | rotations | calendar  |             |
|  +-----------------------------------------------+             |
+---------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Expo Router | Screen navigation, tab structure, deep linking | File-based routing with `(tabs)` group and per-feature stacks |
| Feature Modules | Self-contained feature logic (expenses, chores, groceries, calendar) | Each module has its own screens, hooks, types, and components |
| TanStack React Query | Server state management, caching, background sync, optimistic updates | Query/mutation hooks per feature, configured for mobile (staleTime, retry, refetchOnReconnect) |
| Zustand | Lightweight client-only state (UI state, draft forms, onboarding quiz) | Small stores for ephemeral state that does not belong in the database |
| Supabase Client | Database queries, auth, real-time subscriptions, file uploads | Single client instance in `lib/supabase.ts`, used across all feature hooks |
| Supabase Auth | User registration, login, session management, JWT tokens | Email/password auth with session persisted via `expo-sqlite` localStorage |
| Supabase Realtime | Live updates when roommates modify shared data | Channel subscriptions on household-scoped tables (expenses, groceries, chores) |
| PostgreSQL + RLS | Data storage, access control, household data isolation | Row Level Security policies scoped by `household_id` on every shared table |
| Expo Notifications | Chore reminders, expense alerts, settlement nudges | `expo-notifications` for local scheduled reminders + Supabase Edge Functions for push |

## Recommended Project Structure

```
src/
  app/                          # Expo Router file-based routing
    _layout.tsx                 # Root layout (auth gate + providers)
    (auth)/                     # Auth screens group (no tabs)
      _layout.tsx               # Stack layout for auth flow
      sign-in.tsx
      sign-up.tsx
    (tabs)/                     # Main app with bottom tabs
      _layout.tsx               # Tab navigator layout
      index.tsx                 # Home/Dashboard tab
      expenses/                 # Expenses tab + nested stack
        _layout.tsx
        index.tsx               # Expense list
        [id].tsx                # Expense detail
        new.tsx                 # Add expense
      groceries/                # Groceries tab
        _layout.tsx
        index.tsx               # Shared grocery list
      chores/                   # Chores tab
        _layout.tsx
        index.tsx               # Chore board
      settings/                 # Settings tab
        _layout.tsx
        index.tsx               # Household settings, profile
  features/                     # Feature modules (business logic)
    expenses/
      hooks/                    # useExpenses, useAddExpense, useBalances
      types.ts                  # Expense, Split, Balance types
      utils.ts                  # Debt simplification algorithm
      components/               # Feature-specific components
    groceries/
      hooks/
      types.ts
      components/
    chores/
      hooks/
      types.ts
      components/
    household/
      hooks/                    # useHousehold, useMembers, useInvite
      types.ts
      components/
    auth/
      hooks/                    # useAuth, useSession
      types.ts
  components/                   # Shared UI components
    ui/                         # Buttons, inputs, cards, modals
    layout/                     # Screen wrappers, safe area, etc.
  lib/
    supabase.ts                 # Supabase client initialization
    query-client.ts             # TanStack Query client config
    venmo.ts                    # Venmo deep link utility
    notifications.ts            # Notification setup and scheduling
  stores/                       # Zustand stores (client-only state)
    onboarding-store.ts
    ui-store.ts
  types/
    database.ts                 # Supabase generated types
    global.ts                   # App-wide shared types
  constants/
    config.ts                   # App configuration, feature flags
assets/
  images/
  fonts/
```

### Structure Rationale

- **`app/` vs `features/`:** Expo Router requires route files in `app/`, but business logic should not live there. Route files are thin -- they import and compose from `features/`. This prevents vendor lock-in to the routing framework and keeps logic testable.
- **Feature-based organization:** Each feature (expenses, groceries, chores, household) is self-contained with its own hooks, types, and components. Two developers can work on different features without merge conflicts.
- **`lib/`:** Singleton services and configuration. The Supabase client is initialized once and imported everywhere. Keeps infrastructure concerns out of feature code.
- **`stores/`:** Zustand is only for client-side ephemeral state (UI toggles, form drafts, onboarding quiz progress). Server state is managed exclusively by TanStack Query.
- **`types/database.ts`:** Generated from Supabase schema using `supabase gen types typescript`. Single source of truth for database types.

## Architectural Patterns

### Pattern 1: Feature Hook as Service Layer

**What:** Each feature exposes custom hooks that encapsulate Supabase queries wrapped in TanStack Query. Screen components call hooks, never the Supabase client directly.
**When to use:** Every database interaction.
**Trade-offs:** Adds a layer of indirection, but provides caching, optimistic updates, and testability. Worth it for any shared-state app.

**Example:**
```typescript
// features/expenses/hooks/use-expenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Expense } from '../types';

export function useExpenses(householdId: string) {
  return useQuery({
    queryKey: ['expenses', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, splits(*)')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .throwOnError();
      return data as Expense[];
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: NewExpense) => {
      const { data } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()
        .throwOnError();
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenses', variables.household_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['balances', variables.household_id]
      });
    },
  });
}
```

### Pattern 2: Household-Scoped RLS for Data Isolation

**What:** Every shared table includes a `household_id` column. PostgreSQL Row Level Security policies ensure users can only read/write rows belonging to their household. The app never filters by household_id in application code -- the database enforces it.
**When to use:** Every table that contains household data (expenses, groceries, chores, balances, calendar events).
**Trade-offs:** Requires careful RLS policy design upfront. Debugging RLS issues can be opaque. But it provides defense-in-depth security that cannot be bypassed by client bugs.

**Example:**
```sql
-- RLS policy: users can only see expenses from their household
CREATE POLICY "Users can view household expenses"
ON expenses FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid()
  )
);

-- RLS policy: users can only insert expenses into their household
CREATE POLICY "Users can create household expenses"
ON expenses FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid()
  )
);
```

### Pattern 3: Real-Time Subscription for Shared State

**What:** Subscribe to Supabase Realtime channels for tables that roommates modify concurrently (grocery list, expense additions, chore completions). When a roommate adds/changes data, all connected clients receive the update and TanStack Query cache is invalidated.
**When to use:** Grocery lists (high-frequency concurrent edits), expense additions (roommates should see new expenses immediately), chore completions (board should update live).
**Trade-offs:** WebSocket connections consume resources. For a small household (2-6 people), this is negligible. Do NOT subscribe to every table -- only tables where real-time matters.

**Example:**
```typescript
// features/groceries/hooks/use-grocery-realtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useGroceryRealtime(householdId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`groceries:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_items',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['groceries', householdId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}
```

### Pattern 4: Net Balance Ledger (Not Per-Transaction Tracking)

**What:** Maintain a `balances` view or materialized table that computes net balances between all household members. Each expense creates splits (who owes what), and balances are the sum of all unsettled splits. Debt simplification reduces N-way debts to minimum transactions.
**When to use:** The settlement/balance screen and the "Settle Up" flow.
**Trade-offs:** Computing balances on every query is cheap for small households (2-6 people). A materialized view or database function is cleaner than computing in the client. The debt simplification algorithm itself is NP-hard in general, but a greedy approach (match largest debtor with largest creditor) works perfectly for groups under 10 people.

**Example:**
```typescript
// features/expenses/utils.ts - Debt simplification
interface Balance {
  userId: string;
  amount: number; // positive = owed money, negative = owes money
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  const debtors = balances.filter(b => b.amount < 0)
    .sort((a, b) => a.amount - b.amount); // most negative first
  const creditors = balances.filter(b => b.amount > 0)
    .sort((a, b) => b.amount - a.amount); // most positive first

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].amount, creditors[j].amount);
    settlements.push({
      from: debtors[i].userId,
      to: creditors[j].userId,
      amount,
    });
    debtors[i].amount += amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }
  return settlements;
}
```

## Data Flow

### Request Flow (Standard Query)

```
User opens Expenses tab
    |
    v
ExpensesScreen (app/(tabs)/expenses/index.tsx)
    |
    v
useExpenses(householdId)  <-- feature hook
    |
    v
TanStack Query checks cache
    |-- Cache hit + fresh --> Return cached data
    |-- Cache miss or stale:
        |
        v
    supabase.from('expenses').select(...)  <-- Supabase SDK
        |
        v
    HTTPS request to Supabase REST API
        |
        v
    PostgreSQL executes query + RLS filter
        |
        v
    Response flows back up through SDK --> Query cache --> Component re-render
```

### Mutation Flow (Add Expense)

```
User taps "Add Expense" and fills form
    |
    v
useAddExpense().mutate(expenseData)
    |
    v
TanStack Query mutation
    |-- Optimistic update (optional): immediately update cache
    |
    v
supabase.from('expenses').insert(...)
    |
    v
PostgreSQL INSERT + RLS check
    |
    v
onSuccess: invalidate ['expenses'] and ['balances'] queries
    |
    v
Supabase Realtime broadcasts change to other connected roommates
    |
    v
Other roommates' useGroceryRealtime/useExpenseRealtime hooks
    |
    v
Their TanStack Query caches invalidated --> automatic refetch --> UI updates
```

### Real-Time Sync Flow

```
Roommate A adds grocery item on their phone
    |
    v
INSERT into grocery_items table
    |
    v
Supabase Realtime detects change
    |
    v
WebSocket broadcast to channel `groceries:{householdId}`
    |
    v
Roommate B's app receives event via channel subscription
    |
    v
queryClient.invalidateQueries(['groceries', householdId])
    |
    v
TanStack Query refetches grocery list
    |
    v
Roommate B sees updated list (typically < 500ms)
```

### Auth + Household Onboarding Flow

```
New user opens app
    |
    v
Root _layout.tsx checks session via supabase.auth.getSession()
    |-- No session --> Render (auth) group (sign-in / sign-up)
    |-- Has session --> Check household membership
        |-- No household --> Render onboarding (create/join household + quiz)
        |-- Has household --> Render (tabs) group (main app)
```

### Key Data Flows

1. **Expense lifecycle:** User creates expense --> splits computed (equal, percentage, or custom) --> splits stored in `expense_splits` table --> balances recomputed --> settlement screen reflects new debts.
2. **Chore rotation:** Chores assigned on creation --> rotation schedule computed (weekly/biweekly) --> cron or Edge Function advances assignments --> push notification sent to assigned user --> user marks complete --> next rotation occurs.
3. **Settle up via Venmo:** User views balance --> taps "Settle Up" --> app constructs Venmo deep link with amount and note --> Venmo app opens --> user confirms in Venmo --> user returns and marks as settled in RoomY --> balance updated.

## Database Schema (Core Tables)

```
households
  id (uuid, PK)
  name (text)
  invite_code (text, unique)
  created_at (timestamptz)
  created_by (uuid, FK -> auth.users)

household_members
  id (uuid, PK)
  household_id (uuid, FK -> households)
  user_id (uuid, FK -> auth.users)
  display_name (text)
  role (text: 'admin' | 'member')
  joined_at (timestamptz)

expenses
  id (uuid, PK)
  household_id (uuid, FK -> households)
  paid_by (uuid, FK -> auth.users)
  amount (numeric)
  description (text)
  category (text)
  is_recurring (boolean)
  recurrence_rule (jsonb, nullable)
  created_at (timestamptz)

expense_splits
  id (uuid, PK)
  expense_id (uuid, FK -> expenses)
  user_id (uuid, FK -> auth.users)
  amount (numeric)
  is_settled (boolean, default false)

grocery_items
  id (uuid, PK)
  household_id (uuid, FK -> households)
  name (text)
  quantity (text, nullable)
  added_by (uuid, FK -> auth.users)
  is_purchased (boolean, default false)
  purchased_by (uuid, nullable, FK -> auth.users)
  cost (numeric, nullable)
  created_at (timestamptz)

chores
  id (uuid, PK)
  household_id (uuid, FK -> households)
  name (text)
  assigned_to (uuid, FK -> auth.users)
  rotation_type (text: 'none' | 'weekly' | 'biweekly')
  rotation_order (jsonb)
  is_completed (boolean, default false)
  due_date (date, nullable)
  completed_at (timestamptz, nullable)

settlements
  id (uuid, PK)
  household_id (uuid, FK -> households)
  from_user (uuid, FK -> auth.users)
  to_user (uuid, FK -> auth.users)
  amount (numeric)
  method (text: 'venmo' | 'cash' | 'other')
  settled_at (timestamptz)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-2 households (personal use, v1) | Direct Supabase queries from client. No caching layer. Free tier Supabase handles this easily. Real-time on 2-3 tables is fine. |
| 10-50 households | Still fine on Supabase free/pro tier. Add database indexes on `household_id` + `created_at`. Consider a database view for balance computation instead of client-side calculation. |
| 500+ households | Move balance computation to a PostgreSQL function or materialized view. Use Supabase Edge Functions for chore rotation cron jobs. Consider connection pooling (Supavisor). Pagination on expense lists. |

### Scaling Priorities

1. **First bottleneck: Balance computation.** As expense history grows, summing all unsettled splits per household gets slower. Fix: create a PostgreSQL function `get_household_balances(household_id)` that runs the aggregation server-side and returns net balances.
2. **Second bottleneck: Real-time connections.** Each household member maintains a WebSocket connection per subscribed table. Fix: consolidate into a single channel per household that broadcasts all relevant changes, rather than per-table subscriptions.

## Anti-Patterns

### Anti-Pattern 1: Computing Balances in the Client

**What people do:** Fetch all expenses and splits, then run the debt simplification algorithm in JavaScript on every render.
**Why it's wrong:** As expense history grows, this becomes slow and wastes bandwidth fetching all historical data. Every client recomputes the same result. Inconsistent results if two clients have different cached data.
**Do this instead:** Create a PostgreSQL function or database view that computes net balances server-side. The client fetches the pre-computed result. The function runs once per query, not once per client.

### Anti-Pattern 2: Skipping RLS and Filtering in App Code

**What people do:** Disable Row Level Security and add `.eq('household_id', householdId)` to every query in the app.
**Why it's wrong:** One missed filter exposes all users' data. Client-side filtering is not security -- it is a suggestion. Bugs in the app become data breaches.
**Do this instead:** Enable RLS on every shared table from day one. The database enforces isolation regardless of what the client code does. Application-level filters are for UX (sorting, searching), not security.

### Anti-Pattern 3: Putting Business Logic in Route Files

**What people do:** Write Supabase queries, state management, and data transformations directly in `app/(tabs)/expenses/index.tsx`.
**Why it's wrong:** Route files become bloated and untestable. Changing routing framework requires rewriting business logic. Two developers cannot work on the same feature without conflicts.
**Do this instead:** Route files should be thin -- import a screen component from `features/` or compose hooks. All business logic lives in `features/{name}/hooks/` and `features/{name}/utils.ts`.

### Anti-Pattern 4: Subscribing to Real-Time on Every Table

**What people do:** Set up Supabase Realtime subscriptions on every table "just in case."
**Why it's wrong:** Each subscription is a WebSocket channel consuming server and client resources. Most tables do not need real-time (e.g., `households`, `household_members` change rarely). Excessive subscriptions cause battery drain on mobile.
**Do this instead:** Only subscribe to tables where concurrent editing is common: `grocery_items` (high priority), `expenses` (medium -- notification is enough), `chores` (medium -- for live board updates). Use standard query refetching for infrequently changing data.

### Anti-Pattern 5: Storing Venmo Usernames Without Encryption

**What people do:** Store Venmo handles in plaintext in the profiles table.
**Why it's wrong:** Venmo usernames are semi-sensitive PII. If the database is compromised, this data is exposed.
**Do this instead:** For a personal-use v1, this is acceptable with RLS (only household members can see each other's handles). If scaling to public use, store in an encrypted column or Supabase Vault.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Venmo | Deep link via `Linking.openURL()` with constructed URL | Undocumented API. URL format: `venmo://paycharge?txn=charge&recipients={username}&amount={amount}&note={note}`. Fallback to web URL `https://venmo.com/{username}?txn=charge&amount={amount}&note={note}` if app not installed. Test on real devices only. |
| Expo Push Notifications | `expo-notifications` + Supabase Edge Functions for server-triggered push | Requires development build (not Expo Go). Store push tokens in `household_members` table. Use local notifications for chore reminders. Use server push (via Edge Functions) for expense additions by other members. |
| Supabase Edge Functions | HTTPS invocation from client or cron trigger | Use for: chore rotation advancement (scheduled cron), push notification dispatch, invite code generation/validation. Keep functions small and focused. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Route files <-> Feature modules | Import hooks and components | Route files are thin wrappers. Never import supabase directly in route files. |
| Feature hooks <-> Supabase client | Via `lib/supabase.ts` singleton | All features share one client instance. Client handles auth token injection automatically. |
| Feature hooks <-> TanStack Query | Query keys namespaced by feature | Convention: `['expenses', householdId]`, `['groceries', householdId]`. Cross-feature invalidation happens in mutation `onSuccess` callbacks. |
| Real-time subscriptions <-> TanStack Query | Subscription callbacks invalidate query cache | Real-time does NOT update the cache directly. It triggers a refetch to ensure consistency. |
| Zustand stores <-> Feature modules | Imported where needed for client-only state | Zustand is never used for server state. Clear separation: if it comes from the database, it goes through TanStack Query. |
| Notification service <-> Feature modules | Features call notification utilities from `lib/notifications.ts` | Centralized permission handling and token management. Features only specify content and timing. |

## Build Order (Dependency Chain)

The architecture has clear dependency layers that dictate build order:

```
Phase 1: Foundation (must come first)
  Supabase project setup + schema + RLS policies
  Auth flow (sign-up, sign-in, session management)
  Household creation + invite/join flow
  Root layout with auth gate
      |
      v
Phase 2: Core Feature (depends on Phase 1)
  Expense tracking (add, view, split)
  Balance computation (who owes who)
  Settlement flow + Venmo deep link
      |
      v
Phase 3: Secondary Features (depends on Phase 1, parallel to each other)
  Grocery list (shared list, real-time sync)
  Chore board (assignment, rotation, completion)
      |
      v
Phase 4: Polish (depends on Phases 2+3)
  Push notifications (reminders, alerts)
  Onboarding quiz (module recommendations)
  Shared calendar
  Recurring expenses
```

**Rationale:** Auth and household membership are prerequisites for everything. Expenses + balances are the core value proposition and should be built next. Groceries and chores are independent features that can be built in parallel. Notifications, onboarding, and calendar are enhancements that layer on top of working features.

## Sources

- [Expo Router Layout Documentation](https://docs.expo.dev/router/basics/layout/) - HIGH confidence (official docs)
- [Expo Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) - HIGH confidence (official Expo blog, January 2026)
- [Using Supabase with Expo](https://docs.expo.dev/guides/using-supabase/) - HIGH confidence (official Expo docs)
- [Supabase Expo React Native Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) - HIGH confidence (official Supabase docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - HIGH confidence (official Supabase docs)
- [Multi-Tenant RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - MEDIUM confidence (well-documented pattern, multiple sources agree)
- [TanStack Query with Supabase](https://makerkit.dev/blog/saas/supabase-react-query) - MEDIUM confidence (community guide, verified with TanStack docs)
- [State Management 2026: Redux vs Zustand vs Context](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b) - MEDIUM confidence (multiple sources agree on Zustand recommendation)
- [Splitwise Debt Simplification Algorithm](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688) - MEDIUM confidence (well-known algorithm, verified against multiple explanations)
- [Venmo Deep Linking](https://blog.alexbeals.com/posts/venmo-deeplinking) - LOW confidence (undocumented API, community-discovered URL scheme; verify on real device before relying on it)
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) - HIGH confidence (official Expo docs)
- [Expo New Architecture Default](https://expo.dev/blog/out-with-the-old-in-with-the-new-architecture) - HIGH confidence (official Expo blog)
- [Obytes Expo Starter Project Structure](https://starter.obytes.com/getting-started/project-structure/) - MEDIUM confidence (well-maintained open-source starter)

---
*Architecture research for: RoomY (roommate household management app)*
*Researched: 2026-03-10*
