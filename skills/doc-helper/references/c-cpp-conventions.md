# C and C++ Documentation

Load only after resolving the file/region as C, C++ or a genuinely shared header per language-routing.md. Preserve existing plain comments or Doxygen style; default to `/** ... */` Doxygen when no convention exists. Do not require Doxygen installation to write comments.

## Shared declaration rules

- Cover in-scope public functions, types, structs/unions, meaningful fields, enums/values, constants and public macros. Prefer the public declaration as the contract's home; keep implementation comments about internal decisions rather than duplicating the whole contract.
- Use a short summary, `@param` for parameter meaning, and `@return`/`@retval` for meaningful results/status values. Add `[in]`, `[out]` or `[in,out]` only when supported by actual access/mutation. Preserve the existing `@` versus backslash tag style.
- For pointers and buffers, state evidenced nullability, sizes and units, valid ranges, overlap rules, ownership, release responsibility and lifetime. Distinguish checked errors from caller preconditions; missing validation does not imply inputs are safe or that an error is returned.
- Mention allocation, mutation or external effects only when supported by the implementation or verified called contracts. Returned borrowed memory must not be described as owned by the caller.
- Existing code remains authoritative: never add validation, casts, wrappers or declarations to make a documented guarantee true.

## C-specific semantics

Document error codes, sentinel values and output-parameter state on each relevant path. State whether errno is set only when implementation or a verified call establishes it. C has no native C++ exception contract: do not add `@throw` to describe a negative return code. Respect the configured C standard; avoid adding `//` comments when it does not permit them.

```c
/**
 * Copies bytes into caller-owned storage, allowing source/destination overlap.
 * @param[out] dst Non-null destination with at least capacity writable bytes.
 * @param capacity Destination capacity in bytes.
 * @param[in] src Non-null source with at least count readable bytes.
 * @param count Number of bytes to copy; zero still requires non-null pointers.
 * @retval 0 Bytes copied; no terminator is appended.
 * @retval -1 A pointer is null or count exceeds capacity; dst is unchanged.
 */
int copy_bytes(char *dst, size_t capacity, const char *src, size_t count) {
    if (!dst || !src || count > capacity) return -1;
    memmove(dst, src, count);
    return 0;
}
```

## C++-specific semantics

Include public constructors, methods, overloads and templates. Use `@tparam` for meaningful template constraints, not the type parameter's name alone. Distinguish owned objects, borrowed references/pointers, move effects, invalidation and RAII cleanup where established.

Describe exceptions that actually escape and proven exception-safety guarantees; caught exceptions are not escaping exceptions. `noexcept` does not prove called code cannot fail: if an exception escapes a noexcept function, termination is distinct from a caller-catchable exception. Do not invent a strong exception guarantee or claim all destructors are harmless.

For headers shared by C and C++, keep the shared API's comments C-compatible; document C++-only declarations under their existing guards without changing guards or linkage.

## Inline comments and validation

Explain resource lifetime, synchronization, preprocessor constraints and boundary arithmetic where non-obvious. Preserve pragmas, analyzer/formatter directives and macro continuations. Do not insert comments after a macro continuation backslash or alter token boundaries. Avoid nested block comments; retain declaration/definition relationships.

Use the existing build context (include paths, defines, language mode and standard) and documentation checks. A guessed compiler invocation with missing headers is not evidence of a comment regression. When compilers or Doxygen are absent, inspect placement/contracts and report environment checks unverified; do not install tools or change build files.
