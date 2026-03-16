---
estimated_steps: 5
estimated_files: 7
---

# T01: Move SectionHeader to shared UI and add effort badge to ChoreRow

**Slice:** S02 — Room-Based Chores Tab with Templates & Private Rooms
**Milestone:** M003

## Description

SectionHeader is a generic collapsible section header component currently living in `components/groceries/`. The chores tab needs it for room sections. Move it to `components/ui/` to avoid cross-domain imports. Then add an effort_points badge to ChoreRow's metadata pills so room-grouped chore rows show their difficulty level.

## Steps

1. **Move SectionHeader to `components/ui/SectionHeader.tsx`**
   - Copy `components/groceries/SectionHeader.tsx` to `components/ui/SectionHeader.tsx`
   - Delete `components/groceries/SectionHeader.tsx`
   - The component is self-contained (imports React, RN, Ionicons, colors) — no changes needed to the component code itself

2. **Update exports**
   - Remove `SectionHeader` export from `components/groceries/index.ts`
   - Add `export { SectionHeader } from './SectionHeader';` to `components/ui/index.ts`

3. **Update groceries.tsx import**
   - In `app/(app)/(tabs)/groceries.tsx`, change the SectionHeader import from `@/components/groceries` to `@/components/ui`
   - If SectionHeader was destructured with other groceries components, split the import line

4. **Add effort badge to ChoreRow**
   - In `components/chores/ChoreRow.tsx`, the metadata pills row (line with frequency pill, overdue pill) already exists at the bottom of the component
   - After the frequency pill, add an effort badge pill when `chore.effort_points > 1`:
     ```
     {chore.effort_points > 1 && (
       <View className="bg-amber-50 px-2 py-0.5 rounded-full">
         <Text className="text-xs font-medium text-amber-700">
           ⚡×{chore.effort_points}
         </Text>
       </View>
     )}
     ```
   - Only show for effort > 1 since 1 is the default and doesn't need calling out
   - The `Chore` type from S01 already has `effort_points: number` — no type changes needed

5. **Verify compilation**
   - Run `npx tsc --noEmit` — zero new errors

## Must-Haves

- [ ] SectionHeader exists at `components/ui/SectionHeader.tsx` and is exported from `components/ui/index.ts`
- [ ] SectionHeader removed from `components/groceries/SectionHeader.tsx` and `components/groceries/index.ts`
- [ ] Groceries tab imports SectionHeader from `@/components/ui` and still compiles
- [ ] ChoreRow shows effort badge ("⚡×2" or "⚡×3") for chores with effort > 1
- [ ] ChoreRow hides effort badge for effort_points = 1

## Verification

- `npx tsc --noEmit` — zero new TypeScript errors
- `rg "SectionHeader" components/groceries/` returns only the old file if using git status, or nothing
- `rg "SectionHeader" components/ui/` shows the new file and export
- `rg "effort_points" components/chores/ChoreRow.tsx` confirms effort badge is rendered

## Inputs

- `components/groceries/SectionHeader.tsx` — 55 LOC generic component, takes label/count/icon/collapsible/expanded/onToggle props
- `components/groceries/index.ts` — currently exports SectionHeader
- `components/ui/index.ts` — existing barrel export for ui components
- `app/(app)/(tabs)/groceries.tsx` — imports `{ SectionHeader }` from `@/components/groceries`
- `components/chores/ChoreRow.tsx` — 251 LOC, renders chore row with metadata pills at bottom
- `lib/types/database.ts` — Chore type already has `effort_points: number` from S01

## Expected Output

- `components/ui/SectionHeader.tsx` — moved generic section header, no code changes
- `components/ui/index.ts` — adds SectionHeader export
- `components/groceries/index.ts` — SectionHeader export removed
- `app/(app)/(tabs)/groceries.tsx` — import path updated
- `components/chores/ChoreRow.tsx` — effort badge pill added to metadata row
