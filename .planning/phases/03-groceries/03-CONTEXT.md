# Phase 3: Groceries - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared grocery list with real-time collaboration and one-tap expense splitting after a shopping trip. Users can add items, check them off while shopping, and convert the trip total into a split expense. This phase does NOT include chores (Phase 3.1), per-item price tracking, or offline support.

</domain>

<decisions>
## Implementation Decisions

### List interaction
- Each item has a name and a quantity (separate +/- stepper field, not parsed from text)
- Single flat list, newest items at top — no categories or sections
- Swipe left to delete, tap item to edit name/quantity
- Default quantity is 1

### Shopping mode
- No explicit "shopping mode" — checkboxes are always visible
- Checked-off items slide to a "Completed" section at the bottom, grayed out
- Fully collaborative — any household member can check off items at any time
- A prominent "Complete Trip" button appears when items have been checked off

### Expense conversion
- Single receipt total — user enters one number from the receipt
- Payer picker always shown (don't assume who paid)
- Member picker to select which household members are splitting this trip (not always all members)
- After trip completion, the trip is archived (items + total kept in history) and a fresh list starts
- Creates a standard expense using the existing Phase 2 expense system

### Real-time behavior
- Instant, silent updates — items appear/check off with subtle animation, no toasts
- No attribution — items are shared, no indication of who added what
- First-check wins on conflicts — no error messages, second person just sees it already checked
- Online only — requires connection, no offline queue

### Claude's Discretion
- Animation style and timing for real-time updates
- "Complete Trip" button placement and styling
- Trip archive UI and how to access past trips
- Empty list state design

</decisions>

<specifics>
## Specific Ideas

- Expense conversion should reuse the existing expense form patterns from Phase 2 (payer picker, member selection)
- Trip archive gives users a lightweight history of shopping runs without cluttering the active list

</specifics>

<deferred>
## Deferred Ideas

- Per-item price tracking / itemized splitting — user decided this adds complexity without real value (if you want separate items, just buy them yourself)
- Offline support with sync — deferred, most stores have signal

</deferred>

---

*Phase: 03-groceries*
*Context gathered: 2026-03-11*
