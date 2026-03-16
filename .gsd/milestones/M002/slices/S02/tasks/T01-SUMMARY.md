---
id: T01
parent: S02
milestone: M002
provides:
  - import-recipe Edge Function with YouTube caption extraction and text mode
key_files:
  - supabase/functions/import-recipe/index.ts
key_decisions:
  - YouTube page fetch uses SOCS/CONSENT cookies to bypass GDPR consent wall
  - Gemini API key checked early (before mode branching) for fast fail
  - jsonResponse helper extracted to reduce repetition across 15+ response paths
patterns_established:
  - Phase-tagged structured error responses for multi-step extraction pipelines
  - Dual-mode Edge Function (youtube/text) sharing a single Gemini prompt and response parser
observability_surfaces:
  - Structured JSON console.log/console.error with phase field on every code path
  - Phases: url-parse, page-fetch, caption-extract, duration-guard, config, gemini-call, parse, success
  - Duration and truncation values logged when guards activate
  - Gemini HTTP status logged on API failures
duration: 35m
verification_result: partial
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Build import-recipe Edge Function

**Built dual-mode Edge Function for recipe ingredient extraction via YouTube captions or raw text, with phase-tagged diagnostics on every error path**

## What Happened

Created `supabase/functions/import-recipe/index.ts` (~417 lines) following the scan-receipt Gemini REST API pattern. The function supports two modes:

- **text mode**: Validates input ≤5K chars, sends directly to Gemini, returns structured `{ title, ingredients }`.
- **youtube mode**: Extracts video ID from 4 URL formats (watch, short URL, shorts, mobile), fetches watch page with browser UA + consent cookies, parses `ytInitialPlayerResponse`, checks duration ≤30 min, finds English caption track (falls back to first), fetches XML transcript, strips tags/entities, truncates to 15K chars, then sends to Gemini.

Both modes share the same Gemini prompt and response parsing (markdown fence stripping, JSON parse, structure validation).

## Verification

**Passed:**
- ✅ File exists: `supabase/functions/import-recipe/index.ts`
- ✅ `supabase functions deploy import-recipe` succeeds
- ✅ Text mode with "2 cups flour, 3 eggs, 1 cup sugar, 1 tsp vanilla extract" → 4 ingredients with correct name/quantity/unit
- ✅ Non-recipe text → `{ title: null, ingredients: [] }` (empty array, not error)
- ✅ All error responses include `phase` field (tested: invalid mode → `request`, bad URL → `url-parse`, text too long → `request`)
- ✅ `npx tsc --noEmit` — no new errors (only pre-existing Deno type errors shared by all Edge Functions)

**Known limitation — YouTube mode from cloud IPs:**
- ❌ YouTube mode returns `page-fetch` error (HTTP 429) when called from Supabase Edge Function's cloud IP. YouTube rate-limits/blocks requests from known cloud provider IPs. The code is structurally correct — the same fetch works from local/consumer IPs. This is the fragility the task plan anticipated ("YouTube HTML parsing is fragile").
- The text mode fallback exists precisely for this scenario — the client UI (T02) will guide users to paste text manually when YouTube mode fails.

**Slice-level verification status (T01 is task 1 of 3):**
- ✅ `npx tsc --noEmit` passes with no new errors
- ✅ Edge Function deploys without error
- ✅ curl text mode → 4 ingredients
- ⚠️ curl YouTube mode → page-fetch error from cloud IP (works locally, blocked by YouTube from Supabase edge)
- ⚠️ curl non-recipe YouTube video → same page-fetch block
- ⏳ Expo Go navigation — T02/T03 scope
- ⏳ Items in grocery list — T02/T03 scope

## Diagnostics

- **Edge Function logs**: Supabase dashboard → Functions → import-recipe. Every log/error is structured JSON with `phase` field.
- **Error response shape**: `{ error: string, phase: string }` — phase localizes the failure point in the extraction pipeline.
- **Phases in order**: `request` → `url-parse` → `page-fetch` → `caption-extract` → `duration-guard` → `config` → `gemini-call` → `parse` → `success`
- **Duration guard**: Logs `{ phase: "duration-guard", videoId, lengthSeconds, minutes }` when rejecting long videos.
- **Truncation**: Logs `{ phase: "caption-extract", event: "truncated", originalLength }` when transcript exceeds 15K chars.

## Deviations

- Added `Cookie` header with SOCS/CONSENT values to YouTube page fetch to bypass GDPR consent wall (not in plan but necessary for non-US cloud IPs).
- YouTube mode fails from Supabase Edge Function cloud IPs due to YouTube 429 rate limiting. This is the expected fragility warned about in the task plan. The function is structurally correct and works from consumer IPs. Text mode serves as the designed fallback.

## Known Issues

- YouTube page fetch gets HTTP 429 from Supabase Edge Function IPs. This is a YouTube anti-bot measure affecting all cloud/serverless environments. Potential future mitigations: proxy service, YouTube Data API v3 (doesn't expose captions), or client-side caption extraction. Text mode is the immediate fallback.

## Files Created/Modified

- `supabase/functions/import-recipe/index.ts` — New Edge Function implementing dual-mode recipe ingredient extraction (YouTube captions + raw text → Gemini → structured ingredients)
- `supabase/.temp/project-ref` — Copied from main project to enable `supabase functions deploy` from worktree
