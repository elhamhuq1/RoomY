# Phase 02: Expense Splitting - Research

**Researched:** 2026-03-11
**Domain:** Financial data modeling, Supabase RLS, Venmo deep linking, React Native currency UX
**Confidence:** HIGH

## Summary

This phase adds expense logging, balance tracking, and Venmo settlement to an existing Expo + Supabase app. The core technical challenge is the database schema: expenses need a junction table for per-member splits, balances must be computed from raw data (not stored as mutable state), and RLS policies must follow the established `get_user_household_ids()` pattern to avoid infinite recursion.

The Venmo integration is a simple deep link (`venmo://paycharge?txn=charge&recipients=USERNAME&amount=N&note=NOTE`), not an API integration. The link is undocumented by Venmo and has been known to break periodically; the fallback is `https://venmo.com/USERNAME?txn=charge&amount=N&note=NOTE` which opens the app on mobile. `Linking.canOpenURL` for the `venmo://` scheme requires `LSApplicationQueriesSchemes` in `app.json` and a development build (not testable in Expo Go). However, `Linking.openURL` works without this config -- `canOpenURL` is only needed for conditionally showing/hiding a Venmo button.

No new dependencies are needed. The project already has `expo-linking` (bundled with expo), `@supabase/supabase-js`, and NativeWind. Currency formatting can be done with `Intl.NumberFormat` (available in Hermes). The existing codebase patterns (two-query profile fetch, auth context, NativeWind styling) should be followed exactly.

**Primary recommendation:** Use three new tables (`expenses`, `expense_splits`, `settlements`) with computed balances via a Supabase database function. Follow existing RLS patterns using `get_user_household_ids()`. Use `Linking.openURL` for Venmo without checking `canOpenURL` to maintain Expo Go compatibility during development.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Add expense form**: Minimal fields (description, amount, payer, member split). No categories, no date picker. All household members pre-selected by default; tap to deselect. Payer defaults to current user. Entry point: FAB (+) on expenses tab. Recent descriptions shown as suggestions.
- **Balance dashboard**: Net amount per person. Only your own balances visible. "You owe" / "Owed to you" sections. Zero state: "All settled up!" with checkmark. Layout: balance summary at top of expenses tab, expense history scrolls below.
- **Expense history**: Grouped by date (Today, Yesterday, Mar 8...), newest first. Each row: description, total amount, who paid. Tap opens detail screen with split members, shares, date, edit/delete. Any member can edit/delete any expense. Settlements styled differently (checkmark + "Settlement" label).
- **Settle up & Venmo flow**: "Settle Up" opens confirmation with editable amount for partial settlements. Two actions: "Record Payment" and "Request via Venmo". Venmo deep link pre-fills recipient (from profile venmo_username) and amount. After returning from Venmo, user manually taps "Mark as settled". Either side can record settlement.

### Claude's Discretion
- Loading states and skeleton designs
- Exact card/list styling and spacing
- Error state handling (network failures, etc.)
- Expense detail screen layout
- Animation and transition choices
- How "recent descriptions" suggestions are stored/surfaced

