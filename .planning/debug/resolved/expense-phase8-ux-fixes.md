---
status: resolved
trigger: "Fix 3 UX issues: balance row still navigable, member-history layout broken, expense row dropdown redesign"
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:05:00Z
---

## Current Focus

hypothesis: All three root causes confirmed and fixed
test: TypeScript compilation -- zero errors in changed files
expecting: All three issues resolved
next_action: Archive and commit

## Symptoms

expected:
  1. Tapping a balance member row should NOT navigate (RoommateSection handles per-member navigation)
  2. Member-history page should have safe area + back button
  3. Expense row dropdown should show payment status, not split amounts

actual:
  1. BalanceMemberRow wraps avatar+name in Pressable with onMemberPress that navigates to member-history
  2. member-history uses Stack.Screen for header but it's NOT registered in app/(app)/_layout.tsx so no header/back button renders
  3. ExpenseRow expanded section shows split amounts per member (share_amount) which is redundant

errors: UX/behavior issues, no crashes

reproduction: Navigate to Expenses tab and interact with each element

started: Since phase 8 was built

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-12T00:01:00Z
  checked: BalanceMemberRow.tsx lines 31-50
  found: Avatar+name wrapped in Pressable with onMemberPress callback. BalanceSection passes onMemberPress which navigates to member-history.
  implication: Issue 1 root cause confirmed -- need to remove Pressable wrapper and onMemberPress prop

- timestamp: 2026-03-12T00:02:00Z
  checked: app/(app)/_layout.tsx -- Stack.Screen registrations
  found: "expenses/member-history" is NOT registered as a Stack.Screen. Only add, [id], settle are registered. Without registration, headerShown defaults to false (parent Stack has headerShown:false).
  implication: Issue 2 root cause confirmed -- need to add Stack.Screen for member-history in the app layout

- timestamp: 2026-03-12T00:03:00Z
  checked: ExpenseRow.tsx lines 75-106, expense_splits schema
  found: Expanded section shows each split member's share_amount. The DB has no is_paid/paid_at column on expense_splits. Payment status must be derived from settlements data. User wants to see who has paid vs who hasn't for each expense.
  implication: Issue 3 requires redesign -- need to determine payment status by comparing splits against settlements, and show paid/unpaid status per member. The payer is always "paid", others need to be checked against settlements.

- timestamp: 2026-03-12T00:04:00Z
  checked: Database schema for expense_splits and settlements
  found: expense_splits has only (id, expense_id, user_id, share_amount). No payment tracking column. Settlements are separate records (paid_by, paid_to, amount). There's no direct link between a settlement and a specific expense -- settlements are general debt payments between users.
  implication: Cannot determine per-expense payment status from settlements since settlements are aggregate (not tied to specific expenses). Best approach: show the payer as "Paid" and all other split members as their share amount with "owes" semantics, since that's what the data actually represents. The settlement rows already appear alongside expenses in the history view.

## Resolution

root_cause:
  1. BalanceMemberRow has a Pressable onMemberPress that duplicates RoommateSection navigation
  2. member-history route missing from Stack.Screen registration in _layout.tsx (no header/back button)
  3. ExpenseRow expanded content shows raw split amounts without payment context

fix:
  1. Removed Pressable wrapper and onMemberPress prop from BalanceMemberRow. Removed onMemberPress prop from BalanceSection interface and usage. Removed onMemberPress from BalanceSection in expenses.tsx. Balance rows are now non-interactive (only Remind/Settle buttons remain).
  2. Added Stack.Screen registration for "expenses/member-history" in app/(app)/_layout.tsx with headerShown:true, matching existing screen style. This enables the native header with back button and safe area handling.
  3. Redesigned ExpenseRow expanded section: payer shows green checkmark + "Paid" label, other split members show red "Owes $X" text. Uses expense.paid_by to determine payer vs debtor -- no new props needed since expense object already contains paid_by.

verification: TypeScript compilation passes with zero errors in all changed files. All changes are minimal and targeted.

files_changed:
  - components/expenses/BalanceMemberRow.tsx
  - components/expenses/BalanceSection.tsx
  - app/(app)/(tabs)/expenses.tsx
  - app/(app)/_layout.tsx
  - components/expenses/ExpenseRow.tsx
