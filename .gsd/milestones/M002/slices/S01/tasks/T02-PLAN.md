---
estimated_steps: 5
estimated_files: 1
---

# T02: Build scan-receipt Edge Function with Gemini Vision

**Slice:** S01 — Receipt Scanning
**Milestone:** M002

## Description

Create the `scan-receipt` Supabase Edge Function that receives a base64-encoded receipt image, calls the Gemini Vision REST API to extract structured line items (name, quantity, price, total), and returns the result as JSON. This is the highest-risk item in the slice — it proves Gemini Vision works from the Deno Edge Function runtime. The function establishes the Gemini calling pattern (endpoint, auth, response parsing with markdown fence stripping) that S02 reuses for recipe import.

## Steps

1. Create `supabase/functions/scan-receipt/index.ts` using `Deno.serve()` pattern from `push-expense/index.ts`.

2. Handle the request:
   - Accept POST with JSON body `{ imageBase64: string, mimeType: string }` (mimeType is `image/jpeg` or `image/png`)
   - Add CORS headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`. Handle OPTIONS preflight returning 200 with CORS headers.
   - Read `GEMINI_API_KEY` from `Deno.env.get()`. If missing, return `{ error: "Gemini API key not configured", phase: "config" }` with status 500.

3. Call Gemini Vision:
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
   - Request body: `{ contents: [{ parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: PROMPT }] }] }`
   - Prompt must instruct Gemini to: extract every line item from the grocery receipt, expand store abbreviations into human-readable product names (e.g., "GV WHL MLK 1GL" → "Great Value Whole Milk 1 Gallon"), return JSON with schema `{ items: [{ name: string, quantity: number, price: number }], total: number }`, set quantity to 1 if not explicitly shown, and return the receipt subtotal or total as the `total` field
   - Handle Gemini errors: 429 → return `{ error: "Rate limit exceeded. Please try again in a moment.", phase: "gemini-call" }` with status 429. Other non-200 → return `{ error: "Receipt processing failed", phase: "gemini-call" }` with status 502.

4. Parse the Gemini response:
   - Extract text from `response.candidates[0].content.parts[0].text`
   - Strip markdown code fences: remove leading `` ```json\n `` and trailing `` \n``` `` if present (regex: `/^```(?:json)?\s*\n?/` and `/\n?```\s*$/`)
   - `JSON.parse()` the cleaned text
   - Validate the parsed object has `items` array and `total` number. If parse fails or structure is wrong, return `{ error: "Could not extract receipt items. Please try a clearer photo.", phase: "parse" }` with status 400.

5. Return success response: `{ items, total }` with status 200 and `Content-Type: application/json`.

## Must-Haves

- [ ] Edge Function accepts POST with `{ imageBase64, mimeType }` body
- [ ] Calls Gemini Vision REST API with receipt image as inline data
- [ ] Prompt instructs expansion of receipt abbreviations into readable names
- [ ] Strips markdown code fences before JSON.parse
- [ ] Returns `{ items: [{ name, quantity, price }], total }` on success
- [ ] Returns structured error with `phase` field for: missing API key, Gemini rate limit (429), parse failure
- [ ] CORS headers present for Expo Go cross-origin requests

## Verification

- File compiles: no TypeScript syntax errors in the function file
- Curl test against deployed function with a real receipt base64 returns valid JSON with items array
- Curl with obviously non-receipt image (e.g., a solid color) returns error with `phase: "parse"` or a best-effort response
- Curl without valid API key returns error with `phase: "config"`

## Observability Impact

- Signals added/changed: `console.log` with `{ phase: "success", item_count, total }` on successful extraction; `console.error` with `{ phase, error, status }` on failures
- How a future agent inspects this: Supabase Dashboard → Edge Function logs for `scan-receipt` — filter by `phase` to isolate config vs API vs parse issues
- Failure state exposed: Response body always includes `phase` field on error, enabling client to show contextual messages (config issue vs rate limit vs bad image)

## Inputs

- `supabase/functions/push-expense/index.ts` — Edge Function pattern: `Deno.serve`, `esm.sh` imports, env var access, JSON response structure
- Decision: "Gemini REST API via generativelanguage.googleapis.com from Deno fetch — no SDK needed"
- Decision: "Receipt scan always requires user review/confirmation before committing items"
- `GEMINI_API_KEY` must be set as Edge Function secret (collected in M002-SECRETS.md, status: collected)

## Expected Output

- `supabase/functions/scan-receipt/index.ts` — complete Edge Function ready for deployment
