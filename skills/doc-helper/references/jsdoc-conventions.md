# JSDoc Conventions

Load during Step 2.

## Coverage

Document: functions, methods, classes, interfaces (each property), types, enums, constants (exported; complex internals by default).

## Per-symbol minimum

| Element | Required |
| ------- | -------- |
| All | One-sentence **current** behavior |
| Parameters | `@param` |
| Return | `@returns` when not void |
| Errors | `@throws` when implementation throws |
| Async | Promise resolution in `@returns` |

## TypeScript

Prefer signatures for types; JSDoc for semantics signatures omit (side effects, `ms`/`px`, defaults). Use `@typedef` or named types for complex objects.

## `@example`

Only for non-obvious public/exported APIs and class methods. **One example per overload shape.** Skip trivial wrappers.

## Third-party libraries

Use Context7 (`resolve-library-id` → `query-docs`) before documenting library APIs or migrations.

## Quality

Match all branches and optional params; do not document removed parameters or wrong return shapes.
