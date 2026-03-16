# S01: Foundation

**Goal:** Scaffold the Expo project, configure NativeWind styling, initialize Supabase client with session persistence, create the full database schema with RLS, and wire up the auth context with protected route navigation.
**Demo:** Scaffold the Expo project, configure NativeWind styling, initialize Supabase client with session persistence, create the full database schema with RLS, and wire up the auth context with protected route navigation.

## Must-Haves


## Tasks

- [x] **T01: 01-foundation 01** `est:6min`
  - Scaffold the Expo project, configure NativeWind styling, initialize Supabase client with session persistence, create the full database schema with RLS, and wire up the auth context with protected route navigation.

Purpose: Establishes the entire technical foundation -- every subsequent plan depends on the project structure, database schema, Supabase client, auth context, and navigation guards created here.

Output: A running Expo app with NativeWind styling, Supabase connection, auth state management, protected routing (auth/onboarding/app groups), and a fully migrated database with RLS isolation.
- [x] **T02: 01-foundation 02** `est:3min`
  - Build the complete authentication UI: welcome screen, sign-up, sign-in (email/password + Google + Apple), and forgot password. These are the first screens users see and must match the warm/friendly visual direction.

Purpose: Delivers AUTH-01 (sign up and sign in with email/password + social providers). After this plan, users can create accounts and authenticate -- the prerequisite for all onboarding and household features.

Output: Four fully-styled auth screens with working email/password auth and social sign-in (Google + Apple), plus a password reset flow.
- [x] **T03: 01-foundation 03** `est:3min`
  - Build the complete onboarding wizard: profile setup, household create-or-join fork, invite code sharing, join confirmation, and module quiz with toggle cards. This is the linear wizard flow specified by the user.

Purpose: Delivers AUTH-02 (profile), AUTH-03 (create household + invite code), AUTH-04 (join household via code), and AUTH-05 (module quiz). After this plan, users can form households and configure their app experience.

Output: Seven onboarding screens implementing the full wizard: profile -> household-choice -> (create-household | join-household -> member-welcome) -> module-quiz -> dashboard redirect.
- [x] **T04: 01-foundation 04**
  - Build the main app dashboard with dynamic module tabs, empty states for solo creators, and all settings screens (profile, modules, members/invite). This is the home experience after onboarding.

Purpose: Delivers the post-onboarding experience -- dashboard with module tabs that respond to AUTH-05 settings, invite code management from AUTH-03, and validates RLS isolation. After this plan, the foundation phase is complete.

Output: Dashboard with conditional tabs, empty states, profile settings, module toggle settings, and member management with invite code sharing/regeneration.

## Files Likely Touched

- `app.json`
- `package.json`
- `tsconfig.json`
- `babel.config.js`
- `metro.config.js`
- `tailwind.config.js`
- `global.css`
- `.env.example`
- `lib/supabase.ts`
- `lib/auth-context.tsx`
- `lib/types/database.ts`
- `app/_layout.tsx`
- `supabase/migrations/00001_foundation.sql`
- `app/(auth)/welcome.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/_layout.tsx`
- `lib/auth-utils.ts`
- `app/(onboarding)/_layout.tsx`
- `app/(onboarding)/profile.tsx`
- `app/(onboarding)/household-choice.tsx`
- `app/(onboarding)/create-household.tsx`
- `app/(onboarding)/join-household.tsx`
- `app/(onboarding)/member-welcome.tsx`
- `app/(onboarding)/module-quiz.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/(tabs)/index.tsx`
- `app/(app)/(tabs)/expenses.tsx`
- `app/(app)/(tabs)/groceries.tsx`
- `app/(app)/(tabs)/chores.tsx`
- `app/(app)/settings/index.tsx`
- `app/(app)/settings/profile.tsx`
- `app/(app)/settings/modules.tsx`
- `app/(app)/settings/members.tsx`
- `app/(app)/_layout.tsx`
