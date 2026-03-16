---
estimated_steps: 8
estimated_files: 1
---

# T01: Build import-recipe Edge Function

**Slice:** S02 — YouTube Recipe Import
**Milestone:** M002

## Description

Create the `import-recipe` Edge Function that extracts recipe ingredients from either a YouTube video URL (via caption extraction + Gemini) or raw text (direct to Gemini). This is the riskiest piece of the slice — YouTube HTML parsing is fragile, so structured error phases are critical for diagnosing failures. The function follows the exact same Gemini REST API pattern established by `scan-receipt/index.ts`.

## Steps

1. Create `supabase/functions/import-recipe/index.ts` with the standard Edge Function scaffold: CORS headers constant, `Deno.serve` handler, OPTIONS preflight response, POST-only guard, JSON body parsing. Copy the CORS pattern verbatim from `scan-receipt/index.ts`.

2. Implement video ID extraction from YouTube URLs. Must handle all formats:
   - `youtube.com/watch?v=VIDEO_ID` (with optional extra params)
   - `youtu.be/VIDEO_ID`
   - `youtube.com/shorts/VIDEO_ID`
   - `m.youtube.com/watch?v=VIDEO_ID`
   - Return `phase: 'url-parse'` error for non-YouTube or unparseable URLs.

3. Implement YouTube watch page fetch and `ytInitialPlayerResponse` extraction:
   - Fetch `https://www.youtube.com/watch?v=${videoId}` with a browser-like User-Agent header
   - Regex extract: `/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s`
   - Parse the JSON. On failure, return `phase: 'page-fetch'` or `phase: 'caption-extract'` error.

4. Implement duration guard and caption track extraction:
   - Read `videoDetails.lengthSeconds` from the parsed response. If >1800 (30 min), reject with user-friendly message and `phase: 'duration-guard'`.
   - Navigate to `captions.playerCaptionsTracklistRenderer.captionTracks`. If empty/missing, return error with guidance to use manual text mode and `phase: 'caption-extract'`.
   - Prefer English track (`languageCode` starting with `en`), fall back to first available track.
   - Get the `baseUrl`, replace `\u0026` with `&`.

5. Fetch the XML transcript from the caption track URL, strip XML tags with `.replace(/<[^>]+>/g, ' ')`, decode HTML entities (`&amp;` → `&`, `&#39;` → `'`, `&quot;` → `"`, `&lt;` → `<`, `&gt;` → `>`), collapse whitespace, truncate to 15,000 characters. Log when truncation occurs.

6. Build the Gemini API call — same pattern as scan-receipt:
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
   - API key from `Deno.env.get("GEMINI_API_KEY")` with `phase: 'config'` error if missing.
   - Request body: `{ contents: [{ parts: [{ text: prompt }] }] }` where prompt includes the transcript/text and asks for JSON output: `{ "title": "recipe name", "ingredients": [{ "name": "...", "quantity": "...", "unit": "..." }] }`.
   - Prompt instructions: extract only recipe ingredients (not asides/sponsors), normalize quantities to standard measurements, if no recipe found return `{ "title": null, "ingredients": [] }`.
   - Handle non-2xx responses with `phase: 'gemini-call'`.

7. Parse Gemini response — same as scan-receipt:
   - Extract `candidates[0].content.parts[0].text`
   - Strip markdown fences: `.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")`
   - Parse JSON, validate structure (must have `ingredients` array).
   - Return the parsed result with `phase: 'success'` log.
   - Handle parse failures with `phase: 'parse'`.

8. Implement the `text` mode branch: if `body.mode === 'text'`, validate `body.text` is a non-empty string ≤5000 characters, then skip YouTube fetch entirely and go straight to step 6 (Gemini call) with the text as input. Share the same Gemini prompt and response parsing.

## Must-Haves

- [ ] Two modes: `{ mode: 'youtube', url }` and `{ mode: 'text', text }`
- [ ] YouTube URL parsing handles all 4 formats (watch, short, shorts, mobile)
- [ ] Duration guard rejects videos over 30 minutes before fetching transcript
- [ ] Missing captions return clear error suggesting manual text mode
- [ ] Transcript truncated to 15K characters with logging
- [ ] Text mode validates ≤5K characters
- [ ] Gemini prompt extracts `{ title, ingredients: [{ name, quantity, unit }] }`
- [ ] Non-recipe content returns empty ingredients array (not an error)
- [ ] All errors include `phase` field for diagnostic localization
- [ ] Markdown fence stripping on Gemini response (matching scan-receipt)
- [ ] CORS headers on all responses (matching scan-receipt)

## Verification

- File exists: `supabase/functions/import-recipe/index.ts`
- `supabase functions deploy import-recipe` succeeds
- `curl` with text mode: `{ "mode": "text", "text": "2 cups flour, 3 eggs, 1 cup sugar, 1 tsp vanilla extract" }` → response has 4 ingredients
- `curl` with YouTube mode using a real recipe video → response has title and non-empty ingredients
- `curl` with a non-recipe video → response has empty ingredients array
- Error responses include `phase` field

## Observability Impact

- Signals added: structured JSON logs with `phase` field on every `console.log`/`console.error` — phases: `url-parse`, `page-fetch`, `caption-extract`, `caption-parse`, `duration-guard`, `config`, `gemini-call`, `parse`, `success`
- How a future agent inspects this: Supabase Edge Function logs; `phase` field in error responses
- Failure state exposed: exact failure phase, duration/truncation values when guards activate, Gemini HTTP status on API failures

## Inputs

- `supabase/functions/scan-receipt/index.ts` — template for Gemini REST API pattern (CORS, API key auth, endpoint, response parsing, markdown fence stripping, structured phase errors). Do NOT modify this file — only read it for reference.
- `GEMINI_API_KEY` — already deployed as an Edge Function secret from S01

## Expected Output

- `supabase/functions/import-recipe/index.ts` — complete Edge Function implementing YouTube caption extraction + Gemini ingredient parsing with text mode fallback, ~200-300 lines
