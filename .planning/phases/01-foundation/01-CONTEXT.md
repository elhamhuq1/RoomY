# Phase 1: Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth, household creation/joining, onboarding quiz, and secure data model. Users can create accounts, form a household with roommates, and configure which feature modules they need. No expense tracking, no grocery lists, no chores — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Onboarding flow
- Linear wizard: sign up → profile → create/join household → module quiz → dashboard
- Welcome/value-prop screens before sign-up (1-2 screens showing what RoomY does)
- Dashboard with module tabs is the home screen after onboarding completes
- Empty state for solo creator: invite code prominently displayed with "Share with roommates" action; module cards appear but are empty/disabled until someone joins

### Household invite experience
- Share sheet + visible code: show the invite code on screen AND offer native share button with a pre-written message containing the code
- When a new member joins: household welcome screen showing household name, existing members' names/avatars, and "You're in!" confirmation before going to dashboard
- Invite codes expire after 7 days; creator can regenerate anytime; reasonable household size limit (e.g., 10 members)
- Create-or-join fork in the wizard: after profile setup, a screen with two clear buttons — "Create a household" and "I have an invite code"

### Module quiz design
- Toggle cards on one screen: one card per module with icon, short description, and toggle switch
- Expenses is always on and cannot be disabled (core value of the app); groceries and chores are opt-in
- Any household member can toggle modules on/off (not restricted to creator)
- Module settings accessible post-onboarding in household settings; changes apply immediately

### Auth & profile screens
- Sign-up methods: email/password + Google Sign-In + Apple Sign-In
- Profile: only display name required during onboarding; Venmo username is optional, prompted when first needed in Phase 2
- Visual style: warm and friendly — soft colors, rounded shapes, approachable illustrations of roommates (Duolingo-lite feel, not corporate)
- Forgot password flow included via email link

### Claude's Discretion
- Exact color palette and typography within the "warm and friendly" direction
- Welcome screen illustrations and copy
- Loading states and transitions between wizard steps
- Form validation UX (inline errors, shake animation, etc.)
- Invite code format (length, character set)
- Avatar/initials system for member display

</decisions>

<specifics>
## Specific Ideas

- Visual direction: warm and friendly like Duolingo, not corporate like a fintech app. Soft colors, rounded shapes, approachable feel.
- Empty dashboard should make sharing the invite code the obvious next action — don't let the creator feel lost alone.
- The create-or-join decision point should feel like an equal fork, not "create is primary, join is secondary."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-11*
