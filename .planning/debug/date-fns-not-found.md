# Debug: date-fns-not-found

## Issue
iOS Bundling failed because "date-fns" cannot be resolved from Chores/Dashboard screens.

## Symptoms
- App fails to bundle with "Unable to resolve 'date-fns'".
- Error: `Unable to resolve "date-fns" from "app/(app)/chores/dashboard.tsx"`

## Root Cause
`date-fns` is imported in multiple files (`app/(app)/chores/dashboard.tsx`, `app/(app)/(tabs)/chores.tsx`) but it is not listed as a dependency in `package.json`.

## Resolution
Install `date-fns` as a production dependency.

## Verification Plan
- [x] Install `date-fns`.
- [x] Verify `package.json` contains `date-fns`.
- [ ] (Manual) Bundling should now succeed.
