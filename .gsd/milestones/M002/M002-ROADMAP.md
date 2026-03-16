# M002: Smart Groceries

**Vision:** Transform the grocery tab from a basic shared checklist into an intelligent grocery workflow — receipt scanning for cost splitting, YouTube recipe import for ingredient extraction, Kroger product search for real inventory awareness, and aisle-based list organization.

## Success Criteria

- A user can photograph a grocery receipt, review extracted line items with prices, and complete a trip with accurate per-item cost splitting visible in trip history
- A user can paste a YouTube recipe URL, see extracted ingredients for selection, and have chosen items appear on all roommates' grocery lists in real time
- A user can search Kroger products by name, see real results with price, size, and aisle location, and add a product to the list with its category auto-assigned
- The grocery list displays items grouped by store department (produce, dairy, frozen, etc.) with collapsible section headers for efficient in-store shopping

## Key Risks / Unknowns

- **Gemini Vision from Deno Edge Functions** — the REST API must be callable from Deno `fetch` with an API key obtained from Google AI Studio. If the user's Gemini Pro subscription doesn't provide a server-side key, we fall back to OpenAI Vision. Blocks receipt scanning and recipe import.
- **Receipt OCR accuracy** — thermal print fading, store abbreviations ("GV WHL MLK 1GL"), and format variation across stores. Gemini handles this well but edge cases will exist. User review step is mandatory.
- **YouTube caption extraction** — parsing `ytInitialPlayerResponse` from watch page HTML is fragile to YouTube page structure changes. The `timedtext` API endpoint itself is more stable. Must handle videos without captions gracefully.
- **Kroger API credentials** — self-serve registration at developer.kroger.com, but requires app approval. If delayed, S04 ships last and the category system from S03 still provides aisle organization independently.

## Proof Strategy

- Gemini Vision from Deno → retire in S01 by shipping a working receipt scan that returns structured JSON from a real receipt photo processed by a deployed Edge Function
- Receipt OCR accuracy → retire in S01 by demonstrating correct extraction from a real US grocery receipt with user review/correction step
- YouTube caption extraction → retire in S02 by shipping a working recipe import that extracts ingredients from a real YouTube cooking video URL
- Kroger API availability → retire in S04 by shipping product search that returns real results from the Kroger Products API via a deployed Edge Function

## Verification Classes

- Contract verification: Edge Function integration tests (curl against deployed functions with real inputs), TypeScript compilation (`npx tsc --noEmit`)
- Integration verification: receipt photo → Storage upload → Edge Function → Gemini → structured JSON → complete-trip UI; recipe URL → Edge Function → YouTube captions → Gemini → grocery_items insert → realtime sync to other clients; product search → Edge Function → Kroger API → results rendered in-app
- Operational verification: Edge Functions handle Gemini 429 rate limits, bad receipt images, missing YouTube captions, and Kroger API failures with user-friendly error messages
- UAT / human verification: user photographs a real receipt and confirms extracted items are correct; user imports a real YouTube recipe and confirms ingredients make sense; user searches a real product and confirms price/aisle data is accurate

## Milestone Definition of Done

This milestone is complete only when all are true:

- All four slice deliverables (receipt scanning, recipe import, category organization, Kroger search) are complete and individually verified
- Receipt scan populates the complete-trip flow and itemized costs appear in trip history
- Recipe import creates grocery_items that sync via realtime to all household members
- Kroger product search auto-assigns categories from Kroger's taxonomy that map to the department grouping in the list UI
- The grocery list displays items grouped by department with collapsible sections — items from all sources (manual, recipe, Kroger) appear in the correct department
- Edge Functions handle API failures (rate limits, bad images, missing captions, Kroger downtime) with clear user-facing error messages instead of crashes
- Success criteria are re-checked against live behavior via Expo Go on a real device

## Requirement Coverage

- Covers: GROC-01, GROC-02, GROC-03, GROC-04, GROC-05 (S01); GROC-06, GROC-07, GROC-08, GROC-09 (S02); GROC-10, GROC-11, GROC-12, GROC-13 (S03); GROC-14, GROC-15, GROC-16, GROC-17 (S04)
- Partially covers: none
- Leaves for later: none
- Orphan risks: Gemini API key provisioning — must be resolved before S01 execution (user action to verify server-side API key from Google AI Studio)

## Slices

- [x] **S01: Receipt Scanning** `risk:high` `depends:[]`
  > After this: user photographs a grocery receipt, reviews extracted line items (name, qty, price) on-screen, confirms to auto-populate the trip total and complete the trip with per-item cost splitting visible in trip history
