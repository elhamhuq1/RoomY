# Phase 1: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Authentication, household management, onboarding (Expo + Supabase)
**Confidence:** HIGH

## Summary

Phase 1 builds the entire auth and household foundation for RoomY: sign up/in (email+password, Google, Apple), user profiles, household creation with invite codes, an onboarding module quiz, and Row Level Security to isolate household data. The tech stack is Expo (React Native) with Expo Router for navigation, Supabase for auth + Postgres database, and NativeWind for Tailwind-based styling.

The core architectural challenge is getting the data model right: profiles linked to `auth.users`, households with a membership junction table, invite codes with expiry, and module configuration per household. RLS policies must enforce that users only see data for their own household. The auth flow uses Supabase's native email/password plus `signInWithIdToken` for Google and Apple social sign-in (no OAuth redirect needed for native).

**Primary recommendation:** Use Expo SDK 54 with NativeWind v4 (stable), Supabase JS v2 with `expo-sqlite/localStorage` for session persistence, and Expo Router's `Stack.Protected` pattern for declarative auth-gated navigation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Linear wizard: sign up -> profile -> create/join household -> module quiz -> dashboard
- Welcome/value-prop screens before sign-up (1-2 screens showing what RoomY does)
- Dashboard with module tabs is the home screen after onboarding completes
- Empty state for solo creator: invite code prominently displayed with "Share with roommates" action; module cards appear but are empty/disabled until someone joins
- Share sheet + visible code: show the invite code on screen AND offer native share button with a pre-written message containing the code
- When a new member joins: household welcome screen showing household name, existing members' names/avatars, and "You're in!" confirmation before going to dashboard
- Invite codes expire after 7 days; creator can regenerate anytime; reasonable household size limit (e.g., 10 members)
- Create-or-join fork in the wizard: after profile setup, a screen with two clear buttons -- "Create a household" and "I have an invite code"
- Toggle cards on one screen: one card per module with icon, short description, and toggle switch
- Expenses is always on and cannot be disabled (core value of the app); groceries and chores are opt-in
- Any household member can toggle modules on/off (not restricted to creator)
- Module settings accessible post-onboarding in household settings; changes apply immediately
- Sign-up methods: email/password + Google Sign-In + Apple Sign-In
- Profile: only display name required during onboarding; Venmo username is optional, prompted when first needed in Phase 2
- Visual style: warm and friendly -- soft colors, rounded shapes, approachable illustrations of roommates (Duolingo-lite feel, not corporate)
- Forgot password flow included via email link

