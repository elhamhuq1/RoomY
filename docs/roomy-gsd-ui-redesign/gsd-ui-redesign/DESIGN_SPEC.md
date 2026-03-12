# RoomY Design Specification

> This file is the source of truth for the UI redesign. GSD subagents should reference
> this document AND the companion `reference-mockup.jsx` when implementing each phase.

---

## 1. Color System

### Brand Colors
| Token              | Value     | Usage                                       |
|--------------------|-----------|---------------------------------------------|
| `brand`            | `#2D6A4F` | Primary actions, active tab, checkmarks, CTAs |
| `brandLight`       | `#D8F3DC` | Selected states, light backgrounds           |
| `brandMuted`       | `#95D5B2` | Borders on interactive elements              |
| `brandGradient`    | `#2D6A4F → #1B4332` | Balance summary card background     |

### Semantic Colors
| Token              | Value     | Usage                                       |
|--------------------|-----------|---------------------------------------------|
| `danger`           | `#E5383B` | Disputes, overdue, errors                    |
| `dangerLight`      | `#FFE5E5` | Dispute badges, alert backgrounds            |
| `warning`          | `#F4A261` | Pending items, expense icons                 |
| `warningLight`     | `#FFF3E0` | Pending backgrounds, chore-due indicators    |
| `success`          | `#40916C` | Settlements, completed items, streaks        |
| `successLight`     | `#E8F5E9` | Settlement row icons                         |

### Neutral Colors
| Token              | Value     | Usage                                       |
|--------------------|-----------|---------------------------------------------|
| `bg`               | `#FAFAF8` | Page background                              |
| `card`             | `#FFFFFF` | Card surfaces                                |
| `text`             | `#1A1A1A` | Primary text                                 |
| `textSecondary`    | `#8E8E93` | Labels, subtitles, metadata                  |
| `textTertiary`     | `#AEAEB2` | Placeholders, disabled, past dates           |
| `border`           | `#F0EFEB` | Card borders, dividers                       |

### Elevation
| Token              | Value                                              |
|--------------------|----------------------------------------------------|
| `shadow`           | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` |
| `shadowMd`         | `0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)` |

---

## 2. Typography Scale

Use the system font stack: `-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, system-ui, sans-serif`

| Element            | Size | Weight | Letter-spacing | Color          |
|--------------------|------|--------|----------------|----------------|
| Page title         | 26px | 700    | -0.02em        | `text`         |
| Key number ($$)    | 34px | 700    | -0.02em        | white / `text` |
| Section heading    | 18px | 700    | -0.01em        | `text`         |
| Card title / name  | 16px | 700    | 0              | `text`         |
| Body / row label   | 15px | 600    | 0              | `text`         |
| Metadata / subtitle| 12–13px | 500–600 | 0–0.06em   | `textSecondary`|
| Overline label     | 11–12px | 600  | 0.06em         | `textTertiary` |
| Badge text         | 11px | 600    | 0.02em         | semantic color |

Overline labels (section headers like "CLOWNS", "MY CHORES", "TO GET") use uppercase + wide letter-spacing.

---

## 3. Component Inventory

### Avatar
- Circle with a gradient background unique per member
- Shows first initial, white, centered
- Subtle colored box-shadow: `0 2px 8px {memberColor}33`
- Sizes: 16px (inline), 22px (list detail), 24px (timeline), 36px (default), 40px (card), 44px (profile)

#### Member color assignments
| Member  | Primary   | Gradient                              |
|---------|-----------|---------------------------------------|
| Elham   | `#E76F51` | `linear-gradient(135deg, #E76F51, #F4A261)` |
| Tk      | `#264653` | `linear-gradient(135deg, #264653, #2A9D8F)` |
| Elham3  | `#7209B7` | `linear-gradient(135deg, #7209B7, #B5179E)` |

Each new member should get a visually distinct gradient that doesn't collide with existing members.

### Badge
- Rounded pill: `padding: 2px 8px`, `border-radius: 6px`
- Colored text on light semantic background (e.g., red text on dangerLight)
- Used for: frequency ("Weekly"), status ("Disputed"), categories

