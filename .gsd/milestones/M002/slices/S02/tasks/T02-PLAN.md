---
estimated_steps: 7
estimated_files: 1
---

# T02: Build recipe import screen with ingredient review and bulk insert

**Slice:** S02 — YouTube Recipe Import
**Milestone:** M002

## Description

Create the client-side recipe import screen at `app/(app)/groceries/import-recipe.tsx`. This screen has two input modes (YouTube URL / manual text paste), a loading phase that calls the `import-recipe` Edge Function, an error phase with retry and fallback guidance, and a review phase showing extracted ingredients with checkboxes for selection. "Add Selected" bulk-inserts chosen ingredients to `grocery_items` with `source: 'recipe'`, which flows through the existing realtime subscription to all household members.

## Steps

1. Create `app/(app)/groceries/import-recipe.tsx`. Import standard RN components (View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert), Ionicons, useRouter, supabase client, useAuth (for user/household), and color tokens. Define `ScreenPhase = 'input' | 'loading' | 'error' | 'review'` following scan-receipt pattern.

2. Implement input phase with two mode tabs:
   - A `mode` state: `'youtube' | 'text'`, default `'youtube'`.
   - Two tab buttons at the top: "YouTube Link" and "Paste Recipe" — styled as togglable pills/segments. Active tab uses `bg-brand text-white`, inactive uses `bg-white border-brand text-brand`.
   - YouTube mode: single-line `TextInput` with placeholder "Paste YouTube video URL", auto-capitalize none, keyboard type URL.
   - Text mode: multiline `TextInput` with placeholder "Paste or type the ingredient list...", max 5000 characters, show character count.
   - "Extract Ingredients" submit button below the input, wintergreen brand styling, disabled when input is empty.

3. Implement loading phase:
   - Show `ActivityIndicator` with brand color and "Extracting ingredients..." text.
   - Call `supabase.functions.invoke('import-recipe', { body: { mode, url } })` for YouTube mode or `{ body: { mode: 'text', text } }` for text mode.
   - Handle the response: `supabase.functions.invoke` returns `{ data, error }`. On error or if data contains an `error` field, transition to error phase. On success with ingredients array, transition to review phase.
   - Edge case: if `data.ingredients` is an empty array, show a specific "no recipe found" state (part of error phase) suggesting manual text mode.

4. Implement error phase:
   - Display error message (from Edge Function response or generic network error).
   - "Try Again" button → back to input phase with previous input preserved.
   - If the error came from YouTube mode, show hint: "You can also paste the ingredient list manually" with a button/link that switches to text mode.

5. Implement review phase:
   - Show recipe title at top (if present from API response).
   - Scrollable list of ingredients, each with a checkbox (checked by default), ingredient name, and quantity+unit display.
   - State: `ingredients` array with `selected: boolean` per item. Toggle selection on press.
   - "Select All" / "Deselect All" toggle link above the list.
   - Show count: "X of Y ingredients selected".
   - "Add Selected to List" button at bottom — disabled when 0 selected.

6. Implement bulk insert on "Add Selected":
   - Get `household_id` from auth context (same pattern as `groceries.tsx` `addItem`).
   - For each selected ingredient, format as `{ household_id, name: "${quantity} ${unit} ${name}".trim(), quantity: 1, created_by: user.id, source: 'recipe' }`. The name includes the full ingredient description (e.g., "2 cups flour") since the grocery list displays item names as free text.
   - Use `Promise.all` to insert all items in parallel via `supabase.from('grocery_items').insert({...}).select()`.
   - On success, show brief success feedback and `router.back()` to return to groceries tab.
   - On partial failure, alert user about failed items but still navigate back (successfully inserted items are already in the list via realtime).

7. Style the entire screen using existing patterns:
   - `bg-neutral-bg` background (cream).
   - `font-heading-semi` for headers, `font-sans` for body.
   - Brand wintergreen for primary actions, `text-neutral-text` for body text.
   - `rounded-xl border-2 border-brand` outline style for secondary actions.
   - Consistent spacing with `mx-4`, `mt-4`, `mb-2` etc. matching scan-receipt screen.

## Must-Haves

- [ ] Two input modes: YouTube URL and manual text paste
- [ ] Mode toggle tabs clearly indicate active mode
- [ ] YouTube URL input with URL keyboard type
- [ ] Text input is multiline with 5K character limit displayed
- [ ] Loading state shows spinner and descriptive text
- [ ] Error state shows message with retry and fallback guidance
- [ ] Empty ingredients handled as "no recipe found" with guidance
- [ ] Review phase shows all ingredients with checkboxes (default checked)
- [ ] Select all / deselect all toggle
- [ ] "Add Selected" inserts to `grocery_items` with `source: 'recipe'`
- [ ] Navigates back to groceries tab after successful add
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes with no new errors
- Screen renders in Expo Go when navigated to directly
- YouTube URL input → loading → review → add to list flow completes end-to-end
- Text paste input → loading → review → add to list flow completes end-to-end
- After adding, items appear in grocery list
- Mode toggle switches between YouTube and text inputs

## Inputs

- `supabase/functions/import-recipe/index.ts` — deployed Edge Function from T01 returning `{ title, ingredients: [{ name, quantity, unit }] }`
- `app/(app)/groceries/scan-receipt.tsx` — pattern reference for ScreenPhase type, conditional phase rendering, Supabase function invocation, error handling, screen layout
- `app/(app)/(tabs)/groceries.tsx` — pattern reference for `grocery_items` insert and auth context usage (`useAuth` for user.id, household.id)
- `lib/supabase.ts` — Supabase client import path
- `lib/auth.tsx` — `useAuth` hook providing `user` and `household`

## Expected Output

- `app/(app)/groceries/import-recipe.tsx` — complete recipe import screen with two-mode input, Edge Function invocation, ingredient review with checkboxes, and bulk insert to grocery_items, ~250-350 lines
