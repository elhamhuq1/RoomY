# Phase 8: Expenses Screen - Research

**Researched:** 2026-03-12
**Domain:** React Native UI redesign - Expenses tab (presentation layer)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Balance section layout**: Single-row per member: avatar on left, name, owe/owed amount on right, action button at far right
- **Settle button** goes directly to settle page with userId, amount, and direction params (same pattern as home screen)
- **Remind button** opens system share sheet with pre-filled message (not push notification)
- **Members with zero balance** are hidden from the balance section entirely
- **Tapping a member row** (not the button) navigates to a separate screen showing all expenses between you and that member
- **Expense rows**: amber icon container, expense description, bold total amount, "Paid by [name]" + date as secondary text
- **Settlement rows**: green checkmark icon, same layout but text is muted/dimmed to de-emphasize
- **Tapping an expense row** expands inline to show split breakdown (who owes what)
- **Expanded view** is read-only -- shows split breakdown only, no edit/delete actions
- **Three date groups**: TODAY, YESTERDAY, EARLIER -- overline-styled headers
- **Newest first** within each group
- **Paginated batches** for performance with infinite scroll
- **Empty state**: friendly illustration + "No expenses yet" prompt with button to add first expense
- **Balance section at top**, expense history below -- entire screen scrolls as one unit (no sticky header)
- **Add Expense** uses existing layout FAB from Phase 6 -- no new button needed
- **Pull-to-refresh** to reload balances and history (same pattern as home screen)
- **Per-member expense breakdown** navigates to a separate full screen with same date grouping and visual styling

### Claude's Discretion
- Pagination batch size and infinite scroll implementation
- Exact icon choices within amber/green icon containers
- Loading skeleton design while data fetches
- Empty state illustration style
- Spacing, typography, and shadow details within design system constraints

### Deferred Ideas (OUT OF SCOPE)
- Search expenses by name/description -- future phase
- Expense filtering (by member, date range, amount) -- future phase
- Edit/delete expense from expanded row -- could be added later
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XPUI-01 | Expenses screen shows balance cards with member rows, owe amounts, and remind/settle actions | Balance section pattern, Avatar component, Share API, settle navigation params |
| XPUI-02 | Expense history visually differentiates expenses (amber icon, bold amount) from settlements (green icon, dimmed text) | IconContainer component with warning/success variants, typography presets |
| XPUI-03 | Expense history uses overline-styled date group headers (TODAY, YESTERDAY, EARLIER) | text-overline typography preset, date grouping pattern from existing code |
</phase_requirements>

## Summary

Phase 8 is a presentation-layer redesign of the existing expenses tab (`app/(app)/(tabs)/expenses.tsx`). The current implementation at 525 lines already has all the data fetching, balance display, and history rendering -- but uses old-style hardcoded colors, inline avatar circles, and the previous visual language. This phase replaces the visuals with the design system established in Phase 6 (Avatar, Card, IconContainer, Badge, Button components, color tokens, typography presets) while adding three new behaviors: inline expense row expansion, system share sheet remind, and per-member breakdown navigation.

The core data layer is unchanged: `get_household_balances` RPC returns pairwise `{ user_id, net_amount }` rows. Expenses and settlements are fetched from their tables. The existing `getDateLabel()` function produces date group labels but currently uses "Today", "Yesterday", and formatted dates -- this needs adjustment to use the THREE-GROUP model (TODAY, YESTERDAY, EARLIER) with uppercase overline styling. Additionally, the current screen navigates to `[id].tsx` on row tap -- this changes to inline expansion for split breakdown, while the `[id].tsx` detail/edit screen remains untouched.

New infrastructure needed: (1) a per-member breakdown screen (new file), (2) inline expandable rows with split data fetched on demand or batched, (3) pagination with cursor-based infinite scroll for the history section. All other components (Avatar, Card, IconContainer, Button) exist and are battle-tested from Phases 6-7.

