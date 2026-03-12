---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - assets/icon.png
  - assets/splash-icon.png
  - assets/favicon.png
  - assets/android-icon-foreground.png
  - assets/android-icon-background.png
  - assets/android-icon-monochrome.png
autonomous: true
requirements: []

must_haves:
  truths:
    - "App icon shows the RoomY green house/Y logo on all platforms"
    - "Splash screen displays the RoomY logo centered on the cream background"
    - "Web favicon shows a recognizable small version of the logo"
    - "Android adaptive icon renders correctly with foreground/background separation"
  artifacts:
    - path: "assets/icon.png"
      provides: "Main app icon (iOS + fallback)"
      contains: "1024x1024 PNG"
    - path: "assets/splash-icon.png"
      provides: "Splash screen logo"
      contains: "1024x1024 PNG"
    - path: "assets/favicon.png"
      provides: "Web favicon"
      contains: "48x48 PNG"
    - path: "assets/android-icon-foreground.png"
      provides: "Android adaptive icon foreground layer"
      contains: "512x512 PNG with transparency"
    - path: "assets/android-icon-background.png"
      provides: "Android adaptive icon background layer"
      contains: "512x512 PNG solid color"
    - path: "assets/android-icon-monochrome.png"
      provides: "Android monochrome icon"
      contains: "432x432 PNG single channel"
  key_links:
    - from: "app.json"
      to: "assets/*.png"
      via: "icon/splash/adaptiveIcon config paths"
      pattern: "./assets/"
---

<objective>
Replace all default Expo placeholder icons with the RoomY logo (docs/RoomY-logo.jpg).

Purpose: The app currently shows the default blue Expo chevron icon. Replace with the actual RoomY brand identity (green house/Y mark) for icon, splash screen, favicon, and Android adaptive icon variants.

Output: 6 PNG asset files generated from the source logo at correct dimensions.
</objective>

