# Phase 7: Home Screen - Research

**Researched:** 2026-03-12
**Domain:** React Native dashboard UI with Supabase data aggregation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dashboard priority order: Greeting -> Members card -> Balance summary -> Calendar -> Attention feed -> Weekly timeline
- Spacious density -- generous padding (16-20px gaps) between cards; only greeting + members card + top of balance visible above the fold
- Single continuous scroll for the whole screen
- Greeting header scrolls with content (not sticky) -- tab bar already anchors navigation
- Members card always visible -- shows household name, avatar row, and invite link regardless of household size
- Week strip shows 7 days with today highlighted
- Inline slide-down expansion to full month view -- tap to expand, tap again or swipe up to collapse; pushes content down
- Multi-colored event dots: green for chores due, red/coral for expenses/settlements due
- Single dot per type per day (max 2 dots per day)
- Tapping a day filters the "This Week" timeline section below to show only that day's items
- Attention feed item types: unsettled balances, overdue chores, pending disputes, chores due today
- Priority order (top to bottom): unsettled balances first (core feature), then overdue chores, pending disputes, chores due today
- Tapping a card navigates to the relevant screen (expenses tab, chores tab, expense detail)
- No inline quick actions -- cards are navigation targets only
- Empty state: celebratory "All caught up!" message with illustration/icon; section stays visible
- Dark gradient background with net position framing: "You owe $X" (red text) or "You're owed $X" (green text)
- Both "Settle up" and "Request" buttons always visible regardless of owe direction
- Tapping card body navigates to expenses tab for full breakdown
- Buttons navigate to their respective action flows (settle-up flow, request/reminder flow)
- Zero balance state: "All settled up" with checkmark; buttons still visible but muted

