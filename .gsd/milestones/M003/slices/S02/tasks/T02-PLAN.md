---
estimated_steps: 7
estimated_files: 1
---

# T02: Redesign chores tab with room-grouped collapsible sections

**Slice:** S02 — Room-Based Chores Tab with Templates & Private Rooms
**Milestone:** M003

## Description

The chores tab currently splits chores into "Your Chores" and "Household" flat lists. Redesign it to group chores by room with collapsible SectionHeader per room. Private rooms are auto-filtered by RLS — the query just returns what the user can see. All existing action handlers (complete, claim, swap, dispute, delete) and modals (swap, dispute) are preserved verbatim.

## Steps

1. **Add room fetching to fetchData**
   - In `app/(app)/(tabs)/chores.tsx`, add state: `const [rooms, setRooms] = useState<Room[]>([]);`
   - Import `Room` from `@/lib/types/database`
   - Import `ROOMS, ROOM_MAP` from `@/lib/constants/chore-rooms`
   - Import `SectionHeader` from `@/components/ui`
   - In `fetchData`, add a rooms query after the chores query:
     ```ts
     const { data: roomsData } = await supabase
       .from('rooms')
       .select('*')
       .eq('household_id', household.id);
     if (roomsData) setRooms(roomsData as Room[]);
     ```
   - RLS automatically filters out private rooms the user doesn't own

2. **Add collapsed rooms state**
   - `const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());`
   - Toggle function:
     ```ts
     const toggleRoom = useCallback((roomId: string) => {
       setCollapsedRooms(prev => {
         const next = new Set(prev);
         next.has(roomId) ? next.delete(roomId) : next.add(roomId);
         return next;
       });
     }, []);
     ```

3. **Build room-grouped derived data**
   - Replace the `myChores`/`othersChores` split with room grouping:
     ```ts
     // Build room lookup from fetched rooms
     const roomLookup = useMemo(() => {
       const map: Record<string, Room> = {};
       rooms.forEach(r => { map[r.id] = r; });
       return map;
     }, [rooms]);

     // Group chores by room_id
     const choresByRoom = useMemo(() => {
       const grouped: Record<string, Chore[]> = {};
       chores.forEach(c => {
         const rid = c.room_id;
         if (!grouped[rid]) grouped[rid] = [];
         grouped[rid].push(c);
       });
       // Sort within each room by next_due_at
       Object.values(grouped).forEach(list =>
         list.sort((a, b) => new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime())
       );
       return grouped;
     }, [chores]);

     // Order rooms by ROOMS constant order, skip rooms with 0 chores
     const orderedRoomIds = useMemo(() => {
       const roomTypeOrder = ROOMS.map(r => r.id);
       return rooms
         .filter(r => choresByRoom[r.id]?.length > 0)
         .sort((a, b) => {
           const ai = roomTypeOrder.indexOf(a.room_type);
           const bi = roomTypeOrder.indexOf(b.room_type);
           return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
         })
         .map(r => r.id);
     }, [rooms, choresByRoom]);
     ```
   - Keep `pendingCount` as count of chores where `current_assignee === user?.id`

4. **Replace the main render sections**
   - Remove the "YOUR CHORES" and "HOUSEHOLD" sections
   - Replace with a loop over `orderedRoomIds`:
     ```tsx
     {orderedRoomIds.map((roomId) => {
       const room = roomLookup[roomId];
       const roomChores = choresByRoom[roomId] || [];
       const roomInfo = room ? ROOM_MAP[room.room_type] : null;
       const isExpanded = !collapsedRooms.has(roomId);

       return (
         <View key={roomId} className="mt-4">
           <SectionHeader
             label={room?.name || roomInfo?.label || 'Unknown'}
             count={roomChores.length}
             icon={roomInfo?.icon}
             collapsible
             expanded={isExpanded}
             onToggle={() => toggleRoom(roomId)}
           />
           {isExpanded && (
             <Card className="mx-4 p-0 overflow-hidden">
               {roomChores.map((chore, index) => {
                 // ... same ChoreRow rendering logic as current code
                 // All props computed identically: overdueDays, assigneeProfile, isMyChore, isDisputed, etc.
               })}
             </Card>
           )}
         </View>
       );
     })}
     ```
   - The ChoreRow rendering inside each room is identical to the current rendering — same prop computation, same handlers. The only change is the grouping container.
   - `isMyChore` is computed per-chore as `chore.current_assignee === user?.id` (same as before, just not used for sectioning)

5. **Preserve all existing elements**
   - StatsRow stays at the top (update `pendingCount` to count user's assigned chores across all rooms)
   - Swap request banner stays below StatsRow
   - Swap modal and dispute modal stay at the bottom — no changes needed
   - Empty state check stays: `isEmpty = chores.length === 0 && !loading`

6. **Update the stats computation**
   - `streak` and `personalBest` calculations stay the same (computed from completions)
   - `pendingCount` becomes: `chores.filter(c => c.current_assignee === user?.id).length`
   - No changes to StatsRow component

7. **Verify**
   - Run `npx tsc --noEmit`
   - Visual verification in Expo Go

## Must-Haves

- [ ] Chores grouped by room with SectionHeader per room (icon, name, count)
- [ ] Sections are collapsible via SectionHeader toggle
- [ ] Rooms ordered by ROOMS constant order (kitchen → bathroom → ... → general)
- [ ] Empty rooms hidden from the list
- [ ] All existing chore actions work: complete, claim, swap, dispute, delete
- [ ] Swap modal and dispute modal unchanged
- [ ] StatsRow and swap banner preserved at top
- [ ] Private room chores only appear for room creator (via RLS — no client filtering)

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors
- Expo Go: chores are grouped by room with collapsible headers
- Expo Go: collapse/expand animates with LayoutAnimation (from SectionHeader)
- Expo Go: tapping complete/claim/swap/dispute/delete on any chore works as before

## Inputs

- `app/(app)/(tabs)/chores.tsx` — 768 LOC current chores tab with flat "Your Chores / Household" sections
- `components/ui/SectionHeader.tsx` — moved in T01, accepts label/count/icon/collapsible/expanded/onToggle
- `lib/constants/chore-rooms.ts` — ROOMS (ordered array), ROOM_MAP (lookup by room_type)
- `lib/types/database.ts` — Room type with id, household_id, name, room_type, is_private, created_by; Chore type with room_id, effort_points
- S01 migration created rooms table with RLS: non-private rooms visible to household, private rooms visible only to created_by

## Expected Output

- `app/(app)/(tabs)/chores.tsx` — redesigned with room-grouped sections, rooms fetched from Supabase, collapsible via SectionHeader, all existing functionality preserved
