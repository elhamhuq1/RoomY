# Phase 6: Design System + Components - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a consistent design token system (colors, typography, elevation) and reusable component library (Avatar, Card, Badge, Button, IconContainer, Toggle). Apply branded styling to tab bar and FAB. All existing orange hex values are replaced with the new green brand palette. Light mode only — dark mode is deferred.

</domain>

<decisions>
## Implementation Decisions

### Brand palette & color tokens
- Primary brand green: Emerald family — #10B981 (primary), #059669 (dark), #D1FAE5 (light)
- Semantic colors are SEPARATE from brand: success #22C55E, warning #F59E0B, error #EF4444, info #3B82F6
- Brand green is for primary actions/accents; success green is a different shade so they're visually distinct
- Neutral scale: Cool slate grays — text #0F172A, secondary #64748B, border #E2E8F0, background #F8FAFC
- Light mode only — token architecture should support dark mode later but no dark values defined now

### Component visual style
- Cards: Soft & elevated — subtle box-shadow, 12-16px rounded corners, white background on #F8FAFC page bg. Linear/Notion aesthetic
- Avatars: Gradient circle with white initials, gradient derived from user ID for unique-per-member consistency, colored shadow underneath
- Buttons: Fully rounded pill shape (border-radius 9999px), friendly and approachable feel
- Badges: Subtle tinted pills — soft colored background with darker text of same hue (e.g., light green bg + dark green text for "Paid")

### Tab bar styling
- Icons + text labels (icon above, short label below)
- Outlined (line) icons when inactive, filled icons when active — visual weight shift on selection
- Active color: brand emerald green; inactive color: tertiary slate gray
- White background, top border, 84px height per requirements

### FAB styling
- Position: Bottom-right, floating above tab bar
- Action: Contextual per active screen (add expense on expenses tab, add item on grocery tab, etc.)
- 52px rounded square with 16px radius, brand background, colored shadow per requirements
- Press animation: Scale bounce — scale(0.92) on press, spring back to 1.0 on release (~200ms)

### Typography
- Font family: System fonts (SF Pro on iOS, Roboto on Android) — native feel, zero load time
- Scale (moderate contrast, ~2.9x ratio):
  - Page Title: 28px / Bold (700)
  - Key Number: 32px / Bold (700)
  - Section Heading: 18px / Semibold (600)
  - Card Title: 16px / Semibold (600)
  - Body: 15px / Regular (400)
  - Metadata: 13px / Regular (400)
  - Overline: 11px / Semibold (600), UPPERCASE, 1.5px letter-spacing
  - Badge: 11px / Medium (500)
- Three-tier weight system: Bold (700) for titles/numbers, Semibold (600) for headings/overlines, Regular (400) for body/metadata

### Claude's Discretion
- Exact shadow values for the two-tier elevation system (shadow, shadowMd)
- Avatar gradient color palette and derivation algorithm
- Icon library choice for tab bar icons
- Toggle switch animation timing and spring parameters
- IconContainer color mapping to semantic categories
- Exact spacing/padding tokens

</decisions>

<specifics>
## Specific Ideas

- Cards should feel like Linear's issue cards — clean, not cluttered, with gentle depth
- Avatar gradients should make each household member immediately recognizable at a glance
- Tab bar should feel native/first-party, not custom — icons + labels is standard iOS/Android
- FAB bounce should feel tactile and physical, not floaty
- Overline labels with wide tracking give a polished, editorial quality to section headers

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-design-system-components*
*Context gathered: 2026-03-12*