### Claude's Discretion
- Exact color palette and typography within the "warm and friendly" direction
- Welcome screen illustrations and copy
- Loading states and transitions between wizard steps
- Form validation UX (inline errors, shake animation, etc.)
- Invite code format (length, character set)
- Avatar/initials system for member display

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up and sign in with email/password | Supabase `signUpWithPassword` / `signInWithPassword` + Google via `@react-native-google-signin` + Apple via `expo-apple-authentication`, both using `signInWithIdToken`. Password reset via `resetPasswordForEmail` with deep link redirect. |
| AUTH-02 | User can create a profile with display name and Venmo username | Postgres `profiles` table linked to `auth.users` via trigger on signup. Display name required at onboarding; Venmo username deferred to Phase 2. RLS ensures profile visibility scoped to household members. |
| AUTH-03 | User can create a household and receive an invite code | `households` table + `household_members` junction table. Invite code generated server-side (nanoid or random alphanumeric), stored with `expires_at` timestamp. Creator auto-added as first member. |
| AUTH-04 | User can join a household by entering an invite code | Supabase RPC function validates code (exists, not expired, household not full), inserts membership, and returns household data. RLS policies update to grant access based on membership. |
| AUTH-05 | User completes onboarding quiz that configures enabled modules | `household_settings` table (or JSON column on households) storing `{ expenses: true, groceries: boolean, chores: boolean }`. Toggle UI on one screen. Any member can modify. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~54 (SDK 54) | React Native framework | Stable release, both devs can test via QR code, NativeWind v4 compatible |
| expo-router | v4 (bundled with SDK 54) | File-based routing + `Stack.Protected` auth guards | Declarative auth flow, deep link handling built-in |
| @supabase/supabase-js | ^2.x | Backend client (auth, database, realtime) | Official Supabase JS client for React Native |
| nativewind | ^4.2.0 | Tailwind CSS for React Native | Stable with SDK 54; v5 still in preview per project STATE.md |
| tailwindcss | ^3.4.17 | CSS utility framework (build-time, used by NativeWind) | Required peer dependency for NativeWind v4 |
| react-native-reanimated | ^3.x | Animation library (NativeWind peer dep) | Required by NativeWind v4; v3 recommended for v4 compat |
| react-native-safe-area-context | * | Safe area insets | Required peer dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-sqlite | (bundled) | localStorage polyfill for Supabase session persistence | Supabase client `auth.storage` config |
| react-native-url-polyfill | ^2.x | URL API polyfill for Supabase | Required for Supabase JS in React Native |
| @react-native-google-signin/google-signin | ^13.x | Native Google Sign-In | Google auth via `signInWithIdToken` |
| expo-apple-authentication | (bundled) | Native Apple Sign-In (iOS) | Apple auth via `signInWithIdToken` |
| expo-sharing | (bundled) | Native share sheet | Share invite code with pre-written message |
| expo-linking | (bundled) | Deep link handling | Password reset redirect handling |
| expo-secure-store | (bundled) | Secure key-value storage | NOT for Supabase session (size limit 2048 bytes); use for other small secrets if needed |
| @expo/vector-icons | (bundled) | Icon library (Ionicons, MaterialIcons) | Module toggle cards, nav icons, UI elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NativeWind v4 | NativeWind v5 | v5 uses Tailwind CSS v4 and has better perf, but still in preview; monitor and upgrade when stable |
| expo-sqlite localStorage | @react-native-async-storage/async-storage | AsyncStorage is the older approach; expo-sqlite localStorage is newer, sync API, recommended by current Supabase quickstart |
| expo-sqlite localStorage | expo-secure-store | SecureStore has 2048-byte limit; Supabase sessions exceed this. Hybrid encrypt-in-SecureStore-store-in-AsyncStorage is complex. expo-sqlite localStorage is simplest. |
| Expo SDK 54 | Expo SDK 55 | SDK 55 uses RN 0.83 (New Architecture only); NativeWind v4 compatibility unclear. SDK 54 is battle-tested with NativeWind v4. |

**Installation:**
```bash
npx create-expo-app@latest roomy --template blank-typescript
cd roomy
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
npx expo install @react-native-google-signin/google-signin expo-apple-authentication
npx expo install expo-sharing @expo/vector-icons
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── _layout.tsx              # Root layout: SessionProvider + Stack with Protected guards
├── (auth)/                  # Auth group (unprotected)
│   ├── _layout.tsx          # Stack layout for auth screens
│   ├── welcome.tsx          # Welcome/value-prop screen(s)
│   ├── sign-in.tsx          # Email/password + social sign-in
│   ├── sign-up.tsx          # Registration form
│   └── forgot-password.tsx  # Password reset request
├── (onboarding)/            # Onboarding group (protected, requires auth but no household)
│   ├── _layout.tsx          # Stack layout for onboarding wizard
│   ├── profile.tsx          # Display name entry
│   ├── household-choice.tsx # Create or Join fork
│   ├── create-household.tsx # Create household + get invite code
│   ├── join-household.tsx   # Enter invite code
│   ├── member-welcome.tsx   # "You're in!" confirmation (join flow)
│   └── module-quiz.tsx      # Toggle cards for expenses/groceries/chores
├── (app)/                   # Main app group (protected, requires auth + household)
│   ├── _layout.tsx          # Tab layout for dashboard
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigator
│   │   ├── index.tsx        # Dashboard home
│   │   ├── expenses.tsx     # Expenses tab (placeholder for Phase 2)
│   │   ├── groceries.tsx    # Groceries tab (placeholder, if enabled)
│   │   └── chores.tsx       # Chores tab (placeholder, if enabled)
│   └── settings/
│       ├── index.tsx        # Household settings
│       ├── profile.tsx      # Edit profile
│       ├── modules.tsx      # Toggle modules post-onboarding
│       └── members.tsx      # View members + invite code
lib/
├── supabase.ts              # Supabase client initialization
├── auth-context.tsx         # AuthProvider + useSession hook
└── types/
    └── database.ts          # Generated Supabase types
```