**Primary recommendation:** Extract the expenses screen into a parent container + presentational child components (BalanceSection, HistorySection, ExpenseRow, SettlementRow) following the Phase 7 pattern, then add the inline expansion, share remind, and per-member navigation features.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.81.5 | Core framework | Project standard |
| expo | ^54 | Platform layer | Project standard (SDK 54) |
| expo-router | ~6.0.23 | Navigation/routing | Project standard |
| nativewind | ^4.2.2 | Tailwind-style styling | Project standard (TW3) |
| @supabase/supabase-js | (installed) | Data fetching | Project standard |
| date-fns | ^4.1.0 | Date manipulation | Project standard, already used in home screen |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native (Share) | built-in | System share sheet | For the Remind button -- `Share.share()` from react-native |
| expo-linking | ~8.0.11 | Venmo deep links | Already used for Venmo request/settle flows |
| @expo/vector-icons (Ionicons) | (bundled) | Icons | Amber/green icon containers |
| react-native-reanimated | (installed) | Animations | Expandable row height animation (optional) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual pagination | @tanstack/react-query infinite queries | Adds dependency; manual cursor pagination is simpler for this use case and consistent with project patterns |
| Animated expand | LayoutAnimation | Simpler API but less control; Reanimated already in project for FAB |
| FlatList for history | ScrollView (current) | FlatList better for very long lists; but entire screen needs to scroll as one unit, so nested FlatList is problematic -- use ScrollView with manual pagination |

**Installation:**
```bash
# No new packages needed -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  expenses/
    BalanceSection.tsx      # Balance card with member rows
    BalanceMemberRow.tsx    # Individual member balance row
    HistorySection.tsx      # Date-grouped expense/settlement list
    ExpenseRow.tsx          # Expense row with inline expand
    SettlementRow.tsx       # Settlement row (dimmed variant)
    EmptyState.tsx          # "No expenses yet" empty view
app/(app)/(tabs)/
    expenses.tsx            # Parent screen (data fetching + composition)
app/(app)/expenses/
    member-history.tsx      # Per-member breakdown screen (new)
```

### Pattern 1: Presentational Component Decomposition
**What:** Parent screen fetches all data, passes typed props to presentational children.
**When to use:** All screen components in this phase.
**Example:**
```typescript
// Source: Established pattern from app/(app)/(tabs)/index.tsx (Phase 7)
// Parent fetches data
const [balances, setBalances] = useState<BalanceEntry[]>([]);
const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);

// Children receive typed props -- no data fetching inside
<BalanceSection
  balances={balances}
  currentUserId={user?.id ?? ''}
  onSettle={(userId, amount, direction) => router.push(...)}
  onRemind={(name, amount) => Share.share(...)}
  onMemberPress={(userId) => router.push(...)}
/>
<HistorySection
  groups={groupedHistory}
  currentUserId={user?.id ?? ''}
/>
```

### Pattern 2: Inline Expandable Row with State
**What:** Expense rows expand inline to show split breakdown when tapped. No navigation.
**When to use:** Expense rows in the history section.
**Example:**
```typescript
// Each row manages its own expanded state
const [expandedId, setExpandedId] = useState<string | null>(null);

// On tap, toggle expansion and fetch splits if not cached
function handleExpensePress(expenseId: string) {
  if (expandedId === expenseId) {
    setExpandedId(null);
  } else {
    setExpandedId(expenseId);
    // Fetch splits if not already loaded
    if (!splitsCache[expenseId]) {
      fetchSplitsForExpense(expenseId);
    }
  }
}
```

### Pattern 3: Three-Group Date Bucketing
**What:** Categorize dates into exactly three buckets: TODAY, YESTERDAY, EARLIER.
**When to use:** History section date group headers.
**Example:**
```typescript
function getDateGroup(dateStr: string): 'TODAY' | 'YESTERDAY' | 'EARLIER' {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'TODAY';
  if (date >= yesterday) return 'YESTERDAY';
  return 'EARLIER';
}
```

### Pattern 4: Cursor-Based Pagination
**What:** Load history in batches using Supabase range queries. Track offset, load more on scroll near bottom.
**When to use:** Expense/settlement history loading.
**Example:**
```typescript
const BATCH_SIZE = 20;
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);

async function loadMore() {
  if (!hasMore || loadingMore) return;

  const [expRes, settleRes] = await Promise.all([
    supabase.from('expenses')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1),
    supabase.from('settlements')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1),
  ]);

  // Merge, sort, group, append to existing state
  // If both return fewer than BATCH_SIZE, no more data
}
```

### Pattern 5: System Share Sheet (Remind)
**What:** Use React Native's built-in `Share.share()` for remind functionality.
**When to use:** Remind button on balance member rows (for members who owe you).
**Example:**
```typescript
// Source: Established pattern from app/(onboarding)/create-household.tsx
import { Share } from 'react-native';

async function handleRemind(memberName: string, amount: number) {
  try {
    await Share.share({
      message: `Hey ${memberName}, you owe $${amount.toFixed(2)} on RoomY. Can you settle up?`,
    });
  } catch {
    // User cancelled share or share failed -- no action needed
  }
}
```

