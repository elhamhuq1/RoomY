# RoomY UI Redesign — GSD Milestone Brief

> Paste the content between the --- lines when GSD asks "What do you want to build?"
> during the `/gsd:new-milestone` interview. Adjust to match your actual tech stack.

---

## What I'm building

A complete UI/UX redesign of the RoomY mobile app. RoomY is a household management app where roommates share expenses, chores, and groceries. The app is functional but the UI looks like a developer prototype — I need it to look polished and trustworthy so users feel confident managing money and responsibilities through it.

## Reference mockups

There are two mockup files:

- `docs/ui-redesign/reference-mockup.jsx` — Target visual design for all 4 main screens (Home, Expenses, Groceries, Chores)
- `docs/ui-redesign/onboarding-mockup.jsx` — Target visual design for the full onboarding flow (welcome carousel, sign up, display name, household setup, invite code, module selection)

Subagents should read these files to extract colors, spacing, typography, component patterns, and layout structure — then translate those patterns into our real codebase and framework.

The companion design spec is at `docs/ui-redesign/DESIGN_SPEC.md`. It defines the color system, typography scale, component inventory, and screen-by-screen layout requirements including onboarding.

## What must NOT change

- All backend logic, API calls, data models, and state management must remain untouched
- Navigation structure stays the same (4 tabs: Home, Expenses, Groceries, Chores)
- All existing features must continue working (expense tracking, settlements, chore assignment, disputes, grocery lists, household members, calendar)
- Data bindings and props flowing into components stay the same — only the presentation layer changes
- The onboarding flow's steps and sequence remain the same (welcome → sign up → display name → create/join household → name household → invite code → module selection)

## What must change

- Color system: replace the current orange-everything approach with an intentional palette (green primary for trust/money, amber for warnings, red for disputes/errors, distinct member avatar colors)
- Typography: establish a clear hierarchy (large bold for key numbers, medium for headers, light for metadata)
- Onboarding: redesigned welcome carousel with gradient hero section and emoji feature badges, step progress bar throughout, avatar preview on display name, gradient icon containers on setup choice cards, brand-colored invite code, toggle cards for modules
- Home screen: add compact week-strip calendar (expandable to full month), balance summary card, "needs attention" action feed, weekly timeline
- Expenses screen: visually differentiate expenses from settlements, proper date grouping, clearer balance cards
- Groceries screen: split into "to get" and "done" sections, show who added each item, better empty state
- Chores screen: emoji icons per chore type, streak celebration, dispute highlighting, separate "your chores" from "household"
- Shared components: Avatar with gradient colors, Badge component, consistent card styling with shadows and borders
- Tab bar: updated icons, brand-colored active state

## Phasing suggestion

I'd like this broken into phases so each is independently shippable:

1. **Design tokens + shared components** — colors, typography, Avatar, Badge, card containers, buttons. No screens change yet.
2. **Onboarding flow rebuild** — welcome carousel with gradient hero, sign up form, display name with avatar preview, setup choice cards, name household, invite code, module selection with toggles, step progress bar
3. **Home screen rebuild** — header, members card, calendar, balance card, attention feed, weekly timeline
4. **Expenses screen rebuild** — balance cards, history list with expense/settlement differentiation, date sections
5. **Groceries screen rebuild** — to-get/done split, checkboxes, member avatars on items, improved empty state
6. **Chores screen rebuild** — stat cards, emoji icons, your-chores vs household sections, dispute styling
7. **Navigation + polish** — tab bar icons, FAB button, spacing consistency pass, edge cases

Each phase should verify that all existing functionality still works after the visual changes.

---
