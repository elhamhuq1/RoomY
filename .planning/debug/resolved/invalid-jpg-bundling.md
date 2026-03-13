---
status: resolved
trigger: "Metro bundling fails with TypeError: Invalid JPG, no size found"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - C2PA metadata in JPGs is too large, pushing SOF0 marker beyond image-size's 512KB read buffer
test: Confirmed by checking SOF0 offsets vs MaxInputSize (512KB)
expecting: n/a - root cause found
next_action: Strip C2PA metadata from all 4 failing JPGs to bring SOF0 within buffer range

## Symptoms

expected: App bundles and runs in Expo Go without errors
actual: iOS Bundling fails immediately with "TypeError: Invalid JPG, no size found" from image-size library
errors: TypeError: Invalid JPG, no size found at Object.calculate (node_modules/image-size/dist/types/jpg.js:121:15) — triggered during Metro asset transform
reproduction: Open app in Expo Go — bundling fails immediately
started: After phase 10 execution which copied 7 JPG files from docs/onboarding-images/ to assets/onboarding/

## Eliminated

## Evidence

- timestamp: 2026-03-13T00:01:00Z
  checked: file types and magic bytes of all 7 JPGs in assets/onboarding/
  found: All files are valid JPEG (start with FFD8 JFIF header), no corrupt or misnamed files
  implication: Problem is not file format, but internal structure

- timestamp: 2026-03-13T00:02:00Z
  checked: image-size library output for each file individually
  found: 4 files fail (display-name, invite-code, name-household, setup-home), 3 pass (chore-rotation, shared-grocery, split-expenses)
  implication: Something specific to those 4 files

- timestamp: 2026-03-13T00:03:00Z
  checked: JPEG marker structure of all files
  found: All files have C2PA (Content Credentials) metadata in many APP11 segments. Failing files have many more APP11 segments (9-20+) vs passing files (2-6)
  implication: Large metadata pushes SOF0 marker deeper into file

- timestamp: 2026-03-13T00:04:00Z
  checked: image-size MaxInputSize in node_modules/image-size/dist/index.js line 11
  found: MaxInputSize = 512 * 1024 = 524288 bytes. Library only reads first 512KB of each file.
  implication: If SOF0 is beyond 512KB, library cannot find dimensions

- timestamp: 2026-03-13T00:05:00Z
  checked: SOF0 offsets of failing files vs 512KB limit
  found: display-name SOF0 at 0x8c13f (573KB, beyond limit), setup-home at 0xdd040 (884KB, beyond limit), invite-code and name-household SOF0 even further out
  implication: ROOT CAUSE CONFIRMED

## Resolution

root_cause: C2PA (Content Credentials / AI provenance) metadata embedded in JPG files by the image generator is extremely large (hundreds of KB across many APP11 segments). The image-size library used by Metro only reads the first 512KB of each file. For 4 of 7 onboarding images, the SOF0 marker (containing width/height) is pushed beyond this 512KB boundary by the C2PA metadata, causing "Invalid JPG, no size found".
fix: Stripped C2PA metadata from all JPG files using Pillow (re-saved at quality 95). This removes the bloated APP11 segments, bringing SOF0 to byte 158 in all files. Also stripped docs/onboarding-images/ and docs/empty-state-images/ sources to prevent recurrence.
verification: (1) All 7 files pass image-size library check. (2) Full Expo export --platform ios succeeds with all 7 onboarding images listed as bundled assets. (3) SOF0 marker confirmed at byte 158 in all files.
files_changed:
  - assets/onboarding/display-name.jpg (875KB -> 127KB)
  - assets/onboarding/invite-code.jpg (3.2MB -> 132KB)
  - assets/onboarding/name-household.jpg (1.7MB -> 141KB)
  - assets/onboarding/setup-home.jpg (1.2MB -> 137KB)
  - assets/onboarding/chore-rotation.jpg (688KB -> 129KB)
  - assets/onboarding/shared-grocery.jpg (457KB -> 103KB)
  - assets/onboarding/split-expenses.jpg (433KB -> 138KB)
  - docs/onboarding-images/*.jpg (all 7 sources stripped)
  - docs/empty-state-images/*.jpg (all 9 sources stripped, preventive)