### Anti-Patterns to Avoid
- **Nested FlatList inside ScrollView:** The screen scrolls as one unit. Don't use FlatList for history since it can't be nested in ScrollView without `nestedScrollEnabled` hacks that break scroll physics. Use a flat list of rendered views inside ScrollView with manual pagination.
- **Inline AVATAR_COLORS arrays:** The old expenses screen uses hardcoded `AVATAR_COLORS` arrays. Use the `Avatar` component from `components/ui/Avatar.tsx` which provides consistent gradient avatars with deterministic color selection via `hashString(userId)`.
- **Data fetching inside child components:** Keep all Supabase calls in the parent screen. Children are presentational only.
- **Navigating to [id].tsx on expense tap:** Per user decision, expense taps now expand inline. Only settlement row taps or member row taps navigate away.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Member avatars | Inline colored circles with getInitials | `<Avatar userId={id} name={name} size="md" />` | Consistent gradient colors, deterministic per-user, colored shadow |
| Card containers | Inline rounded-2xl bg-white shadow-sm | `<Card>` component | Handles Android elevation, consistent border/radius/shadow |
| Icon containers | Inline View with bg color + Ionicons | `<IconContainer name="receipt-outline" variant="warning" />` | Standardized 40x40 with correct color-600 mapping |
| Action buttons | Inline Pressable with brand colors | `<Button title="Settle" onPress={...} />` | Consistent sizing, loading state, disabled state |
| Date grouping header | Inline Text with manual styles | `<Text className="text-overline text-neutral-secondary uppercase">` | Matches overline preset (11px, 600 weight, 0.1em letter-spacing) |
| Share sheet | expo-sharing or custom modal | `Share.share()` from react-native | Built-in, no extra dependency, established pattern in project |
| Currency formatting | Template literals with .toFixed(2) | `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` | Handles edge cases, consistent with existing formatCurrency |

**Key insight:** Phase 6 built a complete design system. Phase 8 should consume it. The existing expenses screen predates Phase 6 and uses none of these components -- the entire rendering layer needs replacement, but data fetching can be largely preserved.

## Common Pitfalls

### Pitfall 1: ScrollView Performance with Large History
**What goes wrong:** Rendering hundreds of expense rows in a ScrollView causes jank and high memory usage.
**Why it happens:** ScrollView renders all children, unlike FlatList which virtualizes. But FlatList can't be nested in a ScrollView (which is needed for the balance section + history as one scrolling unit).
**How to avoid:** Implement pagination (20 items per batch). Only render loaded items. Use `onScroll` to detect proximity to bottom and trigger loadMore. Most households will have fewer than 100 total entries, so this is a safeguard more than a critical path.
**Warning signs:** Slow initial render, stuttering on scroll, memory warnings.

### Pitfall 2: Stale Split Data After Inline Expand
**What goes wrong:** Expanding an expense row fetches splits, but if the screen was pulled-to-refresh while expanded, the cached splits become stale.
**Why it happens:** Split data is fetched on-demand per expense and cached locally, but the cache isn't invalidated on refresh.
**How to avoid:** Clear the splits cache when `fetchData()` runs (on focus or pull-to-refresh). Use a simple `Record<string, ExpenseSplit[]>` cache keyed by expense ID.
**Warning signs:** Split amounts don't match after editing an expense in another flow.

### Pitfall 3: Balance Direction Confusion
**What goes wrong:** The `get_household_balances` RPC returns pairwise rows where positive `net_amount` means "the other person owes the household." The home screen inverts this with `-amount` for the current user's perspective.
**Why it happens:** The RPC perspective vs. display perspective is non-obvious. Phase 7 solved this with the `.reduce()` summing pattern and `-amount` inversion.
**How to avoid:** Follow the exact same balance processing pattern from the home screen's `unsettledBalances` useMemo. Filter out current user's own row, invert amounts, display accordingly.
**Warning signs:** "You owe" and "Owed to you" sections show reversed amounts.

### Pitfall 4: Overline Text Styling Not Working
**What goes wrong:** The `text-overline` class doesn't apply letter-spacing or font-weight on Android.
**Why it happens:** NativeWind/Tailwind fontSize tuples with fontWeight and letterSpacing may not cascade on all platforms.
**How to avoid:** Verify overline styling renders on both iOS and Android. If needed, apply letterSpacing via inline style (React Native style prop) as a fallback. The WeeklyTimeline already uses `text-overline text-neutral-secondary` successfully.
**Warning signs:** Date headers look like normal small text without spacing.

