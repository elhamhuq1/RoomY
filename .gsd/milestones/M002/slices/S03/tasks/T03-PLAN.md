---
estimated_steps: 5
estimated_files: 4
---

# T03: Long-press category picker for manual reassignment

**Slice:** S03 — Category & Aisle Organization
**Milestone:** M002

## Description

Adds a long-press gesture to `GroceryItemRow` that opens a category picker overlay. The picker shows all 10 departments as tappable pills (icon + label). Selecting a department optimistically updates the item's category and persists via Supabase. The item moves to the correct department section immediately.

## Steps

1. Create `components/groceries/CategoryPicker.tsx`:
   - Props: `visible: boolean`, `currentCategory: string`, `onSelect: (category: string) => void`, `onDismiss: () => void`
   - Renders a `Modal` (transparent, fade animation) with a semi-transparent backdrop `Pressable` that calls `onDismiss`
   - Content: a centered/bottom card with title "Change Category", then a grid or vertical list of department pills from `DEPARTMENTS` constant
   - Each pill shows the department icon (Ionicon) + label. The `currentCategory` pill gets a highlighted style (e.g., wintergreen background)
   - Tapping a pill calls `onSelect(dept.id)` and the parent dismisses
   - Style: follow the existing edit modal pattern in `groceries.tsx` — `Modal` + transparent bg + centered content card
2. Add `onLongPress` prop to `GroceryItemRow` interface and wire it to the outer `Pressable` wrapping the swipeable content. The outer `Pressable` at ~line 55 currently only has `onPress={onEdit}` — add `onLongPress={onLongPress}`. Keep `delayLongPress` at default (500ms) or set 400ms for responsiveness.
3. Export `CategoryPicker` from `components/groceries/index.ts` barrel file.
4. In `groceries.tsx`:
   - Import `CategoryPicker`
   - Add state: `const [categoryPickerItem, setCategoryPickerItem] = useState<GroceryItem | null>(null)`
   - Pass `onLongPress={() => setCategoryPickerItem(item)}` to each `GroceryItemRow` in the department section rendering (from T02)
   - Also pass `onLongPress` to rows in the DONE section (category change should work on checked items too)
   - Render `<CategoryPicker visible={!!categoryPickerItem} currentCategory={categoryPickerItem?.category ?? 'other'} onSelect={handleCategoryChange} onDismiss={() => setCategoryPickerItem(null)} />`
   - Implement `handleCategoryChange(newCategory: string)`:
     - Optimistically update the item in local `items` state: `setItems(prev => prev.map(i => i.id === categoryPickerItem.id ? { ...i, category: newCategory } : i))`
     - Dismiss picker: `setCategoryPickerItem(null)`
     - Call `supabase.from('grocery_items').update({ category: newCategory }).eq('id', categoryPickerItem.id)`
     - On error, rollback optimistic update (restore old category)
5. Run `npx tsc --noEmit` to verify types.

## Must-Haves

- [ ] `CategoryPicker` component renders all 10 departments with icons
- [ ] Current category visually highlighted in the picker
- [ ] Long-press on any `GroceryItemRow` (checked or unchecked) opens the picker
- [ ] Category change is optimistic — item moves to new section immediately
- [ ] Category change persists to Supabase
- [ ] Picker dismissible by tapping outside
- [ ] No conflict with existing tap (edit) and swipe (delete) gestures

## Verification

- `npx tsc --noEmit` passes
- Visual in Expo Go: long-press an item in "Other" section → picker appears with 10 departments → tap "Produce" → item moves to Produce section → picker dismisses. Long-press a checked item in DONE → picker works the same (category updates even though grouping isn't visible in DONE).

## Inputs

- `components/groceries/GroceryItemRow.tsx` — current props: `item`, `isChecked`, `creatorName`, `creatorId`, `creatorAvatarUrl`, `onToggle`, `onEdit`, `onDelete`. Outer `Pressable` at ~line 55 has `onPress={onEdit}`. No `onLongPress` yet.
- `lib/constants/grocery-departments.ts` — `DEPARTMENTS` array and `DEPARTMENT_MAP` (from T01)
- `app/(app)/(tabs)/groceries.tsx` — department-grouped rendering from T02, existing edit modal pattern for Modal styling reference
- `components/groceries/index.ts` — barrel exports (from T01/T02)
- `lib/theme/colors.ts` — `colors.brand.DEFAULT` for wintergreen highlight

## Expected Output

- `components/groceries/CategoryPicker.tsx` — new component
- `components/groceries/GroceryItemRow.tsx` — `onLongPress` prop added and wired
- `components/groceries/index.ts` — `CategoryPicker` exported
- `app/(app)/(tabs)/groceries.tsx` — category picker state, handlers, and `<CategoryPicker>` rendered