### Claude's Discretion
- Loading skeleton design for each section
- Exact spacing and typography within cards
- Error state handling for failed data fetches
- Greeting text variations (morning/afternoon/evening wording)
- Animation timing for calendar expand/collapse
- Timeline visual style and completion indicators
- Invite link interaction (copy, share sheet, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Home screen shows a time-aware greeting header with date and settings icon button | Time-of-day greeting pattern with `date-fns` format; settings button already exists in tab layout header |
| HOME-02 | Home screen shows a members card with household name overline, avatar row, and invite link | Existing Avatar component + existing invite code copy/share pattern from members settings |
| HOME-03 | Home screen shows a collapsible week-strip calendar with event dots, expandable to full month | `react-native-calendars` ExpandableCalendar with CalendarProvider; existing `buildMarkedDates` utility needs dot color update |
| HOME-04 | Home screen shows a dark gradient balance summary card with dollar amount and action buttons | `expo-linear-gradient` (already installed) + existing `get_household_balances` RPC |
| HOME-05 | Home screen shows a "needs your attention" feed with actionable cards for pending chores, disputes, and updates | Supabase queries for overdue chores, pending disputes, unsettled balances; navigation-only cards |
| HOME-06 | Home screen shows a "this week" vertical timeline with chore items, member avatars, and completion status | date-fns week range + chore query with projected dates from existing `calendar-utils` |
</phase_requirements>

## Summary

Phase 7 is a complete rewrite of the existing home screen (`app/(app)/(tabs)/index.tsx`), transforming it from a basic module-card layout with a full-month calendar into a rich dashboard with six distinct sections. The current home screen already fetches most of the necessary data (members, expenses, chores, calendar events) but organizes it differently. The new design requires: (1) a time-aware greeting, (2) a members card with invite functionality, (3) a collapsible week-strip calendar, (4) a dark gradient balance card, (5) an attention feed, and (6) a weekly timeline.

The project already has all necessary libraries installed: `react-native-calendars` (v1.1314.0) includes ExpandableCalendar for the week-strip-to-month expansion, `expo-linear-gradient` for the dark gradient balance card, `date-fns` (v4.1.0) for date formatting and week calculations, and the full design system components (Avatar, Card, Badge, Button, IconContainer) from Phase 6. No new dependencies are needed.

The primary technical challenge is orchestrating six sections of data that all fetch from Supabase in parallel, plus refactoring the existing calendar utilities to support the new dot color scheme (green for chores, red/coral for expenses -- changed from the current blue/green).

**Primary recommendation:** Rewrite `index.tsx` as a composition of small, focused section components, each with its own data hook, all within a single ScrollView. Use `react-native-calendars` ExpandableCalendar for the collapsible week-strip calendar (already installed, no new deps).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-calendars | 1.1314.0 | ExpandableCalendar with week-strip and month expansion | Already installed; ExpandableCalendar provides exactly the week-to-month expansion with gesture support |
| expo-linear-gradient | 15.0.8 | Dark gradient background for balance card | Already installed; used by Avatar component; native performance |
| date-fns | 4.1.0 | Date formatting, week ranges, time-of-day logic | Already installed; used throughout codebase |
| @supabase/supabase-js | 2.99.0 | Data fetching for balances, chores, expenses | Already installed; used by all data screens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-clipboard | 8.0.8 | Copy invite code to clipboard | Invite link interaction on members card |
| expo-sharing / Share API | built-in | Share invite code via system share sheet | Invite link interaction on members card |
| react-native-reanimated | 4.1.1 | Smooth animations for calendar transitions | Already installed; used by FAB component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ExpandableCalendar | Custom week-strip with LayoutAnimation | Would need to hand-build date math, gesture handling, and the month grid; ExpandableCalendar does this already and is installed |
| expo-linear-gradient | NativeWind bg-gradient | NativeWind v4 with Tailwind 3 does not support gradients natively in React Native |

**Installation:**
```bash
# No new installations needed -- all libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
app/(app)/(tabs)/
  index.tsx                     # Main home screen (rewritten)

components/home/
  GreetingHeader.tsx            # HOME-01: Time-aware greeting + date
  MembersCard.tsx               # HOME-02: Household name, avatars, invite
  BalanceSummaryCard.tsx         # HOME-04: Dark gradient balance card
  CalendarSection.tsx           # HOME-03: ExpandableCalendar wrapper
  AttentionFeed.tsx             # HOME-05: Actionable attention cards
  WeeklyTimeline.tsx            # HOME-06: This week vertical timeline

lib/calendar-utils.ts           # Update dot colors (green chores, red/coral expenses)
```

### Pattern 1: Section Components with Lifted State
**What:** Each visual section is a separate component, but data fetching is centralized in the parent `index.tsx` and passed down as props.
**When to use:** When multiple sections share the same data (e.g., chores used by both CalendarSection and AttentionFeed).
**Example:**
```typescript
// app/(app)/(tabs)/index.tsx
export default function HomeScreen() {
  const { user, household, profile } = useSession();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // ... fetch all data once, pass to sections

  return (
    <ScrollView className="flex-1 bg-neutral-bg">
      <GreetingHeader userName={profile?.display_name ?? ''} />
      <MembersCard members={members} household={household} />
      <BalanceSummaryCard balances={balances} userId={user?.id} />
      <CalendarSection expenses={expenses} chores={chores} />
      <AttentionFeed balances={balances} chores={chores} userId={user?.id} />
      <WeeklyTimeline chores={chores} members={members} />
    </ScrollView>
  );
}
```

### Pattern 2: ExpandableCalendar with CalendarProvider
**What:** Wrap ExpandableCalendar in CalendarProvider for managed state. Starts collapsed (week strip), expands to full month on tap/gesture.
**When to use:** For HOME-03 calendar requirement.
**Example:**
```typescript
// Source: react-native-calendars official docs
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';

<CalendarProvider
  date={todayString}
  onDateChanged={(date) => setSelectedDate(date)}
>
  <ExpandableCalendar
    initialPosition={ExpandableCalendar.positions.CLOSED}
    markingType="multi-dot"
    markedDates={markedDates}
    closeOnDayPress={false}
    theme={{
      calendarBackground: '#ffffff',
      todayTextColor: colors.brand.DEFAULT,
      selectedDayBackgroundColor: colors.brand.DEFAULT,
      selectedDayTextColor: '#ffffff',
      arrowColor: colors.brand.DEFAULT,
    }}
  />
  {/* Content below the calendar */}
</CalendarProvider>
```

### Pattern 3: Dark Gradient Balance Card
**What:** Use LinearGradient as the card container with dark colors for the hero balance display.
**When to use:** For HOME-04 balance summary card.
**Example:**
```typescript
import { LinearGradient } from 'expo-linear-gradient';

<Pressable onPress={() => router.push('/(app)/(tabs)/expenses')}>
  <LinearGradient
    colors={['#1E293B', '#0F172A']}  // slate-800 to slate-900
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="rounded-card-lg p-5"
  >
    <Text className="text-overline text-neutral-tertiary">YOUR BALANCE</Text>
    <Text className="text-key-number" style={{ color: netAmount >= 0 ? '#22C55E' : '#EF4444' }}>
      {netAmount >= 0 ? `You're owed $${amount}` : `You owe $${amount}`}
    </Text>
    <View className="mt-4 flex-row gap-3">
      <Button title="Settle Up" variant="primary" onPress={handleSettle} />
      <Button title="Request" variant="outline" onPress={handleRequest} />
    </View>
  </LinearGradient>
</Pressable>
```

### Pattern 4: Time-of-Day Greeting
**What:** Compute greeting text based on current hour.
**When to use:** For HOME-01 greeting header.
**Example:**
```typescript
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// In component:
<View className="px-5 pt-4">
  <Text className="text-page-title text-neutral-text">
    {getGreeting()}, {firstName}
  </Text>
  <Text className="text-metadata text-neutral-secondary mt-1">
    {format(new Date(), 'EEEE, MMMM d')}
  </Text>
</View>
```

### Anti-Patterns to Avoid
- **Separate ScrollViews per section:** Never nest ScrollViews -- use a single parent ScrollView with section components rendered as regular Views.
- **Fetching data in each section component:** Causes race conditions and redundant queries. Centralize data fetching in the parent.
- **Using the old inline AVATAR_COLORS array:** The Avatar component from Phase 6 handles gradient colors deterministically via `hashString(userId)`. Use `<Avatar>` everywhere.
- **Hardcoding event dot colors across files:** Update `calendar-utils.ts` dot constants once; don't scatter color definitions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Week-strip calendar with expand | Custom week grid + LayoutAnimation expand | `react-native-calendars` ExpandableCalendar | Gesture handling, date math, smooth animations, swipe between weeks -- hundreds of edge cases |
| Gradient backgrounds | Custom View with background image | `expo-linear-gradient` LinearGradient | Native performance, already installed, well-tested |
| Avatar initials with colors | Inline `AVATAR_COLORS` array + manual initials | `<Avatar>` component from Phase 6 | Deterministic color from userId hash, gradient styling, multiple sizes |
| Date formatting | Manual string concatenation | `date-fns` format/startOfWeek/endOfWeek | Locale-aware, handles edge cases (year boundaries, DST) |
| Net balance calculation | Client-side expense aggregation | `get_household_balances` Supabase RPC | Server-side, considers all expenses and settlements, returns net per user |

**Key insight:** The current home screen already contains most of the data fetching logic and patterns needed. The redesign is primarily a UI rewrite, not a data layer change. Reuse existing query patterns and Supabase RPCs.

## Common Pitfalls

### Pitfall 1: ExpandableCalendar Must Be Inside CalendarProvider
**What goes wrong:** ExpandableCalendar renders blank or crashes without CalendarProvider wrapper.
**Why it happens:** The component requires context from CalendarProvider for date management and state.
**How to avoid:** Always wrap ExpandableCalendar in CalendarProvider. Pass `date` prop to CalendarProvider with today's date string.
**Warning signs:** Blank calendar area, "Cannot read property" errors in console.

### Pitfall 2: ExpandableCalendar Inside ScrollView Conflicts
**What goes wrong:** ExpandableCalendar has its own internal scroll/gesture handling for expand/collapse. Placing it inside a ScrollView can cause gesture conflicts.
**Why it happens:** Both the parent ScrollView and ExpandableCalendar respond to vertical gestures.
**How to avoid:** Use CalendarProvider's built-in scroll handling. The ExpandableCalendar should control a section of the layout, and content below it should be placed as children within the CalendarProvider (not siblings in the parent ScrollView). Alternatively, build a custom week strip with a simpler tap-to-expand approach using LayoutAnimation if ExpandableCalendar gesture conflicts prove intractable.
**Warning signs:** Jerky scrolling, calendar not expanding on tap, swipe gestures intercepted by wrong handler.

### Pitfall 3: Nested ScrollView for Day Events
**What goes wrong:** The current code uses a nested `<ScrollView style={{ maxHeight: 280 }}>` for day events. This causes scroll conflicts on iOS and Android.
**Why it happens:** Nested scrollable areas with the same direction fight for gestures.
**How to avoid:** Render day events as flat items in the parent scroll, not in a nested ScrollView. Limit displayed items if needed (e.g., show top 5 with "Show more" navigation).
**Warning signs:** User can't scroll past the events section, scroll snaps back.

### Pitfall 4: Balance Data Needs Current User Context
**What goes wrong:** Displaying "You owe" / "You're owed" requires knowing the current user's net position, but `get_household_balances` returns all members' balances.
**Why it happens:** The RPC returns an array of `{user_id, net_amount}` pairs -- you must filter to find the current user's entry.
**How to avoid:** Find `balances.find(b => b.user_id === user?.id)` and use its `net_amount`. Positive means owed to you, negative means you owe.
**Warning signs:** Showing wrong direction, showing another member's balance.

### Pitfall 5: Solo Creator State Still Needed
**What goes wrong:** The current index.tsx has a special "solo creator" state (1 member) showing the invite code prominently. Removing it would break the first-run experience.
**Why it happens:** New users see the home screen before inviting roommates.
**How to avoid:** Keep the solo creator empty state or integrate it into the new members card prominently (invite code front and center when there's only one member).
**Warning signs:** Solo user sees an empty dashboard with no guidance.

### Pitfall 6: Calendar Dot Colors Changed
**What goes wrong:** The CONTEXT.md specifies green dots for chores and red/coral for expenses. The current `calendar-utils.ts` uses blue for expenses and green for chores.
**Why it happens:** Design decision changed the expense dot from blue to red/coral.
**How to avoid:** Update `EXPENSE_DOT` color in `calendar-utils.ts` from `#3b82f6` (blue) to a red/coral like `#EF4444` or `#F87171`. Update the legend accordingly.
**Warning signs:** Dots showing old colors, mismatched legend.

### Pitfall 7: Attention Feed Priority Ordering
**What goes wrong:** Items render in wrong priority order, confusing users about what needs attention first.
**Why it happens:** Fetching different data types (balances, chores, disputes) and combining them without explicit sorting.
**How to avoid:** Build the attention items array in explicit priority order: (1) unsettled balances, (2) overdue chores, (3) pending disputes, (4) chores due today. Don't rely on database ordering.
**Warning signs:** Chores appearing before balance issues.

## Code Examples

Verified patterns from the existing codebase:

### Fetching Balance Data (from expenses.tsx)
```typescript
// Source: app/(app)/(tabs)/expenses.tsx - proven pattern
const balanceResult = await supabase.rpc("get_household_balances", {
  p_household_id: household.id,
});

// Find current user's net position
const myBalance = balanceResult.data?.find(
  (b: { user_id: string; net_amount: number }) => b.user_id === user?.id
);
const netAmount = myBalance ? Number(myBalance.net_amount) : 0;
// Positive = owed to you, Negative = you owe
```

### Fetching Members with Profiles (two-query pattern)
```typescript
// Source: app/(app)/(tabs)/index.tsx - required because of FK structure
const { data: membersData } = await supabase
  .from("household_members")
  .select("user_id, role")
  .eq("household_id", household.id);

if (membersData && membersData.length > 0) {
  const userIds = membersData.map((m) => m.user_id);
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);
  // Combine client-side...
}
```

### Invite Code Share/Copy (from settings/members.tsx)
```typescript
// Source: app/(app)/settings/members.tsx
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

async function handleShare(inviteCode: string) {
  await Share.share({
    message: `Join my household on RoomY! Use code: ${inviteCode}`,
  });
}

async function handleCopyCode(inviteCode: string) {
  await Clipboard.setStringAsync(inviteCode);
  // Show "Copied!" feedback
}
```

### Using Avatar Component (from Phase 6)
```typescript
// Source: components/ui/Avatar.tsx
import { Avatar } from '@/components/ui/Avatar';

// In JSX:
<Avatar userId={member.user_id} name={member.display_name} size="md" />
```

### Using Card Component (from Phase 6)
```typescript
// Source: components/ui/Card.tsx
import { Card } from '@/components/ui/Card';

<Card className="mt-4">
  <Text className="text-overline text-neutral-secondary">SECTION TITLE</Text>
  {/* Card content */}
</Card>
```

### Fetching Overdue Chores for Attention Feed
```typescript
// Source: derived from chores.tsx patterns
const now = new Date().toISOString();

// Chores assigned to current user that are overdue
const { data: overdueChores } = await supabase
  .from("chores")
  .select("*")
  .eq("household_id", household.id)
  .eq("is_active", true)
  .lt("next_due_at", now);

// Disputed completions
const { data: disputes } = await supabase
  .from("chore_completions")
  .select("*, chores!inner(name)")
  .eq("is_disputed", true)
  .eq("is_reverted", false);
```

### Fetching Chores Due Today for Timeline
```typescript
// Source: derived from calendar-utils.ts patterns
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

// Get chores with due dates in current week
// Use existing projectChoreDates() from calendar-utils
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full Calendar component in ScrollView | ExpandableCalendar with CalendarProvider | react-native-calendars ~1.1300+ | Week strip with smooth expand/collapse |
| Inline AVATAR_COLORS arrays per file | Centralized Avatar component with gradient | Phase 6 (2026-03-12) | Deterministic colors, consistent look, no duplication |
| Hardcoded color values | Design system color tokens (colors.ts) | Phase 6 (2026-03-12) | Semantic colors, centralized updates |

**Deprecated/outdated:**
- The current home screen layout (module cards, full-month calendar) is being entirely replaced by the new dashboard layout.
- The `AVATAR_COLORS` arrays scattered across `index.tsx`, `expenses.tsx`, `chores.tsx`, and `members.tsx` should be replaced with the `Avatar` component. However, only the home screen file is in scope for this phase.

## Open Questions

1. **ExpandableCalendar inside ScrollView gesture conflicts**
   - What we know: ExpandableCalendar has internal gesture handling for expand/collapse. Placing it in a ScrollView can cause conflicts.
   - What's unclear: Whether the specific version installed (1.1314.0) handles this gracefully, or if the CalendarProvider must wrap all scrollable content.
   - Recommendation: Try ExpandableCalendar first. If gesture conflicts are intractable, fall back to a custom week-strip with tap-to-toggle using LayoutAnimation (simpler gesture model). The custom approach would use the existing `Calendar` component conditionally rendered based on an `expanded` boolean state, with `LayoutAnimation.configureNext()` before toggling.

2. **ExpandableCalendar multi-dot marking support**
   - What we know: The base Calendar component supports `markingType="multi-dot"`. ExpandableCalendar extends CalendarList which extends Calendar.
   - What's unclear: Whether ExpandableCalendar properly renders multi-dot markings in its week-strip (collapsed) mode.
   - Recommendation: Test early. If multi-dot doesn't work in collapsed mode, fall back to simple `dot` marking with a single dot per day using the priority color.

3. **Balance summary -- aggregate or per-member net**
   - What we know: `get_household_balances` returns per-user net amounts. The design shows a single "You owe $X" or "You're owed $X."
   - What's unclear: Whether to show the sum of all positive (or all negative) amounts, or the single largest balance.
   - Recommendation: Show the current user's own net position: sum of all their debts vs credits. This is the `net_amount` for the current user from the RPC. If positive, show "You're owed $X". If negative, show "You owe $X". If zero, show "All settled up".

## Sources

### Primary (HIGH confidence)
- Existing codebase: `app/(app)/(tabs)/index.tsx`, `expenses.tsx`, `chores.tsx` -- current data fetching patterns
- Existing codebase: `components/ui/Avatar.tsx`, `Card.tsx`, `Badge.tsx`, `Button.tsx` -- Phase 6 design system
- Existing codebase: `lib/calendar-utils.ts` -- calendar dot and event logic
- Existing codebase: `lib/auth-context.tsx` -- session/household/profile data access
- Existing codebase: `lib/types/database.ts` -- complete type definitions
- Existing codebase: `lib/theme/colors.ts`, `tailwind.config.js` -- design tokens
- [react-native-calendars ExpandableCalendar docs](https://wix.github.io/react-native-calendars/docs/Components/ExpandableCalendar) -- component API
- [expo-linear-gradient docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- gradient component API

### Secondary (MEDIUM confidence)
- [react-native-calendars GitHub examples](https://github.com/wix/react-native-calendars/blob/master/example/src/screens/expandableCalendarScreen.tsx) -- ExpandableCalendar usage patterns
- [React Native LayoutAnimation docs](https://reactnative.dev/docs/layoutanimation) -- fallback animation approach

### Tertiary (LOW confidence)
- ExpandableCalendar multi-dot support in collapsed mode -- not explicitly confirmed in docs; needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the codebase
- Architecture: HIGH -- patterns derived directly from existing codebase code that is proven working
- Pitfalls: HIGH -- identified from actual code review of current implementation and known React Native calendar issues

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days -- stable libraries, no version changes expected)