### Pitfall 5: Member Row Tap vs. Button Tap Conflicts
**What goes wrong:** Tapping the Settle/Remind button also fires the member row's onPress (navigating to per-member breakdown).
**Why it happens:** Touch events bubble from child (button) to parent (row Pressable).
**How to avoid:** Use `stopPropagation` or structure the row so the button is outside the Pressable area, or use separate Pressable zones within the row. Alternatively, use `onPress` on the row and check if the event target was the button.
**Warning signs:** Tapping Settle navigates to member history instead of settle screen.

### Pitfall 6: Pagination Offset Drift with Mixed Types
**What goes wrong:** Using separate offsets for expenses and settlements causes items to appear out of order or be duplicated when merging.
**Why it happens:** Expenses and settlements are in different tables with different counts. If you paginate each independently, merging sorted results at different offsets produces inconsistent pages.
**How to avoid:** Either (a) fetch both full tables and paginate the merged result client-side, or (b) use a single offset applied to the merged/sorted result by fetching enough from each table to fill one page. For small-to-medium households, option (a) with a reasonable limit (e.g., 50 from each table initially) is simpler.
**Warning signs:** Items jump between pages, duplicates appear, or items from yesterday appear before today's items.

## Code Examples

### Using the Avatar Component
```typescript
// Source: components/ui/Avatar.tsx (Phase 6)
import { Avatar } from '@/components/ui/Avatar';

<Avatar userId={entry.user_id} name={entry.profile?.display_name ?? 'Unknown'} size="md" />
// Produces: 40x40 gradient circle with initials, deterministic color per userId, colored shadow
```

### Using IconContainer for Expense/Settlement Rows
```typescript
// Source: components/ui/IconContainer.tsx (Phase 6)
import { IconContainer } from '@/components/ui/IconContainer';

// Expense row: amber/warning variant
<IconContainer name="receipt-outline" variant="warning" />
// Produces: 40x40 rounded-xl, bg-amber-100, icon color #D97706

// Settlement row: green/success variant
<IconContainer name="checkmark-circle" variant="success" />
// Produces: 40x40 rounded-xl, bg-green-100, icon color #16A34A
```

### Overline Date Group Header
```typescript
// Source: WeeklyTimeline.tsx overline pattern (Phase 7)
<Text className="text-overline text-neutral-secondary uppercase mb-2">
  {group.label}  {/* "TODAY", "YESTERDAY", "EARLIER" */}
</Text>
// text-overline = 11px, lineHeight 14px, fontWeight 600, letterSpacing 0.1em
```

### Balance Member Row with Actions
```typescript
// Source: Existing patterns from expenses.tsx + settle.tsx navigation
<Pressable
  className="flex-row items-center py-3"
  onPress={() => router.push(`/(app)/expenses/member-history?userId=${entry.user_id}` as never)}
>
  <Avatar userId={entry.user_id} name={displayName} size="md" />
  <View className="ml-3 flex-1">
    <Text className="text-card-title text-neutral-text">{displayName}</Text>
    <Text className={`text-body font-bold ${isOwedToYou ? 'text-semantic-success' : 'text-semantic-error'}`}>
      {isOwedToYou ? `owes you ${formatCurrency(amount)}` : `you owe ${formatCurrency(amount)}`}
    </Text>
  </View>
  {/* Action button - outside row Pressable or with stopPropagation */}
  {isOwedToYou ? (
    <Pressable onPress={(e) => { e.stopPropagation(); handleRemind(displayName, amount); }}>
      <Text>Remind</Text>
    </Pressable>
  ) : (
    <Pressable onPress={(e) => { e.stopPropagation(); handleSettle(entry.user_id, amount); }}>
      <Text>Settle</Text>
    </Pressable>
  )}
</Pressable>
```

### Pull-to-Refresh Pattern
```typescript
// Source: Home screen index.tsx (Phase 7)
<ScrollView
  className="flex-1 bg-neutral-bg"
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
```

