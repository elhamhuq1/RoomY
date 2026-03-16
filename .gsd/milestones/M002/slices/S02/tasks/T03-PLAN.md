---
estimated_steps: 4
estimated_files: 2
---

# T03: Wire import-recipe route and refactor groceries action buttons

**Slice:** S02 — YouTube Recipe Import
**Milestone:** M002

## Description

Register the import-recipe screen in the app navigation and refactor the groceries tab to show "Scan Receipt" and "Shop by Recipe" as a paired action button section. This replaces the standalone "Scan Receipt" button with a clean horizontal row of two equally-sized outline buttons.

## Steps

1. In `app/(app)/_layout.tsx`, add a `Stack.Screen` entry for `groceries/import-recipe` immediately after the existing `groceries/scan-receipt` entry. Use the same cream header pattern:
   ```
   <Stack.Screen
     name="groceries/import-recipe"
     options={{
       headerShown: true,
       title: "Shop by Recipe",
       headerBackTitle: "Groceries",
       headerTintColor: colors.neutral.text,
       headerStyle: { backgroundColor: colors.neutral.bg },
       headerShadowVisible: false,
     }}
   />
   ```

2. In `app/(app)/(tabs)/groceries.tsx`, locate the `{/* Scan Receipt button */}` section (the `<View className="mx-4 mt-2 mb-1">` containing the single Scan Receipt Pressable). Replace it with a horizontal row of two buttons:
   ```jsx
   {/* Action buttons */}
   <View className="mx-4 mt-2 mb-1 flex-row gap-2">
     <Pressable
       className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-brand bg-white py-2.5 active:bg-brand-light"
       onPress={() => router.push('/(app)/groceries/scan-receipt')}
     >
       <Ionicons name="camera-outline" size={18} color={colors.brand.DEFAULT} />
       <Text className="ml-1.5 text-sm font-heading-semi text-brand">
         Scan Receipt
       </Text>
     </Pressable>
     <Pressable
       className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-brand bg-white py-2.5 active:bg-brand-light"
       onPress={() => router.push('/(app)/groceries/import-recipe')}
     >
       <Ionicons name="restaurant-outline" size={18} color={colors.brand.DEFAULT} />
       <Text className="ml-1.5 text-sm font-heading-semi text-brand">
         Shop by Recipe
       </Text>
     </Pressable>
   </View>
   ```

3. Verify that the `router` import and `colors` import already exist in `groceries.tsx` (they do — used by the existing Scan Receipt button). No new imports needed.

4. Run `npx tsc --noEmit` to confirm no type errors. Verify in Expo Go that both buttons render side-by-side on the groceries tab with equal width, and each navigates to the correct screen.

## Must-Haves

- [ ] `groceries/import-recipe` route registered in `_layout.tsx` with cream header
- [ ] "Shop by Recipe" button added to groceries tab alongside "Scan Receipt"
- [ ] Both buttons are equally-sized in a horizontal row
- [ ] Both buttons use the existing outline style (border-brand, bg-white)
- [ ] "Scan Receipt" still navigates to scan-receipt screen (no regression)
- [ ] "Shop by Recipe" navigates to import-recipe screen
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes
- Both buttons visible on groceries tab in Expo Go
- Tapping "Scan Receipt" opens the scan receipt screen
- Tapping "Shop by Recipe" opens the import recipe screen
- Header shows "Shop by Recipe" title with "Groceries" back button

## Inputs

- `app/(app)/_layout.tsx` — existing layout with `groceries/scan-receipt` route pattern to follow
- `app/(app)/(tabs)/groceries.tsx` — existing standalone "Scan Receipt" button at ~line 427 to refactor into button pair
- `app/(app)/groceries/import-recipe.tsx` — the screen created in T02 that this route points to

## Expected Output

- `app/(app)/_layout.tsx` — one new `Stack.Screen` entry added for `groceries/import-recipe`
- `app/(app)/(tabs)/groceries.tsx` — standalone Scan Receipt button replaced with two-button action row

## Observability Impact

- **No new runtime signals.** This task is pure navigation wiring and UI layout — no async flows, API calls, or state machines.
- **Inspection:** Both buttons can be verified visually on the groceries tab. The route registration can be confirmed by navigating to `/(app)/groceries/import-recipe` and seeing the "Shop by Recipe" header with "Groceries" back button.
- **Failure visibility:** If the route is missing, Expo Router will throw a navigation error visible in the console. If the import-recipe screen file doesn't exist, the route will 404 at runtime.
