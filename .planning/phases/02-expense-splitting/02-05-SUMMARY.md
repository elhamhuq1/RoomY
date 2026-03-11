---
phase: 02-expense-splitting
plan: 05
subsystem: database, ui
tags: [supabase, sql, react-native, venmo, expo-router, nativewind]

# Dependency graph
requires:
  - phase: 02-expense-splitting
    provides: "Expense schema, balance function, settle-up screen, expense history"
provides:
  - "Corrected get_household_balances() with proper settlement sign logic"
  - "Add expense form with aligned $ sign and keyboard dismiss"
  - "Venmo note with expense description and date format"
  - "ScrollView bounce-back fix on expenses tab"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline styles over NativeWind className for ScrollView sizing (avoids bounce-back)"
    - "Keyboard.dismiss() at start of form submit handlers"
    - "Pass expense metadata (description, date) through router search params for Venmo notes"

key-files:
  created: []
  modified:
    - supabase/migrations/00002_expenses.sql
    - app/(app)/expenses/add.tsx
    - app/(app)/(tabs)/expenses.tsx
    - app/(app)/expenses/settle.tsx

key-decisions:
  - "Venmo note encoding: deferred remaining + sign issue (expo-router double-encodes); user accepted minor cosmetic gap"
  - "ScrollView uses inline style={{ flex: 1 }} instead of className='flex-1' to avoid bounce-back regression"

patterns-established:
  - "Inline styles for ScrollView/FlatList sizing to prevent NativeWind layout conflicts"

requirements-completed: [EXPN-05, EXPN-06]

# Metrics
duration: ~20min
completed: 2026-03-11
---

# Phase 2 Plan 5: Gap Closure Summary

**Fixed settlement balance inversion (settlements now reduce debt), dollar sign alignment, keyboard dismiss, and Venmo note format showing expense description with date**

## Performance

- **Duration:** ~20 min (across prior agent sessions)
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Fixed critical settlement balance bug where settlements were adding to balance instead of subtracting (sign inversion in get_household_balances SQL function)
- Fixed dollar sign vertical alignment in add expense form by removing font-semibold and adding paddingVertical: 0
- Added keyboard dismiss on scroll (keyboardDismissMode="on-drag") and Keyboard.dismiss() in handleSubmit
- Venmo note now shows "Description - MM/DD/YY" format instead of generic "RoomY: Settlement" text
- Fixed ScrollView bounce-back issue on expenses tab using inline styles

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix settlement balance inversion and add expense form UX** - `a91e7c9` (fix)
2. **Task 2: Fix Venmo note to show expense description with date** - `782816f` (feat)
   - Follow-up fix: unencoded Venmo note - `a4687b5` (fix)
   - Follow-up fix: decode + from params - `078da6d` (fix)
   - Follow-up fix: ScrollView bounce-back - `b617aa9` (fix)
3. **Task 3: Verify all UAT gaps are closed** - human-verify checkpoint, approved by user

## Files Created/Modified
- `supabase/migrations/00002_expenses.sql` - Swapped settlement signs in get_household_balances() combined CTE
- `app/(app)/expenses/add.tsx` - Removed font-semibold from $, added paddingVertical: 0, keyboardDismissMode, Keyboard.dismiss()
- `app/(app)/(tabs)/expenses.tsx` - Added getRecentExpenseForUser() helper, pass description+date to settle screen, inline ScrollView styles
- `app/(app)/expenses/settle.tsx` - Read description+date params, format Venmo note as "Description - MM/DD/YY"

## Decisions Made
- Venmo note encoding has a minor remaining issue (+ signs for spaces in expo-router double-encoding) -- user chose to defer rather than add workaround complexity
- ScrollView uses inline `style={{ flex: 1 }}` instead of NativeWind `className="flex-1"` to avoid bounce-back regression on iOS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Venmo note double-encoding producing + signs**
- **Found during:** Task 2 (Venmo note implementation)
- **Issue:** expo-router's useLocalSearchParams auto-decodes URL params, but encodeURIComponent was applied on both send and receive sides, causing double-encoding. Spaces appeared as + signs in Venmo.
- **Fix:** Removed encodeURIComponent on the sending side and decodeURIComponent on the receiving side. Used raw params directly.
- **Files modified:** app/(app)/(tabs)/expenses.tsx, app/(app)/expenses/settle.tsx
- **Verification:** Tested on device -- note shows correctly for most cases
- **Committed in:** a4687b5, 078da6d

**2. [Rule 1 - Bug] ScrollView bounce-back on expenses tab**
- **Found during:** Task 2 verification on device
- **Issue:** After Venmo note changes, the expenses tab ScrollView would snap back to top when scrolling. NativeWind className="flex-1" was not being applied correctly to the ScrollView's contentContainerStyle.
- **Fix:** Replaced NativeWind className with inline `style={{ flex: 1 }}` on the ScrollView
- **Files modified:** app/(app)/(tabs)/expenses.tsx
- **Verification:** Scroll behavior verified on physical device
- **Committed in:** b617aa9

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both were runtime bugs discovered during device testing. Fixes were minimal and targeted. No scope creep.

### Deferred Issues
- Venmo note still shows + for spaces in some edge cases due to expo-router param handling. User accepted this as cosmetic and chose to defer.

## Issues Encountered
- Settlement balance inversion was the most critical UAT failure -- settlements were being added to balances instead of subtracted. Root cause was swapped signs in the SQL function's combined CTE for settlement credits.
- Venmo note encoding required multiple iterations to get right due to expo-router's automatic URL param decoding behavior.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 2 UAT issues resolved (or explicitly deferred by user)
- Expense splitting flow is complete: add expenses, view balances, settle up via Venmo
- Ready to proceed to Phase 3 (Groceries & Chores)

## Self-Check: PASSED

All referenced files exist. All referenced commit hashes verified in git log.

---
*Phase: 02-expense-splitting*
*Completed: 2026-03-11*
