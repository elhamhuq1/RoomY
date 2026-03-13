# Phase 9: Groceries + Chores - Research

**Researched:** 2026-03-13
**Domain:** React Native UI redesign - Groceries tab + Chores tab (presentation layer)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Grocery list layout**: Compact one-line rows: circle checkbox, item name, who-added avatar on the right
- **Checked items move immediately** to the DONE section (not strikethrough-in-place)
- **DONE section collapsed by default** -- shows "DONE (5)" header, tap to expand
- **TO GET sorted** with most recently added items first
- **Quick-add input** positioned at top of list, above the TO GET section (always visible without scrolling)
- **Card-styled input field** with branded square add button
- **Add button** disabled/muted when input is empty, turns branded when text is entered
- **Enter/Return** on keyboard submits the item (fast multi-item entry)
- **After adding**: input clears, new item appears at top of TO GET list, no toast/flash
- **Chore stats row**: horizontal row of 3 equal-width cards: Pending (warning), Disputed (danger), Streak (brand)
- **Stats row scrolls** with content (not sticky)
- **Streak card** shows current streak count + personal best (e.g., "5 / Best: 12")
- **Disputed card** shows a count badge in danger color (e.g., red "2")
- **Chore list sections**: YOUR CHORES and HOUSEHOLD sections with overline headers
- **Chore row layout**: emoji icon in rounded container, chore name, assignee avatar, due date/overdue indicator
- **Overdue chores** get subtle red/danger background tint and red due date text
- **Disputed chores** use danger-tinted background with red borders
- **Completing a chore** shows a brief checkmark animation; if it extends the streak, stats card updates
- **Completed chores** hidden from sections (disappear until next recurrence)

### Claude's Discretion
- Exact animation timing for check-off and completion feedback
- Spacing and typography within cards and rows
- Empty state design for both screens
- Loading skeleton patterns
- How the streak personal best is calculated and displayed when there's no streak yet

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRUI-01 | Grocery list splits into "TO GET" and "DONE" sections with item counts in overline headers | Overline typography preset, collapsible DONE section pattern, item count derivation from existing filter logic |
| GRUI-02 | Grocery items show circle checkboxes (unchecked: empty circle, checked: brand fill with checkmark) | Custom circle checkbox component using View+Ionicons, brand color token |
| GRUI-03 | Grocery item rows show a member avatar indicating who added each item | Avatar component (size "xs" or "sm"), profile lookup by created_by field |
| GRUI-04 | Quick-add input uses card-styled input field with a branded square add button | Card component for container, conditional brand/muted button styling |
| CHUI-01 | Chores screen shows a stats row with pending (warning), disputed (danger), and streak (brand + fire emoji) cards | Card component, semantic color tokens, existing derived data (pendingCount, disputedChoreIds, streak) |
| CHUI-02 | Chore rows show emoji icons in rounded icon containers mapped by chore type | Emoji-to-chore mapping constant, View container with rounded style, Text for emoji rendering |
| CHUI-03 | Chores screen separates "YOUR CHORES" from "HOUSEHOLD" sections with overline headers | Overline typography preset, existing myChores/othersChores filter logic |
| CHUI-04 | Disputed chore rows use danger-tinted background and border for visual urgency | bg-red-50 + border-red-200 conditional styling, existing disputedChoreIds set |
</phase_requirements>

## Summary

Phase 9 is a presentation-layer redesign of two existing tab screens: groceries (`app/(app)/(tabs)/groceries.tsx`, 685 lines) and chores (`app/(app)/(tabs)/chores.tsx`, 772 lines). Both screens already have complete data fetching, real-time subscriptions, optimistic updates, and all business logic. The task is purely visual: replace old-style hardcoded colors, inline avatar circles, and inconsistent layouts with the Phase 6 design system (Avatar, Card, IconContainer, Badge, colors, typography presets).

The grocery screen needs the most structural change: the current "To Buy" / "Completed" sections become "TO GET" / "DONE" with overline headers showing counts, the DONE section becomes collapsible (collapsed by default), circle checkboxes replace square Ionicons checkboxes, member avatars appear on each row (requires profile lookup for `created_by`), and the add input gets Card styling with a branded square button. The chores screen needs a redesigned stats row (3 equal-width semantic cards replacing the current plain rounded Views), emoji icons in rounded containers replacing the current assignee-avatar-on-left pattern, overdue/disputed visual treatments, and a completion animation.

