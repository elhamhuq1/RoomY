---
depends_on: [M001]
---

# M002: Smart Groceries

**Gathered:** 2026-03-15
**Status:** Ready for planning

## Project Description

Overhaul the grocery feature from a basic shared checklist into an intelligent grocery workflow. Three new capabilities layered on the existing grocery infrastructure: receipt scanning for cost splitting, recipe URL import for ingredient extraction, and store product integration for real inventory awareness and aisle-based list organization.

## Why This Milestone

The current grocery feature is manual and doesn't provide enough value — users type items by hand, check them off, then manually enter the trip total. There's no connection to real store products, no way to import from recipes, and no receipt scanning. This milestone makes the grocery tab the most useful screen in the app.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Photograph a grocery receipt and have it auto-extract item names, quantities, and prices into the trip completion flow for accurate cost splitting
- Paste a YouTube, TikTok, or Instagram recipe URL and have the ingredients automatically added to their shared grocery list
- Search real products from nearby stores (via Instacart) when adding items to the list, seeing actual availability and pricing
- View their grocery list organized by store aisle/department so they can shop efficiently without backtracking

### Entry point / environment

- Entry point: Groceries tab in the RoomY app, plus new "Scan Receipt" and "Import Recipe" entry points
- Environment: Expo Go on iOS and Android (dev), Supabase Edge Functions for backend processing
- Live dependencies involved: Gemini Pro Vision API (receipt OCR + recipe extraction), Instacart Developer Platform API (store product catalog), YouTube/TikTok/Instagram content fetching

## Completion Class

- Contract complete means: receipt photo → structured line items returned; recipe URL → ingredient list returned; store search → real products with aisle info returned; all verified via Edge Function integration tests and in-app manual testing
- Integration complete means: receipt scan populates the complete-trip flow with itemized costs; recipe ingredients appear on the shared grocery list with realtime sync; store products show aisle/department and map to list categories
- Operational complete means: edge functions handle API failures gracefully (rate limits, bad images, unsupported URLs); OCR works on typical US grocery receipts; recipe extraction handles the three target platforms

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A user can photograph a Walmart/Kroger receipt, see extracted items with prices, and complete a trip with accurate per-item cost splitting
- A user can paste a YouTube cooking video URL, see extracted ingredients, select which ones to add, and have them appear on all roommates' grocery lists in real time
- A user can search for a product by name, see results from a nearby store with aisle locations, and add it to the list with category auto-assigned
- The grocery list displays items grouped by store department/aisle for efficient shopping

## Risks and Unknowns

- **Instacart Developer Platform approval** — requires application and review (~3 weeks). If rejected or delayed, store integration slice ships last or gets descoped to manual category assignment
- **Receipt OCR accuracy** — grocery receipts vary wildly (thermal print fading, abbreviations, store-specific formats). Gemini Vision handles this well but edge cases will exist. Need graceful fallback to manual entry
- **Recipe extraction from video platforms** — TikTok and Instagram don't expose transcripts easily. May need to fetch captions via yt-dlp (YouTube) or platform-specific workarounds. Some recipe videos don't list ingredients explicitly — LLM has to infer from spoken content
- **Gemini API availability** — user has Gemini Pro subscription (free API access). Need to verify Gemini 2.0 Flash or Pro Vision is callable from Supabase Edge Functions (Deno runtime). Fallback: OpenAI Vision
- **Instacart API rate limits and coverage** — product catalog coverage varies by region. Users in areas with few Instacart-partnered stores may get poor results

## Existing Codebase / Prior Art