### Pattern 1: Supabase Client Initialization
**What:** Configure Supabase with expo-sqlite localStorage for session persistence
**When to use:** Once, at app startup
**Example:**
```typescript
// lib/supabase.ts
// Source: Supabase Expo quickstart (https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Pattern 2: Auth Context with Supabase Session
**What:** React context that wraps Supabase auth state changes and exposes session/user to the app
**When to use:** Root layout, wraps entire app
**Example:**
```typescript
// lib/auth-context.tsx
// Source: Supabase Expo social auth quickstart
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react'
import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  household: HouseholdRow | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useSession() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSession must be inside <AuthProvider />')
  return ctx
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [household, setHousehold] = useState<HouseholdRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      // Fetch profile + household membership here
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, household, loading, signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Pattern 3: Stack.Protected for Auth Guards
**What:** Declarative route protection based on auth + onboarding state
**When to use:** Root layout to gate navigation groups
**Example:**
```typescript
// app/_layout.tsx
// Source: Expo Router protected routes docs (https://docs.expo.dev/router/advanced/protected/)
import { Stack } from 'expo-router'
import { AuthProvider, useSession } from '@/lib/auth-context'

function RootNavigator() {
  const { session, profile, household, loading } = useSession()

  const isAuthenticated = !!session
  const hasCompletedOnboarding = !!household

  if (loading) return <LoadingScreen />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
```

### Pattern 4: Household RLS with Membership-Based Isolation
**What:** RLS policies that check household membership via a junction table
**When to use:** Every table that contains household-scoped data
**Example:**
```sql
-- Source: Supabase RLS docs + multi-tenant patterns
-- Users can only see data for households they belong to
CREATE POLICY "Members can view household"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Members can view other members in their household
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );
```

### Pattern 5: Database Trigger for Auto-Profile Creation
**What:** Postgres trigger that creates a profile row when a user signs up
**When to use:** Always -- ensures every auth.users entry has a profiles row
**Example:**
```sql
-- Source: Supabase managing user data docs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Pattern 6: Google Sign-In with Supabase (Native)
**What:** Use `@react-native-google-signin/google-signin` to get an ID token, pass to Supabase
**When to use:** Google sign-in button
**Example:**
```typescript
// Source: Supabase Google auth docs
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { supabase } from '@/lib/supabase'

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices()
  const response = await GoogleSignin.signIn()
  if (response.data?.idToken) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    })
    return { data, error }
  }
  throw new Error('No ID token from Google')
}
```

### Pattern 7: Apple Sign-In with Supabase (Native iOS)
**What:** Use `expo-apple-authentication` to get identity token, pass to Supabase
**When to use:** Apple sign-in button (iOS only)
**Example:**
```typescript
// Source: Supabase Apple auth docs
import * as AppleAuthentication from 'expo-apple-authentication'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

async function signInWithApple() {
  if (Platform.OS !== 'ios') return // Apple Sign-In is iOS only natively

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })

  if (!credential.identityToken) throw new Error('No identity token')

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  })

  // Apple only provides full name on first sign-in -- save to user metadata
  if (!error && credential.fullName) {
    const fullName = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean).join(' ')
    if (fullName) {
      await supabase.auth.updateUser({ data: { full_name: fullName } })
    }
  }

  return { data, error }
}
```

### Anti-Patterns to Avoid
- **Storing Supabase session in SecureStore directly:** SecureStore has a 2048-byte size limit; Supabase JWT sessions exceed this. Use `expo-sqlite/localStorage` instead.
- **Using `signInWithOAuth` for Google/Apple on native:** This opens a web browser for OAuth redirect. Use `signInWithIdToken` with native SDKs for a seamless experience.
- **Checking auth in every screen component:** Use `Stack.Protected` in the root layout for declarative route guarding. Individual screens should not need auth checks.
- **Making profiles publicly readable to all users:** RLS should scope profile visibility to household members only (not `USING (true)`).
- **Skipping the `on_auth_user_created` trigger:** Without it, you need application-level code to create profiles, which is fragile and can leave orphaned auth users without profiles.

## Database Schema

### Core Tables for Phase 1

```sql
-- PROFILES: extends auth.users with app-specific data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  venmo_username TEXT,  -- optional, prompted in Phase 2
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HOUSEHOLDS: the core tenant/group entity
CREATE TABLE households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invite_code_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_members INT DEFAULT 10,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HOUSEHOLD_MEMBERS: junction table (who belongs to which household)
CREATE TABLE household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- HOUSEHOLD_SETTINGS: which modules are enabled
CREATE TABLE household_settings (
  household_id UUID REFERENCES households ON DELETE CASCADE PRIMARY KEY,
  expenses_enabled BOOLEAN DEFAULT true,   -- always true, cannot be disabled
  groceries_enabled BOOLEAN DEFAULT false,
  chores_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users
);
```

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read/update their own; household members can read each other
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Household members can view each other's profiles"
  ON profiles FOR SELECT USING (
    id IN (
      SELECT hm2.user_id FROM household_members hm1
      JOIN household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid()
    )
  );

-- HOUSEHOLDS: only members can view
CREATE POLICY "Members can view their household"
  ON households FOR SELECT USING (
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Authenticated users can insert (create) a household
CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT WITH CHECK (auth.uid() = created_by);

-- HOUSEHOLD_MEMBERS: members can view co-members
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- HOUSEHOLD_SETTINGS: members can view and update
CREATE POLICY "Members can view household settings"
  ON household_settings FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update household settings"
  ON household_settings FOR UPDATE USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
```

