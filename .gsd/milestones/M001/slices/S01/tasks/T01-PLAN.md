# T01: 01-foundation 01

**Slice:** S01 — **Milestone:** M001

## Description

Scaffold the Expo project, configure NativeWind styling, initialize Supabase client with session persistence, create the full database schema with RLS, and wire up the auth context with protected route navigation.

Purpose: Establishes the entire technical foundation -- every subsequent plan depends on the project structure, database schema, Supabase client, auth context, and navigation guards created here.

Output: A running Expo app with NativeWind styling, Supabase connection, auth state management, protected routing (auth/onboarding/app groups), and a fully migrated database with RLS isolation.

## Must-Haves

- [x] "Expo dev server starts without errors"
- [x] "NativeWind className prop applies styles to components"
- [x] "Supabase client connects and auth state listener fires"
- [x] "Navigation guards redirect unauthenticated users to auth screens"
- [x] "Database tables (profiles, households, household_members, household_settings) exist with RLS enabled"

## Files

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