### Deferred Ideas (OUT OF SCOPE)
- Recurring expenses auto-creation (rent, utilities monthly) -- v2 EXPN-07
- Custom split percentages -- v2 EXPN-09
- Debt simplification algorithm for 3+ people -- v2 EXPN-08
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPN-01 | User can add an expense with description, amount, and who paid | Database schema (expenses + expense_splits tables), add expense form pattern, RLS INSERT policies |
| EXPN-02 | Expense is automatically split equally among household members | `expense_splits` junction table with computed `share_amount = total / count(members)`, per-member selection support |
| EXPN-03 | User can view balance dashboard showing who owes whom | Computed balances via `get_household_balances()` DB function, net calculation pattern |
| EXPN-04 | User can view scrollable expense history | Supabase query with ordering + date grouping on client, PostgREST embed for splits |
| EXPN-05 | User can settle up by recording a payment | Settlements table, partial settlement via editable amount, balance recalculation |
| EXPN-06 | User can send a Venmo request with one tap from balance screen | `Linking.openURL` with `venmo://paycharge` URL, fallback to `https://venmo.com/` web URL |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.0 | DB queries, RLS, real-time | Already installed, project standard |
| expo-linking | ~8.0.11 | Venmo deep link via `Linking.openURL` | Already installed (bundled with expo) |
| expo-router | ~6.0.23 | Navigation for expense detail, settle screens | Already installed, project standard |
| nativewind | ^4.2.2 | Styling | Already installed, project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.NumberFormat | Built-in (Hermes) | Currency formatting ($10.50) | Display amounts everywhere |
| react-native-reanimated | ~4.1.1 | FAB animation, list transitions | Already installed, optional polish |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Intl.NumberFormat | react-native-currency-input | Extra dep; Intl covers display-only needs. TextInput can use `keyboardType="decimal-pad"` directly |
| Computed balances (DB function) | Client-side balance calc | DB function is authoritative, avoids stale data, works across devices |
| Separate settlements table | Settlement as negative expense | Separate table is cleaner for audit trail, different display styling, and partial settlements |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/(app)/
├── (tabs)/
│   └── expenses.tsx            # Balance dashboard + expense history (main tab)
├── expenses/
│   ├── add.tsx                 # Add expense modal/screen
│   ├── [id].tsx                # Expense detail screen (view/edit/delete)
│   └── settle.tsx              # Settle up confirmation screen
lib/
├── types/
│   └── database.ts             # Add Expense, ExpenseSplit, Settlement types
supabase/
└── migrations/
    └── 00002_expenses.sql      # New tables, functions, RLS policies, indexes
```

### Pattern 1: Database Schema Design
**What:** Three tables -- `expenses` (header), `expense_splits` (per-member shares), `settlements` (payments between users)
**When to use:** Always -- this is the core data model
**Example:**
```sql
-- Source: Splitwise-style schema adapted for Supabase RLS
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_by UUID REFERENCES auth.users NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  share_amount NUMERIC(10,2) NOT NULL CHECK (share_amount > 0),
  UNIQUE(expense_id, user_id)
);

CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES auth.users NOT NULL,   -- person who paid
  paid_to UUID REFERENCES auth.users NOT NULL,   -- person who received
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pattern 2: Computed Balances via DB Function
**What:** A SECURITY DEFINER function that computes net balances for the current user from expenses and settlements
**When to use:** Balance dashboard data fetching -- never store balances as mutable columns
**Example:**
```sql
-- Returns net balances between current user and each household member
-- Positive = they owe you, Negative = you owe them
CREATE OR REPLACE FUNCTION get_household_balances(p_household_id UUID)
RETURNS TABLE(user_id UUID, net_amount NUMERIC)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  WITH expense_debts AS (
    -- Money owed TO the payer BY each split member (excluding self-splits)
    SELECT
      e.paid_by AS creditor,
      es.user_id AS debtor,
      es.share_amount AS amount
    FROM public.expenses e
    JOIN public.expense_splits es ON es.expense_id = e.id
    WHERE e.household_id = p_household_id
      AND e.paid_by != es.user_id
  ),
  settlement_credits AS (
    SELECT
      s.paid_by AS debtor,     -- settling reduces what debtor owes
      s.paid_to AS creditor,
      s.amount
    FROM public.settlements s
    WHERE s.household_id = p_household_id
  ),
  -- Net from current user's perspective
  -- Positive = other person owes me, Negative = I owe them
  combined AS (
    -- I paid, they owe me
    SELECT debtor AS other_user, amount
    FROM expense_debts WHERE creditor = auth.uid()
    UNION ALL
    -- They paid, I owe them (negative)
    SELECT creditor AS other_user, -amount
    FROM expense_debts WHERE debtor = auth.uid()
    UNION ALL
    -- I settled (paid them), reduces what I owe (positive for them)
    SELECT paid_to AS other_user, -amount
    FROM settlement_credits WHERE debtor = auth.uid()
    UNION ALL
    -- They settled (paid me), reduces what they owe
    SELECT paid_by AS other_user, amount
    FROM settlement_credits WHERE creditor = auth.uid()
  )
  SELECT other_user AS user_id, SUM(amount) AS net_amount
  FROM combined
  WHERE other_user != auth.uid()
  GROUP BY other_user
  HAVING SUM(amount) != 0;
$$;
```

