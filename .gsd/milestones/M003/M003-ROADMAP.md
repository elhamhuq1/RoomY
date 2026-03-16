# M003: Chore System Overhaul

**Vision:** Transform the chore feature from a flat checklist into a room-based, effort-weighted, gamified household chore management system with fairness analytics, smart daily lists, templates, nudging, leaderboard, and badges.

## Success Criteria

- Chores display grouped by room with collapsible sections — not a flat list
- Private room chores are invisible to non-owners at the database level (RLS-enforced, not UI-hidden)
- Existing chores survive migration intact with default room ("General") and effort_points=1
- A user can populate a room's chores from templates in under 30 seconds
- Effort-weighted leaderboard ranks roommates by actual difficulty contributed, not just completion count
- Fairness score shows each member's percentage of total household effort
- "My Day" shows a personalized list of chores due/overdue for the current user today
- Visual urgency indicators (green/yellow/red) replace text "Overdue" labels on chore rows
- Sending a nudge delivers a push notification to the assigned roommate with rate limiting (1 per chore per 24h per sender)
- Streak badges (7/30/60-day) appear on the dashboard for consistent completion

## Key Risks / Unknowns

- **Private room RLS** — compound policy must join through rooms table to enforce visibility. If the policy is wrong, private chores leak to other household members. Must be proven at the DB level, not just UI.
- **Migration of existing chores** — adding room_id FK requires rooms to exist first. Multi-step migration in a single transaction: create rooms table → insert default "General" rooms per household → alter chores → update existing rows. If ordering is wrong, FK constraint fails.
- **Effort denormalization on completions** — leaderboard needs effort_points at completion time (not current chore value, which can change). Requires modifying `complete_chore` RPC to stamp effort_points onto `chore_completions`.
- **Nudge push notification delivery** — new Edge Function paralleling existing push-chore-reminder, but must handle rate limiting and respect notification preferences.

## Proof Strategy

- Private room RLS → retire in S01 by proving that a psql query as a non-owner returns zero rows for private room chores
- Migration safety → retire in S01 by proving existing chores have room_id and effort_points=1 after migration
- Effort denormalization → retire in S03 by proving `chore_completions` records carry the correct effort_points from completion time
- Nudge delivery → retire in S05 by proving the Edge Function sends the correct Expo Push payload and rate limiting blocks re-nudge within 24h

## Verification Classes

- Contract verification: `npx tsc --noEmit` after each slice (zero new errors in app/components/lib code), psql queries for migration/RLS verification
- Integration verification: RLS tested with multiple Supabase auth contexts, push notification Edge Function tested via curl, realtime sync of room/effort data across household members
- Operational verification: nudge rate limiting prevents spam, migration preserves all existing chore completion history, private room RLS blocks at DB level
- UAT / human verification: in-app visual verification via Expo Go — room sections render, urgency colors display, templates populate, dashboard shows effort-weighted stats, nudge notification received on device

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 5 slices are complete with passing verification
- Room-based chore organization renders correctly with collapsible sections in Expo Go
- Private room chores are verified invisible to non-owners via RLS (DB-level proof)
- Existing chores migrated to "General" room with effort_points=1, all completion history preserved
- Templates populate rooms with chores in under 30 seconds
- Effort-weighted leaderboard and fairness scores display on redesigned dashboard
- "My Day" view shows correct personalized daily tasks
- Nudge push notification delivers to assigned roommate with rate limiting enforced
- Streak badges display at correct thresholds (7/30/60-day)
- `npx tsc --noEmit` produces zero new errors in app/components/lib code
- Final integrated acceptance scenarios from M003-CONTEXT.md pass

## Requirement Coverage

- Covers: CHORE-01, CHORE-02, CHORE-03, CHORE-04, CHORE-05, CHORE-06, CHORE-07, CHORE-08, CHORE-09, CHORE-10, CHORE-11, CHORE-12, CHORE-13
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