<execution_context>
@/home/elham/.claude/get-shit-done/workflows/execute-plan.md
@/home/elham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/RoomY-logo.jpg (source logo - 1024x1024 JPG, green house/Y icon on off-white background)
@app.json (references all 6 asset paths, splash backgroundColor: #fefdfb)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Generate all icon and splash PNG assets from source logo</name>
  <files>
    assets/icon.png
    assets/splash-icon.png
    assets/favicon.png
    assets/android-icon-foreground.png
    assets/android-icon-background.png
    assets/android-icon-monochrome.png
  </files>
  <action>
Use ImageMagick (available as `convert` on this system) to generate all 6 PNG assets from `docs/RoomY-logo.jpg`. The source logo is 1024x1024 with a green house/Y icon on an off-white/cream background.

**icon.png** (1024x1024 - iOS app icon and general fallback):
- Convert the JPG directly to PNG at 1024x1024. No transparency needed (iOS icons must not have transparency).
- Command: `convert docs/RoomY-logo.jpg -resize 1024x1024 assets/icon.png`

**splash-icon.png** (1024x1024 - splash screen centered icon):
- Same as icon.png -- the splash screen uses `resizeMode: "contain"` with `backgroundColor: "#fefdfb"` which closely matches the logo's off-white background, so the full logo works here.
- Command: `convert docs/RoomY-logo.jpg -resize 1024x1024 assets/splash-icon.png`

**favicon.png** (48x48 - web browser favicon):
- Resize to 48x48 with high-quality downscaling.
- Command: `convert docs/RoomY-logo.jpg -resize 48x48 -quality 100 assets/favicon.png`

**android-icon-foreground.png** (512x512 - adaptive icon foreground with transparency):
- Extract ONLY the green house/Y icon mark, remove the background to make it transparent.
- The logo background is an off-white/cream color (~#f0efe9 to #fefdfb range). Use fuzz-based flood fill to remove it.
- Steps:
  1. Resize source to 512x512
  2. Make the off-white background transparent using `-fuzz 12% -transparent` targeting the corner color
  3. The icon mark should be inset slightly (Android safe zone is the inner 66% circle of the adaptive icon). The existing logo already has good padding so this should work as-is.
- Command: `convert docs/RoomY-logo.jpg -resize 512x512 -fuzz 12% -transparent "#f0efe9" assets/android-icon-foreground.png`
- IMPORTANT: After generating, visually verify by checking the file. If the fuzz approach doesn't cleanly remove the background, try an alternative: use `-alpha set -channel RGBA -fill none -fuzz 15% -floodfill +0+0 "#f0efe9"` to flood-fill only from the corners/edges rather than replacing all similar pixels globally.

**android-icon-background.png** (512x512 - adaptive icon background solid fill):
- Create a solid 512x512 image with the app's background color `#fefdfb` (matching the splash backgroundColor from app.json).
- Command: `convert -size 512x512 xc:"#fefdfb" assets/android-icon-background.png`

**android-icon-monochrome.png** (432x432 - monochrome/silhouette version):
- Create a single-color silhouette of the icon mark (white icon on transparent background, or black silhouette -- Android uses this as a mask).
- Steps:
  1. Start from the foreground image (after background removal)
  2. Resize to 432x432
  3. Convert all non-transparent pixels to white (this creates the monochrome mask)
- Command: First generate foreground, then: `convert assets/android-icon-foreground.png -resize 432x432 -alpha extract -threshold 50% -negate assets/android-icon-monochrome.png`
- Alternative approach if needed: `convert assets/android-icon-foreground.png -resize 432x432 -channel RGB -fill white -opaque "rgb(0,0,0)-rgb(255,255,255)" assets/android-icon-monochrome.png`

After generating ALL files, verify:
1. `identify assets/icon.png` shows 1024x1024 PNG
2. `identify assets/splash-icon.png` shows 1024x1024 PNG
3. `identify assets/favicon.png` shows 48x48 PNG
4. `identify assets/android-icon-foreground.png` shows 512x512 PNG with alpha channel
5. `identify assets/android-icon-background.png` shows 512x512 PNG
6. `identify assets/android-icon-monochrome.png` shows 432x432 PNG

If the android-icon-foreground.png background removal looks wrong (green pixels removed or artifacts), adjust the fuzz percentage (try 8% for less aggressive, 18% for more aggressive) or switch to floodfill approach from edges only.
  </action>
  <verify>
    <automated>cd /home/elham/projects/sb-proj && identify assets/icon.png | grep "1024x1024" && identify assets/splash-icon.png | grep "1024x1024" && identify assets/favicon.png | grep "48x48" && identify assets/android-icon-foreground.png | grep "512x512" && identify assets/android-icon-background.png | grep "512x512" && identify assets/android-icon-monochrome.png | grep "432x432" && echo "ALL ASSETS VALID"</automated>
    <manual>Open each asset file to visually confirm the RoomY green house/Y logo appears correctly, especially that android-icon-foreground.png has a transparent background with only the green icon visible.</manual>
  </verify>
  <done>All 6 PNG assets exist at correct dimensions, contain the RoomY logo (not the default blue Expo icon), and app.json requires zero changes since file paths are unchanged.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Generated all 6 app icon and splash screen assets from the RoomY logo. Replaced the default blue Expo placeholder icons with the green house/Y brand mark.</what-built>
  <how-to-verify>
    1. Open `assets/icon.png` -- should show the full RoomY logo (green house/Y on cream background), 1024x1024
    2. Open `assets/splash-icon.png` -- same as icon, used for splash screen
    3. Open `assets/favicon.png` -- small 48x48 version, recognizable green mark
    4. Open `assets/android-icon-foreground.png` -- green house/Y icon ONLY on transparent background (no cream/white fill)
    5. Open `assets/android-icon-background.png` -- solid cream/off-white (#fefdfb) fill
    6. Open `assets/android-icon-monochrome.png` -- white silhouette of the house/Y mark on transparent background
    7. Run `npx expo start` and check the app icon in Expo Go -- it should show the RoomY logo instead of the blue Expo chevron
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues with the generated assets</resume-signal>
</task>

</tasks>

<verification>
- All 6 asset PNGs exist at their expected dimensions
- `identify` confirms PNG format for each file
- app.json is unchanged (same file paths still valid)
- No new dependencies added
</verification>

<success_criteria>
- The RoomY green house/Y logo replaces the default blue Expo icon in all 6 asset files
- Assets are correctly sized per Expo's requirements (1024x1024 icon, 512x512 adaptive icon layers, 48x48 favicon, 432x432 monochrome)
- Android adaptive icon has proper foreground/background separation (transparent foreground, solid background)
- App loads in Expo Go showing the branded icon
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-roomy-logo-as-app-icon-and-splash-sc/1-SUMMARY.md`
</output>
