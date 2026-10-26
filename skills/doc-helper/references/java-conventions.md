# Java Documentation

Load only for resolved Java files during Step 2. Follow existing valid style; default to Javadoc when no style exists. Use only syntax/tags supported by the module's declared Java version and documentation tool.

## Coverage and format

- Document in-scope public classes, interfaces, records, enums, constructors and methods. Describe meaningful public fields/constants, enum values and record components. Internal symbols follow the SKILL.md scope rule.
- Put `/** ... */` on the declaration, before annotations. A short summary states behavior; `@param name` adds units, limits, nullability or side effects absent from the signature. Use `@param <T>` for meaningful generic constraints, not a restatement of `T`.
- Use `@return` (singular) for meaningful result semantics; omit it on constructors and void methods. Use `@throws ExceptionType` only for escaping exceptions supported by implementation or verified contracts, including unchecked exceptions.
- Preserve correct inherited documentation and supported `{@inheritDoc}` use. Describe an override's actual differences; do not duplicate a whole inherited contract or introduce incompatible promises.
- For records, document components at the record declaration following the project's Javadoc conventions; do not create accessors just to attach comments.

## Error and asynchronous semantics

Trace validation, calls and catch blocks. A declared `throws` clause is contract evidence, not proof that every execution throws. Caught exceptions returned as defaults are result behavior, not escaping errors.

For Future/CompletionStage/CompletableFuture, separate errors thrown before a future is returned from exceptional completion. Describe result, exceptional completion and recovery in `@return` or prose; distinguish a null completion value from returning a null future. Do not label all asynchronous failures synchronous `@throws`.

```java
/**
 * Returns a completed future, or rejects a missing value before returning it.
 * @param value text to include; must not be null
 * @return an already completed future containing value
 * @throws IllegalArgumentException if value is null
 */
public static CompletableFuture<String> ready(String value) {
    if (value == null) throw new IllegalArgumentException("value");
    return CompletableFuture.completedFuture(value);
}
```

If a future instead uses `exceptionally(error -> null)`, document recovery to null. Exceptions thrown by an earlier supplier call still escape synchronously unless enclosed by a relevant catch.

## Inline comments and validation

Use `//` or existing block-comment style for locking, resource lifetime, ordering and non-obvious branches. Preserve lint suppressions, formatter directives and annotation placement. Read the owning Maven/Gradle configuration and Java version; use existing available documentation checks per language-routing.md.

Avoid JS tags such as `@returns`/`@typedef`, brace-delimited JSDoc parameter types, invented thread-safety guarantees, and changing signatures or adding accessors for documentation. If Javadoc fails because of the new text, fix its tags, links or escaping; report unavailable toolchains or unrelated failures separately.