| Requirement | Primary Slice | Supporting Slices |
|-------------|---------------|-------------------|
| CHORE-01 (room-based organization) | S02 | S01 (schema) |
| CHORE-02 (private rooms) | S02 | S01 (schema + RLS) |
| CHORE-03 (private room RLS) | S01 | — |
| CHORE-04 (effort points 1-3) | S01 | S02 (UI picker) |
| CHORE-05 (chore templates) | S02 | — |
| CHORE-06 (My Day view) | S04 | — |
| CHORE-07 (visual urgency) | S04 | — |
| CHORE-08 (weekly leaderboard) | S03 | — |
| CHORE-09 (fairness score) | S03 | — |
| CHORE-10 (streak badges) | S03 | — |
| CHORE-11 (peer nudging) | S05 | — |
| CHORE-12 (migration to General room) | S01 | — |
| CHORE-13 (effort-weighted dashboard) | S03 | — |

## Slices

- [x] **S01: Schema Migration, Rooms Table & Private Room RLS** `risk:high` `depends:[]`
  > After this: migration runs cleanly — existing chores have room_id pointing to "General" and effort_points=1, private room chores are invisible to non-owners via psql RLS verification, new rooms/nudges tables exist with proper policies

- [ ] **S02: Room-Based Chores Tab with Templates & Private Rooms** `risk:medium` `depends:[S01]`
  > After this: chores tab shows collapsible room sections (reusing SectionHeader pattern), users can create chores with room assignment and effort picker, templates populate rooms with one tap, private rooms appear only for their creator — all visible in Expo Go

- [ ] **S03: Effort-Weighted Dashboard, Leaderboard, Fairness & Badges** `risk:medium` `depends:[S01]`
  > After this: dashboard shows effort-weighted leaderboard ranking roommates by difficulty contributed, fairness score shows workload distribution percentage, streak badges (7/30/60-day) display for consistent completion, complete_chore RPC stamps effort_points on completions

- [ ] **S04: Smart "My Day" View & Visual Urgency Indicators** `risk:low` `depends:[S01]`
  > After this: "My Day" screen shows personalized daily task list (due today + overdue, sorted by urgency), chore rows display green/yellow/red urgency coloring based on due date proximity — all visible in Expo Go

- [ ] **S05: Peer Nudge System with Push Notifications** `risk:medium` `depends:[S01]`
  > After this: user can tap nudge on an overdue chore assigned to another roommate, push notification delivers via new Edge Function, rate limiting prevents re-nudge within 24h per chore per sender — verified via curl test of Edge Function and in-app UI

## Boundary Map

### S01 → S02

Produces:
- `rooms` table with `id`, `household_id`, `name`, `room_type`, `is_private`, `created_by` columns and RLS policies
- `chores.room_id` FK column pointing to rooms, `chores.effort_points` integer column (1-3, default 1)
- `chore_nudges` table with sender/recipient/chore tracking and RLS
- Default "General" room created per household, existing chores migrated to it
- RLS policies: household members see non-private rooms; private rooms visible only to `created_by`
- Updated `Chore` type in `lib/types/database.ts` with `room_id`, `effort_points` fields
- `Room` and `ChoreNudge` types in `lib/types/database.ts`
- `lib/constants/chore-rooms.ts` — fixed room taxonomy constant (`{ id, label, icon }` per room type)
- `lib/constants/chore-templates.ts` — pre-built chore suggestions per room with name, frequency, effort defaults

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- `chores.effort_points` column for effort-weighted queries
- `chore_completions` table (existing) — S03 will add `effort_points` column via its own migration
- Types and constants from S01

Consumes:
- nothing (first slice)

### S01 → S04

Produces:
- `chores.room_id` and `chores.effort_points` for display context
- Room taxonomy constant for room labels/icons on My Day items
- Urgency color thresholds use existing `next_due_at` column (no schema change needed)

Consumes:
- nothing (first slice)

### S01 → S05

Produces:
- `chore_nudges` table with RLS policies
- `ChoreNudge` type

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Room-based chores tab UI that S03's dashboard links back to
- Effort picker on add/edit screens that creates chores with meaningful effort_points values

Consumes:
- S01 schema and types

### S03 (standalone)

Produces:
- Effort-weighted leaderboard and fairness score on redesigned dashboard
- `effort_points` column on `chore_completions` (new migration)
- Modified `complete_chore` RPC to stamp effort_points at completion time
- Streak badge calculation and display

Consumes:
- S01 schema (effort_points on chores)
- S02 room-based tab (navigation context)
