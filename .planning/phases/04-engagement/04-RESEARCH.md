# Phase 4: Engagement - Research

**Researched:** 2026-03-11
**Domain:** Push Notifications (Expo + Supabase) and Calendar UI (React Native)
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Expense notifications show amount + who added (e.g. "Sarah added $42.50 for Groceries")
- Chore reminders fire on the morning of the due date (day-of only)
- No notifications for grocery list updates (overrides PUSH-03 from REQUIREMENTS.md)
- Group notifications when multiple events happen in quick succession (e.g. "Sarah added 3 expenses ($127.00 total)")
- Per-type toggles in settings (expenses on/off, chores on/off)
- Per-user preferences only -- no household-level defaults
- Notification settings live inside the existing Settings screen (new "Notifications" section)
- No in-app quiet hours -- rely on OS-level Do Not Disturb
- Month grid view with dots/indicators on days that have events
- Tap a day to see expandable event list below the grid (calendar stays visible)
- Month grid only -- no week or agenda view alternatives
- Swipe left/right to navigate between months
- Color-coded dots on month grid + icons per item type (e.g. green for chores, blue for expenses)
- Day detail list shows title + key detail per item (e.g. "Rent -- $1,200", "Vacuum -- Sarah")
- Tapping a calendar item deep-links to its source screen (expense detail, chore detail)
- Calendar lives inside the Home tab, not as a separate bottom tab
- Calendar interaction inspired by Apple Calendar's month view -- grid at top, day details expanding below
- Notifications should feel informative but not noisy -- grouping is key

### Claude's Discretion
- Exact color palette for item types
- Month grid dot layout when many events on one day
- "Today" indicator styling
- Empty state for months with no events
- How far back/forward users can navigate

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PUSH-01 | User receives push notifications for new expenses | Supabase DB webhook on expenses INSERT triggers Edge Function that calls Expo Push API. Token stored in profiles table. |
| PUSH-02 | User receives push notifications for chore reminders | Supabase pg_cron or Edge Function cron checks chores.next_due_at each morning and sends reminders via Expo Push API. |
| PUSH-03 | User receives push notifications for grocery list updates | **User decision: NOT implementing.** User explicitly decided "No notifications for grocery list updates." Mark as N/A in plan. |
| CALC-01 | User can view a shared household calendar | react-native-calendars Calendar component embedded in Home tab with multi-dot marking for event types. |
| CALC-02 | Recurring expense due dates and chore schedules appear on calendar | Query expenses (by created_at) and chores (by next_due_at + frequency-based future dates) to populate calendar markedDates. |
</phase_requirements>

## Summary

Phase 4 has two distinct technical domains: push notifications and a household calendar. Push notifications require a backend trigger pipeline (Supabase DB webhooks + Edge Functions + Expo Push API) plus client-side token registration and preference management. The calendar is a purely client-side UI feature using react-native-calendars with data already available from the expenses and chores tables.

The critical architectural decision is the push notification delivery pipeline. Supabase's recommended pattern uses Database Webhooks that trigger Edge Functions on row INSERT events. The Edge Function fetches the recipient's Expo push token from the database and POSTs to `https://exp.host/--/api/v2/push/send`. For chore reminders (morning-of-due-date), a scheduled Edge Function (Supabase cron) runs daily and queries upcoming chores.

A significant constraint is that push notifications do NOT work in Expo Go starting with SDK 53+. The project currently uses Expo Go for development. This means push notification testing requires a Development Build via EAS Build. Local/scheduled notifications still work on simulators, but remote push requires a physical device with a dev build. The calendar feature has no such limitation -- it uses the pure-JS react-native-calendars library.

**Primary recommendation:** Implement the calendar first (pure client-side, testable in Expo Go), then add push notification infrastructure (requires dev build transition). Notification grouping should be handled server-side in the Edge Function, not on the client.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | SDK 54 compatible | Push token registration, permission requests, notification handlers | Official Expo library, handles APNs/FCM abstraction |
| expo-device | SDK 54 compatible | Physical device detection (required for push) | Official Expo library, needed to guard push registration |
| expo-constants | ~18.0.13 | Access projectId for push token | Already installed in project |
| react-native-calendars | 1.1314.x | Month grid calendar with dot markers | Most popular RN calendar, pure JS, no native modules |
| Supabase Edge Functions | Deno runtime | Server-side push notification dispatch | Official Supabase pattern for webhooks + push |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Date math for calendar event projection | Computing future chore due dates from frequency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-calendars | Custom calendar grid | react-native-calendars handles month math, swipe, localization -- too much to hand-roll |
| Supabase Edge Functions | Direct pg_net HTTP calls from triggers | Edge Functions are easier to debug, have access to secrets, and can batch |
| date-fns | dayjs or moment | date-fns is tree-shakeable and widely used; dayjs is lighter but date-fns has better TS types |

