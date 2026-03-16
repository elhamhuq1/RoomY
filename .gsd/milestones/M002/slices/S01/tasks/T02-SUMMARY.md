---
id: T02
parent: S01
milestone: M002
provides:
  - scan-receipt Edge Function that calls Gemini Vision and returns structured receipt items JSON
key_files:
  - supabase/functions/scan-receipt/index.ts
key_decisions:
  - Prompt instructs Gemini to return line-total as price (not unit price) — client-side review can split if needed
  - Return ONLY valid JSON instruction in prompt (no markdown wrapper request) — rely on code-fence stripping as fallback
  - Method not allowed (405) for non-POST requests as additional guard beyond CORS
patterns_established:
  - Gemini Vision REST call pattern from Deno Edge Functions — endpoint, auth via query param, inlineData body, response parsing with fence stripping
  - Structured error responses with phase field for client-side contextual error messages
observability_surfaces:
  - Supabase Dashboard → Edge Function logs for scan-receipt — filter by phase (success/config/gemini-call/parse)
  - Success log includes item_count and total for monitoring extraction quality
  - Error logs include status code and response body (Gemini errors) or raw text snippet (parse errors)
duration: 20m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Build scan-receipt Edge Function with Gemini Vision

**Created scan-receipt Edge Function that calls Gemini 2.0 Flash with receipt images and returns structured `{ items, total }` JSON with abbreviation expansion and phase-tagged error handling.**

## What Happened

Built `supabase/functions/scan-receipt/index.ts` following the `push-expense` Edge Function pattern. The function accepts POST `{ imageBase64, mimeType }`, calls Gemini Vision at `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` with the image as inline data, strips markdown code fences from the response, parses and validates the JSON structure, and returns `{ items: [{ name, quantity, price }], total }`.

The prompt instructs Gemini to expand store abbreviations (e.g., "GV WHL MLK 1GL" → "Great Value Whole Milk 1 Gallon"), set quantity to 1 when not shown, prefer subtotal over total, and exclude tax/fee lines.

Three error paths return structured `{ error, phase }` responses: missing API key (500, phase: config), Gemini 429 rate limit (429, phase: gemini-call) and other API errors (502, phase: gemini-call), and parse/validation failures (400, phase: parse). CORS headers are present on all responses including OPTIONS preflight.

## Verification

- `npx tsc --noEmit` — scan-receipt shows only 2 expected `Deno` type errors (identical to push-expense and push-chore-reminder Edge Functions; no novel TS errors)
- Code review confirms all must-haves: POST body parsing, Gemini Vision call with inline data, abbreviation expansion prompt, code-fence stripping regex, `{ items, total }` success shape, phase-tagged errors for config/rate-limit/parse, CORS headers on all paths
- Structured logging verified: `console.log` with `{ phase: "success", item_count, total }` on happy path; `console.error` with `{ phase, error, status }` on all failure paths
- Cannot curl-test without deployment — function is ready for `supabase functions deploy scan-receipt` with `GEMINI_API_KEY` secret set

## Diagnostics

- **Inspect function logs:** Supabase Dashboard → Edge Function logs → `scan-receipt`. Filter by `phase` to isolate issue type.
- **Success shape:** `{ phase: "success", item_count: N, total: N.NN }` — low item_count with high total suggests extraction issues
- **Error shapes:** Config → `{ phase: "config", error: "GEMINI_API_KEY not set" }`. Gemini call → `{ phase: "gemini-call", error: <body>, status: <code> }`. Parse → `{ phase: "parse", error: "JSON parse failed"|"Invalid response structure", rawText: <first 500 chars> }`
- **GEMINI_API_KEY is never logged** — only the phase and error message appear in logs

## Deviations

None.

## Known Issues

- Cannot verify with live curl until the function is deployed and `GEMINI_API_KEY` is set as an Edge Function secret. Deployment is out of scope for this task.
- Deno type errors in `npx tsc --noEmit` are expected — all Edge Functions share this gap since the project tsconfig targets Node/RN, not Deno.

## Files Created/Modified

- `supabase/functions/scan-receipt/index.ts` — Complete Edge Function: Gemini Vision receipt scanning with structured JSON output and phase-tagged error handling