### Inline Expandable Expense Row
```typescript
// Expand/collapse pattern
const [expandedId, setExpandedId] = useState<string | null>(null);
const [splitsCache, setSplitsCache] = useState<Record<string, SplitWithProfile[]>>({});

async function handleExpensePress(expenseId: string) {
  if (expandedId === expenseId) {
    setExpandedId(null);
    return;
  }
  setExpandedId(expenseId);
  if (!splitsCache[expenseId]) {
    const { data } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', expenseId);
    // Fetch profiles for split users...
    setSplitsCache(prev => ({ ...prev, [expenseId]: splitsWithProfiles }));
  }
}

// In render:
{item.type === 'expense' && expandedId === item.data.id && (
  <View className="px-4 pb-3 bg-neutral-surface">
    {splitsCache[item.data.id]?.map(split => (
      <View key={split.id} className="flex-row items-center py-2">
        <Avatar userId={split.user_id} name={split.profile?.display_name ?? '?'} size="sm" />
        <Text className="ml-2 flex-1 text-metadata text-neutral-secondary">
          {split.profile?.display_name ?? 'Unknown'}
        </Text>
        <Text className="text-metadata font-semibold text-neutral-text">
          {formatCurrency(Number(split.share_amount))}
        </Text>
      </View>
    ))}
  </View>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded AVATAR_COLORS array | Avatar component with gradient pairs | Phase 6 (2026-03-11) | Must replace all inline avatar circles |
| Inline rounded View containers | Card component | Phase 6 | Use for balance section container |
| Manual icon + bg color | IconContainer with variant prop | Phase 6 | Use warning variant for expenses, success for settlements |
| Navigate to [id].tsx on expense tap | Inline expand to show splits | Phase 8 (this phase) | New behavior per user decision |
| Separate "Owed to you" / "You owe" sections | Single flat member list with per-row action | Phase 8 (this phase) | Simpler layout per CONTEXT.md |
| "Today" / "Yesterday" / formatted date | "TODAY" / "YESTERDAY" / "EARLIER" only | Phase 8 (this phase) | Three fixed groups with overline styling |

**Deprecated/outdated:**
- Old inline avatar circles (`AVATAR_COLORS` + `getInitials`) in expenses.tsx: replaced by `Avatar` component
- Old settlement row navigation to `[id].tsx`: settlement rows keep this behavior, expense rows change to inline expand
- `getDateLabel()` returning formatted dates for dates older than yesterday: replaced by three-group model

## Open Questions

1. **Per-member history screen: query approach**
   - What we know: Need to show all expenses and settlements between current user and a specific other member, with same date grouping
   - What's unclear: Whether to filter on the client from already-fetched data or issue a separate query scoped to the two users
   - Recommendation: Use a separate Supabase query filtered by both user IDs (in paid_by or split user_id) for accuracy and pagination support. The expense list may be partial due to pagination.

2. **Pagination boundary across date groups**
   - What we know: Items are sorted newest-first. Pagination loads in batches. Date groups (TODAY/YESTERDAY/EARLIER) must be maintained.
   - What's unclear: When a page boundary falls mid-group, the group header should not duplicate.
   - Recommendation: Maintain running state of which groups exist. When appending new items, merge into existing groups rather than creating new group entries. The "EARLIER" group is always the catch-all accumulator.

3. **Settle button direction logic**
   - What we know: The home screen uses settle/request based on overall net position. The expenses screen should show per-member buttons.
   - What's unclear: Should members who owe you see "Remind" and members you owe see "Settle"? Or both?
   - Recommendation: Per CONTEXT.md, use Remind (share sheet) for members who owe you, and Settle (navigate to settle page) for members you owe. This matches the natural action: you remind someone who owes you, you settle up with someone you owe.

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/(app)/(tabs)/expenses.tsx` - current expenses screen implementation (525 lines)
- Project codebase: `app/(app)/(tabs)/index.tsx` - home screen pattern (data fetching, composition)
- Project codebase: `components/ui/Avatar.tsx` - Avatar component API and gradient system
- Project codebase: `components/ui/IconContainer.tsx` - IconContainer variants (warning = amber, success = green)
- Project codebase: `components/ui/Card.tsx` - Card component with Android elevation handling
- Project codebase: `components/home/WeeklyTimeline.tsx` - overline date header pattern
- Project codebase: `app/(onboarding)/create-household.tsx` - Share.share() pattern
- Project codebase: `tailwind.config.js` - typography presets (text-overline, text-card-title, text-body, text-metadata, text-section-heading)
- Project codebase: `lib/theme/colors.ts` - color tokens
- Project codebase: `lib/types/database.ts` - TypeScript types for Expense, Settlement, ExpenseSplit, Profile
- Project codebase: `supabase/migrations/00002_expenses.sql` - get_household_balances RPC signature and logic

### Secondary (MEDIUM confidence)
- React Native Share API: `Share.share({ message })` - built-in, no import from external package needed (verified in project usage)
- Supabase `.range()` for pagination: standard PostgRES range query (verified via project's existing Supabase usage patterns)

### Tertiary (LOW confidence)
- None -- all findings verified against project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in project, versions verified from package.json
- Architecture: HIGH - decomposition pattern directly mirrors Phase 7 home screen, all components exist
- Pitfalls: HIGH - identified from actual codebase issues (balance direction, ScrollView perf, event bubbling)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- presentation layer only, no library changes expected)
