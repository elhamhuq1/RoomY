---
depends_on: [M002]
---

# M003: Chore System Overhaul

**Gathered:** 2026-03-15
**Status:** Queued — pending auto-mode execution

## Project Description

Complete redesign of the chore feature from a flat checklist with basic rotation into a room-based, effort-weighted, gamified household chore management system. Introduces room organization, effort points with fairness analytics, smart daily task lists, pre-built chore templates, visual urgency indicators, peer nudging, leaderboard with badges, and private room support. This is a rebuild of the chore experience — same underlying data model (extended), completely new UX and intelligence layer.

## Why This Milestone

The current chore system was built early in M001 as a functional checklist with rotation. It works but doesn't differentiate — it's a to-do list with names attached. Competitive analysis of Sweepy, Tody, Nipto, OurHome, and Flatastic shows that the features people actually pay for are: effort-weighted fairness ("who's really pulling their weight"), smart scheduling ("what should I do today"), and room-based organization ("clean by area, not by random list"). The current system doesn't address the #1 roommate chore complaint: perceived unfairness in workload distribution.

This milestone transforms chores from the weakest feature in RoomY to a potential monetization driver. Build everything now for beta testing — gate premium features behind a paywall when publishing to the App Store.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See chores organized by room (Kitchen, Bathroom, Living Room, etc.) with collapsible sections, instead of a flat list
- Add personal/private rooms (bedroom) with chores only they see — not visible to or assignable to other roommates
- Choose from pre-built chore templates per room during setup (kitchen: dishes, wipe counters, mop floor; bathroom: clean toilet, scrub shower, etc.) instead of manually creating every chore
- See effort points (1-3) on each chore reflecting actual difficulty — vacuuming counts more than wiping a counter
- Open a "My Day" view showing a personalized daily task list based on what's due, overdue, and assigned to them
- See visual urgency indicators (green → yellow → red) on each chore instead of plain "Overdue" text labels
- View a weekly leaderboard showing effort points contributed by each roommate, with the current leader highlighted
- Earn visual streak badges (7-day, 30-day, 60-day) for consistent chore completion
- See a fairness score/report showing workload distribution by effort points across the household
- Send a gentle nudge (push notification) to the roommate whose turn it is for an overdue chore — app-mediated, not a passive-aggressive text

### Entry point / environment

- Entry point: Chores tab in the RoomY app (complete UX redesign of existing tab)
- Environment: Expo Go on iOS and Android (dev/beta), Supabase for backend
- Live dependencies involved: Supabase Realtime for household sync, push notifications for nudging

## Completion Class

- Contract complete means: room-based chore organization renders correctly, effort points calculate fairness scores, smart daily list generates appropriate tasks, templates populate rooms, visual urgency shows correct color states, nudge sends push notification, leaderboard ranks by effort — all verified via TypeScript compilation and in-app testing
- Integration complete means: private rooms only visible to owner, nudge notifications delivered via existing push pipeline, leaderboard reflects real completion data, fairness scores match actual effort distribution, templates create real chores with correct room/effort assignments
- Operational complete means: smart daily list handles edge cases (no chores due, all overdue, new user with no history), nudge rate limiting prevents spam, private room RLS prevents cross-user visibility

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A user can set up a household's chores using room templates in under 2 minutes (vs manual creation today), see them organized by room, and have effort points pre-assigned
- A user opens "My Day" and sees a prioritized list of chores due/overdue for them today, completes them, and sees their effort points accumulate on the weekly leaderboard
- A user sends a nudge about an overdue kitchen chore and the assigned roommate receives a push notification
- The fairness report shows accurate effort-weighted workload distribution — a roommate who does hard chores consistently ranks higher than one who only does easy tasks
- Private bedroom chores are completely invisible to other household members (verified via RLS)

## Risks and Unknowns

- **Schema migration complexity** — adding rooms, effort points, and private room visibility to the existing chores table requires careful migration that preserves existing chore data. Existing chores need a default room assignment and default effort points.
- **Smart daily list algorithm** — generating "what to do today" requires balancing overdue priority, rotation fairness, and time estimates. No external API needed, but the algorithm needs to feel right — not just dump all overdue items.
- **Nudge abuse prevention** — roommates could spam nudge each other. Need rate limiting (e.g., max 1 nudge per chore per 24 hours per sender) without making it feel restrictive.
- **Private room RLS** — must ensure private room chores are completely invisible to other household members at the database level, not just UI-hidden. New RLS policies needed.
- **Effort point calibration** — the 1-3 scale seems right based on competitive analysis, but may need adjustment. Templates should have sensible defaults that users can override.
- **Migration of existing chores** — beta users may already have chores created under the old system. Migration must assign them to a default "General" room with effort=1 and preserve all completion history.

## Existing Codebase / Prior Art

