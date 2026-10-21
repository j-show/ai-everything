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
| Errors | Document escaping errors, including calls; distinguish synchronous throws from promise rejections |
| Async | Describe resolution, rejection, and caught-error fallbacks in `@returns`; if using `@throws` for rejections, label them explicitly |

## TypeScript

Prefer signatures for types; JSDoc for semantics signatures omit (side effects, `ms`/`px`, defaults). Use `@typedef` or named types for complex objects.

## Error semantics example

Trace errors supported by the implementation or a verified callback contract; a `try/catch` alone does not prove that its callee throws. Do not list caught errors as escaping errors.

```ts
/**
 * Loads text, converting a rejected load promise to null.
 * @param key - Non-empty lookup key.
 * @param load - Loader called with the key; synchronous throws and rejections are allowed.
 * @returns A promise resolving to loaded text, or null if the load promise rejects.
 * @throws {TypeError} If key is empty.
 * @throws Propagates errors thrown synchronously by load.
 */
function readOrNull(
  key: string,
  load: (key: string) => Promise<string>,
): Promise<string | null> {
  if (!key) throw new TypeError('key is required');
  return load(key).catch(() => null);
}
```

Here `load(key)` executes before `.catch` is attached, so synchronous errors escape. Returning `load(key)` directly would propagate its rejection; an `async` wrapper instead turns escaping throws into rejections. A surrounding `try/catch` catches a promise rejection only when that promise is awaited inside it.

## `@example`

Only for non-obvious public/exported APIs and class methods. **One example per overload shape.** Skip trivial wrappers.

## Third-party libraries

Follow the evidence and fallback table in SKILL.md: verify the installed/locked version and local evidence first, then consult Context7 or matching official docs for missing facts. Type declarations document a contract; they do not prove runtime behavior was tested.

## Quality

Match all branches and optional params; do not document removed parameters or wrong return shapes.
