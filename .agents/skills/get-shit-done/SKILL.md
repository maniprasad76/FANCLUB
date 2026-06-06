---
name: "get-shit-done"
description: "Context engineering and spec-driven methodology to prevent context loss during complex feature implementations."
---

# Get Shit Done (GSD) Methodology

ACTIVATE THIS SKILL when tackling large, complex architectural changes, building new extensive features, or when the user explicitly requests the "GSD" workflow.

## The GSD Cycle

Never attempt to build a massive feature in a single unstructured prompt. Instead, operate using the strict GSD Cycle:

1. **Spec (Specification Phase)**
   - Before writing code, deeply understand the user's requirement.
   - Create or update the `PRD.md` (Product Requirements Document) or feature spec.
   - Clarify edge cases, data structures, and UI states. Do NOT proceed until the spec is crystal clear.

2. **Plan (Context Engineering)**
   - Draft an `implementation_plan.md`.
   - Break the overarching spec into **atomic, manageable steps**.
   - Identify precisely which files will be touched.
   - **Crucial:** Isolate the working context. Close unrelated files mentally. Focus only on the files relevant to the current atomic step to save token bandwidth and prevent hallucinations.

3. **Execute (Atomic Implementation)**
   - Write the code for *only one atomic step at a time*.
   - Strictly follow existing project conventions (design system, types, error handling).
   - Do not stray into refactoring unrelated code unless explicitly requested.

4. **Verify (Testing & Review)**
   - Verify the atomic step via static analysis (e.g., `npm run typecheck`, `npx knip`) or tests.
   - Ensure the UI matches the design tokens.
   - Once verified, tick the item off in `task.md` and move to the next atomic step in the Execute phase.

## Core Rules of GSD
- **No Yolo Coding:** Always map out the plan before touching the code.
- **Micro-Commits / Micro-Steps:** Work in small, verifiable chunks.
- **External Memory:** Keep track of your place in the project using `task.md` so you don't forget what has been done and what remains if the context window gets crowded.
