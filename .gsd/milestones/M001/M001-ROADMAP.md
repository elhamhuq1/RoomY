# M001: RoomY v1.0–v1.2

**Vision:** A mobile app for roommates to manage shared household expenses, groceries, and chores without friction.

## Success Criteria

- Users can authenticate, create/join households, and manage shared expenses, groceries, and chores
- App visual identity is cohesive with wintergreen palette and cream background
- Google OAuth sign-in works in Expo Go on both iOS and Android
## Slices

- [x] **S01: Foundation** `risk:medium` `depends:[]`
  > After this: Scaffold the Expo project, configure NativeWind styling, initialize Supabase client with session persistence, create the full database schema with RLS, and wire up the auth context with protected route navigation.
- [x] **S02: Expense Splitting** `risk:medium` `depends:[S01]`
  > After this: Create the expense splitting database schema (tables, functions, RLS policies) and TypeScript types.
- [x] **S03: Groceries** `risk:medium` `depends:[S02]`
  > After this: Create the grocery list database schema and build the real-time collaborative grocery list screen.
- [x] **S04: Chores** `risk:medium` `depends:[S03]`
  > After this: Create the chores database schema and build the main chore list with create/complete/claim functionality.
- [x] **S05: Engagement** `risk:medium` `depends:[S04]`
  > After this: Shared household calendar on the Home tab showing expenses and chore schedules as color-coded dots on a month grid, with tappable day detail expansion.
- [x] **S06: Design System + Components — Design tokens, shared component library, navigation chrome** `risk:medium` `depends:[S05]`
  > After this: Design tokens (colors, typography, elevation), shared component library (Avatar, Card, Badge, Button, IconContainer, Toggle), and branded tab bar + FAB navigation are established.
- [x] **S07: Home Screen — Calendar, balance summary, attention feed, weekly timeline** `risk:medium` `depends:[S06]`
  > After this: Home screen displays calendar section, gradient balance summary card, attention feed, and weekly timeline.
- [x] **S08: Expenses Screen — Balance cards, differentiated history rows, per Member breakdown** `risk:medium` `depends:[S07]`
  > After this: Expenses screen shows balance cards, differentiated history rows with icons, and per-member breakdown view.
- [x] **S09: Groceries + Chores — Circle checkboxes, avatars, emoji icons, stats cards, dispute styling** `risk:medium` `depends:[S08]`
  > After this: Groceries screen has circle checkboxes and avatars; Chores screen has emoji icons, stats cards, and dispute styling.
- [x] **S10: Onboarding Flow — Glassmorphism carousel, styled auth, gradient cards, step progress bar** `risk:medium` `depends:[S09]`
  > After this: Onboarding flow uses glassmorphism carousel, styled auth screens, gradient info cards, and step progress bar.
- [x] **S11: Visual Foundation** `risk:medium` `depends:[S10]`
  > After this: App-wide visual identity shifted to wintergreen palette (#2D6A4F) with cream background (#F5F0EB) and outline cards across entire app.
- [x] **S12: Empty State Illustrations** `risk:medium` `depends:[S11]`
  > After this: All module empty states display charming illustrations instead of icon-circle placeholders.
- [x] **S13: Profile Pictures** `risk:medium` `depends:[S12]`
  > After this: Install image-related packages, set up Supabase Storage bucket with RLS policies, create the avatar upload utility, and upgrade the Avatar component to display uploaded photos with a brand-colored ring.
- [x] **S14: Google Oauth** `risk:medium` `depends:[S13]`
  > After this: Replace native Google Sign-In with browser-based OAuth flow using expo-web-browser, remove all Apple sign-in code, and update auth screen UI with Google's branded button.