Both screens follow the established Phase 7/8 pattern: extract presentational components into `components/groceries/` and `components/chores/` directories, keep all data fetching in the parent tab screen, and pass typed props to children. No new packages are needed. No backend changes.

**Primary recommendation:** Create `components/groceries/` and `components/chores/` component directories mirroring the `components/expenses/` pattern. Restyle in two waves: groceries first (simpler -- fewer visual states), then chores (more complex -- stats cards, emoji mapping, disputed/overdue states, completion animation).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.81.5 | Core framework | Project standard |
| expo | ^54 | Platform layer | Project standard (SDK 54) |
| expo-router | ~6.0.23 | Navigation/routing | Project standard |
| nativewind | ^4.2.2 | Tailwind-style styling | Project standard (TW3) |
| @supabase/supabase-js | (installed) | Data fetching | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-gesture-handler | (installed) | Swipe-to-delete on grocery items | Already used via ReanimatedSwipeable |
| react-native-reanimated | (installed) | Completion animation, checkbox transition | Already installed, used by FAB and swipeable |
| @expo/vector-icons (Ionicons) | (bundled) | Icons for checkmarks, add button | Standard icon library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom circle checkbox | Ionicons checkbox/circle | Ionicons has square checkboxes only; circle needs custom View |
| Emoji Text for chore icons | Ionicons mapped icons | Emojis are more visually distinct and fun for chores; Ionicons are more uniform but less personality |
| react-native-reanimated for checkbox | LayoutAnimation | Simpler but less control over timing; Reanimated already available |

**Installation:**
```bash
# No new packages needed -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  groceries/
    QuickAddInput.tsx       # Card-styled input with branded add button
    GroceryItemRow.tsx      # Circle checkbox + name + avatar row
    SectionHeader.tsx       # Overline header with count ("TO GET (8)")
    EmptyState.tsx          # Empty grocery list state
    index.ts                # Barrel export
  chores/
    StatsRow.tsx            # 3 equal-width stat cards (pending/disputed/streak)
    ChoreRow.tsx            # Emoji icon + name + avatar + due date row
    EmptyState.tsx          # Empty chore list state
    index.ts                # Barrel export
app/(app)/(tabs)/
    groceries.tsx           # Parent screen (data fetching stays, rendering delegates to components)
    chores.tsx              # Parent screen (data fetching stays, rendering delegates to components)
```

### Pattern 1: Presentational Component Decomposition (Established Phase 7/8 Pattern)
**What:** Parent screen fetches all data, passes typed props to presentational children.
**When to use:** All screen components in this phase.
**Example:**
```typescript
// Source: Established pattern from expenses.tsx (Phase 8)
// Parent fetches data and derives sections
const uncheckedItems = items.filter(i => !i.is_checked && !i.archived_at);
const checkedItems = items.filter(i => i.is_checked && !i.archived_at);

// Children receive typed props -- no data fetching inside
<QuickAddInput
  value={newItemName}
  onChangeText={setNewItemName}
  onSubmit={addItem}
/>
<SectionHeader label="TO GET" count={uncheckedItems.length} />
{uncheckedItems.map(item => (
  <GroceryItemRow
    key={item.id}
    item={item}
    profile={profileMap[item.created_by]}
    onToggle={() => toggleCheck(item)}
    onDelete={() => deleteItem(item.id)}
  />
))}
```

### Pattern 2: Collapsible Section with State
**What:** DONE section collapsed by default, tap header to expand/collapse.
**When to use:** Grocery DONE section.
**Example:**
```typescript
const [doneExpanded, setDoneExpanded] = useState(false);

<Pressable onPress={() => setDoneExpanded(prev => !prev)}>
  <View className="flex-row items-center justify-between px-4 py-2">
    <Text className="text-overline text-neutral-secondary uppercase">
      DONE ({checkedItems.length})
    </Text>
    <Ionicons
      name={doneExpanded ? 'chevron-up' : 'chevron-down'}
      size={16}
      color={colors.neutral.secondary}
    />
  </View>
</Pressable>
{doneExpanded && checkedItems.map(item => (
  <GroceryItemRow key={item.id} item={item} isChecked onToggle={...} />
))}
```

### Pattern 3: Circle Checkbox Component
**What:** Custom circular checkbox: empty circle when unchecked, brand-filled circle with white checkmark when checked.
**When to use:** All grocery item rows.
**Example:**
```typescript
function CircleCheckbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View
        className={`h-6 w-6 rounded-full items-center justify-center ${
          checked
            ? 'bg-brand'
            : 'border-2 border-neutral-tertiary'
        }`}
      >
        {checked && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>
    </Pressable>
  );
}
```