**Installation:**
```bash
npx expo install expo-notifications expo-device
npm install react-native-calendars date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
app/(app)/
  (tabs)/
    index.tsx              # Home tab -- add calendar section here
  settings/
    index.tsx              # Add "Notifications" row linking to notifications.tsx
    notifications.tsx      # NEW: per-type toggle screen
lib/
  notifications.ts         # NEW: token registration, permission helpers
  calendar-utils.ts        # NEW: date projection for chore schedules
  types/database.ts        # ADD: notification_preferences, push token types
supabase/
  migrations/
    00005_notifications.sql  # NEW: notification_preferences table, push token column
  functions/
    push-expense/index.ts    # NEW: Edge Function for expense notifications
    push-chore-reminder/index.ts  # NEW: Edge Function for daily chore reminders
```

### Pattern 1: Push Token Registration on App Launch
**What:** Register for push permissions and store the Expo push token in the user's profile row.
**When to use:** Every app launch after authentication.
**Example:**
```typescript
// Source: https://docs.expo.dev/push-notifications/push-notifications-setup/
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId
    ?? Constants?.easConfig?.projectId;

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData;

  // Store token in profiles table
  await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);

  return token;
}
```

### Pattern 2: Supabase Database Webhook + Edge Function
**What:** Automatic push notification on database INSERT events.
**When to use:** When a new expense is created and other household members should be notified.
**Example:**
```typescript
// supabase/functions/push-expense/index.ts
// Source: https://supabase.com/docs/guides/functions/examples/push-notifications
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const payload = await req.json();
  const { record } = payload; // The new expense row

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Get household members (excluding the person who created the expense)
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', record.household_id)
    .neq('user_id', record.created_by);

  if (!members?.length) return new Response('No recipients');

  // Get push tokens and notification preferences
  const userIds = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, expo_push_token, display_name')
    .in('id', userIds)
    .not('expo_push_token', 'is', null);

  // Check per-user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, expenses_enabled')
    .in('user_id', userIds);

  const prefsMap = new Map(prefs?.map(p => [p.user_id, p]) ?? []);

  // Get creator name for notification body
  const { data: creator } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', record.created_by)
    .single();

  const creatorName = creator?.display_name ?? 'Someone';
  const amount = parseFloat(record.amount).toFixed(2);

  // Filter to users who have push enabled for expenses
  const tokens = (profiles ?? [])
    .filter(p => {
      const pref = prefsMap.get(p.id);
      return !pref || pref.expenses_enabled !== false; // default on
    })
    .map(p => p.expo_push_token)
    .filter(Boolean);

  if (!tokens.length) return new Response('No tokens');

  // Send via Expo Push API
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
    },
    body: JSON.stringify(
      tokens.map(token => ({
        to: token,
        title: 'New Expense',
        body: `${creatorName} added $${amount} for ${record.description}`,
        data: { type: 'expense', expenseId: record.id },
      })),
    ),
  });

  return new Response(JSON.stringify(await res.json()));
});
```

