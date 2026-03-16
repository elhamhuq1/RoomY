---
estimated_steps: 7
estimated_files: 1
---

# T03: Add room picker, effort picker, and inline room creation to add screen

**Slice:** S02 — Room-Based Chores Tab with Templates & Private Rooms
**Milestone:** M003

## Description

The add chore screen currently creates chores without room or effort. Since `chores.room_id` is NOT NULL, every new chore must have a room. This task adds a room picker (scrollable pills from household rooms), effort picker (1/2/3 toggle), and inline "create room" mini-modal. Also accepts URL params for template pre-fill from T04.

## Steps

1. **Add imports and state**
   - Import `Room` from `@/lib/types/database`
   - Import `ROOMS, ROOM_MAP, RoomInfo` from `@/lib/constants/chore-rooms`
   - Add state:
     ```ts
     const [rooms, setRooms] = useState<Room[]>([]);
     const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
     const [effortPoints, setEffortPoints] = useState<1 | 2 | 3>(1);
     const [loadingRooms, setLoadingRooms] = useState(true);
     // Create room modal
     const [showCreateRoom, setShowCreateRoom] = useState(false);
     const [newRoomName, setNewRoomName] = useState('');
     const [newRoomType, setNewRoomType] = useState<string>('general');
     const [newRoomPrivate, setNewRoomPrivate] = useState(false);
     const [creatingRoom, setCreatingRoom] = useState(false);
     ```

2. **Extend URL params**
   - Update `useLocalSearchParams` type to include `suggestedRoom?: string` and `suggestedEffort?: string`
   - Initialize `effortPoints` from `params.suggestedEffort` if present: `parseInt(params.suggestedEffort, 10) as 1|2|3`
   - `suggestedRoom` is a room ID — will be used to pre-select room after rooms are fetched

3. **Fetch household rooms**
   - In a `useEffect` or alongside `fetchMembers`:
     ```ts
     const fetchRooms = useCallback(async () => {
       if (!household?.id) return;
       const { data } = await supabase
         .from('rooms')
         .select('*')
         .eq('household_id', household.id);
       if (data) {
         setRooms(data as Room[]);
         // Default to General room or first room
         const general = (data as Room[]).find(r => r.room_type === 'general');
         setSelectedRoomId(params.suggestedRoom || general?.id || (data[0] as Room)?.id || null);
       }
       setLoadingRooms(false);
     }, [household?.id, params.suggestedRoom]);
     ```
   - Call `fetchRooms` in `useEffect`

4. **Render room picker**
   - Between the chore name input and frequency picker, add:
     ```
     Room
     [scrollable horizontal row of room pills]
     [+ New Room pill at the end]
     ```
   - Each pill shows the room icon (from ROOM_MAP by room_type) and room name
   - Selected pill gets `bg-brand` + white text, unselected gets `bg-white border border-gray-200`
   - Use `ScrollView horizontal` for the pills row
   - Room list ordered by ROOMS constant order (same as T02)
   - `+ New Room` pill at the end — tapping opens create room modal

5. **Render effort picker**
   - Below frequency picker:
     ```
     Effort
     [1] [2] [3] — three square-ish buttons in a row
     ```
   - Same styling as frequency picker (selected = brand bg, unselected = white border)
   - Labels: "Easy" (1), "Medium" (2), "Hard" (3) — or just the number with an emoji: "⚡1", "⚡2", "⚡3"

6. **Create room modal**
   - Small bottom-sheet modal (same pattern as swap/dispute modals in chores.tsx):
     - Room name text input
     - Room type picker: horizontal scroll of ROOMS constant items (icon + label), tap to select
     - Private toggle: `Switch` or checkbox — "Only visible to me (e.g. bedroom)"
     - "Create" button
   - On submit:
     ```ts
     const { data, error } = await supabase.from('rooms').insert({
       household_id: household.id,
       name: newRoomName.trim(),
       room_type: newRoomType,
       is_private: newRoomPrivate,
       created_by: user.id,
     }).select().single();
     ```
   - On success: add to `rooms` state, set as `selectedRoomId`, close modal

7. **Update INSERT to include room_id and effort_points**
   - In `handleSubmit`, add `room_id: selectedRoomId` and `effort_points: effortPoints` to the insert object
   - Validate that `selectedRoomId` is not null before submit (add to `canSubmit` check)
   - The insert now looks like:
     ```ts
     .insert({
       household_id: household.id,
       name: trimmedName,
       frequency,
       custom_interval_days: customIntervalDays,
       rotation_order: shuffled,
       current_assignee_index: 0,
       current_assignee: firstAssignee,
       next_due_at: dueDate.toISOString(),
       created_by: user.id,
       room_id: selectedRoomId,
       effort_points: effortPoints,
     })
     ```

## Must-Haves

- [ ] Room picker renders household rooms as scrollable pills with icon + name
- [ ] Default room is "General" when no suggestedRoom param
- [ ] "+ New Room" pill opens creation modal
- [ ] Room creation modal has name, room_type picker, private toggle
- [ ] Effort picker renders 1/2/3 toggle, defaults to 1
- [ ] `suggestedRoom` and `suggestedEffort` URL params pre-fill selections
- [ ] Chore INSERT includes room_id and effort_points
- [ ] Cannot submit without a room selected

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors
- Expo Go: room picker shows household rooms, defaults to General
- Expo Go: creating a new room (including private) adds it to the picker
- Expo Go: effort picker toggles correctly
- Expo Go: created chore has correct room_id and effort_points (check Supabase dashboard)

## Inputs

- `app/(app)/chores/add.tsx` — 357 LOC current add screen with name, frequency, member selection
- `lib/types/database.ts` — Room type: `{ id, household_id, name, room_type, is_private, created_by }`
- `lib/constants/chore-rooms.ts` — ROOMS (8 entries), ROOM_MAP lookup by room_type
- S01 forward intelligence: `chores.room_id` is NOT NULL — every chore must have a room. Room creation needs `household_id`, `name`, `room_type` (one of 8 CHECK values), `is_private`, `created_by`.

## Expected Output

- `app/(app)/chores/add.tsx` — extended with room picker, effort picker, create room modal, and updated INSERT