### Pattern 3: Two-Query Profile Fetch (Existing Project Pattern)
**What:** Fetch household_members + profiles in two queries, combine client-side
**When to use:** Whenever displaying user info alongside expense data (split members, payer name, balance dashboard)
**Why:** PostgREST cannot embed `profiles` via `household_members.user_id` because the FK points to `auth.users` not `profiles` (established fix from Phase 1)
**Example:**
```typescript
// Existing pattern from app/(app)/(tabs)/index.tsx
const { data: membersData } = await supabase
  .from("household_members")
  .select("user_id, role")
  .eq("household_id", household.id);

const userIds = membersData.map((m) => m.user_id);
const { data: profilesData } = await supabase
  .from("profiles")
  .select("*")
  .in("id", userIds);
```

### Pattern 4: Venmo Deep Link
**What:** Open Venmo app with pre-filled payment request
**When to use:** "Request via Venmo" button on settle screen
**Example:**
```typescript
import * as Linking from 'expo-linking';

function openVenmoRequest(venmoUsername: string, amount: number, note: string) {
  // Strip @ prefix if present
  const username = venmoUsername.replace(/^@/, '');
  const encodedNote = encodeURIComponent(note);

  // Use https:// URL -- works on mobile (opens app) and degrades gracefully
  const url = `https://venmo.com/${username}?txn=charge&amount=${amount.toFixed(2)}&note=${encodedNote}`;

  Linking.openURL(url);
}
```

### Pattern 5: Equal Split Calculation
**What:** Divide expense equally among selected members, handling rounding
**When to use:** Creating expense_splits rows on insert
**Example:**
```typescript
function calculateEqualSplits(totalAmount: number, memberCount: number): number[] {
  const baseShare = Math.floor(totalAmount * 100 / memberCount) / 100;
  const remainder = Math.round((totalAmount - baseShare * memberCount) * 100);

  // Distribute remainder pennies to first N members
  return Array.from({ length: memberCount }, (_, i) =>
    baseShare + (i < remainder ? 0.01 : 0)
  );
}
```

### Anti-Patterns to Avoid
- **Storing computed balances as a column:** Balances must be derived from expenses + settlements. Mutable balance columns drift out of sync with actual transactions.
- **Using `profiles(*)` embed on expense queries:** The FK from `expenses.paid_by` goes to `auth.users`, not `profiles`. Must use two-query pattern (see Pattern 3).
- **Self-referencing RLS subqueries on expenses:** The same infinite recursion problem from Phase 1 applies. Use `get_user_household_ids()` in all expense/settlement RLS policies.
- **Client-side balance computation:** All clients would need all expenses to compute balances. Use the DB function for consistency and performance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom string formatting | `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` | Handles negative, zero, rounding edge cases |
| Penny rounding in splits | Naive `total / count` | Distribute-remainder algorithm (Pattern 5) | `10.00 / 3 = 3.33 * 3 = 9.99` loses a penny |
| Balance computation | Client-side sum over all expenses | Supabase DB function `get_household_balances()` | Single source of truth, handles race conditions |
| Date grouping | Custom date string parsing | `toLocaleDateString` with `isToday`/`isYesterday` helpers | Time zones, locale formatting |
| Deep link to Venmo | Custom URL construction per platform | `Linking.openURL(httpsVenmoUrl)` | HTTPS URL works everywhere, app intercepts on mobile |

**Key insight:** Financial data demands a single authoritative source. Balances computed in the database cannot drift. Client-side calculations across multiple devices will eventually disagree.

## Common Pitfalls

### Pitfall 1: Penny Rounding Drift
**What goes wrong:** `$10.00 / 3 = $3.33` per person, but `$3.33 * 3 = $9.99`. One penny is lost.
**Why it happens:** Floating-point division doesn't distribute cleanly for many common amounts.
**How to avoid:** Use integer-cent arithmetic. Calculate base share, compute remainder pennies, distribute remainder to first N members. Verify: `SUM(splits) == expense.amount`.
**Warning signs:** Balance dashboard shows non-zero balances when all expenses should be settled.

### Pitfall 2: RLS Infinite Recursion on New Tables
**What goes wrong:** Policies on `expenses` or `settlements` that subquery `household_members` to check membership trigger recursive policy evaluation.
**Why it happens:** Same root cause as Phase 1 -- `household_members` has its own RLS policies.
**How to avoid:** Use the existing `get_user_household_ids()` SECURITY DEFINER function in all new policies. Pattern: `USING (household_id IN (SELECT public.get_user_household_ids()))`.
**Warning signs:** "infinite recursion" error from Supabase when inserting/selecting expenses.

### Pitfall 3: INSERT...RETURNING Needs SELECT Policy
**What goes wrong:** `.insert({ ... }).select().single()` fails with permission error even though INSERT policy allows it.
**Why it happens:** PostgREST's RETURNING clause requires SELECT permission. Same issue hit during Phase 1 household creation.
**How to avoid:** Ensure SELECT policies cover the inserting user. For expenses, the household membership check covers this naturally.
**Warning signs:** Insert succeeds but returns `null` data, or throws RLS error on insert with `.select()`.

### Pitfall 4: Venmo Deep Link Unreliability
**What goes wrong:** `venmo://paycharge` scheme stops working or parameters change without notice.
**Why it happens:** Venmo deep links are undocumented and reverse-engineered. Venmo has broken them before (reported March 2024).
**How to avoid:** Use HTTPS URL (`https://venmo.com/USERNAME?txn=charge&...`) as primary -- it opens the app on mobile and degrades to web. Show a fallback message if user reports issues. Never rely on `canOpenURL` for venmo:// in Expo Go (requires dev build + LSApplicationQueriesSchemes).
**Warning signs:** Users report "nothing happens" when tapping Venmo button.

