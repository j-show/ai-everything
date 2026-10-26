# JSDoc Conventions

Load during Step 2 only for resolved JavaScript/TypeScript files, including JSX/TSX, MJS/CJS, MTS/CTS and declaration variants. Keep valid existing style; default to JSDoc when no convention exists.

## Coverage

Document: functions, methods, classes, interfaces (each property), types, enums, constants (exported; complex internals by default).

## Per-symbol minimum

| Element | Required |
| ------- | -------- |
| All | One-sentence **current** behavior |
| Parameters | `@param` for semantics not already clear from the signature |
| Return | `@returns` for meaningful result semantics when not void |
| Errors | Document escaping errors, including calls; distinguish synchronous throws from promise rejections |
| Async | Describe resolution, rejection, and caught-error fallbacks in `@returns`; if using `@throws` for rejections, label them explicitly |

For untyped JavaScript, derive documented types from verified contracts, implementation and callers, not identifier names. A truthiness guard does not prove a string type. If no narrower contract exists, omit the type or use `{*}` and describe the actual constraint; do not turn an observed sample argument into the only accepted type.

## TypeScript

Prefer existing signatures for types; JSDoc for semantics signatures omit (side effects, `ms`/`px`, defaults). In JavaScript, use an existing named type or `@typedef` when a complex object needs a documented shape. Do not add TypeScript declarations or repeat complete TS types just to document them. Declaration files describe contracts; inspect implementations/callers before asserting runtime behavior.

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

Match all branches and optional params; do not document removed parameters or wrong return shapes. Preserve public interface property meanings without repeating their type annotations.

## Inline comments and environment

Use `//` or the existing block style; in JSX use valid comment placement such as `{/* ... */}` only where needed. Keep lint suppressions, type directives, source-map annotations and bundler hints unchanged. Never add a line break after `return`/`throw` just to make room for a comment, or restructure an expression-bodied callback; put its explanation immediately before the expression when no body exists.

Read the owning package's module mode, JS/TS configuration and existing checks per language-routing.md. Missing type/doc tooling is a reported validation gap, not permission to install it. Do not treat JSDoc tags as a universal format for other languages.
