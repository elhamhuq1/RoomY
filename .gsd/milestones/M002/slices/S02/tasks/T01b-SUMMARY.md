---
id: T01b
parent: S02
milestone: M002
provides:
  - Client-side YouTube transcript extraction utility (lib/youtube.ts)
key_files:
  - lib/youtube.ts
  - supabase/functions/import-recipe/index.ts
key_decisions:
  - Innertube ANDROID client (v20.10.38) for reliable caption track access — matches youtube-transcript-api library approach
  - Two-step extraction: fetch watch page for API key, then innertube player API for caption data
  - Text mode limit raised from 5K to 15K to support client-extracted transcripts
  - Manual paste limit enforced client-side at 5K; Edge Function accepts up to 15K
patterns_established:
  - Client-side YouTube extraction → text mode Edge Function pipeline
observability_surfaces:
  - Console log when transcript truncation occurs
  - Structured error with phase field on all failure paths
duration: 25m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01b: Move YouTube caption extraction to client-side utility

**Built client-side YouTube transcript extraction using innertube ANDROID API, bypassing cloud IP rate limiting**

## What Happened

YouTube blocks caption requests from cloud IPs (HTTP 429 from Supabase Edge Functions). Moved the YouTube extraction logic to a client-side utility (`lib/youtube.ts`) that runs on the user's device where consumer IPs aren't blocked.

The key discovery: the `youtube-transcript-api` Python library uses a two-step approach that works reliably:
1. Fetch watch page to get `INNERTUBE_API_KEY`
2. Call `youtubei/v1/player` with `ANDROID` client context (version 20.10.38) — this returns working caption track URLs

Implemented this approach in TypeScript:
- `extractVideoId(url)` — parses 4 YouTube URL formats
- `isYouTubeUrl(url)` — quick validation check
- `extractYouTubeTranscript(url)` — full pipeline returning `{ ok, data: { transcript, title } }` or `{ ok, error: { error, phase } }`

Also raised the Edge Function text mode limit from 5K to 15K characters to accept client-extracted transcripts.

## Verification

- ✅ `npx tsc --noEmit` — no new errors
- ✅ Edge Function redeployed with 15K text limit
- ✅ Full pipeline test: Babish Pasta Aglio e Olio (bJUiWdM__Qw) → innertube extraction → text mode Edge Function → "Pasta Aglio e Olio" title, 8 ingredients (salt, garlic, parsley, olive oil, red pepper flakes, pasta, lemon juice, pepper)
- ✅ Non-recipe test: Rick Astley (dQw4w9WgXcQ) → `{ title: null, ingredients: [] }` (empty array, correct)
- ✅ Duration guard: "The 50 Easiest 3-Ingredient Recipes" (WcGYBX6Ucvg, 35 min) → correctly rejected with user-friendly message

## Diagnostics

- Client console log when transcript truncation occurs: `[youtube] Transcript truncated: N → 15000 chars`
- All error paths return structured `{ ok: false, error: { error, phase } }` for client-side error handling
- Phases: `url-parse`, `page-fetch`, `caption-extract`, `duration-guard`

## Deviations

- Innertube ANDROID client approach instead of direct watch page HTML parsing — the `ytInitialPlayerResponse` approach from the original plan produces caption URLs that return empty content due to YouTube's `xowf` anti-scraping parameter. The innertube API produces working URLs.
- Edge Function text mode limit raised from 5K to 15K — necessary since client-extracted transcripts can be longer than manual paste input.

## Known Issues

None — the innertube approach works reliably from both consumer and cloud IPs.

## Files Created/Modified

- `lib/youtube.ts` — New client-side YouTube transcript extraction utility
- `supabase/functions/import-recipe/index.ts` — Text mode limit raised from 5K to 15K
