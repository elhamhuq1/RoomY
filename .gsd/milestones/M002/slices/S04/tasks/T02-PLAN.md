---
estimated_steps: 7
estimated_files: 3
---

# T02: Build product search screen with store selection and grocery list integration

**Slice:** S04 — Kroger Product Search
**Milestone:** M002

## Description

Create the `search-products` Stack screen that ties together store selection, product search, and add-to-list. This screen is the entire user-facing feature: user selects a nearby store (one-time, persisted), searches products, sees results with price/size/aisle, and taps to add items to the grocery list with auto-assigned category. Also register the screen in the app layout and add the third action button on the grocery tab.

## Steps

1. Register `groceries/search-products` in `app/(app)/_layout.tsx`:
   - Add a new `<Stack.Screen>` entry after the existing groceries screens
   - Same header style pattern: `headerShown: true`, `title: "Search Products"`, `headerBackTitle: "Groceries"`, `headerTintColor: colors.neutral.text`, `headerStyle: { backgroundColor: colors.neutral.bg }`, `headerShadowVisible: false`

2. Add third action button in `app/(app)/(tabs)/groceries.tsx`:
   - In the action buttons `<View>` (around line 476), add a third `<Pressable>` matching the existing pattern
   - Icon: `search-outline` from Ionicons (or `cart-outline`)
   - Label: "Search Products"
   - Navigation: `router.push('/(app)/groceries/search-products')`
   - The three buttons should fit in a row — may need to reduce padding or font size slightly for 3 buttons. Use `flex-1` on all three.

3. Create `app/(app)/groceries/search-products.tsx` with these sections:

   **State and data:**
   - Fetch household settings on mount to check for existing `kroger_location_id` / `kroger_location_name`
   - States: `storeId`, `storeName`, `zipCode`, `stores` (search results), `searchTerm`, `products` (search results), `loading` states for store search and product search, `error`
   - Use `useSession()` for auth, `supabase` client for API calls and DB updates

   **Store selection section (shown when no store selected):**
   - Text input for zip code (5-digit, numeric keyboard)
   - "Find Stores" button that calls the `search-stores` Edge Function
   - List of store results: each shows `name` (e.g. "Kroger"), `chain`, and address line
   - Tapping a store: update `household_settings` with `kroger_location_id` and `kroger_location_name`, then set local state
   - Loading spinner while fetching stores

   **Store header (shown when store is selected):**
   - Display selected store name with a "Change Store" text button
   - "Change Store" clears the store and shows the zip input again

   **Product search section (shown when store is selected):**
   - Text input with search icon, placeholder "Search products..."
   - Debounced search (300ms) — use a `useEffect` with timeout cleanup on `searchTerm` changes
   - Call `search-products` Edge Function with `{ term: searchTerm, locationId: storeId }`
   - Results in a `ScrollView` — each row shows:
     - Product name (bold) and brand (gray, smaller)
     - Price: `$X.XX` with strikethrough + promo price if `promoPrice` exists and is less than `price`
     - Size (e.g. "1 gal")
     - Aisle info (e.g. "Aisle 7 - Dairy") or "Aisle N/A" if missing
     - Department badge (small pill, matching the category picker style)
     - "Add" button (Ionicons `add-circle-outline`) on the right
   - Loading spinner while fetching products
   - Empty state: "No products found" when search returns empty
   - Error state: show error message with retry

   **Add to list:**
   - When user taps "Add" on a product row:
     - Insert into `grocery_items`: `name` = product name + brand (e.g. "Kroger 2% Milk"), `quantity` = 1, `household_id` from session, `added_by` from session user, `source` = 'kroger', `category` = product's `department` field
     - Optimistic UI: show brief "Added!" confirmation (swap the add button to a checkmark briefly)
     - If insert fails, show error toast/alert

   **Design system compliance:**
   - Cream (#F5F0EB) background via `bg-cream`
   - Wintergreen (#2D6A4F) for action buttons and accents
   - Transparent outline cards for store results and product results
   - Consistent with existing grocery screens

4. Handle edge cases:
   - No stores found for zip code → "No Kroger stores found near this zip code" message
   - Kroger API error → show error with phase info and retry option
   - Very long product names → truncate with `numberOfLines={1}`
   - Products without price data → show "Price unavailable"
   - Products without aisle data → show "Aisle N/A"

5. Run `npx tsc --noEmit` to verify everything compiles

## Must-Haves

- [ ] Screen registered in `_layout.tsx` with standard cream header
- [ ] Third action button "Search Products" visible on grocery tab alongside existing two
- [ ] Store selection: zip input → store list → tap to select → persisted to `household_settings`
- [ ] "Change Store" option to re-select
- [ ] Product search: debounced text input → results from Edge Function
- [ ] Results show: product name, brand, price (with promo), size, aisle, department
- [ ] Tap to add inserts `grocery_item` with `source: 'kroger'` and correct `category`
- [ ] Loading, error, and empty states handled
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes
- Visual: "Search Products" button appears on grocery tab as third button in row
- Visual: tapping navigates to search screen
- Visual: entering zip code and tapping "Find Stores" shows Kroger store results
- Visual: selecting a store persists (verify in Supabase: `household_settings.kroger_location_id` is set)
- Visual: searching a product shows results with price/size/aisle
- Visual: tapping "Add" on a product inserts item into grocery list under correct department section

## Inputs

- `supabase/functions/search-stores/index.ts` — deployed Edge Function returning `{ stores: [{ locationId, name, chain, address }] }` (from T01)
- `supabase/functions/search-products/index.ts` — deployed Edge Function returning `{ products: [{ productId, name, brand, price, promoPrice, size, aisle, department }] }` (from T01)
- `lib/types/database.ts` — `HouseholdSettings` with `kroger_location_id` and `kroger_location_name` fields (from T01)
- `app/(app)/_layout.tsx` — existing Stack screen registration pattern (lines 95-145 show groceries/* screens)
- `app/(app)/(tabs)/groceries.tsx` — existing action buttons area (lines 476-496), uses `Ionicons`, `colors`, `router.push`
- `lib/constants/grocery-departments.ts` — DEPARTMENTS array for department badge display
- `lib/auth-context.ts` — `useSession()` hook for auth/user/household context
- `lib/supabase.ts` — `supabase` client for Edge Function invocation and DB operations

## Expected Output

- `app/(app)/groceries/search-products.tsx` — complete product search screen with store selection and add-to-list
- `app/(app)/_layout.tsx` — modified with new Stack.Screen registration
- `app/(app)/(tabs)/groceries.tsx` — modified with third action button
