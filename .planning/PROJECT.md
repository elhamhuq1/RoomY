# RoomY

## What This Is

A mobile app for roommates to manage shared household expenses, groceries, and chores without friction. Built with Expo (React Native), it lets roommates split utility bills, coordinate grocery shopping via shared lists, divvy up household tasks, and settle debts through Venmo deep links — all customized to each household's needs through an onboarding quiz.

## Core Value

Roommates can see exactly who owes what and settle up with one tap — no awkward conversations, no mental math, no forgotten debts.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Household onboarding quiz that recommends which modules to enable
- [ ] Utility/bill splitting with recurring expenses
- [ ] Shared grocery list with automatic cost splitting
- [ ] Chore assignment and rotation tracking
- [ ] Shared household calendar
- [ ] Balance tracking (who owes who, running totals)
- [ ] One-tap Venmo request via deep links
- [ ] Household creation and roommate invites
- [ ] User authentication and profiles

### Out of Scope

- Built-in payment processing (Stripe, etc.) — not a business, no merchant account
- Web version — mobile first, web can come later
- Public app store release — v1 is for personal use
- Social features beyond the household — this isn't a social network
- Receipt scanning / OCR — manual entry is fine for v1

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
- **Team**: Two developers, no designer — UI should be clean but doesn't need to be fancy
- **Backend**: Needs a backend for shared state between roommates (real-time sync preferred)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo (React Native) over native Swift | One dev is on Linux, can't run Xcode — Expo lets both devs test via QR code | — Pending |
| Venmo deep links over built-in payments | Personal project, no business account needed — Venmo is already how they pay each other | — Pending |
| Modular features via onboarding quiz | Not every household needs every feature — quiz recommends a setup | — Pending |
| Mobile first | Roommates interact with this at home, not at a desk | — Pending |

---
*Last updated: 2026-03-10 after initialization*
