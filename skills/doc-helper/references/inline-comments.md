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
- Facts already in the symbol's documentation

## Anonymous functions

Non-trivial callbacks: a brief comment at **start of an existing block body** (why / invariant). For expression bodies or lambdas, place the explanation before the containing statement; do not create a body to fit a comment.

## Rules

- Match actual logic — no "maybe" / "probably" / "I think"
- Do not change structure for comments
- Use the selected language's syntax, placement and version constraints; this shared file does not replace its language rule
- Preserve directive comments and macro/line continuations; those may affect tooling or executable behavior
- Do not duplicate symbol documentation in the body
