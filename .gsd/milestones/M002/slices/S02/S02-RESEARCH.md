# S02: YouTube Recipe Import — Research

**Date:** 2026-03-15

## Summary

This slice adds two ways to import recipe ingredients into the grocery list: (1) paste a YouTube recipe URL for automatic ingredient extraction via captions + Gemini, or (2) manually paste/type a recipe's ingredient list for Gemini-based structured extraction. Both paths share the same Gemini prompt and ingredient review UI. The Gemini REST API calling pattern is already proven in the `scan-receipt` Edge Function — S02 reuses the same endpoint construction, API key auth, and markdown-fence-stripping response parse.

YouTube transcript extraction is doable in ~60 lines of Deno: fetch the watch page HTML, regex-extract `ytInitialPlayerResponse` from the `<script>` tag, parse out caption track URLs from `captionTracks`, fetch the XML transcript, strip tags to get plain text. This is the fragile piece — YouTube page structure changes periodically, but the `timedtext` API endpoint format itself is stable once you have the URL.

The manual text mode covers an important gap: YouTube videos that convey recipes via on-screen text rather than spoken narration have no captions to extract. Rather than attempting frame extraction (infeasible from Deno Edge Functions — would require video download + frame sampling), users can paste the ingredient list from the video description, a website, or type it manually. This goes through the same Gemini extraction prompt and review flow.

**Abuse mitigation:** Three server-side guards protect against misuse: (1) video duration cap — `ytInitialPlayerResponse` contains `videoDetails.lengthSeconds`, reject videos over 30 minutes before fetching any transcript; (2) transcript length cap — truncate to 15,000 characters to bound Gemini input costs; (3) non-recipe detection — when Gemini finds no recipe ingredients, return empty list with a clear message. For manual text mode, a 5,000-character input limit on the client prevents absurd pastes.

The client side is a new `import-recipe.tsx` screen with two input modes (YouTube URL / manual text) and three phases: input → loading → ingredient review/selection. Selected items are bulk-inserted to `grocery_items` with `source = 'recipe'`, flowing through the existing realtime subscription automatically. No new migration needed — `source` column and `grocery_items` INSERT already support arbitrary source values.

### Groceries Page Action Buttons

The main groceries page should group entry-point actions together in a visually cohesive section below the quick-add input:

1. **"Scan Receipt"** — existing, navigates to scan-receipt screen
2. **"Shop by Recipe"** — new, navigates to import-recipe screen (YouTube URL or manual paste modes)

S03 (Category & Aisle Organization) is a list display change, not a user-initiated action — no button slot needed. S04 (Kroger Product Search) would eventually get a button here ("Search Products"), but that's wired later.

## Recommendation

Build in three clean units:

1. **Edge Function first** (`import-recipe/index.ts`) — YouTube caption fetch + Gemini ingredient extraction, plus a `mode` parameter to accept raw text directly (manual paste). This is the riskiest piece (YouTube parsing) and proves the pipeline works before building UI.
2. **Recipe import screen** — Two-mode input (YouTube URL or manual text), loading state, ingredient list with checkboxes, "Add to List" action that bulk-inserts to `grocery_items`.
3. **Navigation wiring** — Register route in `_layout.tsx`, replace the standalone "Scan Receipt" button with a grouped action-button section on the groceries tab.

## Implementation Landscape

### Key Files

