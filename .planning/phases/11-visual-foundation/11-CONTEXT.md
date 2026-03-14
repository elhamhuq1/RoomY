# Phase 11: Visual Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Shift the entire app's visual identity to wintergreen palette with cream background and outline cards. Consolidate duplicated color arrays, replace all hardcoded emerald values, update card styling, and unify system chrome. No new features — purely visual identity.

</domain>

<decisions>
## Implementation Decisions

### Wintergreen palette range
- 5-step scale: #1B4332 (deep forest/pressed) → #2D6A4F (primary) → #52796F (mid-tone/secondary) → #D8E8DC (sage-green wash/tint) → #F5F0EB (cream/background)
- Deep forest (#1B4332) for pressed states and hover — premium feel, high contrast
- Mid-tone (#52796F) for secondary buttons, selected list items, subtle active states
- Sage-green wash (#D8E8DC) for light badge backgrounds, subtle highlights — muted, desaturated, blends with cream
- Text on wintergreen buttons/badges: pure white (#FFFFFF) — maximum contrast, crisp

### Card outline feel
- 1px border weight — standard, clean separation
- Warm gray outline color (#D6D0C8) — warm undertone complements cream, feels integrated not clinical
- Moderately rounded corners (12-16px) — friendly, modern, iOS native feel
- Transparent background (cream shows through) — cards are outlined zones on cream, no layering, no shadows

### Avatar gradient variety
- Earth tone mix: wintergreen, terracotta, amber, slate, plum, ocean, clay, sage — each member clearly distinct
- Soft gradients — gentle transitions between close tones, elegant and understated
- 8 gradient pairs total — matches current count, covers most households (2-8 members), wraps around if more
- Default/fallback: wintergreen gradient — brand-consistent for unassigned users

### Navigation chrome
- Tab bar: cream background (#F5F0EB) — seamless with page, no visual break
- Active tab: wintergreen (#2D6A4F) icon and label, inactive tabs in warm gray
- Headers: cream background with dark text — seamless with content, no branded header bar
- Status bar: dark content (dark text/icons) on cream — standard light theme treatment
- Goal: no visible color seam anywhere between content and system chrome

### Claude's Discretion
- Exact hex values for each earth-tone gradient pair (within the soft/muted direction)
- Specific border radius value within 12-16px range
- Loading state treatments during transition
- Exact warm gray inactive tab color
- How to handle the gradient balance card and dark invite code card special cases (per CARD-02)

</decisions>

<specifics>
## Specific Ideas

- Overall feel: seamless cream surface with wintergreen accents and warm gray structure lines
- Cards should feel like "outlined zones" not layered containers — no depth, no shadows, no elevation
- Avatar gradients should be earthy and warm, not neon or cold — think natural tones
- The whole app should feel like one continuous surface with content organized by outline boundaries

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-visual-foundation*
*Context gathered: 2026-03-13*