### Invite Code Join Function (RPC)

```sql
-- Supabase RPC function for joining a household via invite code
-- This bypasses RLS intentionally (SECURITY DEFINER) because the
-- joining user doesn't have membership yet and can't read the household
CREATE OR REPLACE FUNCTION join_household_by_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household RECORD;
  v_member_count INT;
BEGIN
  -- Find household by invite code
  SELECT * INTO v_household
  FROM public.households
  WHERE invite_code = code
    AND invite_code_expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count
  FROM public.household_members
  WHERE household_id = v_household.id;

  IF v_member_count >= v_household.max_members THEN
    RAISE EXCEPTION 'Household is full';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household.id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member of this household';
  END IF;

  -- Add member
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household.id, auth.uid(), 'member');

  -- Return household info
  RETURN json_build_object(
    'household_id', v_household.id,
    'household_name', v_household.name,
    'member_count', v_member_count + 1
  );
END;
$$;
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom auth with bcrypt/JWT | Supabase Auth | Handles password hashing, token refresh, session management, social providers, email verification |
| Session persistence | Manual token storage/refresh | Supabase JS client with `persistSession: true` + `expo-sqlite/localStorage` | Token refresh, expiry, and race conditions are handled automatically |
| Data isolation | Application-level WHERE clauses | Postgres Row Level Security | RLS enforces at database level; application bugs can't leak data |
| Password reset | Custom email + token flow | `supabase.auth.resetPasswordForEmail()` | Handles token generation, email sending, expiry, and single-use enforcement |
| Google Sign-In | WebView-based OAuth | `@react-native-google-signin/google-signin` native SDK | Native UI, credential manager integration, no browser redirect |
| Apple Sign-In | Custom ASAuthorizationController bridge | `expo-apple-authentication` | Expo-maintained, config plugin handles native setup |
| Invite code generation | Simple `Math.random()` string | Crypto-safe random (e.g., `nanoid` or Postgres `gen_random_uuid` + substring) | Avoids predictable/guessable codes |
| Navigation auth guards | Manual `useEffect` + `router.replace` in every screen | Expo Router `Stack.Protected` | Declarative, handles deep links, no race conditions on mount |

**Key insight:** Authentication and data isolation are security-critical domains where custom solutions consistently have vulnerabilities. Supabase Auth + RLS is battle-tested infrastructure that handles edge cases (token rotation, concurrent sessions, timing attacks on invite codes) that hand-rolled solutions miss.

## Common Pitfalls

### Pitfall 1: SecureStore Size Limit for Sessions
**What goes wrong:** Storing Supabase JWT sessions in `expo-secure-store` throws an error because the session exceeds the 2048-byte value limit.
**Why it happens:** Supabase sessions include full JWT tokens with claims that routinely exceed 2KB.
**How to avoid:** Use `expo-sqlite/localStorage` (import `'expo-sqlite/localStorage/install'`) as the storage adapter. This is the approach recommended in the current Supabase Expo quickstart.
**Warning signs:** Intermittent auth failures, "value too large" errors on certain devices.

### Pitfall 2: RLS Subquery Performance
**What goes wrong:** RLS policies with `IN (SELECT ...)` subqueries execute per row, causing slow queries on large tables.
**Why it happens:** Postgres evaluates RLS predicates for every row in the result set.
**How to avoid:** Add indexes on the columns used in RLS policies: `CREATE INDEX idx_household_members_user_id ON household_members(user_id);` and `CREATE INDEX idx_household_members_household_id ON household_members(household_id);`. For Phase 1 with small data volumes this is unlikely to be noticeable, but set up indexes from the start.
**Warning signs:** Query times increasing as household data grows.

### Pitfall 3: Apple Only Sends Full Name Once
**What goes wrong:** Apple Sign-In only provides the user's full name on the very first sign-in. Subsequent sign-ins return `null` for name fields.
**Why it happens:** Apple privacy design -- they send PII once and expect you to store it.
**How to avoid:** Capture and save the full name to Supabase user metadata (`updateUser`) immediately on first sign-in. The `handle_new_user` trigger should also extract `full_name` from `raw_user_meta_data` into the profiles table.
**Warning signs:** Users who signed up with Apple have empty display names.

### Pitfall 4: Invite Code Join Requires SECURITY DEFINER
**What goes wrong:** A user trying to join a household via invite code gets "permission denied" because RLS prevents them from reading the `households` table (they're not a member yet).
**Why it happens:** RLS policies on `households` only allow members to read. A joining user has no membership yet.
**How to avoid:** Use a Supabase RPC function with `SECURITY DEFINER` that validates the invite code and inserts the membership in one atomic operation.
**Warning signs:** Join flow always fails with RLS errors.

### Pitfall 5: Missing `detectSessionInUrl: false`
**What goes wrong:** Supabase client tries to parse the URL for session tokens on every app load, causing errors or unexpected behavior in React Native.
**Why it happens:** `detectSessionInUrl` defaults to `true` (designed for web apps with URL-based auth redirects).
**How to avoid:** Always set `detectSessionInUrl: false` in the Supabase client auth config for React Native apps.
**Warning signs:** Console warnings about URL parsing, unexpected auth state changes.

### Pitfall 6: Google Sign-In Requires Dev Build
**What goes wrong:** `@react-native-google-signin/google-signin` doesn't work in Expo Go.
**Why it happens:** It's a native module that requires a config plugin and custom native build.
**How to avoid:** Use `npx expo prebuild` and build a development client with `npx expo run:android` / `npx expo run:ios`, or use EAS Build for dev builds. Plan for this from the start -- don't prototype auth in Expo Go.
**Warning signs:** "Native module not found" errors when testing in Expo Go.

### Pitfall 7: NativeWind v4 Babel Config Order
**What goes wrong:** NativeWind styles don't apply or the app crashes on startup.
**Why it happens:** Incorrect babel.config.js setup -- the `jsxImportSource: "nativewind"` option must be on `babel-preset-expo`, and `nativewind/babel` must be listed as a separate preset.
**How to avoid:** Follow the exact babel config from NativeWind docs:
```javascript
presets: [
  ["babel-preset-expo", { jsxImportSource: "nativewind" }],
  "nativewind/babel",
]
```
**Warning signs:** `className` prop has no effect, styles appear as default React Native.

## Code Examples

Verified patterns from official sources:

### Password Reset Flow
```typescript
// Source: Supabase Auth docs (https://supabase.com/docs/guides/auth/passwords)
// Step 1: Request reset email
async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'com.roomy://reset-password', // deep link back to app
  })
  return { error }
}