### Pitfall 5: NUMERIC vs FLOAT for Money
**What goes wrong:** Using `FLOAT` or `REAL` for monetary amounts causes precision errors (`0.1 + 0.2 = 0.30000000000000004`).
**Why it happens:** IEEE 754 floating-point cannot exactly represent many decimal fractions.
**How to avoid:** Use `NUMERIC(10,2)` in PostgreSQL (exact decimal). On the client side, use `number` (JavaScript) but round to 2 decimal places on display with `Intl.NumberFormat`.
**Warning signs:** Balances show values like `$0.01` that should be zero.

### Pitfall 6: Expo Go Cannot Test canOpenURL for Custom Schemes
**What goes wrong:** `Linking.canOpenURL('venmo://...')` always returns `false` in Expo Go.
**Why it happens:** `LSApplicationQueriesSchemes` requires native Info.plist changes, only applied in development builds.
**How to avoid:** Skip `canOpenURL` check entirely. Just call `Linking.openURL` with the HTTPS fallback URL. If the user has Venmo installed, the app intercepts the HTTPS link. If not, it opens in browser.
**Warning signs:** Venmo button hidden during development because `canOpenURL` returns false.

## Code Examples

Verified patterns from official sources:

### Supabase Insert with Select (v2 pattern)
```typescript
// Source: Supabase JS v2 migration guide (Context7)
// Must call .select() explicitly to get inserted data back
const { data, error } = await supabase
  .from('expenses')
  .insert({
    household_id: household.id,
    description: 'Electric bill',
    amount: 120.00,
    paid_by: user.id,
    created_by: user.id,
  })
  .select()
  .single();
```

### Currency Display Formatting
```typescript
// Built-in Intl API (available in Hermes engine)
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

// formatCurrency(10.5)    → "$10.50"
// formatCurrency(-3.33)   → "-$3.33"
// formatCurrency(0)       → "$0.00"
```

### Date Grouping for Expense History
```typescript
function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

### Venmo Deep Link with HTTPS Fallback
```typescript
// Source: Community documentation (blog.alexbeals.com, goleary.com)
import * as Linking from 'expo-linking';

async function requestViaVenmo(
  venmoUsername: string,
  amount: number,
  note: string
) {
  const username = venmoUsername.replace(/^@/, '');
  const encodedNote = encodeURIComponent(note);
  // HTTPS URL: opens Venmo app on mobile, browser fallback on desktop
  const url = `https://venmo.com/${username}?txn=charge&amount=${amount.toFixed(2)}&note=${encodedNote}`;
  await Linking.openURL(url);
}
```

### RLS Policy Pattern (Following Established Project Convention)
```sql
-- Source: Existing 00001_foundation.sql pattern
-- All new table policies MUST use get_user_household_ids()
CREATE POLICY "Members can view household expenses"
  ON expenses FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create household expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );
