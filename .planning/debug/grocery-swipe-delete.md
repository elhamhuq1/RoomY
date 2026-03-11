---
status: diagnosed
trigger: "Swipe-to-delete on grocery list items auto-deletes too quickly, user can't see/tap delete button. Also not discoverable."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: onSwipeableOpen fires delete immediately after the swipe animation completes (snap-open), so the item vanishes before the user can interact with the revealed delete button. Plus, no visual hint tells users swiping is possible.
test: Code review of ReanimatedSwipeable configuration and RightSwipeAction component
expecting: Confirm that the callback + threshold combo causes auto-delete, and no hint UI exists
next_action: Return diagnosis (find_root_cause_only mode)

## Symptoms

expected: User swipes left, sees a red "Delete" button, taps it to confirm deletion
actual: Item deletes almost immediately on swipe — user never gets a chance to see or deliberately tap the delete button. Additionally, there is zero visual indication that items are swipeable.
errors: none (functional bug, not a crash)
reproduction: Swipe any grocery item to the left
started: Since feature was implemented

## Eliminated

(none needed — root cause identified on first hypothesis)

## Evidence

- timestamp: 2026-03-11T00:00:01Z
  checked: ReanimatedSwipeable props on lines 372-377 of groceries.tsx
  found: |
    Configuration is:
      renderRightActions={RightSwipeAction}
      onSwipeableOpen={() => deleteItem(item.id)}
      rightThreshold={80}
    No overshootRight prop set (defaults to true).
    No friction prop set (defaults to 1).
  implication: |
    onSwipeableOpen fires when the spring animation finishes snapping the row open.
    With overshootRight=true (default) and friction=1 (default), a moderately fast swipe
    overshoots the action panel width and the row snaps fully open almost instantly.
    The moment it snaps open, onSwipeableOpen fires and deleteItem() runs — the item
    is removed from state before the user can even process what happened.

- timestamp: 2026-03-11T00:00:02Z
  checked: RightSwipeAction component (lines 66-72)
  found: |
    function RightSwipeAction() {
      return (
        <View className="items-center justify-center bg-red-500 px-6">
          <Ionicons name="trash" size={22} color="#fff" />
        </View>
      );
    }
    - No onPress handler on the action itself — it's purely decorative.
    - No fixed width — its width is determined solely by px-6 padding + icon size (~70px).
    - No text label ("Delete") — just an icon.
  implication: |
    The delete action panel is not tappable. The ONLY delete mechanism is the
    onSwipeableOpen callback, which means deletion is exclusively triggered by the
    swipe completing its open animation — not by a deliberate user tap.
    This is the core design flaw.

- timestamp: 2026-03-11T00:00:03Z
  checked: rightThreshold value (80) vs action panel width
  found: |
    rightThreshold=80 means: if the user drags >= 80px to the left, the row snaps open
    on release. The action panel is ~70px wide (24px icon + 48px padding). So the threshold
    (80px) is LARGER than the panel width. Combined with DRAG_TOSS=0.05 in the library
    (which adds velocity * 0.05 to the translation), even a moderate-speed swipe will
    exceed 80px effective distance, causing the row to snap fully open.
  implication: |
    The threshold is close enough to the panel width that most intentional swipes will
    trigger it. Once triggered, the row snaps open and onSwipeableOpen fires immediately
    after the spring animation completes (~200-300ms), deleting the item.

- timestamp: 2026-03-11T00:00:04Z
  checked: ReanimatedSwipeable source — handleRelease (lines 416-459) and animateRow (lines 194-266)
  found: |
    handleRelease computes: translationX = (userDrag + DRAG_TOSS * velocityX) / friction
    If translationX < -rightThresholdProp, toValue = -rightWidth.value (snap open).
    animateRow uses withSpring to animate, then on completion calls dispatchEndEvents
    which fires onSwipeableOpen.

    onSwipeableWillOpen fires BEFORE the animation (at line 251 via dispatchImmediateEvents).
    onSwipeableOpen fires AFTER the animation completes (at line 234 via isFinished callback).
  implication: |
    Using onSwipeableOpen for deletion means the delete happens after animation completes.
    But the animation is very fast (spring config: mass=2, damping=1000, stiffness=700,
    overshootClamping=true) — this is a very stiff, heavily-damped spring that settles
    almost instantly. The user sees the row slide open and the item immediately vanishes.

    If onSwipeableWillOpen were used instead, it would be WORSE — deletion before animation.

- timestamp: 2026-03-11T00:00:05Z
  checked: Entire groceries.tsx for any swipe hint / discoverability UI
  found: No visual affordance whatsoever — no swipe hint animation, no instructional text, no chevron indicator, no onboarding tooltip.
  implication: Users have no way to discover that swipe-to-delete exists unless they accidentally swipe or are told.

## Resolution

root_cause: |
  Two distinct issues:

  **Issue 1 — Auto-delete on swipe (primary bug):**
  The ReanimatedSwipeable is configured with `onSwipeableOpen={() => deleteItem(item.id)}`
  as the sole deletion mechanism. There is no tappable delete button. When the user swipes
  past the rightThreshold (80px), the row snaps open and `onSwipeableOpen` fires automatically
  after the spring animation completes. Because the spring is very stiff (damping=1000,
  stiffness=700, overshootClamping=true), this happens in ~200ms. The `RightSwipeAction`
  component is purely decorative (no onPress handler), so the user cannot deliberately tap
  to confirm deletion — the swipe itself IS the delete action, with no confirmation step.

  **Issue 2 — No discoverability:**
  There is zero visual indication that items can be swiped. No hint animation, no instructional
  overlay, no subtle chevron or edge indicator. First-time users have no way to discover this
  interaction pattern.

fix: (not applied — diagnosis only)
verification: (not applicable)
files_changed: []
