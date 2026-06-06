---
name: "ralph-loop"
description: "An autonomous, stubborn iteration methodology (inspired by Ralph Wiggum) for relentlessly pushing through a complex problem until success criteria are met."
---

# Ralph Loop Methodology

ACTIVATE THIS SKILL when debugging stubborn errors, attempting complex algorithmic tasks, or when the user explicitly asks for "Ralph Mode" or "Ralph Loop".

## The Ralph Philosophy
"Clueless yet relentlessly persistent." 

When in a Ralph Loop, you do not stop working when you encounter a failure. Instead, you automatically evaluate the failure, adjust your approach, and try again. You keep looping until the task is definitively solved or a hard stop condition is met.

## Execution Rules

1. **Externalize State (`progress.txt`)**
   - Create a scratch file at `C:\Users\manip\.gemini\antigravity-ide\brain\current-conversation-id\scratch\progress.txt`.
   - Before every iteration, write down:
     - What you are about to attempt.
     - Why the last attempt failed (if applicable).
   - This prevents you from repeating the same mistake if your context gets overloaded.

2. **The Loop Structure**
   - **Attempt:** Write the code, run the script, or execute the test.
   - **Evaluate:** Read the terminal output or error logs.
   - **Success?** If the output matches the expected result, break the loop, delete `progress.txt`, and report success to the user.
   - **Failure?** Do NOT ask the user for help yet. Log the error in `progress.txt`, formulate a new hypothesis, and instantly start a new **Attempt**.

3. **Stubbornness & Boundaries**
   - Be extremely stubborn. Try alternative APIs, check documentation, add debug logging to see where the state diverges.
   - **Max Iterations:** Only break the loop and ask the user for help if you have failed 5 consecutive times on the exact same error, or if you require an API key/secret that is missing.

4. **Background Execution**
   - If a command takes a long time (e.g., waiting for a build to fail or pass), use background tasks. Do not wait synchronously. Let the task finish, evaluate the result via message notifications, and continue the loop.