### Pattern 4: Emoji Icon Container for Chores
**What:** Map chore names to emoji icons, display in a rounded container like IconContainer but with emoji Text instead of Ionicons.
**When to use:** Chore rows (CHUI-02).
**Example:**
```typescript
// Chore name -> emoji mapping
const CHORE_EMOJI_MAP: Record<string, string> = {
  'dishes': '🍽️',
  'trash': '🗑️',
  'vacuum': '🧹',
  'clean bathroom': '🚿',
  'mop floors': '🧹',
  'wipe counters': '✨',
  'laundry': '👕',
  'cook': '🍳',
};

function getChoreEmoji(choreName: string): string {
  const lower = choreName.toLowerCase();
  for (const [key, emoji] of Object.entries(CHORE_EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '📋'; // default fallback
}

// Rendered in a rounded container
<View className="h-10 w-10 rounded-xl bg-brand-light items-center justify-center">
  <Text style={{ fontSize: 20 }}>{getChoreEmoji(chore.name)}</Text>
</View>
```

### Pattern 5: Conditional Danger Styling for Disputed/Overdue Rows
**What:** Apply danger-tinted background and red border to disputed chore rows, subtle red tint to overdue rows.
**When to use:** Chore rows that are disputed (CHUI-04) or overdue.
**Example:**
```typescript
const isDisputed = disputedChoreIds.has(chore.id);
const isOverdue = getOverdueDays(chore.next_due_at) !== null;

<View
  className={`flex-row items-center px-4 py-3 ${
    isDisputed
      ? 'bg-red-50 border border-red-200'
      : isOverdue
        ? 'bg-red-50/50'
        : 'bg-white'
  }`}
>
```

### Pattern 6: Stats Card Row
**What:** Three equal-width stat cards in a horizontal row with semantic colors.
**When to use:** Chores stats section (CHUI-01).
**Example:**
```typescript
<View className="flex-row gap-3 px-4 pt-4 pb-2">
  <Card className="flex-1 items-center py-3">
    <Text className="text-key-number text-semantic-warning">{pendingCount}</Text>
    <Text className="text-metadata text-neutral-secondary">Pending</Text>
  </Card>
  <Card className="flex-1 items-center py-3">
    <View className="flex-row items-center gap-1">
      <Text className="text-key-number text-semantic-error">{disputedCount}</Text>
    </View>
    <Text className="text-metadata text-neutral-secondary">Disputed</Text>
  </Card>
  <Card className="flex-1 items-center py-3">
    <Text className="text-key-number text-brand">{streak} 🔥</Text>
    <Text className="text-metadata text-neutral-secondary">
      Best: {personalBest}
    </Text>
  </Card>
</View>
```

### Anti-Patterns to Avoid
- **Inline AVATAR_COLORS arrays:** Both screens currently use hardcoded `AVATAR_COLORS` arrays with `getInitials()`. Replace ALL instances with the `Avatar` component from `components/ui/Avatar.tsx`. The chores screen uses AVATAR_COLORS in the main render AND the swap modal.
- **Inline getInitials functions:** Both screens define their own `getInitials()` helper. Remove these -- the Avatar component handles initials internally.
- **Data fetching inside child components:** Keep all Supabase calls in the parent screen. Children are presentational only.
- **Quantity stepper in the main row:** The current grocery screen shows a QuantityStepper inline. Per CONTEXT.md, rows should be compact one-line: checkbox, name, avatar. The quantity stepper should only appear in the edit modal (which already exists).
- **Square checkboxes (Ionicons `checkbox`/`square-outline`):** Replace with custom circle checkbox per GRUI-02.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Member avatars | Inline colored circles with AVATAR_COLORS | `<Avatar userId={id} name={name} size="xs" />` | Consistent gradient, deterministic per-user, colored shadow |
| Card containers | Inline rounded bg-white views | `<Card>` component | Handles Android elevation, consistent border/radius/shadow |
| Status badges | Inline View + Text with manual colors | `<Badge label="Overdue" variant="error" />` | Standardized pill shape, semantic color mapping |
| Section headers | Manual Text with hardcoded styles | `<Text className="text-overline text-neutral-secondary uppercase">` | Matches design system overline preset |
| Stat card containers | Inline bg-colored rounded Views | `<Card className="flex-1">` with semantic text colors | Consistent elevation, border, shadow |
| Currency formatting | Template literals | `Intl.NumberFormat` | Already established pattern in project |
| Swipe-to-delete | Custom gesture handling | `ReanimatedSwipeable` (already used) | Already implemented and working in current grocery screen |

