# Inline Comment Conventions

Load during Step 3.

## When to comment

- Recursion and termination
- Non-obvious branches
- Resource lifecycle
- Concurrency / ordering assumptions
- Magic numbers (meaning)
- External system contracts

## When not to comment

- Self-explanatory one-liners with clear names
- Facts already in JSDoc above the symbol

## Anonymous functions

Non-trivial callbacks: brief comment at **start of body** (why / invariant).

## Rules

- Match actual logic — no "maybe" / "probably" / "I think"
- Do not change structure for comments
- Do not duplicate JSDoc in the body