### Pattern 3: Calendar Data Aggregation
**What:** Query expenses and chores, project chore schedules forward, build markedDates object for react-native-calendars.
**When to use:** When rendering the household calendar on the Home tab.
**Example:**
```typescript
// lib/calendar-utils.ts
import { addDays, addWeeks, addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import type { Chore, Expense } from './types/database';

type CalendarDot = { key: string; color: string; selectedDotColor: string };
type MarkedDates = Record<string, { dots: CalendarDot[] }>;

const EXPENSE_DOT: CalendarDot = { key: 'expense', color: '#3b82f6', selectedDotColor: '#3b82f6' };
const CHORE_DOT: CalendarDot = { key: 'chore', color: '#22c55e', selectedDotColor: '#22c55e' };

export function buildMarkedDates(
  expenses: Expense[],
  chores: Chore[],
  monthDate: Date,
): MarkedDates {
  const marked: MarkedDates = {};
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Add expense dots
  for (const exp of expenses) {
    const dateStr = format(new Date(exp.created_at), 'yyyy-MM-dd');
    if (!marked[dateStr]) marked[dateStr] = { dots: [] };
    if (!marked[dateStr].dots.some(d => d.key === 'expense')) {
      marked[dateStr].dots.push(EXPENSE_DOT);
    }
  }

  // Add chore dots (project from next_due_at using frequency)
  for (const chore of chores) {
    const futureDates = projectChoreDates(chore, monthStart, monthEnd);
    for (const dateStr of futureDates) {
      if (!marked[dateStr]) marked[dateStr] = { dots: [] };
      if (!marked[dateStr].dots.some(d => d.key === 'chore')) {
        marked[dateStr].dots.push(CHORE_DOT);
      }
    }
  }

  return marked;
}

function projectChoreDates(chore: Chore, rangeStart: Date, rangeEnd: Date): string[] {
  const dates: string[] = [];
  let current = new Date(chore.next_due_at);

  // Walk backwards if next_due_at is after range, using frequency
  // Walk forwards from last known date
  while (current <= rangeEnd) {
    if (current >= rangeStart) {
      dates.push(format(current, 'yyyy-MM-dd'));
    }
    switch (chore.frequency) {
      case 'daily': current = addDays(current, 1); break;
      case 'weekly': current = addWeeks(current, 1); break;
      case 'monthly': current = addMonths(current, 1); break;
      case 'custom': current = addDays(current, chore.custom_interval_days ?? 7); break;
    }
  }
  return dates;
}
```

### Pattern 4: Notification Grouping (Server-Side)
**What:** When multiple expenses are created in quick succession by the same user, batch them into one notification.
**When to use:** Expense INSERT webhook handler.
**Architecture:** Use a `pending_notifications` table with a short delay. A scheduled function (runs every 30-60 seconds) groups pending notifications by household + creator, then sends one grouped notification instead of many.

**Alternative (simpler):** Accept individual notifications for v1, since rapid-fire expense creation is uncommon in household settings. Implement grouping in v2 if users report noise.

**Recommendation:** Start with individual notifications. The user's "Sarah added 3 expenses ($127.00 total)" grouping is a nice-to-have that adds significant complexity (pending queue, scheduled aggregator, race conditions). For 2-4 person households, expense creation frequency is low enough that grouping is rarely triggered.

### Anti-Patterns to Avoid
- **Sending push from the client:** Never call the Expo Push API directly from the mobile app. Always go through Supabase Edge Functions with a service role key. The client should only register its token.
- **Storing push tokens in auth.users metadata:** Use a dedicated column on the profiles table. Auth metadata is not queryable with standard PostgREST and can't be used in RLS policies.
- **Polling for calendar data:** Don't set up an interval to refetch calendar data. Use useFocusEffect (already established in this project) to refresh when the Home tab gains focus.
- **Computing all future chore dates indefinitely:** Limit projection to the visible month plus one month buffer. Projecting years of daily chores is wasteful.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month grid calendar | Custom grid with date math | react-native-calendars Calendar | Month arithmetic, leap years, locale, swipe gestures, accessibility |
| Push notification delivery | Direct APNs/FCM calls | Expo Push API via Edge Function | Token management, retry logic, platform abstraction |
| Date projection for recurring events | Manual date arithmetic loops | date-fns addDays/addWeeks/addMonths | DST transitions, month-end edge cases, leap years |
| Android notification channels | Manual channel config | expo-notifications setNotificationChannelAsync | Required for Android 8+, complex lifecycle |

**Key insight:** Push notifications have a surprisingly deep stack (token lifecycle, permission states, platform-specific channels, delivery receipts, error handling). Expo + Supabase Edge Functions abstract most of this. The calendar grid looks simple but month math has notorious edge cases.

## Common Pitfalls

### Pitfall 1: Push Notifications Don't Work in Expo Go (SDK 53+)
**What goes wrong:** Developer implements push notification code, tests in Expo Go, nothing happens -- no errors, no tokens, silent failure.
**Why it happens:** Starting with SDK 53, Expo Go no longer bundles push notification credentials. The `getExpoPushTokenAsync` call returns nothing useful.
**How to avoid:** Create a Development Build using `eas build --profile development`. Test push on physical devices only. Guard push registration code with `Device.isDevice` check. Make the calendar feature testable independently of push.
**Warning signs:** `getExpoPushTokenAsync` returns undefined or throws; no notifications arrive despite correct server-side setup.