- `app/(app)/(tabs)/chores.tsx` — main chore list screen (flat list with completion/dispute actions). Will be completely redesigned with room-based sections.
- `app/(app)/chores/add.tsx` — chore creation screen. Needs room selection, effort picker, template support.
- `app/(app)/chores/dashboard.tsx` — contribution dashboard with weekly/monthly toggle and completion counts. Will be redesigned with effort-weighted leaderboard and fairness analytics.
- `app/(app)/chores/dispute.tsx` — dispute flow. Stays largely the same.
- `app/(app)/chores/swap-request.tsx` — swap request flow. Stays largely the same.
- `components/chores/ChoreRow.tsx` — chore row component with emoji mapping, status display. Needs visual urgency indicators and effort badge.
- `components/chores/StatsRow.tsx` — member stats row. Needs effort-weighted display.
- `supabase/migrations/20260311000004_chores.sql` — chore schema (chores, chore_completions, chore_swap_requests). Needs new columns (room_id, effort_points, is_private) and new tables (rooms, chore_templates, nudges).
- `supabase/functions/push-chore-reminder/index.ts` — existing push notification Edge Function for chore reminders. Nudging will extend or parallel this.
- `lib/constants/grocery-departments.ts` — pattern for fixed taxonomy constants (rooms will follow similar pattern).

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- This milestone introduces entirely new capabilities. New requirements will be added during planning:
  - CHORE-01 through CHORE-XX for room organization, effort points, fairness, smart lists, templates, visual urgency, nudging, leaderboard, badges, private rooms

## Scope

### In Scope

- Room-based chore organization (kitchen, bathroom, living room, etc.) with collapsible sections
- Private rooms (bedrooms) with owner-only visibility and RLS enforcement
- Effort points (1-3) on each chore with creator-configurable difficulty
- Pre-built chore templates per room with sensible effort defaults
- Smart "My Day" daily task list based on due dates, overdue status, and assignment
- Visual urgency indicators (green/yellow/red color coding) replacing text labels
- Effort-weighted fairness score/report showing workload distribution
- Weekly leaderboard ranked by effort points with current leader highlighted
- Streak badges (7-day, 30-day, 60-day) for consistent completion
- Peer nudging via push notification with rate limiting (1 nudge per chore per 24h per sender)
- Migration of existing chores to new room-based structure (default "General" room, effort=1)
- Redesigned contribution dashboard with effort-weighted analytics

### Out of Scope / Non-Goals

- Virtual home decoration / coins / virtual rewards (too juvenile for college-age roommates)
- Chore approval system (parent/kid dynamic, not roommate)
- Focus timer for cleaning sessions (not a roommate use case)
- Monetization / paywall gating (build everything free for beta; gate later when publishing)
- Chore marketplace / trading beyond existing swap system
- Integration with smart home devices
- Photo verification of completed chores

## Technical Constraints

- **Expo Go compatibility** — all features must work in Expo Go on both iOS and Android
- **Existing push notification pipeline** — nudging must use the existing Supabase Edge Function + Expo Push pattern, not introduce new infrastructure
- **Additive schema changes** — migrations must not break existing chore data. All new columns need defaults, existing chores get migrated to default room/effort values
- **RLS for private rooms** — private room chores must be invisible at the database level via Supabase RLS policies, not just hidden in UI
- **Realtime sync** — room changes, effort updates, and nudge status must sync across household members via existing Supabase realtime subscriptions

## Integration Points

- **Existing push notification system** — nudge notifications route through the same Expo Push + Edge Function pipeline used for chore reminders and expense notifications
- **Supabase Realtime** — room-based organization and effort points sync across household members via existing realtime subscription pattern
- **Existing chore rotation/completion RPCs** — complete_chore, claim_chore, dispute_completion RPCs need to be aware of effort points for leaderboard accumulation
- **Home screen attention feed** — overdue chores and nudge notifications should surface in the existing attention feed on the home tab
- **Household calendar** — chore events already appear on calendar; room and effort metadata could enhance calendar display

## Open Questions

- **Room creation UX** — should users pick from a fixed set of room types (kitchen, bathroom, living room, bedroom, etc.) or allow fully custom rooms? Fixed set simplifies templates but limits flexibility.
- **Fairness algorithm** — simple ratio (your effort points / total effort points) vs. more sophisticated "expected vs actual" contribution model? Simple is more transparent.
- **Smart daily list cap** — should "My Day" limit the number of tasks shown (e.g., top 5) to avoid overwhelming, or show everything that's due/overdue?
- **Nudge notification copy** — how should the push notification read? "Alex thinks the kitchen could use some love 🧹" vs "Kitchen cleanup is overdue — nudge from Alex"? Tone matters.
- **Badge display** — where do streak badges appear? On the chore row? On the dashboard? On the user's profile?
