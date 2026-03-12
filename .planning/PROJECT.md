# RoomY

## What This Is

A mobile app for roommates to manage shared household expenses, groceries, and chores without friction. Built with Expo (React Native), it lets roommates split utility bills, coordinate grocery shopping via shared lists, divvy up household tasks, and settle debts through Venmo deep links — all customized to each household's needs through an onboarding quiz.

## Core Value

Roommates can see exactly who owes what and settle up with one tap — no awkward conversations, no mental math, no forgotten debts.

## Current Milestone: v1.1 UI Redesign

**Goal:** Make the app look polished and trustworthy — replace the developer-prototype aesthetic with an intentional design system that builds user confidence.

**Target features:**
- Design token system (colors, typography, spacing, shadows)
- Shared component library (Avatar, Badge, Card, Icon containers, buttons, toggles)
- Onboarding flow rebuild (welcome carousel, sign up, display name, setup choice, household name, invite code, module selection)
- Home screen rebuild (week-strip calendar, balance summary, attention feed)
- Expenses screen rebuild (balance cards, differentiated history rows)
- Groceries screen rebuild (to-get/done sections, member attribution)
- Chores screen rebuild (emoji icons, stats row, dispute styling)
- Tab bar and navigation polish

**Design references:**
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/DESIGN_SPEC.md` — full specification
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/reference-mockup.jsx` — visual target (main screens)
- `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/onboarding-mockup.jsx` — visual target (onboarding flow)

## Requirements

### Validated

- ✓ User authentication and profiles — v1.0
- ✓ Household creation and roommate invites — v1.0
- ✓ Household onboarding quiz — v1.0
- ✓ Utility/bill splitting with Venmo deep links — v1.0
- ✓ Balance tracking (who owes who) — v1.0
- ✓ Shared grocery list with real-time sync — v1.0
- ✓ Grocery trip to expense conversion — v1.0
- ✓ Chore assignment, rotation, and contribution tracking — v1.0
- ✓ Push notifications (expenses, chores) — v1.0
- ✓ Shared household calendar — v1.0

### Active

- [ ] Intentional color system replacing default orange-everything palette
- [ ] Typography hierarchy with clear visual weight
- [ ] Shared component library (Avatar, Badge, Card, buttons, toggles)
- [ ] Onboarding flow with gradient hero carousel, avatar preview, step progress bar, toggle cards
- [ ] Home screen with calendar, balance summary, attention feed
- [ ] Expenses screen with visual expense/settlement differentiation
- [ ] Groceries screen with to-get/done sections and member attribution
- [ ] Chores screen with emoji icons, stats, and dispute highlighting
- [ ] Polished tab bar and navigation

### Out of Scope

- Built-in payment processing (Stripe, etc.) — not a business, no merchant account
- Web version — mobile first, web can come later
- Public app store release — v1 is for personal use
- Social features beyond the household — this isn't a social network
- Receipt scanning / OCR — manual entry is fine for v1
- Backend changes — presentation layer only, all data models and APIs stay untouched
- New features — this milestone is purely visual redesign

## Context

- Two-person dev team: one on Linux, one on macOS
- Both CS majors, post-college age, roommate experience firsthand
- Expo chosen so both devs can test on their own phones (QR code scanning) regardless of OS
- Friend on Mac handles iOS builds when needed
- Personal project — solving their own problem first
- Venmo is the existing payment method in their social circle

## Constraints

- **Platform**: Expo (React Native) — must work for dev on both Linux and macOS
- **Payments**: No Stripe/built-in payments — Venmo deep links only
- **Scope**: v1 is personal use for their own household
- **Team**: Two developers, no designer — design guided by reference mockup and spec
- **Backend**: Needs a backend for shared state between roommates (real-time sync preferred)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo (React Native) over native Swift | One dev is on Linux, can't run Xcode — Expo lets both devs test via QR code | ✓ Good |
| Venmo deep links over built-in payments | Personal project, no business account needed — Venmo is already how they pay each other | ✓ Good |
| Modular features via onboarding quiz | Not every household needs every feature — quiz recommends a setup | ✓ Good |
| Mobile first | Roommates interact with this at home, not at a desk | ✓ Good |
| Green primary color (#2D6A4F) | Trust/money association, distinct from default orange — per design spec | — Pending |
| Presentation-only redesign | All backend logic untouched — reduces risk and keeps functionality intact | — Pending |

---
*Last updated: 2026-03-11 after v1.1 milestone start*