### Card
- Background: `card` (#FFFFFF)
- Border: `1px solid border`
- Border-radius: 14–16px
- Shadow: `shadow` token
- Padding: 14–16px
- Dispute cards: border color changes to `dangerLight`, optional tinted background

### Icon containers
- 40×40px, border-radius: 12px
- Background: light semantic color matching the icon purpose
- Icon stroke: matching semantic color, 2–2.2px width
- Alternative: emoji (20px) for chore types

### Action buttons (FAB)
- 52×52px, border-radius: 16px
- Background: `brand`
- Shadow: `0 4px 16px {brand}55`
- White "+" icon, 22px, stroke 2.5px
- Position: bottom-right, above tab bar

### Tab bar
- Height: 84px (includes safe area)
- Background: `card`
- Top border: `1px solid border`
- Icons: 22px, stroke 2px
- Active: `brand` color (stroke + fill where appropriate)
- Inactive: `textTertiary`
- Labels: 10px, weight 600

### Step progress bar (onboarding)
- 3 equal-width segments, height 3px, border-radius 2px, gap 6px
- Filled segment: `brand` background
- Unfilled segment: `border` background
- Shown on: display name (1/3), setup choice (2/3), module selection (3/3)

### Primary button
- Full-width, padding 16px vertical, border-radius 14px
- Background: `brand`, color white, 17px weight 700
- Shadow: `0 4px 16px {brand}44`
- Used across onboarding and main app

### Outline button
- Full-width, padding 16px vertical, border-radius 14px
- Background: transparent, border: `2px solid brand`, color: `brand`, 17px weight 700
- Used for secondary actions (e.g. "Continue Setup" on invite code screen)

### Glass-morphism container (onboarding hero)
- Background: `rgba(255,255,255,0.15)`
- Border: `1px solid rgba(255,255,255,0.2)`
- `backdrop-filter: blur(12px)`
- Used for logo and emoji badge on welcome carousel

### Social auth buttons
- Google: card bg, 1.5px border, 15px weight 600, text color
- Apple: solid black bg, white text, 15px weight 600
- Both: full-width, 14px vertical padding, 14px border-radius

### Toggle switch
- Container: 48×28px, border-radius 14px, 2px padding
- Active: `brand` background
- Inactive: `#E0E0E0` background
- Knob: 24×24px white circle, `0 1px 3px rgba(0,0,0,0.15)` shadow
- Locked state: 60% opacity

---

## 4. Screen Layouts

### Onboarding — Welcome Carousel

**Layout:** Full-height screen split into two zones.
1. **Hero section** (top ~52%) — Gradient background with rounded bottom corners (border-radius: 0 0 40px 40px). Decorative translucent circles for depth. Centered: logo container (80px, rounded 24px, glass-morphism style with backdrop blur) with 🏠 emoji → app name "RoomY" (32px, 800 weight, white) → tagline (15px, white 70% opacity). Below: feature emoji badge (72px rounded container, glass-morphism) showing the current slide's emoji.
2. **Content section** (bottom) — Feature title (24px, 700, centered) → description (15px, textSecondary, centered) → page dots (active: 24px wide pill in brand, inactive: 8px circle in border) → "Get Started" button (full-width, brand bg, 17px 700 white) → "Already have an account? Sign in" link.

**Carousel slides:**
| Slide | Emoji | Gradient | Title | Body |
|-------|-------|----------|-------|------|
| 1 | 💰 | `#2D6A4F → #1B4332` | Split Expenses Fairly | Track shared costs and settle up... |
| 2 | 🛒 | `#7209B7 → #B5179E` | Shared Grocery Lists | Keep one list everyone can add to... |
| 3 | ✨ | `#E76F51 → #F4A261` | Fair Chore Rotation | Take turns automatically... |

Each slide changes the hero gradient and the emoji badge. The content section slides text.

### Onboarding — Sign Up

**Layout:** Standard form screen.
1. **Back button** — 40px square, card bg, border, shadow, left-chevron icon.
2. **Header** — Left-aligned "Create Account" (28px, 700) + subtitle "Join your household on RoomY" (15px, textSecondary).
3. **Form fields** — Label (13px, 600, textSecondary) above each input. Input containers: 14px padding, 12px border-radius, 1.5px border. Email + Password fields.
4. **Sign Up button** — Full-width, brand bg, same style as Get Started.
5. **Divider** — Line + "or" + line.
6. **Social buttons** — "Continue with Google" (outlined, card bg) + "Continue with Apple" (solid black bg, white text).
7. **Footer link** — "Already have an account? Sign in"

### Onboarding — Display Name

**Layout:** Centered content with avatar preview.
1. **Back button** — Same as Sign Up.
2. **Step progress bar** — 3 equal segments. Segment 1 filled (brand), 2–3 empty (border). Height: 3px, border-radius: 2px.
3. **Avatar preview** — 88px rounded square (border-radius: 28px) showing the user's gradient avatar with their initial. Uses the same avatar gradient system as the main app. Shadow: `0 4px 20px` of member color.
4. **Header** — "What should we call you?" (28px, 700, centered) + subtitle (15px, textSecondary, centered).
5. **Input** — Display Name field with active border (2px solid brand) showing typed name.
6. **Continue button** — Full-width, brand bg.

### Onboarding — Setup Choice

**Layout:** Two large tappable option cards.
1. **Back button** + **Step bar** (segments 1–2 filled).
2. **Header** — "Set Up Your Home" (28px, 700) + subtitle (15px, textSecondary).
3. **Option cards** — Two cards with generous padding (20px). Each contains: gradient icon container (56px, rounded 18px, with shadow) holding an emoji → title (17px, 700) + description (13px, textSecondary) → right chevron. First card: 🏠 "Create a Household" on brand gradient. Second card: 🔑 "I Have an Invite Code" on purple gradient (#7209B7 → #B5179E).

### Onboarding — Name Household

**Layout:** Centered form with house illustration.
1. **Back button**.
2. **House icon** — 96px rounded square (border-radius: 30px), brand gradient bg, 🏠 emoji (48px), heavy shadow.
3. **Header** — "Name Your Household" (28px, 700, centered) + subtitle.
4. **Input** — Household Name field with active brand border.
5. **"Create Household" button** — Full-width, brand bg.

### Onboarding — Invite Code

**Layout:** Celebration screen with prominent code.
1. **Success icon** — 80px rounded square, brandLight bg, green checkmark SVG.
2. **Header** — "{Name} is ready!" (28px, 700) + subtitle about sharing code.
3. **Code card** — Card container with overline "INVITE CODE" (11px, textTertiary, uppercase, wide letter-spacing) → large code display (36px, 800, brand color, letter-spacing 0.12em) → expiry note (12px, textTertiary).
4. **Buttons** — "Share with Roommates" (solid brand, with upload icon) + "Continue Setup" (outlined, brand border + text).

### Onboarding — Module Selection

**Layout:** Toggle cards for feature selection.
1. **Step bar** (all 3 segments filled).
2. **Header** — "Choose Your Modules" (28px, 700) + subtitle about changing later.
3. **Module cards** — Three cards, each containing: emoji icon container (48px, rounded 14px, brandLight bg when active, #F5F5F5 when inactive) → title (16px, 700) + description (13px, textSecondary) + optional "Always enabled" note (11px, brand) → toggle switch. Active cards: 2px brand border, brandLight icon bg. Inactive cards: 2px border-color border, grey icon bg. Toggle: 48×28px pill, brand bg when on, #E0E0E0 when off, white 24px circle knob.
4. **"Let's Go!" button** — Full-width, brand bg.

### Home Screen

**Order from top to bottom:**
1. **Header** — Left: date (14px, textSecondary) + greeting "Good evening, {name}" (26px, bold). Right: settings icon button (40px square, card bg, shadow).
2. **Members card** — Overline label with household name, "Invite +" link on right. Row of member Avatars (44px) with names below.
3. **Calendar card** — Collapsible. Default: week strip (current week, 7 days in a grid). Today highlighted with brand fill + white text. Event dots below dates (small colored circles, max 3). Chevron + pull handle to expand into full month grid. Past dates dimmed. Navigation arrows for month switching.
4. **Balance summary card** — Dark gradient background (brand → darker). Large dollar amount (34px, white, bold). Subtitle "Owed to you" (13px, white 70% opacity). Two buttons: "Request" (ghost/glass style) and "Settle Up" (white solid). Decorative subtle circles in background for depth.
5. **Needs your attention** — Section heading. List of action cards: pending chores (warning icon), disputes (danger icon + red border), grocery updates (member-colored icon). Each card: icon container + title + subtitle + action (checkmark or chevron).
6. **This week** — Section heading. Vertical timeline: date labels on left, vertical line (brand for today, border for others), chore items with member avatar + task name. Done items: strikethrough + dimmed + green checkmark.

### Expenses Screen

**Order from top to bottom:**
1. **Header** — "Expenses" (26px, bold). Right: more options icon button.
2. **Balances card** — Overline "BALANCES". List of members with their owe status. Owed to you: green "owes you $X" + "Remind" button (brand bg, white text). Settled: "All settled up" (tertiary) + green checkmark icon. Divider between rows.
3. **History** — Section heading "History" with "Filter" link on right. Date group headers ("TODAY", "YESTERDAY", "EARLIER") in overline style. Expense rows: amber icon container (card icon) + name + "paid by {name} · {time}" + amount in bold. Settlement rows: green icon container (checkmark icon) + "{from} → {to}" + "Settlement · {time}" + green amount with "−" prefix. Dimmed text for settlement names to de-emphasize resolved items.

### Groceries Screen

**Order from top to bottom:**
1. **Header** — "Groceries" (26px, bold). Right: history icon button.
2. **Quick add** — Input field (card bg, border, placeholder "Add an item...") + brand-colored add button (44px square, brand bg, white "+" icon).
3. **To get section** — Overline "TO GET · {n} items". Card container with item rows. Each row: unchecked circle (22px, textTertiary border) + item name (15px) + member avatar (22px) showing who added it. Tappable to check off.
4. **Done section** — Overline "DONE · {n} items". Same card container, but: checked circle (brand bg, white checkmark) + item name (strikethrough, textSecondary) + 50% opacity on entire row.

### Chores Screen

**Order from top to bottom:**
1. **Header** — "Chores" (26px, bold). Right: grid/view icon button.
2. **Stats row** — Three equal cards: Pending (number in warning color), Disputed (number in danger color), Streak (number in brand color + 🔥 emoji). Label below each in overline style.
3. **Your chores section** — Overline "YOUR CHORES". Card with your assigned chores. Each row: emoji icon container (40px, warningLight bg) + chore name (15px bold) + badges (frequency, due date) + checkmark button (brand border, brand checkmark icon).
4. **Household section** — Overline "HOUSEHOLD". Card with all household chores. Each row: emoji icon container + chore name + optional Disputed badge + member avatar (16px) + member name + due date. Disputed rows: dangerLight bg tint + dangerLight border on icon container. Chevron on right for detail view.

#### Chore emoji mapping
| Chore            | Emoji |
|------------------|-------|
| Dishes           | 🍽️    |
| Laundry          | 🧺    |
| Vacuum           | 🧹    |
| Folding clothes  | 👕    |
| Trash            | 🗑️    |
| Bathroom         | 🚿    |
| Cooking          | 🍳    |
| Default          | ✅    |

---

## 5. Interaction Notes

- **Welcome carousel**: swiping or tapping dots cycles through 3 slides. The hero gradient transitions smoothly between slides. "Get Started" is always visible regardless of which slide is active.
- **Onboarding step bar**: fills progressively as the user advances. Does not appear on welcome, sign up, name household, or invite code screens — only display name, setup choice, and module selection.
- **Display name avatar preview**: updates in real-time as the user types. Shows the first character of input with the assigned member gradient.
- **Module toggles**: tapping anywhere on the card toggles the module on/off. Expenses toggle is locked on and shows 60% opacity with "Always enabled" label.
- **Calendar collapse/expand**: toggle between week strip and month grid. Use a chevron indicator and a small pull-handle bar at bottom of card. Animation should feel native (iOS-style ease).
- **Grocery checkboxes**: tapping a row toggles the item between "to get" and "done" sections. Newly checked items move to the done section with strikethrough and dimming.
- **Chore completion**: the checkmark button on your-chore rows should confirm completion (existing backend flow).
- **Dispute cards**: visually elevated with red-tinted border. Tapping navigates to dispute detail (existing flow).
- **Settlement rows**: visually quieter than expense rows (dimmed text color) so the eye focuses on outstanding items.
- **Empty states**: should include a relevant illustration or emoji, a friendly headline, and a helpful subtitle. Never just a generic icon + "No items."

---

## 6. Verification Checklist (per phase)

After each phase, verify:
- [ ] App launches without errors
- [ ] All existing data displays correctly
- [ ] Navigation between all 4 tabs works
- [ ] Adding new expenses, chores, grocery items still works
- [ ] Settlements and disputes display correctly
- [ ] Calendar shows correct dates and events
- [ ] Member avatars render with correct colors
- [ ] No regressions in existing functionality
- [ ] Visual output matches the reference mockup for the relevant screen

### Onboarding-specific verification:
- [ ] Welcome carousel swipes between all 3 slides
- [ ] "Get Started" navigates to sign up
- [ ] "Sign in" link navigates to login flow
- [ ] Sign up with email/password works
- [ ] Sign up with Google/Apple OAuth works
- [ ] Display name saves correctly and avatar preview updates live
- [ ] "Create a Household" and "I Have an Invite Code" both navigate correctly
- [ ] Household creation generates an invite code
- [ ] Invite code share sheet triggers native share
- [ ] Module toggles persist selection and Expenses stays locked on
- [ ] "Let's Go!" transitions to the main app home screen
- [ ] Step progress bar shows correct fill state on each screen