- `supabase/functions/scan-receipt/index.ts` — **Pattern template.** Gemini REST API call structure: `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, API key from `Deno.env.get("GEMINI_API_KEY")`, CORS headers, markdown fence stripping on response, structured error handling with `phase` tags. The recipe function follows this identically but sends text (transcript) instead of an image.
- `supabase/functions/import-recipe/index.ts` — **New.** Two modes: (a) `{ mode: 'youtube', url: string }` — fetches YouTube watch page, extracts captions, sends transcript to Gemini; (b) `{ mode: 'text', text: string }` — sends raw text directly to Gemini. Both return `{ title, ingredients: [{ name, quantity, unit }] }`. Server-side guards: video duration ≤30 min, transcript truncated to 15K chars, text input capped at 5K chars.
- `app/(app)/groceries/import-recipe.tsx` — **New.** Two-mode input (toggle between YouTube URL and manual text), then loading → ingredient review. Review phase shows ingredient list with checkboxes (all checked by default). "Add Selected" button bulk-inserts to `grocery_items` via Supabase client, then navigates back to groceries tab.
- `app/(app)/_layout.tsx` — Register `groceries/import-recipe` route with standard cream header.
- `app/(app)/(tabs)/groceries.tsx` — Refactor action buttons into a grouped section: "Scan Receipt" and "Shop by Recipe" side by side or stacked, replacing the current standalone button.
- `lib/types/database.ts` — No change needed. `GroceryItem.source` is already `string` type, and the INSERT type allows optional `source`.

### Existing Patterns to Reuse

- **Edge Function structure:** CORS headers, `Deno.serve`, JSON body parsing, `Deno.env.get("GEMINI_API_KEY")`, Gemini `generateContent` POST, response parsing (`candidates[0].content.parts[0].text`), markdown fence stripping, structured error responses with `phase` field. All from `scan-receipt/index.ts`.
- **Screen phase pattern:** `scan-receipt.tsx` uses a `ScreenPhase` union type (`'capture' | 'scanning' | 'error' | 'review'`) with conditional rendering. Recipe import follows the same pattern with `'input' | 'loading' | 'error' | 'review'`.
- **Supabase client-side insert:** `groceries.tsx` `addItem` shows the pattern — `supabase.from('grocery_items').insert({...}).select()`. Recipe import does the same in a loop or batch.
- **Realtime dedup:** The existing realtime subscription on `grocery_items` already deduplicates by ID on INSERT. Bulk-inserted items from the server will flow through automatically — each INSERT triggers a realtime event, and the existing handler adds them to the local state.
- **Outline button pattern:** "Scan Receipt" button in `groceries.tsx` — `border-2 border-brand bg-white` with Ionicons icon + wintergreen text.

### YouTube Caption Extraction Approach

The Edge Function fetches `https://www.youtube.com/watch?v=${videoId}`, extracts `ytInitialPlayerResponse` from the page HTML via regex, parses the JSON to find `captions.playerCaptionsTracklistRenderer.captionTracks`, selects the English track (or first available), fetches the XML transcript from the track URL, strips XML tags to get plain text.

**Duration guard (before any transcript fetch):** `ytInitialPlayerResponse` also contains `videoDetails.lengthSeconds`. Check this first — if the video exceeds 30 minutes, reject immediately with a user-friendly message ("Videos over 30 minutes aren't supported. Try pasting the ingredient list manually instead."). This prevents both abuse and wasted Gemini API calls on 2-hour cooking marathons.

Key implementation details:
- Extract video ID from various YouTube URL formats: `youtube.com/watch?v=xxx`, `youtu.be/xxx`, `youtube.com/shorts/xxx`, `m.youtube.com/watch?v=xxx`
- The `ytInitialPlayerResponse` is in a script tag matching `var ytInitialPlayerResponse = {...};`
- Caption track URLs look like `https://www.youtube.com/api/timedtext?v=xxx&...`
- The XML format is `<transcript><text start="0.0" dur="1.5">word word</text>...</transcript>` — strip tags, join with spaces
- **Transcript truncation:** Cap at 15,000 characters before sending to Gemini. A typical 20-min video produces ~3,000 words (~15K chars). This bounds Gemini costs and prevents edge cases with extremely verbose auto-captions.
- Handle missing captions: if `captionTracks` is empty/undefined, return a clear error ("This video doesn't have captions. Try pasting the ingredient list manually instead.")

### Manual Text Mode

The Edge Function accepts a second mode: `{ mode: 'text', text: string }`. The text is sent directly to the same Gemini extraction prompt (no YouTube fetch). This covers:

