# RoomY UI Redesign — GSD Package

This folder contains everything you need to run the UI redesign as a GSD milestone.

## Files

| File                    | Purpose                                            |
|-------------------------|----------------------------------------------------|
| `MILESTONE_BRIEF.md`    | Paste the content between the `---` lines into GSD when it asks "What do you want to build?" |
| `DESIGN_SPEC.md`        | Design tokens, component specs, screen layouts (including onboarding). GSD subagents reference this during implementation. |
| `reference-mockup.jsx`  | Interactive React mockup showing the target UI for all 4 main screens. Subagents extract visual patterns from this. |
| `onboarding-mockup.jsx` | Interactive React mockup showing the target UI for the entire onboarding flow (8 screens). Click through with the nav bar at the bottom. |

## Setup Steps

### 1. Commit your current UI to a clean branch

```bash
git checkout -b ui-redesign
git add -A && git commit -m "checkpoint: pre-redesign UI"
```

### 2. Copy these files into your repo

```bash
mkdir -p docs/ui-redesign
cp MILESTONE_BRIEF.md docs/ui-redesign/
cp DESIGN_SPEC.md docs/ui-redesign/
cp reference-mockup.jsx docs/ui-redesign/
cp onboarding-mockup.jsx docs/ui-redesign/
git add docs/ui-redesign && git commit -m "docs: add UI redesign reference files"
```

### 3. Run the GSD milestone

```bash
/gsd:new-milestone
```

When GSD asks what you want to build, paste the content from `MILESTONE_BRIEF.md` (the section between the `---` markers).

### 4. During the GSD interview

GSD will ask clarifying questions. Key answers to have ready:

- **Tech stack**: tell it your actual framework (SwiftUI, React Native, Flutter, etc.)
- **Mapping**: say YES to `/gsd:map-codebase` — it needs to understand your current component structure
- **Parallelism**: Phase 1 is sequential (everything depends on it). Phase 2 (onboarding) can run independently of Phases 3–6 since it's a separate flow. Phases 3–6 could technically run in parallel since they're separate screens, but sequential is safer to avoid merge conflicts.
- **Verification**: enable the verifier agent — each phase should confirm no regressions

### 5. If a phase goes wrong

```bash
# Find the last good commit
git log --oneline

# Reset to the end of the previous phase
git reset --hard <commit-hash>

# Re-run just that phase
/gsd:resume-work
```

## Tips

- **Don't skip Phase 1** (design tokens). Every other phase depends on it. If you rush past this, subagents will hardcode colors and you'll have inconsistency everywhere.
- **Let GSD read the DESIGN_SPEC.md** — when it generates plans, check that the plan references this file. If it doesn't, mention it during review.
- **Adapt the spec to your stack** — the mockup is React JSX, but the DESIGN_SPEC.md is framework-agnostic. If you're on SwiftUI, the subagent should translate "border-radius: 16px" into `.cornerRadius(16)`, etc.
- **The emoji mapping is a suggestion** — if your backend already has chore categories, map the emojis to those categories instead of hardcoding by name.