// Step 2: Handle deep link in app (after user clicks email link)
// In your deep link handler:
import * as Linking from 'expo-linking'
import * as QueryParams from 'expo-auth-session/src/QueryParams'

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)

  const { access_token, refresh_token } = params
  if (!access_token) return

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw error
  return data.session
}

// Step 3: Update password (user is now authenticated via the link)
async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error }
}
```

### Invite Code Generation (Postgres)
```sql
-- Generate a human-friendly 8-character invite code
-- Uses uppercase letters + digits, avoiding ambiguous characters (0/O, 1/I/L)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
```

### NativeWind Warm Theme Setup
```javascript
// tailwind.config.js
// Source: NativeWind themes guide (https://www.nativewind.dev/docs/guides/themes)
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm, friendly palette (Duolingo-lite direction)
        primary: {
          50:  '#fef3e2',
          100: '#fde4b9',
          200: '#fcd48c',
          300: '#fbc35f',
          400: '#fab63d',
          500: '#f9a825', // main primary
          600: '#f59b20',
          700: '#ef8a19',
          800: '#e97a13',
          900: '#df5f0a',
        },
        surface: {
          50:  '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e8',
        },
        accent: {
          500: '#66bb6a', // friendly green for success states
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
```

### App Config for Deep Linking + Native Modules
```json
// app.json (relevant sections)
{
  "expo": {
    "name": "RoomY",
    "slug": "roomy",
    "scheme": "com.roomy",
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ],
      "expo-apple-authentication",
      "expo-router"
    ],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.roomy.app"
    },
    "android": {
      "package": "com.roomy.app"
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for Supabase sessions | `expo-sqlite/localStorage` polyfill | SDK 52+ (late 2024) | Sync API, no additional dependency, works cross-platform |
| `useEffect` + `router.replace` for auth guards | `Stack.Protected` with `guard` prop | Expo SDK 53 (mid 2025) | Declarative, handles deep links, no race conditions |
| NativeWind v2 (StyleSheet-based) | NativeWind v4 (CSS-based with Tailwind v3) | 2024 | Real CSS variables, theme support, better perf |
| `expo-auth-session` for Google/Apple | Native SDKs + `signInWithIdToken` | 2023+ | No browser redirect, native UI, better UX |
| Manual profile creation in app code | Postgres trigger `on_auth_user_created` | Always best practice | Atomic, no orphaned users, works for all auth providers |

**Deprecated/outdated:**
- `@react-native-community/async-storage`: Renamed to `@react-native-async-storage/async-storage`; but for Supabase, prefer `expo-sqlite/localStorage`
- `expo-auth-session` for native social auth: Still works but `signInWithIdToken` with native SDKs is the recommended path
- NativeWind v2 API (`styled()` wrapper): Replaced by direct `className` prop in v4

## Open Questions

1. **NativeWind v4 stability on SDK 54 with New Architecture**
   - What we know: NativeWind v4.2.0+ is compatible with SDK 54. Some users report issues with Reanimated v4 compatibility.
   - What's unclear: Whether to pin Reanimated to v3 (as NativeWind v4 docs suggest) or use v4. SDK 54 supports both old and new architecture.
   - Recommendation: Start with NativeWind v4 + Reanimated v3 on SDK 54. If issues arise, NativeWind v5 is the escape hatch. Pin exact versions in package.json.

2. **Password reset deep link handling on Android**
   - What we know: iOS handles custom URL schemes well. Android deep linking with fragments (#access_token=...) can be inconsistent.
   - What's unclear: Whether Expo's Linking API reliably captures Supabase's password reset redirect on all Android versions.
   - Recommendation: Test password reset flow on physical Android device early. If fragments are problematic, use Supabase's PKCE flow with query parameters instead.

3. **Apple Sign-In on Android**
   - What we know: `expo-apple-authentication` only works on iOS. Apple Sign-In on Android requires an OAuth web flow.
   - What's unclear: Whether to implement Apple Sign-In for Android users or skip it.
   - Recommendation: Show Apple Sign-In button only on iOS (`Platform.OS === 'ios'`). Android users use email/password + Google. This is the standard pattern.

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase` - Auth setup, RLS policies, Google/Apple sign-in, profile triggers, password reset, client initialization
- Context7 `/expo/expo` - Router file structure, Stack.Protected pattern, tabs layout, authentication flow
- Context7 `/websites/nativewind_dev` - NativeWind v4 installation, babel/metro config, theme customization
- [Supabase Expo Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) - Client initialization with expo-sqlite localStorage
- [Expo Router Protected Routes](https://docs.expo.dev/router/advanced/protected/) - Stack.Protected API (SDK 53+)
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) - Deep link setup for password reset

### Secondary (MEDIUM confidence)
- [NativeWind/Expo version discussion](https://github.com/nativewind/nativewind/discussions/1604) - v4 vs v5 compatibility with SDK 54
- [Supabase RLS multi-tenant patterns](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - Household isolation patterns
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) - SDK version timeline
- [@react-native-google-signin/google-signin Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo) - Config plugin setup

### Tertiary (LOW confidence)
- NativeWind v4 + SDK 55 compatibility: Web search only, conflicting reports. Sticking with SDK 54 recommendation.
- Expo-sqlite localStorage as AsyncStorage replacement performance: Official docs mention it but no benchmarks found.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified via Context7 + official docs for all core libraries
- Architecture: HIGH - patterns from official Supabase and Expo Router documentation, cross-verified
- Database schema: HIGH - standard Supabase patterns for multi-tenant apps with RLS
- Pitfalls: HIGH - documented in official sources and verified across multiple references
- NativeWind version choice: MEDIUM - v4 is stable but SDK 54+ compatibility has some community-reported edge cases

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (30 days -- stable domain, but monitor NativeWind v5 status)
