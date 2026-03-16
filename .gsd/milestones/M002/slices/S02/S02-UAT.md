# S02: YouTube Recipe Import — UAT

**Milestone:** M002
**Written:** 2026-03-15

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: recipe import requires real Gemini API calls, real YouTube caption extraction, and real Supabase inserts — artifact inspection alone can't verify the extraction pipeline or realtime sync

## Preconditions

- Supabase project running with `import-recipe` Edge Function deployed (`supabase functions deploy import-recipe` was completed in T01)
- `GEMINI_API_KEY` set in Edge Function secrets
- Expo Go running on device connected to the Supabase project
- User is signed in to a household with at least one other member (for realtime sync verification)
- Grocery list is visible and accessible

## Smoke Test

From the groceries tab, tap "Shop by Recipe" → see the import screen with YouTube/text toggle tabs. Switch to "Paste Recipe" tab, enter "2 cups flour, 3 eggs, 1 cup sugar", tap "Extract Ingredients" → see 3 ingredients listed with checkboxes.

## Test Cases

### 1. YouTube recipe import — full flow

1. From the groceries tab, tap "Shop by Recipe"
2. Verify "YouTube Link" tab is selected by default
3. Paste a real cooking video URL (e.g. a Binging with Babish or Tasty video with English captions)
4. Tap "Extract Ingredients"
5. Observe loading state
6. **Expected:** Review screen appears with recipe title and a list of ingredients with checkboxes, all checked by default
7. Deselect 1-2 items using checkboxes
8. Verify selected count updates in the "Add Selected" button text
9. Tap "Add Selected"
10. **Expected:** Screen navigates back to grocery list; selected ingredients appear as new items with readable names (e.g. "2 cups flour")

### 2. Manual text paste mode

1. Navigate to "Shop by Recipe"
2. Tap the "Paste Recipe" tab
3. Type or paste: "1 lb chicken breast, 2 tbsp olive oil, 1 cup rice, 3 cloves garlic, salt and pepper to taste"
4. Tap "Extract Ingredients"
5. **Expected:** Review screen shows ~5 ingredients extracted from the text, each with checkbox

### 3. Select all / deselect all toggle

1. Complete steps 1-6 from test case 1 or 2
2. On the review screen, tap "Deselect All"
3. **Expected:** All checkboxes unchecked; "Add Selected" button shows 0 count or is disabled
4. Tap "Select All"
5. **Expected:** All checkboxes checked again

### 4. Items persist in grocery list with source = 'recipe'

1. Complete a full import flow (test case 1 or 2)
2. Navigate to the groceries tab
3. **Expected:** Imported items visible in the grocery list
4. Pull to refresh
5. **Expected:** Items still present (not just optimistic UI)

### 5. Realtime sync to other household members

1. Open the app on a second device (or second simulator) signed in as a different household member
2. On device 1, complete a full recipe import
3. **Expected:** Imported items appear on device 2's grocery list without manual refresh (realtime subscription)

### 6. Navigation from groceries tab

1. On the groceries tab, verify two buttons side-by-side: "Scan Receipt" and "Shop by Recipe"
2. Tap "Shop by Recipe"
3. **Expected:** Import recipe screen opens with "Shop by Recipe" in the header and "Groceries" back button
4. Navigate back
5. Tap "Scan Receipt"
6. **Expected:** Scan receipt screen opens (not broken by the layout change)

## Edge Cases

### YouTube video without captions

1. Paste a YouTube URL for a video known to have no captions (e.g. a music-only video)
2. Tap "Extract Ingredients"
3. **Expected:** Error screen with message indicating captions aren't available, with a visible option to try manual text paste instead

### Non-recipe YouTube video

1. Paste a YouTube URL for a non-cooking video (e.g. a news clip or music video with captions)
2. Tap "Extract Ingredients"
3. **Expected:** Review screen shows empty ingredients list or a message indicating no recipe ingredients were found — not a crash

### Video over 30 minutes

1. Paste a YouTube URL for a video longer than 30 minutes
2. Tap "Extract Ingredients"
3. **Expected:** Error with message about video being too long

### Invalid YouTube URL

1. Type "not a url" in the YouTube input
2. Tap "Extract Ingredients"
3. **Expected:** Error message about invalid URL format — not a crash or unhandled exception

### Empty text input

1. Switch to "Paste Recipe" tab
2. Leave the text input empty
3. Tap "Extract Ingredients"
4. **Expected:** Button is disabled or shows validation message

### Text exceeding 5K character limit

1. Switch to "Paste Recipe" tab
2. Paste a very long text (>5K characters)
3. **Expected:** Input is truncated or a character count warning appears before submission

## Failure Signals

- "Extract Ingredients" button taps but nothing happens (loading state not shown)
- Error screen shows raw JSON or undefined values instead of a readable message
- Ingredients appear with empty names or "undefined" text
- Imported items don't appear on the grocery list after navigating back
- "Scan Receipt" button is missing or broken after the layout change
- App crashes during any part of the flow

## Requirements Proved By This UAT

- GROC-06 — Tests 1, 2, and 6 prove user can paste a YouTube URL or text to import ingredients
- GROC-07 — Tests 1 and 2 prove Edge Function extracts ingredients via Gemini from both YouTube transcript and raw text
- GROC-08 — Tests 1, 2, and 3 prove extracted ingredients shown for selection with checkboxes
- GROC-09 — Tests 4 and 5 prove imported items appear on grocery list and sync to other household members

## Not Proven By This UAT

- Category assignment for imported items — deferred to S03
- Department grouping of imported items in the list — deferred to S03
- Behavior when Gemini API is down or rate-limited — would require simulating API failure

## Notes for Tester

- The YouTube extraction uses an internal YouTube API (innertube ANDROID client). If a video that previously worked stops returning ingredients, this API may have changed. Try a different video before reporting a bug, and use manual text mode as the fallback.
- Ingredient names are stored as full descriptions (e.g. "2 cups all-purpose flour") rather than just the ingredient name. This is intentional — the grocery list is free-text.
- The Edge Function's `youtube` mode (server-side) is deployed but unused by the client. The client extracts transcripts on-device and sends via `text` mode. This is by design due to YouTube cloud IP blocking.