**Key insight:** Phase 6 built a complete design system. Both grocery and chore screens predate Phase 6 and use none of these components. The rendering layer needs replacement but all data fetching, optimistic updates, realtime subscriptions, and business logic remain untouched.

## Common Pitfalls

### Pitfall 1: Profile Lookup for Grocery Item `created_by`
**What goes wrong:** Grocery items have a `created_by` field but the current screen never looks up profiles for it. Adding member avatars (GRUI-03) requires fetching profiles for all unique `created_by` user IDs.
**Why it happens:** The original grocery screen didn't show who added each item. The avatar requirement is new to this phase.
**How to avoid:** After fetching grocery items, collect unique `created_by` IDs, batch-fetch profiles, and build a `Record<string, Profile>` map. Pass this map to the GroceryItemRow component. Use the established two-query pattern (IDs first, then profiles).
**Warning signs:** Avatars show "?" for all items, or N+1 query per item.

### Pitfall 2: Streak Personal Best Calculation
**What goes wrong:** The streak "personal best" isn't stored anywhere in the database. The current `calculateStreak()` function only counts the current streak (consecutive non-reverted completions).
**Why it happens:** Personal best requires scanning all completions to find the longest consecutive run, not just the current one from the head of the list.
**How to avoid:** Calculate personal best by iterating through all completions and tracking the longest consecutive non-reverted run. Since completions are already fetched (limited to 50), this can be done client-side. For "no streak yet" state, show "0 / Best: 0" or a dash.
**Warning signs:** Personal best always equals current streak, or shows 0 when user has completed chores before.

### Pitfall 3: Emoji Rendering Inconsistency Across Platforms
**What goes wrong:** Emoji appearance differs between iOS and Android. Some emojis may not render or may look different.
**Why it happens:** Each platform uses its own emoji font. Complex emojis (skin tones, ZWJ sequences) can break on older Android versions.
**How to avoid:** Use simple, single-codepoint emojis for the chore mapping. Test on both platforms. The fallback emoji (clipboard) should be universally supported. Avoid compound emojis.
**Warning signs:** Missing emoji squares on Android, different visual appearance than expected.

### Pitfall 4: Collapsible DONE Section Animation
**What goes wrong:** Toggling the DONE section shows/hides items abruptly without smooth transition.
**Why it happens:** Simply conditionally rendering items causes an instant layout jump.
**How to avoid:** Use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` before toggling the `doneExpanded` state. This is the simplest approach for expand/collapse in React Native. LayoutAnimation is already available without additional imports from react-native.
**Warning signs:** Jarring jump when expanding/collapsing DONE section.

### Pitfall 5: Chore Completion Animation Timing
**What goes wrong:** The completion checkmark animation fires but the chore disappears before the animation completes (due to data refetch after `complete_chore` RPC).
**Why it happens:** The `handleComplete` function calls `fetchData()` immediately after the RPC succeeds, which removes the completed chore from the list.
**How to avoid:** Add a brief delay (300-500ms) before refetching data after completion, allowing the checkmark animation to play. Use `setTimeout` or an Animated sequence that calls fetchData on completion.
**Warning signs:** Chore disappears instantly without visible feedback.

### Pitfall 6: Stats Row Disputed Count vs. Disputed Set
**What goes wrong:** The current screen tracks `disputedChoreIds` as a Set for row styling, but the stats card needs a count. These could drift if not derived from the same source.
**Why it happens:** The count and the set are derived independently.
**How to avoid:** Derive the disputed count directly from `disputedChoreIds.size`. Single source of truth.
**Warning signs:** Stats card shows different disputed count than actual number of red-bordered rows.

## Code Examples

Verified patterns from the existing codebase:

### Using Avatar Component for Grocery Item Creator
```typescript
// Source: components/ui/Avatar.tsx (Phase 6)
import { Avatar } from '@/components/ui/Avatar';

// In grocery item row -- show who added the item
<Avatar
  userId={item.created_by}
  name={profileMap[item.created_by]?.display_name ?? '?'}
  size="xs"  // 24px -- compact for inline rows
/>
```

### Overline Section Header with Count
```typescript
// Source: tailwind.config.js text-overline preset
// text-overline = 11px, lineHeight 14px, fontWeight 600, letterSpacing 0.1em
<Text className="text-overline text-neutral-secondary uppercase mb-2 px-4">
  TO GET ({uncheckedItems.length})