- [ ] **S01b: Receipt-Based Item Ownership & Smart Splitting** `risk:medium` `depends:[S01]`
  > After this: user scans receipt from main groceries page, assigns items to household members, completes trip with splits calculated from item ownership (with even-split fallback)
- [ ] **S02: YouTube Recipe Import** `risk:medium` `depends:[S01]`
  > After this: user pastes a YouTube recipe URL, sees extracted ingredients with selection checkboxes, adds chosen items to the shared grocery list with realtime sync to all roommates
- [ ] **S03: Category & Aisle Organization** `risk:low` `depends:[]`
  > After this: grocery list displays items grouped by department (produce, dairy, frozen, etc.) with collapsible section headers; users can manually change any item's category via a quick picker
- [ ] **S04: Kroger Product Search** `risk:medium` `depends:[S03]`
  > After this: user searches Kroger products by name with a selected nearby store, sees real results with price, size, and aisle, and adds a product to the list with its category auto-assigned from Kroger's taxonomy

## Boundary Map

### S01 (Receipt Scanning)

Produces:
- `supabase/functions/scan-receipt/index.ts` — Edge Function pattern for Gemini Vision: receives base64 image, returns structured JSON `{ items: [{ name, quantity, price }], total }`. Establishes the Gemini REST API calling pattern (endpoint, auth header, response parsing with markdown fence stripping) that S02 reuses
- `supabase/migrations/` — new migration adding `unit_price NUMERIC(10,2)` and `source TEXT DEFAULT 'manual'` columns to `grocery_items`. Also creates `receipts` Storage bucket with RLS policies
- `lib/receipt-capture.ts` — image capture + upload utility (expo-image-picker → expo-image-manipulator at 1200px width → Supabase Storage upload). Follows the avatar-upload.ts pattern
- Updated `complete_grocery_trip` RPC or new RPC that accepts per-item prices and stores them with the trip
- Updated `complete-trip.tsx` — accepts receipt-scanned items as input, shows itemized preview, auto-populates total

Consumes:
- Existing `complete-trip.tsx` trip completion flow
- Existing `lib/avatar-upload.ts` image capture pattern
- Existing Edge Function pattern from `push-expense/index.ts`
- Existing `trip-history.tsx` for displaying per-item prices

### S01 → S02

Produces:
- Gemini REST API calling pattern (endpoint construction, auth header, response parsing, markdown fence stripping) — S02 reuses this exact pattern for recipe extraction
- Edge Function secret management pattern (`GEMINI_API_KEY` in Deno.env)

### S02 (YouTube Recipe Import)

Produces:
- `supabase/functions/import-recipe/index.ts` — Edge Function: receives YouTube URL, fetches watch page, extracts captions, sends to Gemini for ingredient extraction, returns `{ ingredients: [{ name, quantity, unit, category? }] }`
- Recipe import UI: modal/screen accessible from grocery tab for pasting URL, reviewing extracted ingredients, selecting which to add
- Bulk insert of selected ingredients as `grocery_items` with `source = 'recipe'`, flowing through existing realtime channel

Consumes:
- Gemini REST API pattern from S01 (calling convention, response parsing)
- `GEMINI_API_KEY` Edge Function secret (already deployed in S01)
- Existing `grocery_items` table and realtime subscription

### S03 (Category & Aisle Organization)

Produces:
- `supabase/migrations/` — adds `category TEXT` column to `grocery_items` (if not already added by S01's migration)
- Fixed department taxonomy constant (produce, dairy, meat, frozen, bakery, beverages, snacks, pantry, household, other) — shared between Edge Functions and client
- Updated `groceries.tsx` — list grouped by department with collapsible section headers and category counts
- Category picker component for manual category assignment/change on any item

Consumes:
- Existing `groceries.tsx` flat list UI
- Existing `GroceryItemRow.tsx` component

### S03 → S04

Produces:
- Department taxonomy constant — S04 maps Kroger's `categories` field to this taxonomy
- `category` column on `grocery_items` — S04 writes to it when adding Kroger products
- Category-grouped list UI — S04's auto-categorized products appear in correct sections

### S04 (Kroger Product Search)

Produces:
- `supabase/functions/search-products/index.ts` — Edge Function: Kroger OAuth token acquisition, proxied product search, simplified result format `{ products: [{ name, brand, price, size, aisle, department }] }`
- `supabase/functions/search-stores/index.ts` — Edge Function: Kroger Locations API, finds nearby stores by zip code
- Product search UI: accessible when adding items, shows Kroger results with price/size/aisle, tap to add
- Store selection UX: one-time nearby store picker, persisted to household or user settings

Consumes:
- Department taxonomy from S03 (maps Kroger categories to app departments)
- `category` column on `grocery_items` from S03
- Existing `grocery_items` table and realtime subscription
