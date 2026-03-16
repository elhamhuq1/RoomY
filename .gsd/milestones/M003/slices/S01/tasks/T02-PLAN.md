---
estimated_steps: 7
estimated_files: 4
---

# T02: TypeScript types, room taxonomy constant, and chore templates constant

**Slice:** S01 — Schema Migration, Rooms Table & Private Room RLS
**Milestone:** M003

## Description

Add the TypeScript interfaces and constants that all downstream slices (S02-S05) depend on. The `Room` and `ChoreNudge` types must mirror the migration schema exactly. The `Chore` interface gets `room_id` and `effort_points` fields. The room taxonomy constant follows the identical pattern as `lib/constants/grocery-departments.ts`. The chore templates constant provides per-room pre-built suggestions with realistic names, frequencies, and effort_points defaults.

## Steps

1. Open `lib/types/database.ts`. Add `Room` interface after `ChoreSwapRequest`:
   ```ts
   export interface Room {
     id: string;
     household_id: string;
     name: string;
     room_type: 'kitchen' | 'bathroom' | 'living_room' | 'bedroom' | 'laundry' | 'outdoor' | 'garage' | 'general';
     is_private: boolean;
     created_by: string;
     created_at: string;
   }
   ```
2. Add `ChoreNudge` interface:
   ```ts
   export interface ChoreNudge {
     id: string;
     chore_id: string;
     sender_id: string;
     recipient_id: string;
     created_at: string;
   }
   ```
3. Add `room_id: string` and `effort_points: number` to the existing `Chore` interface.
4. Add `rooms` table entry to the `Database` type's `Tables`:
   - `Row: Room`
   - `Insert: Omit<Room, 'id' | 'created_at'> & { id?: string; created_at?: string; }`
   - `Update: Partial<Omit<Room, 'id'>>`
5. Add `chore_nudges` table entry to the `Database` type's `Tables`:
   - `Row: ChoreNudge`
   - `Insert: Omit<ChoreNudge, 'id' | 'created_at'> & { id?: string; created_at?: string; }`
   - `Update: Partial<Omit<ChoreNudge, 'id'>>`
6. Update the `chores` Insert type to include `room_id?: string` (optional because it could be set server-side) and `effort_points?: number` (optional because it has a default of 1).
7. Create `lib/constants/chore-rooms.ts` following the exact pattern of `lib/constants/grocery-departments.ts`:
   - Export `RoomInfo` interface: `{ id: string; label: string; icon: string }`
   - Export `ROOMS: RoomInfo[]` with 8 entries ordered logically: kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general. Use Ionicons names for icons (e.g., 'restaurant' for kitchen, 'water' for bathroom, 'tv' for living room, 'bed' for bedroom, 'shirt' for laundry, 'leaf' for outdoor, 'car' for garage, 'grid' for general).
   - Export `ROOM_MAP: Record<string, RoomInfo>` for O(1) lookup.
8. Create `lib/constants/chore-templates.ts`:
   - Export `ChoreTemplate` interface: `{ name: string; frequency: 'daily' | 'weekly' | 'monthly'; effortPoints: 1 | 2 | 3 }`
   - Export `CHORE_TEMPLATES: Record<string, ChoreTemplate[]>` keyed by room_type id.
   - Include 3-5 realistic templates per room. Examples:
     - kitchen: Wash dishes (daily/1), Wipe counters (daily/1), Clean stovetop (weekly/2), Mop floor (weekly/2), Clean oven (monthly/3)
     - bathroom: Wipe mirror (weekly/1), Clean toilet (weekly/2), Scrub shower (weekly/2), Mop floor (weekly/2), Deep clean (monthly/3)
     - living_room: Vacuum (weekly/2), Dust surfaces (weekly/1), Clean windows (monthly/2)
     - bedroom: Make bed (daily/1), Vacuum (weekly/2), Change sheets (weekly/2), Dust (weekly/1)
     - laundry: Do laundry (weekly/2), Clean lint trap (weekly/1), Wipe machines (monthly/1)
     - outdoor: Sweep porch (weekly/1), Water plants (daily/1), Mow lawn (weekly/3), Take out trash (daily/1)
     - garage: Sweep floor (monthly/1), Organize shelves (monthly/2)
     - general: Take out recycling (weekly/1), Check mail (daily/1), Wipe light switches (monthly/1)

## Must-Haves

- [ ] `Room` interface matches migration schema exactly (all columns represented)
- [ ] `ChoreNudge` interface matches migration schema exactly
- [ ] `Chore` interface has `room_id: string` and `effort_points: number`
- [ ] Database type has `rooms` and `chore_nudges` table entries
- [ ] `ROOMS` array has exactly 8 entries matching the room_type CHECK constraint in migration
- [ ] `CHORE_TEMPLATES` has entries for all 8 room types
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` — zero new errors
- Manually verify `ROOMS` has 8 entries with unique ids matching the SQL CHECK constraint values
- Manually verify `CHORE_TEMPLATES` keys match `ROOMS` ids

## Inputs

- `lib/types/database.ts` — existing types file. `Chore`, `ChoreCompletion`, `ChoreSwapRequest` interfaces and their Database table entries. See the existing pattern for Row/Insert/Update typing.
- `lib/constants/grocery-departments.ts` — exact pattern to follow for `chore-rooms.ts`: `DepartmentInfo` interface, `DEPARTMENTS` array, `DEPARTMENT_MAP` record.
- `supabase/migrations/20260316000016_chore_rooms.sql` — T01 output. The rooms table columns and chore_nudges table columns define the TS interfaces. The room_type CHECK constraint values define the ROOMS array ids.
- Decision: "Fixed room taxonomy (kitchen, bathroom, living_room, bedroom, laundry, outdoor, garage, general) as constant like DEPARTMENTS"
- Decision: "Room taxonomy as a fixed constant (chore-rooms.ts) with rooms table for household instances"

## Observability Impact

- **No runtime signals change.** This task adds only compile-time types and static constants — no runtime behavior, no logs, no API surfaces.
- **Inspection:** `npx tsc --noEmit` validates type correctness. Constants can be inspected via `node -e "console.log(require('./lib/constants/chore-rooms').ROOMS.length)"` after build.
- **Failure visibility:** Type mismatches between these interfaces and the migration schema will surface as runtime Supabase query errors in downstream slices when the migration is applied.

## Expected Output

- `lib/types/database.ts` — updated with Room, ChoreNudge interfaces; Chore has room_id + effort_points; Database type has rooms + chore_nudges tables
- `lib/constants/chore-rooms.ts` — new file with ROOMS array (8 entries) and ROOM_MAP lookup
- `lib/constants/chore-templates.ts` — new file with CHORE_TEMPLATES record keyed by room type
