---
status: verifying
trigger: "On the expenses tab screen, when there are more than ~7 items in the history list, the user cannot scroll down to see all items. The scroll gets stuck or bounces back."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - ScrollView inside wrapper View with NativeWind className="flex-1" causes improper height constraint; ScrollView grows to content height instead of being bounded by parent
test: Compare with all other working screens (all use ScrollView as root element) and apply fix
expecting: Removing wrapper View and restructuring to match working pattern will fix scroll
next_action: Apply fix - restructure to eliminate wrapper View, keep FAB overlay working

## Symptoms

expected: User should be able to freely scroll through all expense history items on the Expenses tab
actual: Scroll gets stuck or bounces back when history has more than ~7 items, preventing access to older entries
errors: No error messages
reproduction: Add enough expenses/settlements to have more than 7 items in history on the Expenses tab, then try to scroll down
started: Noticed during UAT testing of Phase 2 expense splitting features

## Eliminated

- hypothesis: Gesture conflict between Pressable components and ScrollView
  evidence: Pressable inside ScrollView is standard RN pattern; other screens use same Pressable-in-ScrollView pattern without issues
  timestamp: 2026-03-11T00:05:00Z

- hypothesis: NativeWind contentContainerClassName applying incorrect styles (flex properties)
  evidence: contentContainerClassName only has padding classes (px-4 pt-4 pb-24); cssInterop maps contentContainerClassName -> contentContainerStyle correctly; no flex classes in content container
  timestamp: 2026-03-11T00:08:00Z

- hypothesis: RefreshControl interfering with scroll gestures
  evidence: RefreshControl only captures pull-down-from-top gesture; upward scrolling to see content below should be unaffected; other screens use same RefreshControl pattern
  timestamp: 2026-03-11T00:10:00Z

- hypothesis: FAB Pressable (absolutely positioned sibling) affecting flex layout
  evidence: absolute positioning takes element out of flex flow; FAB is small (56x56px) in bottom-right corner; wouldn't affect layout calculation
  timestamp: 2026-03-11T00:12:00Z

## Evidence

- timestamp: 2026-03-11T00:03:00Z
  checked: expenses.tsx line 274-545 - full component render tree
  found: ScrollView is wrapped in <View className="flex-1 bg-surface-50"> with FAB as sibling. This is the ONLY screen in the entire app that uses this View>ScrollView wrapper pattern
  implication: All other screens (Home tab, settings, add expense, etc) use ScrollView as the root element and work fine

- timestamp: 2026-03-11T00:04:00Z
  checked: User symptom "can scroll at very bottom, tap status bar to scroll to top"
  found: iOS scroll-to-top via status bar tap WORKS, meaning content IS longer than viewport
  implication: This is NOT a content-too-short issue; the ScrollView has scrollable content but scroll gestures aren't working properly

- timestamp: 2026-03-11T00:06:00Z
  checked: NativeWind react-native-css-interop components.ts - how ScrollView className is mapped
  found: cssInterop(ScrollView, { className: "style", contentContainerClassName: "contentContainerStyle" }) - standard mapping
  implication: className="flex-1" should become style={{ flex: 1 }} on the ScrollView

- timestamp: 2026-03-11T00:09:00Z
  checked: All other screens in app for scroll patterns
  found: Every working screen uses ScrollView as root element (not wrapped in View). Home tab index.tsx, settings screens, add/edit expense screens - all root ScrollView
  implication: The wrapper View pattern is the distinguishing factor between the broken expenses tab and all working screens

- timestamp: 2026-03-11T00:11:00Z
  checked: NativeWind GitHub issues for ScrollView + flex-1 + className
  found: Multiple known issues with NativeWind v4 and ScrollView className handling (issues #700, #1018, #1087). className-based styles can behave differently than inline style props on ScrollView
  implication: NativeWind's cssInterop wrapping of ScrollView may not properly propagate flex:1 when ScrollView is a child (not root), causing ScrollView to grow unbounded to fit content

- timestamp: 2026-03-11T00:14:00Z
  checked: react-native-css-interop render-component.tsx
  found: cssInterop creates ForwardRef wrapper around ScrollView. The wrapper calls createElement(baseComponent, props) with processed styles. No extra View wrapper is added.
  implication: Style processing is correct in principle, but the indirection through ForwardRef + cssInterop may have edge cases with ScrollView's flex behavior when nested in a flex container

## Resolution

root_cause: The expenses tab is the only screen that wraps ScrollView inside a <View className="flex-1"> container (needed for the FAB overlay). NativeWind's cssInterop processing of className="flex-1" on ScrollView, combined with the wrapper View, causes the ScrollView to not properly constrain its height to the available viewport space. The ScrollView grows to match its content height, making scroll gestures bounce back because the content doesn't exceed the container from the ScrollView's perspective. All other screens in the app use ScrollView as the root element (no wrapper) and work correctly.
fix: Replaced NativeWind className="flex-1" and contentContainerClassName="px-4 pt-4 pb-24" on ScrollView with inline style={{ flex: 1 }} and contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}. This bypasses NativeWind's cssInterop wrapper for the ScrollView's critical layout properties, ensuring React Native's native flex system directly constrains the ScrollView height.
verification: TypeScript compilation passes. Needs manual verification on device -- user should scroll the history list with 7+ items.
files_changed: [app/(app)/(tabs)/expenses.tsx]
