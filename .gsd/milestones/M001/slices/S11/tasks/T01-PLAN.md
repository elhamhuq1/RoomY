# T01: 11-visual-foundation 01

**Slice:** S11 — **Milestone:** M001

## Description

Update the two token source-of-truth files (colors.ts and tailwind.config.js) to the wintergreen palette, add the shared AVATAR_COLORS export, and update the Card and Avatar components to match the new visual identity.

Purpose: This is the foundation for the entire visual migration. ~90% of the app's color usage is via token references (NativeWind classes or colors.* imports), so updating these 2 token files propagates changes app-wide. The Card and Avatar components are shared UI primitives that cascade to every screen.

Output: Updated token files, redesigned Card component, earth-tone Avatar gradients, exported AVATAR_COLORS constant.

## Must-Haves

- [x] "Brand color tokens resolve to wintergreen (#2D6A4F) instead of emerald (#10B981)"
- [x] "Background token resolves to cream (#F5F0EB) instead of slate (#F8FAFC)"
- [x] "Card component renders with transparent background, warm gray outline, and no shadow"
- [x] "Avatar gradient pairs use earth-tone wintergreen palette"
- [x] "AVATAR_COLORS is exported from lib/theme/colors.ts as a shared constant"

## Files

- `lib/theme/colors.ts`
- `tailwind.config.js`
- `components/ui/Card.tsx`
- `components/ui/Avatar.tsx`
