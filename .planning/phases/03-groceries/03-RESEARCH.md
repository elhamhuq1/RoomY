# Phase 3: Groceries - Research

**Researched:** 2026-03-11
**Domain:** Real-time collaborative grocery list with Supabase Realtime + expense integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Each item has a name and a quantity (separate +/- stepper field, not parsed from text)
- Single flat list, newest items at top -- no categories or sections
- Swipe left to delete, tap item to edit name/quantity
- Default quantity is 1
- No explicit "shopping mode" -- checkboxes are always visible
- Checked-off items slide to a "Completed" section at the bottom, grayed out
- Fully collaborative -- any household member can check off items at any time
- A prominent "Complete Trip" button appears when items have been checked off
- Single receipt total -- user enters one number from the receipt
- Payer picker always shown (don't assume who paid)
- Member picker to select which household members are splitting this trip (not always all members)
- After trip completion, the trip is archived (items + total kept in history) and a fresh list starts
- Creates a standard expense using the existing Phase 2 expense system
- Instant, silent updates -- items appear/check off with subtle animation, no toasts
- No attribution -- items are shared, no indication of who added what
- First-check wins on conflicts -- no error messages, second person just sees it already checked
- Online only -- requires connection, no offline queue

### Claude's Discretion
- Animation style and timing for real-time updates
- "Complete Trip" button placement and styling
- Trip archive UI and how to access past trips
- Empty list state design

### Deferred Ideas (OUT OF SCOPE)
- Per-item price tracking / itemized splitting -- user decided this adds complexity without real value
- Offline support with sync -- deferred, most stores have signal
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GROC-01 | User can add items to a shared grocery list | DB schema (grocery_items table), Supabase insert pattern, add-item UI with name + quantity stepper |
| GROC-02 | User can check off items from the grocery list in real-time | Supabase Realtime postgres_changes subscription filtered by household_id, optimistic UI updates, checkbox toggle with UPDATE query |
| GROC-03 | When shopping is complete, user can auto-create a split expense from the total | "Complete Trip" flow: archive items to grocery_trips table, create expense + expense_splits using existing Phase 2 pattern, reset active list |
</phase_requirements>

## Summary

Phase 3 adds a shared, real-time grocery list to the existing RoomY app. The core technical challenges are: (1) Supabase Realtime subscriptions for live collaboration, (2) a "Complete Trip" flow that archives the current list and creates a split expense via the existing Phase 2 expense system, and (3) swipe-to-delete gestures requiring react-native-gesture-handler.

The project already has all major infrastructure in place -- Supabase client, auth context with household data, NativeWind styling, expo-router navigation, and the full expense creation pattern (expenses + expense_splits tables with RLS). The groceries tab already exists as a placeholder. The main new technical surface is Supabase Realtime (WebSocket-based postgres_changes) and the swipe gesture library.

The DB schema needs two new tables: `grocery_items` (the active shared list) and `grocery_trips` (archived completed shopping runs). Real-time updates use `supabase.channel().on('postgres_changes', ...)` filtered by `household_id=eq.<id>` on the `grocery_items` table. The "Complete Trip" action is a multi-step operation: insert a trip record, move items to the trip archive, create an expense + splits, and clear the active list.

**Primary recommendation:** Use Supabase Realtime postgres_changes with `eq` filter on `household_id` for live updates, `react-native-gesture-handler` Swipeable for swipe-to-delete, and a Supabase RPC function for the atomic "complete trip" transaction.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.0 | Realtime subscriptions + CRUD | Already installed, provides `.channel().on('postgres_changes', ...)` API |
| react-native-gesture-handler | ~2.24.0 | Swipe-to-delete gesture | Standard for RN gesture handling; `ReanimatedSwipeable` component for swipe actions |
| react-native-reanimated | ~4.1.1 | Swipe animation + list transitions | Already installed; powers ReanimatedSwipeable and LayoutAnimation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo/vector-icons (Ionicons) | ^15.0.2 | Icons for add, delete, cart, checkmark | Already installed |
| expo-router | ~6.0.23 | Navigation between list and trip-complete screens | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-gesture-handler Swipeable | Custom PanGestureHandler | Swipeable is a pre-built component that handles the entire swipe-to-reveal pattern; custom PanGestureHandler requires manually managing thresholds, spring animations, and action layout |
| Separate grocery_trips archive table | Soft-delete with `completed_at` column on items | Separate table keeps active list queries fast and simple; soft-delete would require filtering on every query |

**Installation:**
```bash
npx expo install react-native-gesture-handler
```

Note: `react-native-gesture-handler` is already a transitive dependency (via react-native-screens) but needs to be installed as a direct dependency for Expo Go to resolve it properly and for the `ReanimatedSwipeable` import to work.

## Architecture Patterns

### Recommended Project Structure
```
app/(app)/
  (tabs)/groceries.tsx          # Main grocery list screen (replaces placeholder)
  groceries/complete-trip.tsx   # Trip completion screen (amount, payer, split)
  groceries/trip-history.tsx    # Past trips archive view
supabase/migrations/
  00003_groceries.sql           # New tables, RLS, publication, RPC function
lib/types/database.ts           # Add GroceryItem, GroceryTrip types
```

### Pattern 1: Supabase Realtime Subscription with Cleanup
**What:** Subscribe to postgres_changes on grocery_items filtered by household_id, merge changes into local state optimistically.
**When to use:** On the groceries tab screen, active while the screen is mounted.
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
useEffect(() => {
  if (!household?.id) return;

  const channel = supabase
    .channel(`grocery-${household.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'grocery_items',
        filter: `household_id=eq.${household.id}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [payload.new as GroceryItem, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) =>
            prev.map((item) =>
              item.id === (payload.new as GroceryItem).id
                ? (payload.new as GroceryItem)
                : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) =>
            prev.filter((item) => item.id !== payload.old.id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [household?.id]);
```

### Pattern 2: Optimistic UI with Supabase
**What:** Update local state immediately before the server confirms, then let Realtime reconcile.
**When to use:** Check/uncheck items, add items -- any mutation where latency would feel sluggish.
**Example:**
```typescript
async function toggleItemChecked(item: GroceryItem) {
  // Optimistic update
  setItems((prev) =>
    prev.map((i) =>
      i.id === item.id ? { ...i, is_checked: !i.is_checked } : i
    )
  );

  // Server update -- Realtime will also fire, but state is already correct
  const { error } = await supabase
    .from('grocery_items')
    .update({ is_checked: !item.is_checked })
    .eq('id', item.id);

  // If error, revert
  if (error) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_checked: item.is_checked } : i
      )
    );
  }
}
```

### Pattern 3: Atomic Trip Completion via RPC
**What:** Use a Supabase RPC function to atomically archive items, create the expense, and clear the active list in one transaction.
**When to use:** When the user taps "Complete Trip" and confirms the total/split.
**Example:**
```sql
-- Database function for atomic trip completion
CREATE OR REPLACE FUNCTION complete_grocery_trip(
  p_household_id UUID,
  p_total_amount NUMERIC,
  p_paid_by UUID,
  p_split_user_ids UUID[],
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip_id UUID;
  v_expense_id UUID;
  v_share NUMERIC;
  v_user_id UUID;
BEGIN
  -- 1. Create trip record
  INSERT INTO public.grocery_trips (household_id, total_amount, paid_by, created_by)
  VALUES (p_household_id, p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_trip_id;

  -- 2. Archive checked items to the trip
  UPDATE public.grocery_items
  SET trip_id = v_trip_id, archived_at = now()
  WHERE household_id = p_household_id AND is_checked = true AND trip_id IS NULL;

  -- 3. Delete unchecked items (fresh start)
  DELETE FROM public.grocery_items
  WHERE household_id = p_household_id AND is_checked = false AND trip_id IS NULL;

  -- 4. Create expense
  INSERT INTO public.expenses (household_id, description, amount, paid_by, created_by)
  VALUES (p_household_id, 'Grocery trip', p_total_amount, p_paid_by, p_created_by)
  RETURNING id INTO v_expense_id;

  -- 5. Create equal splits
  v_share := ROUND(p_total_amount / array_length(p_split_user_ids, 1), 2);
  FOREACH v_user_id IN ARRAY p_split_user_ids
  LOOP
    INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
    VALUES (v_expense_id, v_user_id, v_share);
  END LOOP;

  RETURN json_build_object(
    'trip_id', v_trip_id,
    'expense_id', v_expense_id
  );
END;
$$;
```

### Pattern 4: Swipe-to-Delete with ReanimatedSwipeable
**What:** Use react-native-gesture-handler's ReanimatedSwipeable for iOS-style swipe-to-delete.
**When to use:** Each grocery list item row.
**Example:**
```typescript
// Source: https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

function renderRightActions() {
  return (
    <View className="items-center justify-center bg-red-500 px-6">
      <Ionicons name="trash" size={24} color="#fff" />
    </View>
  );
}

<ReanimatedSwipeable
  renderRightActions={renderRightActions}
  onSwipeableOpen={() => handleDeleteItem(item.id)}
  rightThreshold={80}
>
  {/* Item row content */}
</ReanimatedSwipeable>
```

### Pattern 5: Two-Section List (Active + Completed)
**What:** Split the item array into unchecked (top) and checked (bottom, grayed) sections.
**When to use:** Main grocery list rendering.
**Example:**
```typescript
const uncheckedItems = items
  .filter((i) => !i.is_checked && !i.archived_at)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const checkedItems = items
  .filter((i) => i.is_checked && !i.archived_at)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const hasCheckedItems = checkedItems.length > 0;
```

### Anti-Patterns to Avoid
- **Subscribing to all tables instead of filtering:** Always use `filter: 'household_id=eq.<id>'` to avoid receiving events for other households. Without the filter, RLS still protects data but the client receives and processes unnecessary events.
- **Not cleaning up channels:** Always call `supabase.removeChannel(channel)` in the useEffect cleanup. Leaking channels causes "TooManyChannels" errors and memory issues.
- **Using FlatList for a short grocery list:** ScrollView is simpler and sufficient for lists under ~100 items. FlatList adds complexity (renderItem, keyExtractor) without benefit for small datasets.
- **Manually splitting expenses in client code:** Use an RPC function for the "complete trip" operation. The multi-step process (archive items + create expense + create splits) must be atomic to avoid partial states.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipe-to-delete gesture | Custom PanResponder / PanGestureHandler logic | `ReanimatedSwipeable` from react-native-gesture-handler | Handles thresholds, spring physics, action panel reveal, works on both platforms |
| Real-time sync | Polling with setInterval | Supabase Realtime `postgres_changes` | WebSocket-based, zero-latency, automatic RLS filtering, built into supabase-js |
| Atomic multi-table transaction | Sequential client-side inserts/updates | Supabase RPC function (SECURITY DEFINER) | Single round-trip, all-or-nothing transaction, no partial state if connection drops |
| Penny-accurate expense splitting | Manual Math.round() logic | Reuse `calculateEqualSplits()` from Phase 2 add.tsx (or put it in the RPC) | Handles remainder distribution without rounding errors |

**Key insight:** The "Complete Trip" flow involves 5 DB operations across 4 tables. Doing this client-side risks partial completion if the user loses connection mid-flow. A single RPC function handles it atomically.

## Common Pitfalls

### Pitfall 1: Realtime Table Not Added to Publication
**What goes wrong:** Subscription connects but never receives any events.
**Why it happens:** Supabase Realtime only broadcasts changes for tables explicitly added to the `supabase_realtime` publication.
**How to avoid:** Include `ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;` in the migration.
**Warning signs:** Channel status shows "subscribed" but no events fire on INSERT/UPDATE/DELETE.

### Pitfall 2: Missing Replica Identity for Non-PK Filters
**What goes wrong:** Filter `household_id=eq.<id>` on postgres_changes doesn't work for UPDATE events.
**Why it happens:** By default, Postgres WAL only includes primary key columns. Filtering on `household_id` (a non-PK column) requires the column to be in the WAL output.
**How to avoid:** Set `ALTER TABLE grocery_items REPLICA IDENTITY FULL;` in the migration.
**Warning signs:** INSERT events filter correctly, but UPDATE events are missed or include all updates.

### Pitfall 3: Double State Updates from Optimistic + Realtime
**What goes wrong:** Item appears twice in the list, or checkbox flickers.
**Why it happens:** Optimistic update sets state immediately, then the Realtime event fires and tries to insert the same item again.
**How to avoid:** In the Realtime handler, for INSERT events, check if the item already exists in state (by ID) before adding. For UPDATE events, always replace the existing item (idempotent). Pattern: `setItems(prev => prev.some(i => i.id === newItem.id) ? prev.map(i => i.id === newItem.id ? newItem : i) : [newItem, ...prev])`.
**Warning signs:** Items momentarily duplicate after adding, or checkbox state flickers on toggle.

### Pitfall 4: DELETE Events Cannot Be Filtered
**What goes wrong:** App receives DELETE events from all households, not just the current one.
**Why it happens:** Supabase Realtime limitation: "You can't filter Delete events when tracking Postgres Changes."
**How to avoid:** In the DELETE handler, match against the local items array (by `payload.old.id`) rather than trusting the filter. Since you only have local items for the current household, this naturally filters correctly.
**Warning signs:** None visible (it works), but be aware for debugging.

### Pitfall 5: RLS with SECURITY DEFINER Functions and Realtime
**What goes wrong:** Realtime events are not delivered despite correct RLS policies.
**Why it happens:** The existing `get_user_household_ids()` function is SECURITY DEFINER. Realtime checks SELECT policies. If the SELECT policy uses this function, it should work, but complex policy chains can cause performance issues.
**How to avoid:** Keep RLS policies on grocery_items simple -- use `household_id IN (SELECT public.get_user_household_ids())` for SELECT, same pattern as expenses. This pattern is already proven in Phase 1 and 2.
**Warning signs:** Realtime connection is slow, or events intermittently missing.

### Pitfall 6: GestureHandlerRootView Missing
**What goes wrong:** Swipeable component doesn't respond to gestures, or app crashes.
**Why it happens:** react-native-gesture-handler requires a `GestureHandlerRootView` wrapper at the app root.
**How to avoid:** Wrap the root layout in `GestureHandlerRootView`. Expo Router may handle this automatically in newer versions, but verify. Add it to `app/_layout.tsx` if gestures don't work.
**Warning signs:** Swipe gesture has no effect, console warning about missing root view.

### Pitfall 7: Channel Name Collisions
**What goes wrong:** Multiple subscriptions interfere with each other, events are lost or duplicated.
**Why it happens:** Using a generic channel name like `'groceries'` across multiple components or re-renders.
**How to avoid:** Include the household_id in the channel name: `supabase.channel(\`grocery-\${household.id}\`)`. This ensures uniqueness.
**Warning signs:** Events stop after navigating away and back, or duplicate events fire.

## Code Examples

### Database Schema for Grocery Items
```sql
-- Source: Project patterns from 00001_foundation.sql and 00002_expenses.sql

-- Active grocery list items
CREATE TABLE grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  is_checked BOOLEAN DEFAULT false,
  trip_id UUID REFERENCES grocery_trips(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Completed shopping trips (archive)
CREATE TABLE grocery_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grocery_items_household ON grocery_items(household_id)
  WHERE trip_id IS NULL;  -- partial index: only active items
CREATE INDEX idx_grocery_items_trip ON grocery_items(trip_id);
CREATE INDEX idx_grocery_trips_household ON grocery_trips(household_id);

-- Realtime: MUST enable for grocery_items
ALTER TABLE grocery_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;

-- RLS
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_trips ENABLE ROW LEVEL SECURITY;

-- Grocery items: household members can CRUD
CREATE POLICY "Members can view grocery items"
  ON grocery_items FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can add grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update grocery items"
  ON grocery_items FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can delete grocery items"
  ON grocery_items FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- Grocery trips: household members can view
CREATE POLICY "Members can view grocery trips"
  ON grocery_trips FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

CREATE POLICY "Members can create grocery trips"
  ON grocery_trips FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_household_ids())
    AND created_by = auth.uid()
  );
```

### Add Item with Optimistic Insert
```typescript
async function addItem(name: string, quantity: number) {
  if (!household?.id || !user?.id) return;

  const tempId = crypto.randomUUID();
  const optimisticItem: GroceryItem = {
    id: tempId,
    household_id: household.id,
    name: name.trim(),
    quantity,
    is_checked: false,
    trip_id: null,
    archived_at: null,
    created_by: user.id,
    created_at: new Date().toISOString(),
  };

  // Optimistic add
  setItems((prev) => [optimisticItem, ...prev]);

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      household_id: household.id,
      name: name.trim(),
      quantity,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Remove optimistic item on failure
    setItems((prev) => prev.filter((i) => i.id !== tempId));
    return;
  }

  // Replace temp ID with real ID (Realtime may also do this)
  setItems((prev) =>
    prev.map((i) => (i.id === tempId ? (data as GroceryItem) : i))
  );
}
```

### Quantity Stepper Component
```typescript
function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center rounded-lg bg-surface-100">
      <Pressable
        className="px-3 py-2 active:bg-surface-200"
        onPress={() => onChange(Math.max(1, value - 1))}
      >
        <Ionicons name="remove" size={18} color="#9ca3af" />
      </Pressable>
      <Text className="min-w-[24px] text-center text-base font-semibold text-gray-800">
        {value}
      </Text>
      <Pressable
        className="px-3 py-2 active:bg-surface-200"
        onPress={() => onChange(value + 1)}
      >
        <Ionicons name="add" size={18} color="#9ca3af" />
      </Pressable>
    </View>
  );
}
```

### Complete Trip RPC Call from Client
```typescript
async function completeTrip(
  totalAmount: number,
  payerId: string,
  splitMemberIds: string[]
) {
  if (!household?.id || !user?.id) return;

  const { data, error } = await supabase.rpc('complete_grocery_trip', {
    p_household_id: household.id,
    p_total_amount: totalAmount,
    p_paid_by: payerId,
    p_split_user_ids: splitMemberIds,
    p_created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Clear local items (Realtime DELETE events will also fire)
  setItems([]);
  return data;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| supabase.from().on() realtime | supabase.channel().on('postgres_changes', ...) | supabase-js v2 (2023) | Channel-based API, explicit subscribe/unsubscribe |
| Custom swipe with PanResponder | ReanimatedSwipeable from react-native-gesture-handler | RNGH 2.14+ (2024) | Drop-in component, works with Reanimated, no custom physics code |
| Polling for list updates | Supabase Realtime postgres_changes with filter | Supabase v2 (2023) | Instant updates via WebSocket, filter support reduces noise |

**Deprecated/outdated:**
- `supabase.from('table').on('*', callback)` -- this was the v1 API. Use `.channel().on('postgres_changes', ...)` instead.
- `Swipeable` from `react-native-gesture-handler` -- deprecated in favor of `ReanimatedSwipeable` which uses Reanimated for smoother animations.

## Open Questions

1. **GestureHandlerRootView wrapper**
   - What we know: react-native-gesture-handler requires a root wrapper for gestures to work. Expo Router may provide this automatically in SDK 54.
   - What's unclear: Whether Expo Router SDK 54 already wraps in GestureHandlerRootView.
   - Recommendation: Test without the wrapper first. If swipe gestures don't respond, add `<GestureHandlerRootView style={{ flex: 1 }}>` to `app/_layout.tsx`.

2. **Realtime performance with SECURITY DEFINER RLS**
   - What we know: The project uses `get_user_household_ids()` SECURITY DEFINER function in all RLS policies. Supabase Realtime checks SELECT policies for every change event.
   - What's unclear: Whether the SECURITY DEFINER function causes performance degradation with Realtime at the current scale (2-4 user households).
   - Recommendation: Proceed with the existing RLS pattern. At 2-4 users per household, performance is not a concern. Monitor if latency exceeds ~200ms.

3. **Handling unchecked items on "Complete Trip"**
   - What we know: User decided archived items + total kept in history, fresh list starts.
   - What's unclear: Should unchecked items be deleted or kept for the next shopping trip?
   - Recommendation: Delete unchecked items to give a truly fresh start. If users want recurring items, they can re-add them. The RPC function should delete unchecked items as part of the atomic operation.

## Sources

### Primary (HIGH confidence)
- [Supabase Postgres Changes docs](https://supabase.com/docs/guides/realtime/postgres-changes) - Realtime subscription API, filter operators, replica identity requirements, RLS behavior, publication setup
- [Supabase Realtime Authorization docs](https://supabase.com/docs/guides/realtime/authorization) - RLS integration with Realtime, performance implications
- [React Native Gesture Handler ReanimatedSwipeable docs](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/) - Swipe-to-delete component API

### Secondary (MEDIUM confidence)
- [Supabase GitHub discussion #20610](https://github.com/orgs/supabase/discussions/20610) - Channel cleanup patterns, removeChannel behavior
- [Supabase soft delete troubleshooting](https://supabase.com/docs/guides/troubleshooting/soft-deletes-with-supabase-js) - Archive table vs soft-delete patterns
- Project codebase: `supabase/migrations/00002_expenses.sql`, `app/(app)/expenses/add.tsx` - Existing RLS, expense creation, and UI patterns

### Tertiary (LOW confidence)
- None -- all findings verified through official docs or existing codebase patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries either already installed or well-documented with Expo SDK 54
- Architecture: HIGH - DB schema follows established project patterns; Realtime API well-documented
- Pitfalls: HIGH - Verified through official Supabase docs (replica identity, publication, DELETE filter limitations)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- Supabase Realtime API and react-native-gesture-handler are mature)