</Text>
```

### Card-Styled Quick Add Input
```typescript
// Source: components/ui/Card.tsx for container, existing addItem pattern
import { Card } from '@/components/ui/Card';

<Card className="mx-4 mt-4 p-0">
  <View className="flex-row items-center p-2">
    <TextInput
      className="flex-1 px-3 py-2 text-body text-neutral-text"
      placeholder="Add an item..."
      placeholderTextColor={colors.neutral.tertiary}
      value={newItemName}
      onChangeText={setNewItemName}
      onSubmitEditing={addItem}
      returnKeyType="done"
    />
    <Pressable
      className={`h-10 w-10 rounded-xl items-center justify-center ${
        newItemName.trim() ? 'bg-brand' : 'bg-neutral-surface'
      }`}
      onPress={addItem}
      disabled={!newItemName.trim()}
    >
      <Ionicons
        name="add"
        size={22}
        color={newItemName.trim() ? '#fff' : colors.neutral.tertiary}
      />
    </Pressable>
  </View>
</Card>
```

### Chore Stats Card with Semantic Colors
```typescript
// Source: components/ui/Card.tsx, tailwind.config.js presets
import { Card } from '@/components/ui/Card';

<View className="flex-row gap-3 px-4 pt-4 pb-2">
  <Card className="flex-1 items-center py-3">
    <Text className="text-key-number text-semantic-warning">{pendingCount}</Text>
    <Text className="text-metadata text-neutral-secondary">Pending</Text>
  </Card>
  <Card className="flex-1 items-center py-3">
    <Text className="text-key-number text-semantic-error">{disputedCount}</Text>
    <Text className="text-metadata text-neutral-secondary">Disputed</Text>
  </Card>
  <Card className="flex-1 items-center py-3">
    <View className="flex-row items-center">
      <Text className="text-key-number text-brand">{streak}</Text>
      <Text style={{ fontSize: 20, marginLeft: 4 }}>🔥</Text>
    </View>
    <Text className="text-metadata text-neutral-secondary">Best: {personalBest}</Text>
  </Card>
</View>
```

### Emoji Icon Container for Chore Rows
```typescript
// Custom container since IconContainer uses Ionicons, but we need emoji Text
<View
  className="h-10 w-10 rounded-xl bg-brand-light items-center justify-center mr-3"
>
  <Text style={{ fontSize: 20 }}>{getChoreEmoji(chore.name)}</Text>
</View>
```

### Disputed Row with Danger Styling
```typescript
// Conditional className for disputed chore rows
const isDisputed = disputedChoreIds.has(chore.id);

<View
  className={`flex-row items-center px-4 py-3 ${
    isDisputed ? 'bg-red-50 border border-red-200 rounded-xl' : 'bg-white'
  }`}
>
  {/* ... row content ... */}
