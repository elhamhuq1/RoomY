# Feature Landscape: RoomY UI Redesign

**Domain:** Mobile household management app -- visual redesign (presentation layer only)
**Researched:** 2026-03-12
**Confidence:** HIGH (design spec and reference mockups provide definitive targets; existing codebase fully inspected)

---

## Table Stakes

Features users expect from a polished mobile household/finance app. Missing any of these makes the redesign feel incomplete or inconsistent.

### Design Foundation

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Consistent color token system | Every polished app has one palette. Current orange-everything (#f9a825) everywhere screams prototype. | Low | `tailwind.config.js` has orange `primary` palette; all screens hardcode `#f9a825`. | Replace TW config colors wholesale. All hardcoded hex values in screens must be hunted and replaced. ~30+ instances across 4 tab screens + onboarding. |
| Typography hierarchy | Users unconsciously judge apps by text weight/size consistency. No hierarchy = no visual trust. | Low | Screens use NativeWind text classes (`text-2xl font-bold`, etc.) inconsistently. No shared scale. | Define 8 text presets matching DESIGN_SPEC (page title 26px/700, key number 34px/700, section heading 18px/700, etc.). Apply via consistent className patterns. |
| Elevation/shadow system | Cards without shadows look flat; too many shadows look messy. Financial apps need subtle depth to separate content. | Low | Scattered `shadow-sm` usage; FAB has inline `shadowColor` styles. No system. | Two shadow tokens (`shadow`, `shadowMd`) per spec. NativeWind v4 supports custom shadow via TW config `boxShadow` extension. |
| Consistent card component | Every data container must look the same: radius, border, shadow, padding. Inconsistency = amateur. | Low | Cards are ad-hoc `View` elements with varying `rounded-2xl bg-white shadow-sm` classes. No shared component. | Extract a `<Card>` wrapper. Spec: 14-16px padding, 14-16px radius, 1px border #F0EFEB, shadow token. |
| Consistent button styles | Primary, outline, and ghost button variants must look identical everywhere. | Low | Buttons vary: some `rounded-2xl bg-primary-500 py-4`, some `rounded-lg px-3 py-2`. No consistency. | Two variants needed: Primary (brand bg, white text, 14px radius, colored shadow) and Outline (transparent bg, 2px brand border, brand text). |
| Accessible touch targets | Every interactive element needs 44px minimum touch target (Apple HIG). | Low | Most buttons and rows meet this. Some small action buttons in chores (h-9 w-9 = 36px) are undersized. | Audit all touch targets during rebuild. Spec's 40px icon buttons are acceptable with hitSlop. |

### Shared Components

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Gradient avatar with consistent member colors | Polished apps give each user a unique visual identity. Flat single-color circles feel generic. | Med | `AVATAR_COLORS` array duplicated in 3 files (`index.tsx`, `expenses.tsx`, `chores.tsx`). Colors are positional (index-based), not user-stable -- users get different colors depending on fetch order. | Requires `expo-linear-gradient` (not installed). Member color assignment must be deterministic (hash of user_id or stored in profile). Spec defines 3 member gradients. Must support 6 sizes (16px inline through 44px card). Colored box-shadow per member. |
| Badge/pill component | Used everywhere: frequency labels, status indicators, dispute markers, categories. Without a shared component, styling drifts. | Low | Ad-hoc `View` + `Text` combos with `rounded-full bg-amber-100 px-2 py-0.5` patterns, inconsistent sizing and colors. | Spec: `padding: 2px 8px`, `border-radius: 6px`, colored text on light semantic background. Single component with `variant` prop for semantic coloring. |
| Icon containers | 40x40px colored background squares holding icons or emoji. Used in expense rows, chore rows, attention feed items. | Low | Current: `h-10 w-10 items-center justify-center rounded-full bg-primary-100` -- circles, all same color. Spec uses rounded squares with semantic colors. | Change shape from circle to rounded square (border-radius: 12px). Match background to content type: warningLight for expenses, successLight for settlements, brandLight for chores. |
| Toggle switch | Module selection during onboarding. Must feel native-quality with smooth animation. | Med | No custom toggle exists in codebase. Onboarding `module-quiz.tsx` likely uses React Native's built-in `Switch`. | Spec: 48x28px pill, brand bg when on, #E0E0E0 when off, white 24px circle knob with shadow. Locked state at 60% opacity. Build with `react-native-reanimated` (already installed) for smooth knob translation. |

### Onboarding Flow

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Welcome carousel with hero gradients | First impression screen. If this looks generic, users close the app. Every successful onboarding (Splitwise, Venmo, Duolingo) has a polished hero section. | High | `welcome.tsx`: plain white/cream bg (#fefdfb), orange Ionicon in rounded square, horizontal `ScrollView` with card-based slides. Functional but visually flat. | Requires: gradient background per slide (`expo-linear-gradient`), decorative translucent circles (absolute-positioned Views with rgba backgrounds), glassmorphism logo container (`expo-blur` BlurView), emoji feature badges, smooth gradient color transitions between slides. Most complex single component in the redesign. |
| Step progress bar | Users need orientation in multi-step flows. Standard UX pattern since iOS 7. | Low | No progress indicator exists across onboarding screens. User navigates blind through 5+ steps. | 3 equal segments, 3px height, brand fill for completed, border color for unfilled. Only shown on: display name (1/3), setup choice (2/3), module selection (3/3). Simple View row. |
| Avatar preview on display name screen | Real-time visual feedback that input "worked" builds user confidence. Splitwise, Slack, Discord all preview avatars during name entry. | Med | `profile.tsx` onboarding: text input only, no avatar preview anywhere. | Show 88px rounded-square (border-radius: 28px) avatar with gradient background and first initial, updating live as user types. Depends on Avatar component being built first. Shadow using member color. |
| Social auth buttons with proper styling | Google and Apple sign-in buttons have brand guidelines. Violating them looks unprofessional. | Low | Currently basic buttons exist in the auth flow. | Google: card bg, 1.5px border, 15px weight 600, text color. Apple: solid black bg, white text, 15px weight 600. Both full-width with 14px border-radius. |
| Setup choice cards with gradient icons | Create vs Join household decision is a commitment. Large, clear option cards with visual distinction make the choice feel intentional. | Med | `household-choice.tsx`: likely simple buttons or basic cards (not yet inspected in detail but pattern suggests standard list). | Two large cards with 56px gradient icon containers (brand gradient for Create, purple gradient for Join), emoji inside (house/key), descriptive text, right chevron affordance. Generous 20px padding. |
| Invite code celebration screen | After creating a household, showing a celebration with the invite code makes a mundane action feel like an achievement. | Low | Invite code displayed on home screen as solo-creator empty state. The dedicated invite code screen exists in onboarding flow but with basic styling. | Restyle: success icon (80px, brandLight bg, green checkmark SVG), header "[Name] is ready!", large code display (36px, 800 weight, brand color, 0.12em letter-spacing), "INVITE CODE" overline, expiry note, Share + Continue buttons. |
| Module toggle cards | Feature selection during onboarding must feel intentional, not like a settings page. Card-per-module with visual active/inactive states. | Med | `module-quiz.tsx` exists. Current implementation likely uses standard switches or checkboxes. | Spec: active cards get 2px brand border + brandLight icon bg. Inactive cards get 2px border-color border + #F5F5F5 icon bg. Whole card is tappable. Expenses toggle locked on at 60% opacity with "Always enabled" label. |

### Home Screen

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Date-aware greeting header | Personal touch. "Good evening, Tk" feels human. Every household/finance app does this (Mint, YNAB, Splitwise). | Low | Current: just household name as `text-2xl font-bold`. No date, no greeting, no time awareness. | Time-of-day greeting (morning/afternoon/evening) + formatted date (e.g., "Wednesday, March 11") + settings icon button (40px, card bg, shadow, border). |
| Members card with household label | Users need to see who's in the household at a glance. Social proof and orientation. | Low | Current: avatar row with names below, no card wrapper, no household name label, no invite action. | Wrap in Card component. Add overline label with household name in uppercase. Add "Invite +" link on right. Avatars at 44px with names below. |
| Balance summary card with gradient background | The single most important number in the app. How much you're owed/owe must be the hero element. Every finance app (Venmo, Cash App, Splitwise) makes the balance visually prominent. | Med | No balance card on home screen at all. Balance information only visible when navigating to Expenses tab. | Dark gradient background (brand #2D6A4F to #1B4332 via `LinearGradient`), large 34px white dollar amount, "Owed to you" subtitle at 70% white opacity, two action buttons (Request as ghost/glass style, Settle Up as white solid). Decorative subtle circles. Requires calling `get_household_balances` RPC on home screen (already used by expenses.tsx). |
| Needs-attention feed | Users open the app wondering "what needs my attention?" Having to navigate tabs to find out means the home screen is failing its purpose. | Med | No attention feed exists. Home screen shows module cards (navigation shortcuts to tabs) and a full calendar. | Action cards for: pending chores (warning icon container), disputes (danger icon + red border on card), grocery updates (member-colored icon). Each card: icon container + title + subtitle + action affordance (checkmark or chevron). Requires aggregating data from chores and potentially groceries on the home screen. |

### Expenses Screen

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Visual expense/settlement differentiation | Users must instantly distinguish "money went out" from "money came back." Splitwise and Venmo both differentiate these visually. Without it, the history is a wall of identical rows. | Low | Currently both exist but look similar. Settlements have a green circle icon but text styling and layout weight are identical to expenses. | Expenses: amber/warning icon container (card icon) + bold black amount. Settlements: green/success icon container (checkmark icon) + green amount with "-" prefix + dimmed text for names. Settlements should be visually quieter so eyes focus on outstanding items. |
| Date-grouped history with overline headers | Temporal context. "TODAY", "YESTERDAY", "EARLIER" help users scan quickly. Standard in Venmo and banking apps. | Low | Already implemented: `getDateLabel()` function groups items. Labels render as `text-sm font-semibold text-gray-400`. | Spec wants uppercase overline style: 11-12px, 600 weight, 0.06em letter-spacing, textTertiary color. Minor styling update to existing pattern. |
| Balance cards with member rows | Each member's balance needs to be scannable: avatar, name, amount, action button. | Low | Already implemented with owed-to-you/you-owe sections. Has avatar, name, amount, and settle/request buttons. | Restyle to match spec: overline "BALANCES" header, "owes you $X" in green text, "Remind" button (brand bg, white text), "All settled up" state with green checkmark. Dividers between member rows. Remove the owed-to-you/you-owe sub-headers. |

### Groceries Screen

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| To-get / done section split with counts | Users need to see what still needs buying at a glance. Table stakes for any grocery/todo app (Apple Reminders, AnyList, OurGroceries). | Low | Already implemented: `uncheckedItems` ("To Buy") and `checkedItems` ("Completed") sections with overline labels. | Rename labels to "TO GET" and "DONE" per spec. Add item counts: "TO GET . 5 items" and "DONE . 3 items". Wrap each section in a Card. Styling update only. |
| Custom circle checkboxes | Ionicons square checkboxes look like a web app, not a native mobile app. Circle checkboxes (like Apple Reminders) feel more polished. | Low | Currently uses `Ionicons` checkbox/square-outline icons (`size={24}`). | Spec: 22px circle View, textTertiary (#AEAEB2) border when unchecked, brand bg with white checkmark when checked. Build as a small presentational component. |
| Member attribution on items | "Who added this?" prevents confusion and duplicates. Important for shared lists where multiple people contribute. | Med | Items have `created_by` field in database. This data is fetched but not displayed. | Show 22px avatar next to each item row showing who added it. Requires: (1) fetching profile data for item creators, (2) passing to row renderer. The profiles query pattern already exists in the codebase. |
| Styled quick-add input | Adding items must be frictionless and look intentional. | Low | Already exists: `TextInput` with `rounded-xl border border-gray-200` + `Ionicons add-circle` icon button at 36px. | Restyle input: card bg, border color per spec. Replace Ionicons circle with a 44px square button (brand bg, 12px border-radius, white "+" icon). |

### Chores Screen

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Stats row (pending/disputed/streak) | Quick status overview. Users want a performance snapshot before scanning the list. | Low | Already implemented: 3 stat cards showing Pending, Overdue, Streak in a row with `bg-primary-100`, `bg-red-100`, `bg-green-100`. | Restyle: Pending uses warning (#F4A261) color, rename "Overdue" to "Disputed" with danger (#E5383B) color, Streak keeps brand color + fire emoji. Use overline-style labels below numbers. |
| Your chores vs household split | "What do I need to do?" is the primary question. Separating personal from household reduces cognitive load. | Low | Already implemented: "My Chores" and "Household Chores" sections with overline labels and rounded card containers. | Rename to "YOUR CHORES" and "HOUSEHOLD". Update overline styling to match spec (11-12px, uppercase, textTertiary, wide letter-spacing). |
| Emoji chore icons | Emoji are universally understood, fun, and break up text-heavy lists. AnyList, Tody, and other chore apps use visual categorization. | Med | Currently uses Ionicons (`restaurant-outline`, `trash-outline`, `home-outline`, etc.) for chore type identification. | Map chore names to emoji per spec (Dishes=plate, Laundry=basket, Vacuum=broom, Folding=shirt, Trash=bin, Bathroom=shower, Cooking=pan, Default=checkmark). Display in 40px icon container with warningLight bg. Requires string-matching logic against chore name or a stored category field. |
| Dispute visual highlighting | Disputes are urgent. They must visually demand attention. Red border and tinted background make them impossible to miss. | Low | Currently: "Disputed" text badge in `rounded-full bg-amber-100` with amber text. No row-level highlighting. | Spec: dangerLight (#FFE5E5) bg tint on entire row, dangerLight border on icon container. Much more visually aggressive than current amber badge -- appropriate because disputes represent trust issues. |
| Checkmark completion button | Chore completion must feel satisfying with a clear visual affordance. | Low | Currently: 36px green circle with Ionicons checkmark. Works but undersized. | Spec: checkmark button with brand border and brand checkmark icon. Maintain the existing `handleComplete` flow. Size to at least 40px. |

### Tab Bar & Navigation

| Feature | Why Expected | Complexity | Existing State | Notes |
|---------|-------------|------------|----------------|-------|
| Branded tab bar | The tab bar is always visible. If it looks default/generic, the whole app feels generic. | Low | Current: 56px height, orange (#f9a825) active tint, gray inactive (#9ca3af), default Ionicons, cream bg (#fefdfb). | Spec: 84px height (includes safe area), card (#FFFFFF) bg, 1px top border (#F0EFEB), brand green (#2D6A4F) active color, textTertiary (#AEAEB2) inactive. Labels 10px/600 weight. Update in `_layout.tsx` `Tabs` component `screenOptions`. |
| FAB (floating action button) | Primary add action must be instantly accessible on list screens (Expenses, Chores). | Low | Already exists on Expenses and Chores: `h-14 w-14` (56px) circle, `bg-primary-500`, white "+" Ionicons, bottom-right. | Restyle: 52px, 16px border-radius (rounded square, not circle), brand bg, colored shadow (`0 4px 16px brand55`), white "+" icon at 22px with 2.5px stroke. |

---

## Differentiators

Features that elevate RoomY from "functional" to "delightful." Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Collapsible week-strip calendar | Most household apps show a full calendar or nothing. A compact week strip that expands to full month is a superior space-saving pattern while maintaining temporal context. | High | Current: full `react-native-calendars` Calendar component, always showing the entire month. Spec: custom 7-day week strip with day labels, date numbers, today highlight (brand fill + white text), event dots (small colored circles, max 3 per day), chevron toggle + pull handle for expand/collapse animation to full month grid. Cannot reuse `react-native-calendars` for week strip -- need a fully custom component. Use `react-native-reanimated` (installed) for smooth expand/collapse. Keep `react-native-calendars` for the expanded month view, OR build a custom month grid too (spec shows a custom one). This is the most technically complex UI element in the redesign. |
| Glassmorphism onboarding hero | Welcome carousel with translucent containers, backdrop blur, and decorative circles creates a premium first impression. Very few React Native apps attempt this because the CSS `backdrop-filter` pattern doesn't translate directly. | High | Nothing like this exists currently. Requires `expo-blur` (BlurView, not installed). Use `expo-blur`'s `BlurView` component with `tint="light"` and `intensity` props to approximate the CSS `backdrop-filter: blur(12px)` effect. Decorative circles are simple absolute-positioned `View` elements with `rgba(255,255,255,0.05)` backgrounds -- trivial once the base gradient is working. Note: `expo-blur` works in Expo Go (SDK 54 compatible). |
| Gradient color transitions between carousel slides | Smooth gradient background color interpolation as user swipes between onboarding slides. Creates a polished, intentional feel vs. abrupt color changes. | Med | Current carousel: static styling per slide, uses `ScrollView` with `pagingEnabled`. | Interpolate gradient colors based on scroll offset using `Animated.event` or `useAnimatedScrollHandler` (Reanimated). Map scroll position to start/end color arrays for `LinearGradient`. Three slide gradients: green-to-dark-green, purple-to-pink, orange-to-amber. |
| Weekly timeline on home screen | Vertical timeline showing this week's chores with completion status, date labels, and member avatars. Gives a "weekly planner" feel that no competitor offers on a household dashboard. | Med | Not implemented. Home screen currently shows module navigation cards and a full calendar. | Spec: "This week" section heading, date labels on left, vertical line (brand color for today, border color for other days), chore items with member avatar + task name. Done items get strikethrough + dimmed opacity + green checkmark. Requires fetching chore data for the current week on the home screen. |
| Module toggle cards with visual state changes | Toggle cards that change border color and icon background when active, with the whole card as the tap target. More engaging than a plain switch list. | Med | `module-quiz.tsx` exists but likely uses simple switches. | Active: 2px brand border, brandLight emoji container bg, brand toggle. Inactive: 2px border-color border, #F5F5F5 emoji container bg, gray toggle. Card-as-toggle pattern is more touch-friendly and visually engaging. |
| Settlement visual de-emphasis | Intentionally making resolved settlements visually quieter than outstanding expenses. Users' eyes should focus on what still needs attention. | Low | Currently settlements have green styling but same visual weight as expenses in the history list. | Dimmed text color for settlement names/descriptions, green amount with "-" prefix. Subtle but effective information hierarchy that polished finance apps (Venmo, banking apps) all implement. |
| Streak celebration with fire emoji | Streak counter with fire emoji in the chores stats row. Light-touch gamification that encourages consistent chore contribution without being condescending. | Low | Streak number already computed and displayed. No emoji or celebration styling. | Add fire emoji next to streak number in brand color. Simple text addition with outsized psychological impact. |
| Empty states with personality | Friendly empty states with relevant emoji/illustration and helpful copy instead of generic "No items" text. | Low | Current empty states exist (expenses, groceries, chores) with Ionicons in circles + text. Functional but generic. | Spec says: "Never just a generic icon + 'No items.'" Include relevant illustration or emoji, friendly headline, and helpful subtitle. Update copy to be warmer. |

---

## Anti-Features

Features to explicitly NOT build during this redesign.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Dark mode | Doubles the design surface area. The color system already involves brand colors, semantic colors, member gradient colors, and glassmorphism effects. Adding dark mode multiplies testing and makes gradient/blur combinations much harder to tune. Not needed for personal-use v1. | Build the light mode color system with design tokens that COULD support dark mode later (all colors referenced by token name, not hardcoded). But do not implement the dark variant. |
| Animated micro-interactions everywhere | Tempting to add spring animations, haptic feedback, parallax scrolling, and entrance animations. Massively increases scope, creates performance concerns on lower-end devices, and risks feeling gimmicky. | Limit animation to 4 interactions: (1) carousel slide/gradient transitions, (2) toggle switch knob, (3) calendar expand/collapse, (4) checkbox check/uncheck. Everything else should be instant state changes. |
| Custom icon library | The mockups use inline SVGs, which might tempt replacing Ionicons with a custom set like Lucide or Phosphor. This requires auditing every icon usage and potentially missing glyphs. | Keep `@expo/vector-icons` (Ionicons) for all icons except where emoji are explicitly specified (chore types, onboarding badges, celebration screens). Ionicons already covers all needed glyphs. |
| Skeleton loading screens | Shimmer/skeleton loading states look premium but represent significant implementation effort for every screen -- multiple placeholder shapes matching each real layout. | Keep `ActivityIndicator` loading pattern, update color from orange to brand green (#2D6A4F). Focus effort on meaningful UI rather than loading decoration. |
| Custom pull-to-refresh animation | Custom refresh indicators (bouncing logos, animated icons) are complex and fragile across platforms. | Use React Native's built-in `RefreshControl` with `tintColor` set to brand green. Already works on all screens that support it. |
| History filter UI | The spec mentions a "Filter" link on the expenses history section. Tempting to build a filter bar with category tabs, date range picker, member filter. This is a feature, not a visual redesign. | Keep the "Filter" as a text link. If tapped, either show a simple ActionSheet with options or defer entirely -- the filter functionality is a future feature addition. |
| Custom fonts | The spec uses system fonts (`-apple-system, BlinkMacSystemFont`). Installing and configuring `expo-font` with custom typefaces adds startup time and complexity. | Use system fonts via NativeWind's default font stack. The spec intentionally chose system fonts for performance, consistency with platform conventions, and zero-config deployment. |
| Rebuilding the month calendar from scratch | The reference mockup includes a custom full-month grid, which might suggest replacing `react-native-calendars`. That library is already installed, working, and handles edge cases (month transitions, localization). | Use `react-native-calendars` for the expanded month view. Build only the custom week strip for collapsed view. Hybrid approach saves significant effort. |
| Swipe gesture on onboarding carousel | The mockup shows page dots for carousel navigation, which tempts adding `react-native-pager-view` or gesture-based swiping with spring physics. | Use the existing `ScrollView` with `pagingEnabled` pattern from current `welcome.tsx`. It already supports swipe gestures natively. Add the gradient interpolation on top. No new library needed. |

---

## Feature Dependencies

```
Design tokens (colors, typography, shadows in tailwind.config.js)
  --> All shared components (Avatar, Badge, Card, Button, Toggle, Icon Container)
    --> Every screen rebuild depends on shared components being available

expo-linear-gradient (NEW dependency, must install)
  --> Avatar gradient backgrounds
  --> Onboarding welcome carousel hero gradients
  --> Balance summary card dark gradient
  --> Setup choice card icon containers
  --> Invite code celebration (optional, could use brandLight bg instead)

expo-blur (NEW dependency, must install)
  --> Glassmorphism containers in onboarding welcome carousel ONLY
  --> Not needed elsewhere in the app

Avatar component (depends on: expo-linear-gradient + design tokens)
  --> Members card on Home screen
  --> Balance cards on Expenses screen
  --> Grocery item member attribution rows
  --> Chore assignment rows
  --> Onboarding display name preview
  --> Weekly timeline on Home screen

Card component (depends on: design tokens)
  --> Every screen's content containers

Badge component (depends on: design tokens)
  --> Chore frequency labels
  --> Chore dispute status
  --> Due date indicators

Week-strip calendar (custom component, depends on: design tokens + react-native-reanimated)
  --> Home screen calendar card
  --> Expand/collapse to month view

Balance data query on home screen (NO UI dependency -- data wiring)
  --> Balance summary card rendering
  --> Reuses `get_household_balances` RPC already called by expenses.tsx

Attention feed data aggregation (NO UI dependency -- data wiring)
  --> Needs-attention section on home screen
  --> Queries pending chores, active disputes, possibly grocery changes

Chore emoji mapping (depends on: design tokens for icon containers)
  --> Chore screen emoji icons
  --> Weekly timeline chore display on home screen
```

**Critical path:** Design tokens --> Shared components --> Screen rebuilds (onboarding first, then home, then remaining tabs)

---

## MVP Recommendation

### Build in this order (respects dependencies):

1. **Design tokens + Tailwind config** -- Everything depends on this. Replace orange palette with green brand system. Add semantic colors, neutral colors, shadow tokens. Zero visual change until screens adopt new classes, but unlocks all subsequent work. Install `expo-linear-gradient` and `expo-blur` at this stage.

2. **Shared components: Avatar, Badge, Card, Button, Icon Container, Toggle** -- Build the component library before touching any screens. Avatar is most complex (gradient + deterministic color assignment + 6 sizes). Card, Badge, Button are simple wrappers. Toggle needs Reanimated for smooth animation.

3. **Onboarding flow rebuild** -- First impression matters most. Users see this before anything else. Welcome carousel is highest-complexity feature but highest-impact on perceived polish. Rebuild all 7 onboarding screens in sequence.

4. **Home screen rebuild** -- Daily landing screen. Week-strip calendar is second-highest complexity. Balance summary card and attention feed add immediate functional value beyond visual polish.

5. **Expenses screen rebuild** -- Core money feature. Visual expense/settlement differentiation is high-value, low-effort. Balance cards need minor restyling.

6. **Groceries screen rebuild** -- Already close to spec (to-get/done split exists). Mostly styling updates + member attribution avatars + circle checkboxes.

7. **Chores screen rebuild** -- Already close to spec (my-chores/household split exists). Emoji icons, dispute highlighting, and stats row restyling are the main changes.

8. **Tab bar + navigation polish** -- Tab bar styling update, FAB shape change, spacing consistency pass across all screens. Do last because it touches the persistent navigation frame.

### Defer to post-redesign:

- **Dark mode**: Not appropriate for v1 scope. Design with tokens that could support it later.
- **History filtering**: Feature addition, not visual redesign.
- **Skeleton loading states**: Current loading indicators work fine with a color update.
- **Custom pull-to-refresh**: Diminishing returns for effort.

---

## Existing Code -- What Must Be Preserved

Each screen rebuild must preserve these existing behaviors without any backend changes.

| Screen | Data Fetching | Real-time | Navigation | Must Preserve |
|--------|---------------|-----------|------------|---------------|
| Home (`index.tsx`) | Members query (two-query pattern), calendar events (expenses + chores for month) | No | Tab navigation, settings push, event deep links | Invite code copy/share (solo-creator state), calendar month navigation, pull-to-refresh, conditional module cards based on `householdSettings` |
| Expenses (`expenses.tsx`) | Balances via `get_household_balances` RPC, expenses query, settlements query, profiles query | No | Expense detail push, settle push, add expense push | Venmo deep link (`handleVenmoRequest`), settle up navigation with params, request button, date grouping logic, pull-to-refresh |
| Groceries (`groceries.tsx`) | Grocery items query | Yes (Supabase realtime channel) | Complete trip push, trip history push, edit modal | Optimistic add/toggle/delete/update, swipe-to-delete via `ReanimatedSwipeable`, realtime subscription, quantity stepper, edit modal, keyboard handling |
| Chores (`chores.tsx`) | Chores, profiles (two-query), completions, disputed completions, stale dispute revert, swap count | No | Add chore push, swap request push, dashboard push | Complete/claim/dispute/swap actions with Alert confirmations, empty state with suggested chores, swap member picker modal, dispute revert logic |
| Onboarding (6 screens) | User profile CRUD, household creation, module settings | No | Sequential router.push flow | Auth flows (email + Google OAuth), household creation, invite code generation, module selection persistence, back navigation |
| Tab layout (`_layout.tsx`) | `householdSettings` from session context | No | Conditional tab visibility via `href` prop | `groceriesEnabled`/`choresEnabled` flags controlling whether Groceries/Chores tabs appear. Header right buttons per tab. |

**Key pattern to preserve:** The two-query pattern for household members + profiles (fetch `household_members`, then fetch `profiles` by user_ids, combine client-side). This pattern exists because PostgREST cannot follow the `household_members.user_id -> auth.users` FK to `profiles` directly.

---

## New Dependencies Required

| Package | Purpose | Expo Go Compatible | Confidence |
|---------|---------|-------------------|------------|
| `expo-linear-gradient` | Gradient backgrounds for avatars, hero sections, balance card, icon containers | Yes (part of Expo SDK) | HIGH -- official Expo package, documented at docs.expo.dev |
| `expo-blur` | BlurView for glassmorphism containers in onboarding welcome carousel | Yes (part of Expo SDK) | HIGH -- official Expo package, works in Expo Go |

No other new dependencies are needed. `react-native-reanimated` (animations), `react-native-calendars` (month calendar), `react-native-gesture-handler` (swipe), and `@expo/vector-icons` (Ionicons) are already installed.

---

## Sources

- Design Specification: `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/DESIGN_SPEC.md` (authoritative, project-internal)
- Reference Mockup: `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/reference-mockup.jsx` (visual target for main screens)
- Onboarding Mockup: `docs/roomy-gsd-ui-redesign/gsd-ui-redesign/onboarding-mockup.jsx` (visual target for onboarding flow)
- Existing codebase: all 4 tab screens, tab layout, welcome screen, package.json, tailwind.config.js (direct file inspection)
- [Expo LinearGradient documentation](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [Expo BlurView documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [react-native-calendar-strip](https://github.com/BugiDev/react-native-calendar-strip) (evaluated; not recommended -- custom build preferred for collapsible week/month pattern)
- [react-native-calendars by Wix](https://github.com/wix/react-native-calendars) (already installed, keep for expanded month view)
- [Implementing Liquid Glass UI in React Native](https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/) (glassmorphism patterns reference)

---
*Feature research for: RoomY UI Redesign milestone*
*Researched: 2026-03-12*
