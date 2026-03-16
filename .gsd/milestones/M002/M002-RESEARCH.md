# M002: Smart Groceries — Research

**Date:** 2026-03-15

## Summary

This milestone adds four capabilities to the grocery feature: receipt scanning (Gemini Vision OCR), YouTube recipe import (Gemini ingredient extraction), Kroger product search for real store inventory awareness, and aisle-based list organization. The existing codebase is well-structured for extension — clean grocery schema, established Edge Function patterns, consistent UI component model with a wintergreen design system.

Research confirms **Kroger is the only major US grocery chain with a genuine self-serve public developer API** for product search. Their Products API returns exactly what we need: product descriptions, `aisleLocations`, `categories`, pricing (`regular`/`promo`), `brand`, and `size`. Auth is standard OAuth2 client credentials (sign up at developer.kroger.com, get CLIENT_ID + CLIENT_SECRET). Kroger operates ~2,800 stores under multiple banners (Ralphs, Fred Meyer, Harris Teeter, Fry's, King Soopers, etc.), so coverage is decent despite being a single chain. Other chains (Walmart, Target, Albertsons, Publix) either have no public API or deprecated theirs.

Receipt scanning and recipe import are both achievable via Gemini's `generateContent` REST API called from Deno Edge Functions. YouTube transcript extraction is feasible from Deno by fetching the watch page HTML and parsing caption track URLs from `ytInitialPlayerResponse`. TikTok and Instagram are out of scope per user decision — YouTube only.

All new UI must match the existing design system: wintergreen (#2D6A4F) brand palette, cream (#F5F0EB) background, transparent-outline cards, consistent typography hierarchy. No emoji or generic icon usage — custom illustrations via Nano Banana where needed, Ionicons for standard affordances.

## Recommendation

1. **Start with receipt scanning** — highest user value, most testable, and the Gemini Vision integration proves the Edge Function → Gemini → structured JSON pipeline that recipe import reuses.
2. **Recipe import second** — reuses the Gemini Edge Function pattern. YouTube-only scope keeps it focused and reliable.
3. **Category/aisle organization third** — pure frontend + schema work. Define a fixed set of grocery departments, add `category` to `grocery_items`, update the list UI to group by category. This is foundational for store search but also valuable standalone.
4. **Kroger product search last** — depends on API key registration (self-serve, but still requires sign-up). Needs Locations API for store selection before Products API returns prices/aisles. If Kroger access has issues, the category system from slice 3 still provides aisle organization.

## Implementation Landscape

### Key Files

- `supabase/migrations/00003_groceries.sql` — current schema: `grocery_items` (id, household_id, name, quantity, is_checked, trip_id, archived_at, created_by, created_at) and `grocery_trips` (id, household_id, total_amount, expense_id, paid_by, created_by, completed_at). New columns needed: `category TEXT`, `unit_price NUMERIC(10,2)`, `source TEXT DEFAULT 'manual'` on grocery_items. Receipt scan needs a way to store per-item prices on trip items.
- `app/(app)/(tabs)/groceries.tsx` — main grocery list screen (~350 LOC). Currently flat list with TO GET / DONE sections. Needs category grouping and new entry points (recipe URL input). Well-structured with optimistic updates, realtime subscription, dedup logic.
- `app/(app)/groceries/complete-trip.tsx` — trip completion with manual total entry (~400 LOC). Receipt scan will auto-populate the total and show itemized preview. Has even/custom split modes already built.
- `app/(app)/groceries/trip-history.tsx` — past trip viewer with expandable item lists. Will show per-item prices from receipt scans.
- `components/groceries/GroceryItemRow.tsx` — individual row component with swipeable delete, circle checkbox, creator avatar. Will need minor update for category indicator.
- `components/groceries/QuickAddInput.tsx` — inline add input. Will be extended with entry points for recipe import and product search.
- `supabase/functions/push-expense/index.ts` — established Edge Function pattern: `Deno.serve`, `esm.sh` imports for `@supabase/supabase-js`, service role key from `Deno.env`, JSON responses, error handling returns 200 to avoid webhook retries.
- `lib/avatar-upload.ts` — existing pattern for image capture → upload to Supabase Storage (expo-image-picker → expo-image-manipulator → supabase.storage.upload). Receipt photo flow follows identical approach.
- `supabase/migrations/00009_create_avatars_bucket.sql` — storage bucket creation pattern with RLS policies. Receipt bucket follows this.
- `app/(app)/_layout.tsx` — Stack navigator registering all sub-screens. New screens register here with standard cream header styling.
- `lib/types/database.ts` — TypeScript types for all tables. Needs updated GroceryItem/GroceryTrip types and new types.
- `lib/theme/colors.ts` — wintergreen palette, AVATAR_COLORS. All new UI references these tokens.
- `app/(app)/(tabs)/_layout.tsx` — Tab layout. Groceries tab header already has history icon; will add recipe import entry point.
- `components/ui/` — Avatar, Card, Badge, Button, FAB, IconContainer. New grocery components reuse these primitives.

### Existing Patterns to Reuse

- **Image capture → Storage upload**: `lib/avatar-upload.ts` — expo-image-picker → expo-image-manipulator → supabase.storage.upload(). Receipt photos use same flow to a `receipts` bucket.
- **Edge Function structure**: `Deno.serve`, `createClient` from `esm.sh`, `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from env, JSON responses.
- **Optimistic updates + realtime sync**: Grocery list handles INSERT/UPDATE/DELETE via realtime channel on `grocery_items`. Recipe-imported items flow through the same channel automatically.
- **RPC for atomic operations**: `complete_grocery_trip` demonstrates multi-step DB operations in a single function. Receipt-enhanced trip completion extends this.
- **Stack navigation with cream headers**: `headerStyle: { backgroundColor: colors.neutral.bg }`, `headerShadowVisible: false`, `headerTintColor: colors.neutral.text`.
- **Card/section UI**: Transparent outline cards (`border border-neutral-border`), SectionHeader component with count badges.
- **Barrel exports**: `components/groceries/index.ts` pattern for new components.

### Kroger API Integration Details

- **Auth**: OAuth2 client credentials — `POST https://api.kroger.com/v1/connect/oauth2/token` with base64-encoded `CLIENT_ID:CLIENT_SECRET`. Returns bearer token. Self-serve registration at developer.kroger.com.
- **Locations**: `GET https://api.kroger.com/v1/locations?filter.zipCode=xxxxx` — finds nearby Kroger-family stores. Returns `locationId`, name, address, chain (Kroger, Ralphs, etc.).
- **Products**: `GET https://api.kroger.com/v1/products?filter.term=xxx&filter.locationId=xxx` — returns products with `aisleLocations` (bay number, shelf description, side), `categories` (e.g., "Dairy"), `brand`, `description`, `items[].price.regular`, `items[].price.promo`, `items[].size`.
- **Key fields for our use**: `description` (product name), `categories[0]` (maps to our department), `aisleLocations[0]` (aisle info for sorting), `items[0].price.regular` (price), `items[0].size` (e.g., "1 gal").
- **Edge Function flow**: Client calls our Edge Function → Edge Function gets Kroger OAuth token (cache it, 30-min expiry) → proxies product search → returns simplified results to client.

### Build Order

1. **Receipt Scanning** — proves Gemini Vision end-to-end: receipt photo capture → upload to Storage → Edge Function reads image → calls Gemini Vision → returns structured items (name, qty, price) → populate complete-trip. Highest risk (OCR accuracy), highest value.

2. **Recipe Import (YouTube only)** — reuses Gemini pattern: paste YouTube URL → Edge Function fetches transcript via caption track API → Gemini extracts ingredients → bulk insert to grocery_items. Lower risk since Gemini pipeline is proven in slice 1.

3. **Category/Aisle Organization** — schema + frontend: add `category` column, define department taxonomy, update grocery list to group by category with collapsible sections. Items from recipe import can be auto-categorized; manual items get Gemini-suggested or manual category.

4. **Kroger Product Search** — Edge Function wraps Kroger OAuth + Products API. Client-side search UI with product results showing price, size, aisle. Adding a product sets `category` from Kroger's categories and `source = 'kroger'`.

### Verification Approach

- **Receipt scanning**: Photograph a real US grocery receipt. Verify Edge Function returns structured JSON with correctly extracted line items. Verify prices sum approximately to receipt total. Verify items populate complete-trip flow with per-item prices.
- **Recipe import**: Paste a YouTube cooking video URL. Verify ingredients extracted and shown for selection. Verify selected ingredients appear on grocery list with realtime sync.
- **Category organization**: Verify list displays grouped by department with section headers. Verify items can be recategorized. Verify new items default to a sensible category.
- **Kroger search**: Search "milk" with a location selected. Verify real products return with price, size, aisle. Verify adding a product creates a grocery_item with correct category.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Image capture + crop | `expo-image-picker` (already installed) | Same API used for profile photos |
| Image resize | `expo-image-manipulator` (already installed) | Resize receipt photo before upload |
| Storage upload | Supabase Storage (already configured) | RLS-protected buckets, identical to avatars pattern |
| Vision OCR + text extraction | Gemini REST API (`generativelanguage.googleapis.com`) | Single API for both receipt OCR and recipe extraction |
| YouTube transcript | YouTube internal caption API (plain `fetch`) | ~50 lines of Deno code, no library needed |
| Product catalog search | Kroger Public Products API | Self-serve, returns real prices, aisles, categories |

## Constraints

- **Deno runtime in Edge Functions** — no Node.js-only packages, no Python. All external calls via `fetch()`. Third-party imports via `esm.sh` or `deno.land/x`.
- **Gemini API key** — must be stored as Edge Function secret (`GEMINI_API_KEY`). User needs to verify API key works server-side from Google AI Studio (not tied to Vertex AI). Fallback: OpenAI Vision API.
- **Kroger API credentials** — `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` as Edge Function secrets. Self-serve sign-up at developer.kroger.com, but takes a few minutes for app approval.
- **Expo Go compatibility** — `expo-image-picker` works in Expo Go (already proven for profile photos). No `expo-camera` module needed.
- **Existing schema is additive only** — new columns must have defaults or be nullable. Cannot break existing queries or `complete_grocery_trip` RPC.
- **Receipt photos need higher resolution than avatars** — avatars are 512px max; receipts need ~1200px width for readable OCR of small text. Adjust manipulator resize accordingly.
- **Gemini rate limits** — free tier: 15 RPM for Flash, 2 RPM for Pro Vision. Receipt scanning is low-frequency. Edge Functions should handle 429 responses with user-friendly error.
- **Kroger API rate limits** — not explicitly documented for public tier, but standard REST API practices apply. Token caching (30-min expiry) reduces auth calls.
- **Design system adherence** — all new UI uses wintergreen palette, cream background, transparent-outline cards, existing typography classes. No emoji icons. Custom Nano Banana illustrations for empty states and feature branding where needed.

## Common Pitfalls

- **Gemini JSON response parsing** — `generateContent` returns `candidates[0].content.parts[0].text` which contains the model's text response. If prompted for JSON, the model sometimes wraps it in ```json fences. Always strip markdown code fences before `JSON.parse()`.
- **Receipt OCR abbreviations** — grocery receipts use cryptic abbreviations ("GV WHL MLK 1GL"). Prompt Gemini to expand abbreviations into human-readable names.
- **YouTube caption parsing** — `ytInitialPlayerResponse` is embedded in a `<script>` tag. YouTube changes page structure periodically. The caption track URL format (`/api/timedtext?...`) is more stable than the page parsing. Handle failures gracefully with clear user messaging.
- **Kroger OAuth token caching** — tokens expire after 30 minutes. Edge Functions are stateless (no persistent memory between invocations). Either re-auth each call (simple, adds ~200ms) or cache token in Supabase table with expiry (more complex, saves latency). Given low call frequency, re-auth each call is fine.
- **Batch insert realtime flood** — inserting 10+ items from a recipe triggers 10+ realtime events. Existing dedup logic handles this, but consider a single RPC that inserts all items atomically. The UI may show items appearing one-by-one which is actually a nice UX effect.
- **Category assignment accuracy** — Gemini auto-categorization won't be perfect. Always allow manual override. The category picker should be fast (tap to change, not a modal workflow).
- **Kroger location selection UX** — user needs to pick a nearby store before product search returns prices/aisles. This is a one-time setup step that should be persisted (save selected `locationId` to household settings or user preferences).

## Open Risks

- **Gemini API key provisioning** — unclear whether user's Gemini Pro subscription includes server-side API access or only Google AI Studio web interface. If AI Studio only, user needs to create a Google Cloud project and enable the Generative Language API, which may have different billing. Needs resolution before receipt scanning slice.
- **YouTube caption availability** — not all YouTube videos have captions/subtitles. Auto-generated captions exist for most English videos but quality varies. The Edge Function should detect missing captions and return a clear error rather than hallucinating ingredients.
- **Receipt OCR on thermal prints** — faded thermal receipts produce poor OCR. UI should always show extracted items for user review/correction before confirming. Never auto-commit receipt data without user approval.
- **Kroger product coverage by region** — Kroger family stores are concentrated in the Midwest, South, and West Coast. Users in New England or areas without Kroger stores won't benefit from product search. The feature should degrade gracefully (show a "no nearby stores" message, still allow manual item entry with categories).

## Nano Banana Illustration Prompts

The following illustrations would match the app's design language. These are suggestions for the user to generate via Nano Banana:

1. **Receipt scanning entry point** — "A minimal line-art illustration of a grocery receipt with a camera viewfinder overlay, wintergreen (#2D6A4F) accent color on cream (#F5F0EB) background, clean and modern, no text, app icon style"
2. **Recipe import entry point** — "A minimal line-art illustration of a cooking pot with a play button symbol, wintergreen (#2D6A4F) accent color on cream (#F5F0EB) background, clean and modern, no text, app icon style"
3. **Product search empty state** — "A minimal line-art illustration of a magnifying glass over grocery items (apple, milk carton, bread), wintergreen (#2D6A4F) accent color on cream (#F5F0EB) background, clean and modern, no text"
4. **Category section headers** — "A set of 10 minimal grocery department icons (produce/leaf, dairy/milk-drop, meat/drumstick, frozen/snowflake, bakery/bread-loaf, beverages/cup, snacks/cookie, pantry/jar, household/spray-bottle, other/bag), line-art style, wintergreen (#2D6A4F) on transparent background, consistent weight and size"
5. **Scanning in progress** — "A minimal line-art illustration of a receipt being scanned with light rays, wintergreen (#2D6A4F) accent color on cream (#F5F0EB) background, conveying processing/loading state"

## Candidate Requirements

These should be added to REQUIREMENTS.md during planning. The planner decides final scope.

### Receipt Scanning
- **GROC-01**: User can photograph a grocery receipt from the complete-trip screen
- **GROC-02**: Receipt photo is processed by Edge Function via Gemini Vision OCR
- **GROC-03**: Extracted line items (name, quantity, price) shown for review before confirming
- **GROC-04**: Receipt total auto-populates the trip amount field
- **GROC-05**: Per-item prices stored with trip for itemized cost visibility in history

### Recipe Import (YouTube)
- **GROC-06**: User can paste a YouTube recipe URL to import ingredients
- **GROC-07**: Edge Function extracts ingredients from YouTube transcript via Gemini
- **GROC-08**: Extracted ingredients shown for selection before adding to grocery list
- **GROC-09**: Imported items appear on all roommates' lists via existing realtime sync

### Category/Aisle Organization
- **GROC-10**: Grocery items have a category/department field
- **GROC-11**: Grocery list displays items grouped by department for efficient shopping
- **GROC-12**: Items from recipe import and Kroger search are auto-categorized
- **GROC-13**: Users can manually change an item's category

### Kroger Product Search
- **GROC-14**: User can search Kroger products when adding items to the list
- **GROC-15**: Search results show product name, brand, price, size, and aisle location
- **GROC-16**: Adding a Kroger product auto-assigns its category from Kroger's taxonomy
- **GROC-17**: User can select a nearby Kroger-family store for location-specific results

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Gemini API | `google-gemini/gemini-skills@gemini-api-dev` | available (5.2K installs) — recommended for Gemini REST API patterns |
| Supabase Edge Functions | `nice-wolf-studio/claude-code-supabase-skills@supabase-edge-functions` | available (132 installs) — low count, existing codebase patterns sufficient |

## Sources

- Kroger Products API returns `aisleLocations`, `categories`, `brand`, `description`, pricing via `items[].price.regular/promo` (source: [Kroger Product Search docs](https://developer.kroger.com/documentation/api-products/public/products/product-search))
- Kroger auth uses OAuth2 client credentials: base64-encoded `CLIENT_ID:CLIENT_SECRET` → `POST /v1/connect/oauth2/token` → bearer token (source: [Kroger Service to Service Auth](https://developer.kroger.com/documentation/public/security/service-to-service))
- Kroger developer portal is self-serve sign-up with app registration (source: [developer.kroger.com](https://developer.kroger.com))
- Walmart, Target, Albertsons, Publix do not offer public product search developer APIs — Walmart's is Marketplace sellers only, others have no public API
- Gemini `generateContent` REST API accepts inline image data as base64 at `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- YouTube caption tracks accessible via `timedtext` endpoint parsed from `ytInitialPlayerResponse` in watch page HTML