</View>
```

### Profile Batch Fetch for Grocery Creators
```typescript
// Source: Established two-query pattern from expenses.tsx, chores.tsx
// After fetching grocery items, batch-fetch creator profiles
const creatorIds = [...new Set(items.map(i => i.created_by))];
if (creatorIds.length > 0) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', creatorIds);
  const profileMap: Record<string, Profile> = {};
  profiles?.forEach(p => { profileMap[p.id] = p as Profile; });
  setCreatorProfiles(profileMap);
}
```

### Personal Best Streak Calculation
```typescript
// Calculate longest consecutive non-reverted streak from completion history
function calculatePersonalBest(completions: ChoreCompletion[]): number {
  let best = 0;
  let current = 0;
  for (const c of completions) {
    if (c.is_reverted) {
      current = 0;
    } else {
      current++;
      best = Math.max(best, current);
    }
  }
  return best;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded AVATAR_COLORS array | Avatar component with gradient pairs | Phase 6 (2026-03-11) | Replace all inline avatar circles in both screens |
| Square Ionicons checkboxes | Custom circle checkboxes (brand-filled) | Phase 9 (this phase) | New visual for grocery items per GRUI-02 |
| "To Buy" / "Completed" section labels | "TO GET" / "DONE" overline headers with counts | Phase 9 (this phase) | Matches design system overline preset |
| Plain rounded View stat cards | Card component with semantic text colors | Phase 9 (this phase) | Consistent elevation and styling |
| Ionicons for chore icons | Emoji text in rounded containers | Phase 9 (this phase) | More personality, visually distinct per chore type |
| Inline QuantityStepper in grocery rows | Compact one-line rows (checkbox + name + avatar) | Phase 9 (this phase) | Quantity editing stays in modal only |
| Always-visible checked items | Collapsible DONE section (collapsed by default) | Phase 9 (this phase) | Cleaner focus on unchecked items |

**Deprecated/outdated:**
- Old inline avatar circles (`AVATAR_COLORS` + `getInitials`) in both groceries.tsx and chores.tsx: replaced by Avatar component
- Square checkbox icons (`checkbox` / `square-outline`): replaced by custom circle checkbox
- QuantityStepper inline in grocery row: moved to edit modal only
- "To Buy" / "Completed" section names: replaced by "TO GET" / "DONE"
- Plain stat summary cards in chores: replaced by Card component with semantic colors

## Open Questions

1. **Chore completion animation approach**
   - What we know: User wants a "brief checkmark animation" on completion. Reanimated is available. The completion flow currently uses an Alert confirmation before the RPC call.
   - What's unclear: Whether to animate the checkmark inside the row before it disappears, or show an overlay animation, or animate the row sliding out.
   - Recommendation: Use a simple scale+opacity animation on the checkmark button (scale up to 1.3, then back to 1.0, with opacity fade) lasting ~400ms. After the animation, trigger the RPC and refetch. Keep the existing Alert confirmation -- animate after user confirms.

2. **Empty state design for both screens**
   - What we know: The expenses screen has a Card-based empty state with icon + text + button. Both grocery and chore screens have existing empty states but with old styling.
   - What's unclear: Exact icon/text/illustration for each screen.
   - Recommendation: Follow the expenses EmptyState pattern: Card with centered icon (brand-light bg circle), heading text, subtext, and optionally an action button. Groceries: cart icon + "Your grocery list is empty" + "Add items above to get started". Chores: checkbox icon + "No chores yet" + suggested chores grid (keep existing suggested chores UI but restyle with Card/Avatar components).

3. **Keyboard behavior after quick-add submit**
   - What we know: CONTEXT.md says "Enter/Return on keyboard submits the item (fast multi-item entry)" and "input clears, no toast." The current screen calls `Keyboard.dismiss()` after adding.
   - What's unclear: Should keyboard stay open for rapid multi-item entry, or dismiss?
   - Recommendation: Keep keyboard open and keep focus on the input after adding. This supports the "fast multi-item entry" use case. Remove the `Keyboard.dismiss()` call. The `onSubmitEditing` handler already handles this naturally if we don't dismiss.

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/(app)/(tabs)/groceries.tsx` -- current grocery screen (685 lines), all data logic preserved
- Project codebase: `app/(app)/(tabs)/chores.tsx` -- current chore screen (772 lines), all data logic preserved
- Project codebase: `components/ui/Avatar.tsx` -- Avatar component API (6 sizes, gradient pairs, userId-based color)
- Project codebase: `components/ui/Card.tsx` -- Card component (white bg, border, radius, shadow, Android elevation)
- Project codebase: `components/ui/Badge.tsx` -- Badge component (6 semantic variants)
- Project codebase: `components/ui/IconContainer.tsx` -- IconContainer (40x40, 6 variants)
- Project codebase: `components/ui/Button.tsx` -- Button component (primary/outline variants)
- Project codebase: `components/expenses/` -- Phase 8 component decomposition pattern (barrel exports, typed props, presentational children)
- Project codebase: `tailwind.config.js` -- typography presets (text-overline, text-key-number, text-card-title, text-body, text-metadata, text-section-heading)
- Project codebase: `lib/theme/colors.ts` -- color tokens (brand, semantic, neutral)
- Project codebase: `lib/types/database.ts` -- TypeScript types (GroceryItem, Chore, ChoreCompletion, Profile)

### Secondary (MEDIUM confidence)
- React Native LayoutAnimation API -- for smooth expand/collapse of DONE section (standard RN API, no external dep)
- React Native Animated / Reanimated -- for checkmark completion animation (library already installed)

### Tertiary (LOW confidence)
- Emoji cross-platform rendering -- assumed simple emojis render correctly on both iOS and Android (needs visual verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used, versions verified from project
- Architecture: HIGH -- component decomposition mirrors established Phase 7/8 pattern exactly
- Pitfalls: HIGH -- identified from actual codebase analysis (profile lookup gap, streak calculation, animation timing)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- presentation layer only, no library changes expected)
