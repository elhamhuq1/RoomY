---
id: T01
parent: S05
milestone: M003
provides:
  - push-chore-nudge Edge Function with full nudge lifecycle (auth, validation, rate-limit, insert, push)
key_files:
  - supabase/functions/push-chore-nudge/index.ts
key_decisions:
  - Nudge insert happens before push token/prefs lookup so nudge is always recorded even if push delivery is skipped
  - Push failures are non-fatal — return 200 with push_sent:false and reason field
  - Rate limit uses rolling 24h window via JS Date arithmetic rather than SQL interval (consistent with service-role client pattern)
patterns_established:
  - Structured phase-based error responses with { error, phase } shape matching search-products pattern
  - Graceful degradation: nudge recorded first, push attempted second, each skip reason returned in response
observability_surfaces:
  - console.log JSON on each phase (auth, validation, rate_limit, insert, push) with phase-specific context
  - Structured JSON responses expose phase field for client-side diagnostic routing
  - chore_nudges table rows for nudge history inspection
duration: 15m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Build push-chore-nudge Edge Function

**Created complete Deno Edge Function handling nudge auth, chore validation, 24h rate limiting, nudge recording, and Expo Push delivery with graceful degradation.**

## What Happened

Built `supabase/functions/push-chore-nudge/index.ts` (256 lines) following existing patterns from `search-products` (CORS, jsonResponse helper) and `push-chore-reminder` (Expo Push send, notification prefs check, supabase-js import).

The function handles five phases sequentially:
1. **auth** — Extract Bearer token from Authorization header, validate via `supabase.auth.getUser()`
2. **validation** — Fetch chore, check is_active, overdue (`next_due_at < now`), has assignee, sender ≠ assignee
3. **rate_limit** — Query `chore_nudges` for matching row within rolling 24h window, return 429 if found
4. **insert** — Record nudge in `chore_nudges` table (always, before push attempt)
5. **push** — Fetch recipient profile + notification prefs, skip if chores_enabled=false or no token, otherwise send via Expo Push API

Key design choice: nudge record is inserted before push token/prefs lookup. This means the nudge is always recorded for rate-limiting purposes, even when push delivery is skipped. Each skip reason is returned in the response body.

## Verification

- **File exists:** `supabase/functions/push-chore-nudge/index.ts` confirmed at 256 lines
- **tsc check:** `npx tsc --noEmit` — all errors in new file are standard Deno-not-found-in-tsc pattern (same as all other Edge Functions: `push-chore-reminder`, `push-expense`, `search-products`, etc.). Zero new app/components/lib errors.
- **Code review against must-haves:** All 10 must-haves verified present in code:
  - CORS headers on all responses including OPTIONS preflight ✅
  - Auth from Authorization header (not body) ✅
  - Overdue validation (`next_due_at < now()`) ✅
  - Self-nudge prevention (`sender_id ≠ current_assignee`) ✅
  - Rate limit: 1 per chore per sender per 24h via rolling window ✅
  - Nudge record always inserted (before push check) ✅
  - `notification_preferences.chores_enabled` respected (default true) ✅
  - Missing push token handled gracefully ✅
  - Friendly copy: "Gentle Nudge" title, sender name + chore name in body ✅
  - Structured JSON errors with phase field ✅

**Slice-level verification (partial — T01 is not final task):**
- curl test: cannot run locally (requires deployed Edge Function + auth token) — deferred to deployment
- tsc check: passed (no new errors in app code)
- Visual nudge button: not yet implemented (T02)

## Diagnostics

- **Edge Function logs:** Each phase emits `console.log(JSON.stringify({ phase, ... }))` — visible in Supabase Dashboard > Edge Functions > Logs
- **Nudge history:** `SELECT * FROM chore_nudges WHERE chore_id = '...'` shows all nudge records including those where push was skipped
- **Error shape:** All error responses follow `{ error: "description", phase: "auth|validation|rate_limit|insert|push" }` — clients can route on phase field
- **Push skip reasons:** Success responses with `push_sent: false` include `reason` field explaining why (disabled prefs, no token, delivery failure)

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `supabase/functions/push-chore-nudge/index.ts` — New Edge Function (256 lines) handling complete nudge lifecycle
