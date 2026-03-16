---
estimated_steps: 5
estimated_files: 2
---

# T04: Template quick-add flow and redesigned empty state

**Slice:** S02 — Room-Based Chores Tab with Templates & Private Rooms
**Milestone:** M003

## Description

Delivers CHORE-05 (templates). Redesigns the empty state from a flat suggestion list to room-based template cards. Adds a template selection modal that lets users pick chores from CHORE_TEMPLATES and batch-insert them into the correct room. Also adds an "Add from templates" entry point on the chores tab for non-empty state.

## Steps

1. **Redesign EmptyState component**
   - In `components/chores/EmptyState.tsx`, replace the flat `SUGGESTED_CHORES` grid with room-based cards
   - Import `ROOMS, ROOM_MAP` from `@/lib/constants/chore-rooms` and `CHORE_TEMPLATES` from `@/lib/constants/chore-templates`
   - Change the interface: `onSelectRoom: (roomType: string) => void` instead of `onSelectSuggestion`
   - Keep `onCreateCustom` for the "Create custom chore" button
   - Render one card per room type (from ROOMS) that has templates:
     ```tsx
     {ROOMS.filter(r => CHORE_TEMPLATES[r.id]?.length > 0).map(room => (
       <Pressable key={room.id} onPress={() => onSelectRoom(room.id)}>
         <Card className="flex-row items-center px-3 py-3.5">
           <Ionicons name={room.icon as any} size={24} color={colors.brand.DEFAULT} />
           <View className="ml-3 flex-1">
             <Text className="text-sm font-medium text-neutral-text">{room.label}</Text>
             <Text className="text-xs text-neutral-secondary">
               {CHORE_TEMPLATES[room.id].length} templates
             </Text>
           </View>
           <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
         </Card>
       </Pressable>
     ))}
     ```
   - Keep the empty state illustration and messaging at top

2. **Build template selection modal in chores.tsx**
   - Add state:
     ```ts
     const [templateRoomType, setTemplateRoomType] = useState<string | null>(null);
     const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
     const [addingTemplates, setAddingTemplates] = useState(false);
     ```
   - When `templateRoomType` is set, show a bottom-sheet modal listing `CHORE_TEMPLATES[templateRoomType]` with checkboxes (all checked by default)
   - Each row: template name, frequency badge, effort badge
   - Toggle individual templates, "Select All / Deselect All" toggle
   - "Add Selected" button at bottom

3. **Implement template batch insert**
   - On "Add Selected", for each selected template:
     - Find or create a room of that room_type for the household:
       - Check if `rooms.find(r => r.room_type === templateRoomType)` exists
       - If not, insert a new room: `{ household_id, name: ROOM_MAP[templateRoomType].label, room_type: templateRoomType, is_private: false, created_by: user.id }`
     - Build chore inserts with: `name`, `frequency`, `effort_points` from template, `room_id` from found/created room, `household_id`, `created_by: user.id`, `rotation_order` from all household member IDs, `current_assignee_index: 0`, `current_assignee: memberIds[0]`, `next_due_at: new Date().toISOString()`
   - Insert all chores via `Promise.all` for parallel execution (same pattern as recipe import in groceries)
   - Show single loading state during insert
   - On completion: close modal, refresh chores

4. **Wire EmptyState in chores.tsx**
   - Update `EmptyState` usage in the empty-state branch:
     ```tsx
     <EmptyState
       onSelectRoom={(roomType) => {
         setTemplateRoomType(roomType);
         // Pre-select all templates
         const templates = CHORE_TEMPLATES[roomType] || [];
         setSelectedTemplates(new Set(templates.map((_, i) => i)));
       }}
       onCreateCustom={() => router.push('/(app)/chores/add' as never)}
     />
     ```

5. **Add "Browse Templates" button for non-empty state**
   - Below the StatsRow / swap banner area, add a small link-style button:
     ```tsx
     <Pressable className="mx-4 mt-2 flex-row items-center" onPress={() => setTemplateRoomType('__picker__')}>
       <Ionicons name="add-circle-outline" size={18} color={colors.brand.DEFAULT} />
       <Text className="ml-1.5 text-sm font-medium text-brand">Add from templates</Text>
     </Pressable>
     ```
   - When `templateRoomType === '__picker__'`, show a room picker first (list of room types), then on selection show the template modal for that room type
   - Alternative simpler approach: reuse the same room cards from EmptyState inline in the modal

## Must-Haves

- [ ] Empty state shows room-based template cards instead of flat suggestion list
- [ ] Template selection modal shows chore templates for selected room with checkboxes
- [ ] "Add Selected" batch-inserts chores with correct room, effort, frequency, rotation
- [ ] Room auto-created if it doesn't exist for the household
- [ ] Promise.all used for parallel inserts with single loading state
- [ ] "Browse Templates" or similar entry point available when chores already exist
- [ ] Empty state illustration preserved

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors
- Expo Go: empty state shows room template cards with template counts
- Expo Go: tapping a room card opens template selection modal
- Expo Go: adding templates creates chores in the correct room section
- Expo Go: adding templates for a room type that has no room record creates the room automatically
- Timing: user can populate a room from templates in under 30 seconds (success criterion)

## Inputs

- `components/chores/EmptyState.tsx` — 86 LOC current flat suggestion grid
- `app/(app)/(tabs)/chores.tsx` — T02 output: room-grouped chores tab with rooms state and refresh function
- `lib/constants/chore-rooms.ts` — ROOMS array (8 entries), ROOM_MAP lookup
- `lib/constants/chore-templates.ts` — CHORE_TEMPLATES record with 3-5 templates per room type
- `lib/types/database.ts` — Room, Chore types
- T02 established: `rooms` state, `choresByRoom` grouping, `refreshChores` function in chores.tsx
- T03 established: room creation pattern (insert with household_id, name, room_type, is_private, created_by)

## Expected Output

- `components/chores/EmptyState.tsx` — redesigned with room-based template cards
- `app/(app)/(tabs)/chores.tsx` — template selection modal added, EmptyState wiring updated, "Browse Templates" entry point added

## Observability Impact

- **Console logging:** Room creation failure logs `[chores] room creation failed: <message>`. Template insert failure logs `[chores] template insert failed: <message>`. General catch logs `[chores] template add error: <err>`.
- **User-facing signals:** Loading spinner on "Add Selected" button during batch insert. Alert dialog on any failure path.
- **Inspection:** Template insertion results visible immediately in the room-grouped chore list after refresh. Room auto-creation verifiable via `supabase.from('rooms').select('*')`. Chore count per room visible in SectionHeader badges.
- **Failure visibility:** If room creation fails, alert shown and no chores inserted (atomic guard). If chore insert fails, alert shown. No silent failures — all error paths produce either console.error or Alert.alert.