- `app/(app)/(tabs)/groceries.tsx` — main grocery list screen (shared checklist with quick-add, realtime sync, TO GET/DONE sections). Will be extended with category grouping and new entry points
- `app/(app)/groceries/complete-trip.tsx` — trip completion flow (manual total entry, payer selection, even/custom split). Receipt scan will auto-populate this
- `app/(app)/groceries/trip-history.tsx` — past trip viewer with expandable item lists. Will show itemized costs from receipt scans
- `supabase/migrations/00003_groceries.sql` — grocery_items and grocery_trips schema. Needs new columns (category, unit_price, product_id) and possibly new tables (recipes, receipt_scans)
- `supabase/functions/push-expense/index.ts` — existing Edge Function pattern (Deno, service role key, error handling). New functions follow this pattern
- `components/groceries/` — GroceryItemRow, EmptyState, QuickAddInput, SectionHeader. Will need new components for receipt preview, recipe import modal, product search

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- This milestone introduces entirely new capabilities not in the current requirement contract. New requirements will be added during planning:
  - GROC-01 through GROC-XX for receipt scanning, recipe import, store integration, and aisle organization

## Scope

### In Scope

- Receipt photo capture → Gemini Vision OCR → structured line items (name, quantity, price) → auto-populate complete-trip flow
- Recipe URL paste (YouTube, TikTok, Instagram) → Edge Function fetches content → Gemini extracts ingredients → items added to grocery list
- Instacart Developer Platform integration for product search (name → real products with price, availability, aisle/department)
- Grocery list reorganization by store department/aisle (produce, dairy, frozen, etc.)
- New grocery_items columns: category/department, unit_price, source (manual/recipe/store)
- Edge Functions: scan-receipt, import-recipe, search-products
- Graceful degradation when APIs are unavailable or return errors

### Out of Scope / Non-Goals

- Instacart ordering/checkout — this is product search only, not a shopping integration
- Barcode scanning — camera is for receipts only
- Meal planning / weekly menu features — recipe import adds ingredients to the list, that's it
- Price comparison across stores — show prices from one store at a time
- Automatic reordering / purchase history suggestions — future milestone
- Custom receipt templates or training OCR on specific store formats

## Technical Constraints

- **Supabase Edge Functions (Deno runtime)** — all backend processing runs here. No separate server.
- **Gemini Pro Vision API** — primary LLM for OCR and recipe extraction (user has free access via Gemini Pro subscription). Must work from Deno `fetch`.
- **Instacart Developer Platform** — requires API key approval. Store search depends on this.
- **Expo Go compatibility** — camera access for receipt photos must work in Expo Go on both iOS and Android. Use expo-image-picker (already installed for profile photos).
- **Existing grocery schema** — new columns/tables must be additive (no breaking changes to existing grocery_items/grocery_trips structure)
- **Realtime sync** — new items from recipe import must appear on all roommates' screens via existing Supabase realtime subscription

## Integration Points

- **Gemini Vision API** — Edge Functions call Gemini for receipt OCR (image → structured items) and recipe extraction (text/transcript → ingredient list)
- **Instacart Developer Platform** — Edge Function proxies product search requests, returns product name, price, aisle, availability
- **YouTube / TikTok / Instagram** — Edge Function fetches video transcripts or page content for recipe extraction. YouTube via yt-dlp or Invidious API; TikTok/Instagram via page scraping or oEmbed
- **Supabase Storage** — receipt photos uploaded to a `receipts` bucket (similar to existing `avatars` bucket pattern)
- **Existing expense system** — receipt-scanned trips create expenses with itemized splits (extends current complete_grocery_trip RPC)
- **Existing realtime subscription** — recipe-imported items flow through the same grocery_items realtime channel

## Open Questions

- **Gemini API key management** — does the user's Gemini Pro subscription provide an API key usable from server-side Edge Functions, or is it tied to Google AI Studio / Vertex AI? Need to verify access method before implementation
- **Instacart API approval timeline** — if approval takes longer than expected, should store integration be the last slice (deferred) or should we build a manual category assignment fallback?
- **Recipe extraction quality** — for TikTok videos where ingredients aren't explicitly listed, how aggressively should the LLM infer? Conservative (only extract explicitly stated items) vs. liberal (infer from visual/contextual cues)
- **Receipt item matching to store products** — should scanned receipt items auto-match to Instacart products for category assignment, or keep receipt scanning and store integration as independent features?