- **Videos without captions** — user pastes from the video description or types ingredients manually
- **Text-on-screen recipe videos** — user transcribes or copies the visible ingredient list
- **Non-YouTube sources** — user copies from a recipe website, cookbook, screenshot, etc.
- **Fallback when YouTube parsing breaks** — the YouTube extraction layer could break from page structure changes; manual text mode always works

Client-side input cap: 5,000 characters. The Edge Function validates this server-side too.

### Gemini Prompt for Ingredient Extraction

The prompt sends the full transcript text and asks Gemini to extract recipe ingredients with structured JSON output:
```
{ "title": "recipe name", "ingredients": [{ "name": "chicken breast", "quantity": "2", "unit": "lbs" }] }
```

Key prompt instructions:
- Extract only ingredients mentioned as part of the recipe (not asides, sponsors, or mentioned-but-not-used items)
- Normalize quantities to standard measurements
- Omit common pantry staples like salt, pepper, oil unless specifically measured
- If no recipe is found in the transcript, return `{ "title": null, "ingredients": [] }`

### Bulk Insert Strategy

Two viable approaches for inserting recipe ingredients as `grocery_items`:

1. **Client-side sequential inserts** — simplest, matches existing `addItem` pattern. Each insert triggers a realtime event, which is fine per the M002 research ("UI may show items appearing one-by-one which is actually a nice UX effect"). 10-15 items × ~50ms each = sub-second total.

2. **Single RPC for atomic batch insert** — cleaner but adds a migration/RPC. Overkill for 10-15 items given the existing dedup handling.

**Recommendation: client-side sequential inserts.** Simpler, consistent with existing patterns, and the realtime cascade is already handled. Use `Promise.all` for parallel inserts to minimize total wait time, since there are no ordering dependencies.

### Build Order

1. **Edge Function** — `supabase/functions/import-recipe/index.ts`. Two modes: YouTube URL (caption extraction + duration guard + transcript truncation) and raw text (direct to Gemini). Proves the full pipeline. Testable via `curl` against deployed function. This is the risk — if YouTube caption extraction fails, manual text mode still works.
2. **Recipe import screen** — `app/(app)/groceries/import-recipe.tsx`. Two-mode input (toggle tabs: "YouTube Link" / "Paste Recipe"). YouTube mode: URL input → `supabase.functions.invoke('import-recipe', { body: { mode: 'youtube', url } })`. Text mode: multiline text input → `supabase.functions.invoke('import-recipe', { body: { mode: 'text', text } })`. Both → review ingredients → bulk insert.
3. **Navigation + groceries page action buttons** — Register route in `_layout.tsx`. Refactor the groceries page to group action buttons: "Scan Receipt" and "Shop by Recipe" in a clean horizontal or stacked layout replacing the current standalone button.

### Verification Approach

- **Edge Function (contract):** `curl` the deployed function with a real YouTube recipe URL (e.g., a popular cooking channel video). Verify response has `title` and `ingredients` array with sensible items. Test with a non-recipe video to verify empty-ingredient handling. Test with a video without captions to verify error message.
- **TypeScript compilation:** `npx tsc --noEmit` passes with no new errors.
- **Expo Go flow:** Paste a YouTube URL → see loading → see ingredients list → select some → tap "Add to List" → verify items appear on grocery list. Open a second device/simulator — verify items appear via realtime sync.
- **Error handling:** Paste an invalid URL → see error. Paste a non-recipe video URL → see "no ingredients found" state. Kill network during scan → see error with retry option.

## Constraints

- **Deno runtime** — no Node.js packages. YouTube page fetch and XML parsing must use standard `fetch` + string/regex operations. No `cheerio`, `xml2js`, or similar. XML tag stripping is just `text.replace(/<[^>]+>/g, '')`.
- **GEMINI_API_KEY already deployed** — S01 set this secret on the Supabase project. No new secret provisioning needed.
- **No new migration required** — `source TEXT DEFAULT 'manual'` on `grocery_items` already supports `'recipe'` as a value. No schema changes needed.
- **Expo Go compatibility** — the screen is standard React Native (TextInput, ScrollView, Pressable). No native modules. Clipboard paste works natively in TextInput.
- **Abuse guards (server-side):** Video duration ≤ 30 minutes (checked before transcript fetch). Transcript truncated to 15,000 characters. Manual text input capped at 5,000 characters (validated server-side, enforced client-side too). Non-recipe videos handled gracefully via empty ingredient list from Gemini.
- **No video frame extraction** — text-on-screen recipe videos cannot be handled automatically. Downloading video + frame sampling is infeasible in a Deno Edge Function (size, time, no ffmpeg). This is a documented limitation with manual text input as the workaround.

