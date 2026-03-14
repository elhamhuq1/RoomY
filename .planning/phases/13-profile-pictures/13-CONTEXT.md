# Phase 13: Profile Pictures - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Let users upload profile pictures via camera or gallery, displayed across the entire app. Upload is available only in settings (profile page) and during onboarding (display name step). All avatars show uploaded photos when available, falling back to gradient+initials.

</domain>

<decisions>
## Implementation Decisions

### Upload flow
- Triggered by tapping the avatar directly (no separate button)
- Available in only two places: settings profile page and onboarding display name step
- Action sheet options: "Take Photo", "Choose from Library", "Edit" (change existing photo), "Remove Photo"
- "Edit" and "Remove" only appear when a photo already exists
- Circle crop overlay after picking/taking a photo (1:1 square aspect ratio)
- No confirmation/preview step — upload starts immediately after cropping

### Avatar styling
- Circular shape across the entire app
- Brand-colored ring around all avatars (own and other members')
- Two size tiers: small (for lists/rows) and large (for profile screens)
- No loading placeholder needed — upload is fast enough that a transition state isn't necessary

### Photo constraints
- 1:1 square crop enforced
- Maximum resolution: 512x512
- Silent compression — automatically compress to fit, user never sees a size error
- Photos only (camera photos and gallery images) — no illustrations, memes, or arbitrary files

### Feedback & states
- Permission denial (camera/gallery): toast notification
- Upload failure: toast with manual "Try Again" option (no auto-retry)
- New photo updates instantly everywhere across the app (cache busting required)
- Removing a photo requires a confirmation dialog ("Remove profile photo?" with Cancel/Remove)

### Onboarding integration
- Photo upload is optional during onboarding — user can skip and add later in settings
- Avatar appears on the display name step (above the name input), not a separate screen
- As user types their name, the avatar updates live with gradient+initials
- Camera badge always visible during onboarding (first-time setup context)

### Other members' avatars
- Household members' avatar updates pushed via Supabase Realtime subscription
- All members see photo changes immediately without needing to reload
- Consistent styling: everyone's avatar gets the brand-colored ring

### Upload indicator (camera badge)
- Small camera icon in a circle, positioned bottom-right on the avatar
- In settings: badge shows only when no photo is set, hides after upload
- In onboarding: badge always shows (first-time setup — encourages photo upload)

### Claude's Discretion
- Camera badge styling details (size, background color, icon color)
- Exact avatar size values for small and large tiers
- Action sheet implementation (native vs custom)
- Supabase Storage bucket configuration and RLS policy details
- Image compression algorithm and quality settings
- Cache busting strategy

</decisions>

<specifics>
## Specific Ideas

- Avatar reacts live to name input during onboarding — gradient+initials update as user types
- "Edit" in the action sheet means the user can change their photo again (re-pick from camera/gallery), not a photo editor

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-profile-pictures*
*Context gathered: 2026-03-13*