```

### Supabase Real-Time Subscription for Expense Updates
```typescript
// Source: Supabase real-time docs (Context7)
// Optional: live updates when another member adds an expense
useEffect(() => {
  const channel = supabase
    .channel('expense-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `household_id=eq.${household.id}`,
      },
      () => {
        // Refetch expenses and balances
        fetchExpenses();
        fetchBalances();
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [household.id]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Venmo API integration | Deep links only (API closed to new devs) | ~2020 (PayPal acquisition) | Must use undocumented deep links, HTTPS fallback recommended |
| supabase-js v1 auto-return on insert | v2 requires explicit `.select()` | 2022 (supabase-js v2) | All insert/update calls need `.select()` for RETURNING data |
| SecureStore for sessions | expo-sqlite/localStorage | Expo SDK 54 | Already configured in this project |
| Expo Go for all features | Dev builds for native config | Ongoing | canOpenURL for custom schemes needs dev build; openURL works in Expo Go |

**Deprecated/outdated:**
- Venmo official API: Closed to new developers. Deep links are the only integration path.
- `supabase.from().insert()` returning data by default: v2 requires explicit `.select()`.

## Open Questions

1. **Venmo Deep Link Reliability**
   - What we know: `venmo://paycharge` and `https://venmo.com/USERNAME?txn=charge` both work as of research date. Venmo has broken deep links in the past (March 2024 report).
   - What's unclear: Whether current format will persist. No official documentation exists.
   - Recommendation: Use HTTPS URL as primary (more stable). Add a user-facing "Link not working?" message with manual instructions. Test on physical device early (already flagged in STATE.md blockers).

2. **Recent Descriptions Suggestions Storage**
   - What we know: User wants recent descriptions shown as quick-fill suggestions when adding expenses.
   - What's unclear: Whether to query recent expenses' descriptions or maintain a separate suggestions list.
   - Recommendation: Query the last N distinct descriptions from the household's expenses table (e.g., `SELECT DISTINCT description FROM expenses WHERE household_id = ? ORDER BY created_at DESC LIMIT 10`). No extra table needed.

3. **Real-Time Updates Scope**
   - What we know: Supabase real-time subscriptions can notify when other members add expenses.
   - What's unclear: Whether real-time is needed for MVP or manual pull-to-refresh suffices.
   - Recommendation: Start with pull-to-refresh (already used in dashboard). Add real-time subscription as polish if time permits -- it's non-blocking and easy to add later.

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase` - RLS policies, insert with select pattern, real-time subscriptions
- Context7 `/expo/expo/__branch__sdk-54` - expo-linking `openURL`, `canOpenURL`, `LSApplicationQueriesSchemes` config
- Existing codebase `supabase/migrations/00001_foundation.sql` - established RLS patterns, `get_user_household_ids()`
- Existing codebase `lib/auth-context.tsx`, `app/(app)/(tabs)/index.tsx` - two-query profile fetch pattern

### Secondary (MEDIUM confidence)
- [Venmo Deeplinking - Alex Beals](https://blog.alexbeals.com/posts/venmo-deeplinking) - `venmo://paycharge` parameters, native scheme format
- [Venmo Deeplinking - Gabe O'Leary](https://goleary.com/posts/venmo-deeplinking-including-from-web-apps) - HTTPS URL format, web fallback behavior
- [Expo Linking Docs](https://docs.expo.dev/linking/into-other-apps/) - LSApplicationQueriesSchemes requirement for canOpenURL, dev build constraint

### Tertiary (LOW confidence)
- Venmo deep link stability long-term -- undocumented API, has broken before, no official commitment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, no new dependencies
- Architecture: HIGH - database schema follows well-established expense-splitting patterns (Splitwise-style), RLS patterns proven in Phase 1
- Pitfalls: HIGH - most pitfalls identified from Phase 1 experience (RLS recursion, INSERT...RETURNING) and verified Venmo community reports
- Venmo integration: MEDIUM - deep link format verified from multiple community sources but undocumented by Venmo

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days -- stable domain, Venmo links should be retested on device)
