---
id: T02
parent: S01
milestone: M003
provides:
  - Room and ChoreNudge TypeScript interfaces matching migration schema
  - Chore interface updated with room_id and effort_points
  - Database type entries for rooms and chore_nudges tables
  - ROOMS constant (8 entries) and ROOM_MAP lookup
  - CHORE_TEMPLATES constant with per-room chore suggestions
key_files:
  - lib/types/database.ts
  - lib/constants/chore-rooms.ts
  - lib/constants/chore-templates.ts
key_decisions:
  - Followed grocery-departments.ts pattern exactly for chore-rooms.ts (RoomInfo interface, ROOMS array, ROOM_MAP record)
  - ChoreTemplate effortPoints typed as union 1|2|3 matching DB CHECK constraint
patterns_established:
  - Room taxonomy constant pattern mirrors grocery department pattern for consistency
observability_surfaces:
  - none — compile-time types and static constants only
duration: 5m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: TypeScript types, room taxonomy constant, and chore templates constant

**Added Room/ChoreNudge types, room_id+effort_points to Chore, ROOMS constant (8 entries), and CHORE_TEMPLATES with per-room suggestions**

## What Happened

Previous attempt had already updated `lib/types/database.ts` with Room, ChoreNudge interfaces, updated Chore with room_id/effort_points, and added rooms/chore_nudges to the Database type. It also created `lib/constants/chore-rooms.ts` with ROOMS array and ROOM_MAP. The missing piece was `lib/constants/chore-templates.ts` — created it with 3-5 templates per room type, each with name, frequency, and effortPoints.

## Verification

- `npx tsc --noEmit` — zero new errors (all errors are pre-existing Deno/Supabase edge function issues unrelated to this task)
- `npx tsx` runtime check confirmed: ROOMS has 8 entries, ROOM_MAP maps all correctly, CHORE_TEMPLATES keys match ROOMS ids exactly
- Room interface fields match migration schema: id, household_id, name, room_type (union of 8 values), is_private, created_by, created_at
- ChoreNudge interface fields match migration schema: id, chore_id, sender_id, recipient_id, created_at
- Chore interface has room_id: string and effort_points: number
- Database type has rooms and chore_nudges table entries with correct Row/Insert/Update types

### Slice-level verification status

- ~~Migration applies cleanly~~ — T01 scope (partial recovery)
- ~~Existing chore preservation~~ — T01 scope
- ~~Private room RLS proof~~ — T01 scope
- ✅ `npx tsc --noEmit` produces zero new errors in app/components/lib code
- ✅ Room taxonomy constant exports ROOMS array with 8 entries and ROOM_MAP lookup
- ✅ Chore templates constant exports templates for each room type

## Diagnostics

No runtime signals — all outputs are compile-time types and static constants. Verify via `npx tsc --noEmit` for type correctness or `npx tsx -e "import { ROOMS } from './lib/constants/chore-rooms'; console.log(ROOMS.length)"` for runtime inspection.

## Deviations

None — previous attempt had completed steps 1-7, this run completed step 8 (chore-templates.ts).

## Known Issues

None.

## Files Created/Modified

- `lib/types/database.ts` — Added Room, ChoreNudge interfaces; updated Chore with room_id/effort_points; added rooms/chore_nudges to Database type
- `lib/constants/chore-rooms.ts` — New file: ROOMS array (8 entries), RoomInfo interface, ROOM_MAP lookup
- `lib/constants/chore-templates.ts` — New file: ChoreTemplate interface, CHORE_TEMPLATES record keyed by room type with 3-5 suggestions each
