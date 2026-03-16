---
id: T02
parent: S02
milestone: M002
provides:
  - Recipe import screen with two-mode input (YouTube/text), ingredient review with checkboxes, and bulk insert to grocery_items
key_files:
  - app/(app)/groceries/import-recipe.tsx
  - app/(app)/_layout.tsx
  - app/(app)/(tabs)/groceries.tsx
key_decisions:
  - Client-side YouTube transcript extraction feeds Edge Function via text mode (not youtube mode) to avoid cloud IP rate limits
  - Ingredient names formatted as "{quantity} {unit} {name}" for readable grocery list entries
  - Promise.allSettled for bulk insert to surface partial failures without losing successful inserts
patterns_established:
  - Two-mode input with pill toggle tabs following ScreenPhase state machine pattern from scan-receipt
  - Client-side extraction + server-side AI processing split for external service access patterns
observability_surfaces:
  - Error phase renders exact Edge Function error message (preserves phase tag from T01)
  - Partial insert failures surfaced via Alert with success/failure counts
  - errorFromYoutube flag controls fallback hint visibility
duration: 25m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Build recipe import screen with ingredient review and bulk insert

**Built complete recipe import screen with YouTube/text dual-mode input, client-side caption extraction, Gemini-powered ingredient parsing, checkbox review, and bulk insert to grocery_items**

## What Happened

Created `import-recipe.tsx` with the four-phase state machine (`input` → `loading` → `error` → `review`). Input phase has YouTube/text toggle tabs styled as pill segments. YouTube mode uses `extractYouTubeTranscript` from `lib/youtube.ts` (T01b) for client-side caption extraction, then sends the transcript via text mode to the Edge Function — this avoids the cloud IP rate-limiting issue discovered in T01b. Text mode sends directly.

Review phase shows recipe title (from YouTube metadata or Gemini), scrollable ingredient list with checkboxes (all checked by default), select all/deselect all toggle, and selected count. "Add Selected" bulk-inserts via `Promise.allSettled` for partial failure resilience, each item getting `source: 'recipe'`.

Also wired the route in `_layout.tsx` and added an "Import Recipe" button alongside "Scan Receipt" on the groceries tab — this partially covers T03's scope but was necessary for the screen to be reachable.

## Verification

- `npx tsc --noEmit`: 25 errors, all pre-existing (Deno types, font module). Zero errors from `import-recipe.tsx`, `groceries.tsx`, or `_layout.tsx`.
- Screen file created at expected path with ~320 lines.
- Route registered in `_layout.tsx` with cream header style matching scan-receipt.
- Navigation button added to groceries tab in side-by-side layout with scan-receipt.

### Slice-level verification status (intermediate task — not all expected to pass):
- ✅ `npx tsc --noEmit` passes with no new errors
- ⏭️ Edge Function deploy — covered by T01, not re-tested here
- ⏭️ `curl` text mode — covered by T01
- ⏭️ `curl` YouTube mode — covered by T01
- ⏭️ `curl` non-recipe video — covered by T01
- 🔲 Expo Go full flow — requires device testing (T03 or UAT)
- 🔲 Items appear in grocery list after import — requires runtime verification

## Diagnostics

- **Error display**: Error phase renders the exact error message from the Edge Function (including the `phase` tag in the message text from T01). `errorFromYoutube` boolean controls whether the "Paste Ingredients Manually" fallback button appears.
- **Partial insert tracking**: `Promise.allSettled` catches both rejected promises and fulfilled-with-error results. Alert displays exact counts of succeeded/failed items.
- **State machine**: `ScreenPhase` type restricts rendering to exactly one of four phases — impossible to be in an intermediate state.

## Deviations

- Added route registration in `_layout.tsx` and "Import Recipe" button on groceries tab — this was planned for T03 but was necessary for T02 to be testable. T03 may now be reduced in scope or can focus on naming refinement ("Shop by Recipe" vs "Import Recipe").
- Used client-side YouTube extraction (`lib/youtube.ts` from T01b) instead of calling the Edge Function's youtube mode directly — follows the architectural decision from T01b about cloud IP rate limiting.

## Known Issues

- None

## Files Created/Modified

- `app/(app)/groceries/import-recipe.tsx` — new recipe import screen (~320 lines) with dual-mode input, Edge Function invocation, ingredient review with checkboxes, and bulk insert
- `app/(app)/_layout.tsx` — added import-recipe route registration with cream header
- `app/(app)/(tabs)/groceries.tsx` — refactored action buttons to side-by-side layout with Import Recipe alongside Scan Receipt
- `.gsd/milestones/M002/slices/S02/tasks/T02-PLAN.md` — added Observability Impact section
