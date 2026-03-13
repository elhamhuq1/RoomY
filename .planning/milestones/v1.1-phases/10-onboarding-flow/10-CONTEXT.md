# Phase 10: Onboarding Flow - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the onboarding experience: welcome carousel, styled auth screens (sign-up + log-in), display name with avatar preview, household setup cards, invite code celebration, module quiz, and a step progress bar. All screens use illustrations from `docs/onboarding-images/`. This is a visual redesign of existing functional screens — no new features or logic changes (except renaming "Sign In" to "Log In").

</domain>

<decisions>
## Implementation Decisions

### Welcome Carousel
- Fixed header above carousel: glassmorphism logo container + "RoomY" title + tagline stay pinned at top while slides swipe beneath
- Image hero layout: illustration takes ~50% of slide, title + subtitle below, emoji badge chips underneath
- Cream background (#F5F3EE or matched to illustration bg) — same color throughout all 3 slides, no per-slide tints
- Image bg handling: match slide background to illustration background color so JPGs blend seamlessly (no transparency needed)
- Emoji feature badges: small pill-shaped chips below each slide's subtitle (e.g. "💰 Fair splits" "⚡ One tap")
- 3 slides: split-expenses.jpg, shared-grocery.jpg, chore-rotation.jpg with existing VALUE_PROPS content
- Page indicator dots (current style: active = wide brand pill, inactive = small gray circle)

### Auth Screen Styling
- Cream background on both sign-up and log-in screens for visual continuity with welcome
- Small glassmorphism logo container at top of each auth screen (smaller than welcome screen version)
- Sign-up and log-in screens mirror each other in layout — same structure, only form fields and CTA text differ
- **Rename "Sign In" to "Log In"** throughout the app (button text, links, screen title)
- Form inputs: subtle inset style — light gray fill (#F5F5F5) default, no border; on focus: white bg with brand-colored border
- Social auth buttons: full-width branded pill buttons — Google gets white bg with colored G logo, Apple gets black bg with white logo
- Primary CTA: branded rounded button (existing style, no change needed)

### Celebration & Invite Code
- Replace green checkmark with celebration illustration (invite-code.jpg) as hero image at top
- Invite code displayed in a dark brand gradient card (similar to home screen balance card) with white text
- Code formatted with space for readability: "ABCD EFGH"
- Primary action: "Share with Roommates" button opens OS share sheet
- Secondary action: "Copy code" as a text link below share button
- "Continue Setup" button below both actions

### Progress Bar
- Instagram Stories-style: thin segmented bars at top of screen, below safe area
- 3 equal-width segments with small gaps between them
- Filled = brand color, unfilled = muted gray
- Segments: Profile (display name) → Household (choice + create/join) → Modules (quiz)
- Animated fill: current segment slides left-to-right on screen entry, previous segments stay filled
- Back button (←) top-left, progress bar spans remaining width; hidden on first onboarding screen
- **Skip progress bar on invite code celebration screen** — that's a celebration moment, bar feels out of place
- Show on: profile, household-choice, create-household, join-household, module-quiz

### Onboarding Screen Images
- Each onboarding screen uses its matching illustration from `docs/onboarding-images/`:
  - Welcome slide 1: `split-expenses.jpg`
  - Welcome slide 2: `shared-grocery.jpg`
  - Welcome slide 3: `chore-rotation.jpg`
  - Display name screen: `display-name.jpg`
  - Household choice (setup): `setup-home.jpg`
  - Name household: `name-household.jpg`
  - Invite code: `invite-code.jpg`
- All images are JPGs with off-white/cream backgrounds — use matching background colors to blend

### Claude's Discretion
- Exact cream hex value (match to illustration background)
- Glassmorphism blur intensity and opacity
- Emoji badge content per carousel slide
- Animation timing/easing for progress bar fill
- Spacing, typography sizing, and padding across screens
- How to style the module quiz screen (not discussed — apply same cream bg + illustration patterns)

</decisions>

<specifics>
## Specific Ideas

- "I want the progress bar like Instagram Stories — sectioned pills at the top"
- Cream background globally is preferred but out of scope — onboarding screens are cream for now
- The illustrations have a consistent flat art style with green, orange, purple, teal figures — lean into this palette
- Dark gradient card for invite code mirrors the balance card pattern already used on the home screen

</specifics>

<deferred>
## Deferred Ideas

- **Global cream background** — Change the entire app's `neutral-bg` token from current value to cream. Simple one-line design token change, could be done as a quick task anytime. User feels cream is easier on the eyes and more visually appealing.

</deferred>

---

*Phase: 10-onboarding-flow*
*Context gathered: 2026-03-13*
