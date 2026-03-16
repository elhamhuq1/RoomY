# T03: 11-visual-foundation 03

**Slice:** S11 — **Milestone:** M001

## Description

Update all system chrome (tab bar, headers, status bar, splash screen) to match the cream background with wintergreen accents, then verify the entire phase visually on device.

Purpose: System chrome is the "frame" around the app content. Even if all content uses cream and wintergreen, a mismatched tab bar, header, or status bar creates a visible seam. This plan ensures the entire visual experience is seamless from splash to every screen.

Output: Unified cream system chrome, dark status bar content, wintergreen tab active states, visual verification checkpoint.

## Must-Haves

- [x] "Tab bar background is cream (#F5F0EB) with no visible seam against content"
- [x] "Active tab icon and label are wintergreen (#2D6A4F), inactive tabs are warm gray"
- [x] "All screen headers have cream background with dark text"
- [x] "Status bar shows dark content (dark text/icons) on cream background"
- [x] "Splash screen background matches cream (#F5F0EB) for seamless app load"
- [x] "No visible color seam between content area and system chrome on any screen"

## Files

- `app/_layout.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `app.json`
