---
estimated_steps: 5
estimated_files: 1
---

# T01: Add urgency color system and update ChoreRow visual styling

**Slice:** S04 — Smart "My Day" View & Visual Urgency Indicators
**Milestone:** M003

## Description

Replace the amber-only overdue styling in ChoreRow with a three-tier urgency color system (green/yellow/red). This is the visual foundation for CHORE-07 and affects both the existing chores tab and the upcoming My Day screen (both render ChoreRow). The urgency helper uses `next_due_at` directly rather than the parent-computed `overdueDays` for cleaner encapsulation.

## Steps

1. **Add `getUrgencyLevel` helper** in `components/chores/ChoreRow.tsx` (above the component, near the existing helpers):
   ```typescript
   type UrgencyLevel = 'green' | 'yellow' | 'red';

   function getUrgencyLevel(nextDueAt: string): UrgencyLevel {
     const due = new Date(nextDueAt);
     const now = new Date();
     const diffMs = due.getTime() - now.getTime();
     const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
     if (diffDays < 0) return 'red';       // overdue
     if (diffDays <= 1) return 'yellow';    // due today or tomorrow
     return 'green';                        // 2+ days out
   }
   ```
   Note: `diffDays < 0` catches overdue (past due date). `diffDays === 0` is "due today", `diffDays === 1` is "due tomorrow" — both yellow.

2. **Add urgency color mapping** that maps `UrgencyLevel` to style values, using existing color tokens from `lib/theme/colors.ts`:
   ```typescript
   const URGENCY_COLORS: Record<UrgencyLevel, { border: string; pillBg: string; pillText: string }> = {
     green:  { border: colors.brand.DEFAULT,    pillBg: 'bg-brand-light',   pillText: 'text-brand-dark' },
     yellow: { border: colors.semantic.warning,  pillBg: 'bg-amber-50',      pillText: 'text-amber-700' },
     red:    { border: colors.semantic.error,    pillBg: 'bg-red-100',       pillText: 'text-red-700' },
   };
   ```

3. **Update the row background/border logic** (currently lines ~115-119). The current code is:
   ```typescript
   let rowBg = '';
   if (isDisputed) {
     rowBg = 'bg-red-50 border-l-4 border-red-300';
   } else if (isOverdue) {
     rowBg = 'bg-amber-50/50';
   }
   ```
   Replace with:
   ```typescript
   const urgency = getUrgencyLevel(chore.next_due_at);
   const urgencyStyle = URGENCY_COLORS[urgency];

   let rowBg = '';
   if (isDisputed) {
     rowBg = 'bg-red-50 border-l-4 border-red-300';
   } else {
     // Always show urgency left border for non-disputed rows
     rowBg = 'border-l-4';
   }
   ```
   Then on the `<View className={...}>` that wraps the row, apply the border color via inline style when not disputed:
   ```tsx
   <View
     className={`px-4 py-3 ${rowBg}`}
     style={!isDisputed ? { borderLeftColor: urgencyStyle.border } : undefined}
   >
   ```
   This gives every non-disputed chore a colored left border: green for 2+ days, yellow for today/tomorrow, red for overdue. Disputed rows keep their existing red-50 bg + red-300 border.

4. **Update the due-date pill** in the bottom metadata row (currently lines ~223-230). Replace the overdue amber pill and the plain text due date with an urgency-colored pill:
   - Current code has an if/else: overdue shows amber pill with "Xd overdue", not-overdue shows plain text `formatDueDate(...)`.
   - New: always show a pill with urgency coloring. The text stays the same (`formatDueDate` for non-overdue, `{overdueDays}d overdue` for overdue).
   ```tsx
   <View className={`rounded-full px-2 py-0.5 ${urgencyStyle.pillBg}`}>
     <Text className={`text-xs font-heading-semi ${urgencyStyle.pillText}`}>
       {isOverdue ? `${overdueDays}d overdue` : formatDueDate(chore.next_due_at)}
     </Text>
   </View>
   ```
   This replaces the entire if/else block from the overdue amber pill through the plain-text due date.

5. **Verify** disputed rows are unaffected. The `isDisputed` check remains the first condition in the if/else chain, so disputed styling always wins. Confirm the "Disputed" red pill (line ~211-213) is outside the urgency-affected area and untouched.

## Must-Haves

- [ ] `getUrgencyLevel` returns 'red' for overdue, 'yellow' for today/tomorrow, 'green' for 2+ days
- [ ] Non-disputed rows have urgency-colored left border (4px)
- [ ] Due-date pill uses urgency-colored background and text
- [ ] Disputed row styling (bg-red-50 + border-red-300) takes precedence over urgency coloring
- [ ] Effort badge (`⚡×N`) and frequency pill remain unchanged

## Verification

- `npx tsc --noEmit` — zero new TS errors
- Visual check in Expo Go: chores tab shows green/yellow/red left borders on rows based on due date
- Visual check: overdue chores show red pill with "Xd overdue" text
- Visual check: due-today chores show yellow pill
- Visual check: future chores show green pill with "Due in Xd" text
- Visual check: disputed chores still show red bg + red border + "Disputed" pill (unchanged)

## Inputs

- `components/chores/ChoreRow.tsx` — existing 258-line component with amber-only overdue styling
- `lib/theme/colors.ts` — color tokens: `brand.DEFAULT` (#2D6A4F), `semantic.warning` (#F59E0B), `semantic.error` (#EF4444)
- DECISIONS.md: "Urgency color thresholds hardcoded: green (2+ days), yellow (today/tomorrow), red (overdue)"

## Expected Output

- `components/chores/ChoreRow.tsx` — updated with `getUrgencyLevel` helper, `URGENCY_COLORS` mapping, urgency-based left border + pill coloring on all non-disputed rows
