# S02: YouTube Recipe Import

**Goal:** Users can import recipe ingredients from a YouTube video URL or manual text paste, review extracted ingredients, and add selected items to the shared grocery list.
**Demo:** Paste a YouTube recipe URL → see loading → see extracted ingredients with checkboxes → select items → tap "Add to List" → items appear on grocery list and sync to all roommates in real time. Alternatively, paste/type an ingredient list manually for the same extraction and review flow.

## Must-Haves

- Edge Function accepts YouTube URL, extracts captions, sends transcript to Gemini, returns structured ingredients (GROC-07)
- Edge Function also accepts raw text mode for manual paste (covers no-caption videos)
- Server-side abuse guards: video duration ≤30 min, transcript truncation at 15K chars, text input cap at 5K chars
- YouTube URL parsing handles all formats: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `m.youtube.com/watch?v=`
- Missing captions handled with clear error directing user to manual text mode
- Non-recipe videos return empty ingredients with guidance message
- Import screen with two input modes: YouTube URL and manual text paste (GROC-06)
- Ingredient review screen with checkboxes, all checked by default (GROC-08)
- Bulk insert of selected ingredients as `grocery_items` with `source = 'recipe'` (GROC-09)
- Items flow through existing realtime subscription to all household members (GROC-09)
- Groceries page groups "Scan Receipt" and "Shop by Recipe" as action buttons
- Route registered in `_layout.tsx` with standard cream header

## Proof Level

- This slice proves: integration
- Real runtime required: yes (deployed Edge Function + Expo Go)
- Human/UAT required: yes (real YouTube URL test, visual review of ingredients)

## Verification

- `npx tsc --noEmit` passes with no new errors
- Edge Function deploys without error: `supabase functions deploy import-recipe`
- `curl` the deployed Edge Function with `{ "mode": "text", "text": "2 cups flour, 3 eggs, 1 cup sugar, 1 tsp vanilla" }` → response contains `ingredients` array with 4 items
- `curl` with `{ "mode": "youtube", "url": "<real-recipe-video-url>" }` → response contains `title` and non-empty `ingredients` array
- `curl` with `{ "mode": "youtube", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }` (non-recipe) → response has empty `ingredients` array
- Expo Go: navigate to import-recipe screen from groceries tab, complete full flow (paste URL → review → add to list)
- Verify items appear in grocery list with correct names after import

## Observability / Diagnostics

- Runtime signals: structured `console.log`/`console.error` JSON with `phase` field (`url-parse`, `page-fetch`, `caption-extract`, `caption-parse`, `gemini-call`, `parse`, `success`) following scan-receipt pattern
- Inspection surfaces: Edge Function logs via Supabase dashboard; client-side error messages with specific failure guidance
- Failure visibility: `phase` tag on every error response localizes failure point; duration/truncation logged when guards activate
- Redaction constraints: `GEMINI_API_KEY` never logged; YouTube URLs are logged (not sensitive)

## Integration Closure

- Upstream surfaces consumed: Gemini REST API pattern from `supabase/functions/scan-receipt/index.ts` (endpoint, auth, response parsing, fence stripping); `GEMINI_API_KEY` secret already deployed; `grocery_items` table with `source` column; realtime subscription in `groceries.tsx`
- New wiring introduced in this slice: `import-recipe` Edge Function; `import-recipe.tsx` screen; route in `_layout.tsx`; action button group on groceries tab
- What remains before the milestone is truly usable end-to-end: S03 (category organization), S04 (Kroger search)

## Tasks

- [x] **T01: Build import-recipe Edge Function** `est:1h`
  - Why: Proves the riskiest piece — YouTube caption extraction + Gemini ingredient parsing. This is the backend that makes recipe import possible (GROC-07). Must work before building any UI.
  - Files: `supabase/functions/import-recipe/index.ts`
  - Do: Create Edge Function with two modes: (1) `youtube` — parse video ID from URL, fetch watch page, extract `ytInitialPlayerResponse`, check duration ≤30 min, find caption track URL, fetch XML transcript, strip tags, truncate to 15K chars, send to Gemini; (2) `text` — validate ≤5K chars, send directly to Gemini. Both modes share the same Gemini prompt for ingredient extraction. Follow scan-receipt patterns exactly: CORS headers, API key from `Deno.env`, structured `phase` error logging, markdown fence stripping. Handle `\u0026` in caption URLs. Return `{ title, ingredients: [{ name, quantity, unit }] }`.
  - Verify: `npx tsc --noEmit` (if applicable to Edge Functions); deploy with `supabase functions deploy import-recipe`; `curl` with text mode and YouTube mode both return valid ingredient JSON
  - Done when: deployed Edge Function returns correct structured ingredients from both YouTube URL and raw text input