### Pitfall 2: Expo Push Token Changes
**What goes wrong:** Token stored in DB becomes stale, notifications silently fail.
**Why it happens:** Tokens can change when app is reinstalled, after OS updates, or periodically by the push service.
**How to avoid:** Re-register and update the token on every app launch (in useEffect of root component or auth provider). Compare with stored value and update if different.
**Warning signs:** Push delivery receipts show "DeviceNotRegistered" errors.

### Pitfall 3: Android Notification Channels Not Set Up
**What goes wrong:** Notifications arrive silently (no sound, no banner) on Android 8+.
**Why it happens:** Android 8+ requires notification channels. Without them, notifications may be delivered but with lowest priority.
**How to avoid:** Call `Notifications.setNotificationChannelAsync()` before requesting permissions. Create separate channels for expenses and chores so users can control them in OS settings too.
**Warning signs:** Notifications appear in the shade but without sound or heads-up display.

### Pitfall 4: Calendar Performance with Many Events
**What goes wrong:** Calendar screen lags when household has hundreds of expenses across months.
**Why it happens:** Fetching all expenses ever created and computing markedDates for all of them.
**How to avoid:** Query only the visible month's expenses (filter by created_at between month start and end). Use useMemo for the markedDates computation. Pre-fetch adjacent months for smooth swiping.
**Warning signs:** Visible jank when swiping between months.

### Pitfall 5: Chore Reminder Timing (Morning-of Due Date)
**What goes wrong:** Chore reminders fire at inconsistent times or in wrong timezone.
**Why it happens:** Supabase Edge Functions run in UTC. "Morning" depends on the user's timezone.
**How to avoid:** Store user timezone in profile or notification preferences. The cron job runs hourly and sends reminders when it's ~8 AM in the user's timezone. Or simplify: run the cron at a fixed time (e.g., 8 AM UTC-5 = 1 PM UTC) and accept timezone imprecision for v1.
**Warning signs:** Users in different timezones get reminders at odd hours.

### Pitfall 6: RLS Blocking Edge Function Database Queries
**What goes wrong:** Edge Function can't query household_members or profiles because RLS blocks unauthenticated access.
**Why it happens:** Edge Functions need to query across users (get all members of a household). The service role key bypasses RLS.
**How to avoid:** Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) in Edge Functions. This is the standard pattern -- Edge Functions are trusted server-side code.
**Warning signs:** Empty query results in Edge Function logs despite data existing.

## Code Examples

### Notification Handler Setup (Root Layout)
```typescript
// In app/_layout.tsx or a dedicated NotificationProvider
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// Set notification handler (controls foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function useNotificationListeners() {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Handle notification tap -- deep link to source screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data.type === 'expense' && data.expenseId) {
          router.push(`/(app)/expenses/${data.expenseId}`);
        }
        // Add chore deep link handling similarly
      },
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
```

### Android Notification Channel Setup
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('expenses', {
    name: 'Expenses',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
  });

  await Notifications.setNotificationChannelAsync('chores', {
    name: 'Chore Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#22c55e',
  });
}
```

### Calendar Component with Day Detail Expansion
```typescript
// In app/(app)/(tabs)/index.tsx -- calendar section
// Source: https://wix.github.io/react-native-calendars/docs/Components/Calendar
import { Calendar, DateData } from 'react-native-calendars';

const [selectedDate, setSelectedDate] = useState<string>(
  format(new Date(), 'yyyy-MM-dd')
);
const [currentMonth, setCurrentMonth] = useState(new Date());

// markedDates built from buildMarkedDates utility
const markedDates = useMemo(() => {
  const marks = buildMarkedDates(expenses, chores, currentMonth);
  // Add selected date highlight
  if (marks[selectedDate]) {
    marks[selectedDate] = { ...marks[selectedDate], selected: true };
  } else {
    marks[selectedDate] = { dots: [], selected: true };
  }
  return marks;
}, [expenses, chores, currentMonth, selectedDate]);

<Calendar
  markingType="multi-dot"
  markedDates={markedDates}
  onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
  onMonthChange={(month: DateData) => {
    setCurrentMonth(new Date(month.year, month.month - 1, 1));
  }}
  enableSwipeMonths={true}
  theme={{
    calendarBackground: '#fefdfb',
    todayTextColor: '#f9a825',
    selectedDayBackgroundColor: '#f9a825',
    arrowColor: '#f9a825',
    dotStyle: { marginTop: 2 },
  }}
/>