## Common Pitfalls

- **YouTube page HTML parsing fragility** — `ytInitialPlayerResponse` is embedded in a script tag. YouTube occasionally changes the variable name or surrounding structure. The regex should be generous: `/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s`. If this breaks, the error should clearly identify `phase: 'caption-fetch'` so diagnosis is immediate. Manual text mode is the built-in fallback.
- **Caption track URL encoding** — The URL from `captionTracks[0].baseUrl` may contain `\u0026` instead of `&`. Replace these before fetching.
- **Gemini JSON fences** — Same as scan-receipt: the model wraps JSON in ` ```json ` fences. Must strip before parsing. Already solved in scan-receipt.
- **Long transcripts exceeding truncation** — A 30-minute video at the cap produces ~5,000 words. Truncation at 15K chars should capture the full ingredient discussion (usually in the first 10 minutes). Log when truncation occurs so we know if the cap is too aggressive.
- **URL validation** — Users may paste full YouTube URLs, shortened URLs, mobile URLs, or URLs with extra parameters. Parse video ID robustly from all formats before proceeding. Non-YouTube URLs should get a clear error pointing to the manual text mode.
- **Realtime flood from batch insert** — Inserting 15 items triggers 15 realtime events. The existing dedup logic in `groceries.tsx` handles this (checks `prev.some(i => i.id === newItem.id)`), but the list may visually "pop" items in one by one. This is acceptable — the M002 research notes it's "actually a nice UX effect."
- **Non-recipe videos wasting Gemini calls** — A user could paste a music video or vlog. Gemini will return empty ingredients, which is the correct behavior. One API call is wasted, but there's no cheaper way to determine "is this a recipe" without calling the LLM. The duration guard prevents the worst case (2-hour videos). The empty-result UX should guide users: "No recipe ingredients found in this video. Try pasting the ingredient list manually."

## Open Risks

- **YouTube page structure change** — The `ytInitialPlayerResponse` extraction could break if YouTube changes their page template. This is the single biggest risk. Mitigation: structured error messages with `phase: 'caption-fetch'` or `phase: 'caption-parse'` for fast diagnosis. The timedtext API endpoint itself is stable — the fragility is in _finding_ the URL. Manual text mode is always available as fallback.
- **Videos without captions (text-on-screen recipes)** — Auto-generated captions exist for most English videos, but some videos convey recipes only via on-screen text with background music. Extracting text from video frames would require downloading the video and sending frame screenshots to Gemini Vision — infeasible from a Deno Edge Function due to size/time constraints. **Known limitation:** these videos require manual text input. The error message should be specific: "This video doesn't have captions. You can paste the recipe's ingredient list manually instead."
- **Videos without English captions** — Some videos have captions only in non-English languages. The Edge Function should prefer English (`lang=en`) but fall back to whatever is available, with Gemini handling the translation/extraction regardless.
- **Gemini extraction quality on conversational transcripts** — Cooking videos often have lengthy narration with ingredients mentioned casually. The prompt needs to be specific about extracting _recipe ingredients_ vs. passing mentions. Some ingredients may be missed or hallucinated. The user review step (checkbox selection) is the mandatory safety net.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Google Gemini API | `google-gemini/gemini-skills@gemini-api-dev` | available (5.2K installs) — relevant but S01's scan-receipt already establishes the calling pattern in this codebase |
| Supabase Edge Functions | `nice-wolf-studio/claude-code-supabase-skills@supabase-edge-functions` | available (132 installs) — low install count, existing codebase patterns sufficient |