- [x] **T01b: Move YouTube caption extraction to client-side utility** `est:30m`
  - Why: YouTube rate-limits cloud IPs (HTTP 429), so server-side YouTube page fetch fails from Supabase Edge Functions. Moving caption extraction to client side uses consumer IPs which aren't blocked, and makes the Edge Function a pure text→Gemini service (better separation of concerns).
  - Files: `lib/youtube.ts`
  - Do: Extract YouTube logic from Edge Function into a client-side utility: video ID extraction from 4 URL formats, watch page fetch with browser UA + consent cookies, ytInitialPlayerResponse parsing, duration guard (≤30 min), caption track selection (prefer English), transcript XML fetch + cleaning (strip tags, decode entities, collapse whitespace, truncate 15K chars). Export `extractYouTubeTranscript(url)` returning `{ transcript, title, error?, phase? }`. React Native fetch has no CORS restrictions so YouTube fetch works from device IPs. The Edge Function keeps its `youtube` mode as-is for potential future use but the client will use `text` mode exclusively.
  - Verify: `npx tsc --noEmit` passes; write a quick test script or verify via the import-recipe screen in T02 that client-side extraction + text mode Edge Function call returns ingredients
  - Done when: `lib/youtube.ts` exports a working `extractYouTubeTranscript` function that extracts captions from a YouTube URL on the client side

- [x] **T02: Build recipe import screen with ingredient review and bulk insert** `est:1.5h`
  - Why: The user-facing screen that delivers GROC-06 (paste URL), GROC-08 (ingredient review/selection), and GROC-09 (items added to shared list via realtime). Without this, the Edge Function has no client.
  - Files: `app/(app)/groceries/import-recipe.tsx`
  - Do: Create screen with four phases (`input` → `loading` → `error` → `review`). Input phase has two mode tabs ("YouTube Link" / "Paste Recipe") — YouTube mode shows URL TextInput, text mode shows multiline TextInput (5K char limit). Loading phase calls `supabase.functions.invoke('import-recipe', { body })`. Error phase shows message with retry and guidance toward manual text mode. Review phase shows recipe title, scrollable ingredient list with checkboxes (all checked by default), and "Add Selected" button. Add Selected does `Promise.all` of `supabase.from('grocery_items').insert(...)` for each selected ingredient with `source: 'recipe'`, then navigates back. Follow scan-receipt.tsx patterns: ScreenPhase type, conditional rendering, Ionicons, existing color tokens.
  - Verify: `npx tsc --noEmit` passes; screen renders in Expo Go; full flow from URL paste through ingredient selection to list addition works
  - Done when: user can paste a YouTube URL or text, see extracted ingredients, select items, and have them appear on the grocery list

- [x] **T03: Wire import-recipe route and refactor groceries action buttons** `est:30m`
  - Why: Connects the import screen to the app navigation and makes it discoverable from the groceries tab. Groups "Scan Receipt" and "Shop by Recipe" as a cohesive action button section.
  - Files: `app/(app)/_layout.tsx`, `app/(app)/(tabs)/groceries.tsx`
  - Do: Register `groceries/import-recipe` route in `_layout.tsx` with cream header, "Groceries" back title, "Shop by Recipe" title. In `groceries.tsx`, replace the standalone "Scan Receipt" `<Pressable>` with a horizontal row of two outline buttons side-by-side: "Scan Receipt" (camera-outline icon) and "Shop by Recipe" (restaurant-outline icon), both using the existing outline button style (`border-2 border-brand bg-white`). The row sits in the same `mx-4 mt-2 mb-1` container with `flex-row gap-2` and each button `flex-1`.
  - Verify: `npx tsc --noEmit` passes; both buttons visible on groceries tab in Expo Go; tapping "Shop by Recipe" navigates to import-recipe screen; tapping "Scan Receipt" still navigates to scan-receipt screen
  - Done when: both action buttons render correctly on the groceries tab and navigate to their respective screens

## Files Likely Touched

- `supabase/functions/import-recipe/index.ts`
- `app/(app)/groceries/import-recipe.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/(tabs)/groceries.tsx`