{/* Day detail list below calendar */}
{selectedDateEvents.length > 0 ? (
  selectedDateEvents.map(event => (
    <Pressable
      key={event.id}
      onPress={() => router.push(event.deepLink)}
      className="flex-row items-center px-4 py-3 border-b border-surface-100"
    >
      <Ionicons name={event.icon} size={20} color={event.color} />
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-gray-800">{event.title}</Text>
        <Text className="text-sm text-gray-400">{event.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </Pressable>
  ))
) : (
  <Text className="px-4 py-6 text-center text-gray-400">
    No events on this day
  </Text>
)}
```

### Notification Preferences Database Migration
```sql
-- 00005_notifications.sql

-- Add push token to profiles
ALTER TABLE profiles ADD COLUMN expo_push_token TEXT;

-- Per-user notification preferences
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  expenses_enabled BOOLEAN DEFAULT true,
  chores_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for Edge Function lookups
CREATE INDEX idx_profiles_push_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-notifications in Expo Go | Development Build required | SDK 53 (2025) | Must use `eas build --profile development` for push testing |
| FCM Legacy API (server key) | FCM v1 API (service account) | 2024 | Need google-services.json + service account key JSON for Android |
| Expo push token via experienceId | Expo push token via projectId | SDK 49+ | Must pass projectId from Constants.easConfig |
| Manual APNs/FCM credential setup | EAS Build auto-prompts | 2024+ | Simpler credential flow when using EAS |

**Deprecated/outdated:**
- `Notifications.clearLastNotificationResponse()` -- use `clearLastNotificationResponseAsync()`
- `Notifications.getLastNotificationResponse()` -- use `getLastNotificationResponseAsync()`
- `Subscription` type -- use `EventSubscription` instead
- Notification config in app.json `notification` field -- use expo-notifications config plugin

## Open Questions

1. **Notification Grouping Complexity**
   - What we know: User wants grouping (e.g., "Sarah added 3 expenses ($127.00 total)")
   - What's unclear: Server-side grouping requires a pending queue + aggregation timer, which is significantly more complex than individual notifications
   - Recommendation: Implement individual notifications first. Add grouping as a follow-up if users report noise. For 2-4 person households, rapid-fire expense creation is rare.

2. **Expo Go to Development Build Transition**
   - What we know: Push notifications require a dev build. The project currently uses Expo Go.
   - What's unclear: Whether the user has EAS configured, Apple Developer account for APNs, or Google Firebase project for FCM
   - Recommendation: Document the dev build transition as a prerequisite task. Calendar can be built and tested entirely in Expo Go first.

3. **Chore Reminder Timezone Handling**
   - What we know: User wants chore reminders "on the morning of the due date"
   - What's unclear: How to determine user timezone (store in profile? Use device timezone on registration?)
   - Recommendation: For v1, store timezone string in notification_preferences. The cron Edge Function groups users by timezone and sends at ~8 AM local time.

4. **Calendar Data for Future Recurring Expenses**
   - What we know: CALC-02 says "Recurring expense due dates" appear on calendar
   - What's unclear: Recurring expenses (EXPN-07) are v2. Current expenses have no recurrence field.
   - Recommendation: For v1, show expenses on their created_at date only. Show chore schedules projected forward. When recurring expenses are added in v2, they will naturally appear.

## Sources

### Primary (HIGH confidence)
- [Expo Notifications SDK docs](https://docs.expo.dev/versions/latest/sdk/notifications/) - API reference, config plugin, channel setup, event listeners
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) - Token registration, permission flow, EAS credentials
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications) - Edge Function pattern, webhook setup, Expo integration
- [react-native-calendars Calendar docs](https://wix.github.io/react-native-calendars/docs/Components/Calendar) - Props API, multi-dot marking, theme customization

### Secondary (MEDIUM confidence)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) - Webhook configuration, pg_net extension
- [react-native-calendars GitHub](https://github.com/wix/react-native-calendars) - Version 1.1314.x, pure JS, feature list
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) - Push notification changes, deprecated APIs

### Tertiary (LOW confidence)
- Notification grouping pattern - No established library or Supabase pattern found; would need custom implementation
- Chore reminder cron pattern - Based on general Supabase cron patterns, not a specific documented example

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - expo-notifications and react-native-calendars are well-documented, widely used
- Architecture: MEDIUM - Push pipeline pattern (webhook + Edge Function) is documented by Supabase but notification grouping is custom
- Pitfalls: HIGH - Expo Go limitation, token lifecycle, and Android channels are well-documented issues
- Calendar: HIGH - react-native-calendars multi-dot API is straightforward and well-documented

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days -- stable libraries, no major breaking changes expected)
