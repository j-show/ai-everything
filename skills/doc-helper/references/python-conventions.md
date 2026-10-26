# Python Documentation

Load only for resolved Python files during Step 2. Preserve the module's Google, NumPy, reST or plain-docstring style. Default to Google style when no convention exists; no documentation package is required.

## Coverage and placement

- Cover in-scope public modules, classes, functions and methods; document meaningful public attributes/constants in the existing convention. Respect explicit exports such as `__all__`, naming and caller evidence; do not infer every non-underscore name is a supported API.
- A docstring is the first statement of its module, class or function body. Preserve shebang and encoding comments; module docstrings precede `from __future__` imports. Do not add standalone string expressions elsewhere as substitute comments.
- Start with a short behavior summary. In Google style, add `Args:`, `Returns:`, `Yields:`, `Raises:` and `Attributes:` only when applicable and useful. Do not repeat complete annotated types. Explain defaults, units, mutation and resource ownership when relevant.
- Properties document access and assignment behavior without changing decorators or creating setters. Stubs describe declared contracts; inspect implementation/callers before asserting runtime details.

For a simple typed function such as `twice(value: int) -> int`, a summary like `"""Return value multiplied by two."""` is sufficient. Do not add `Args: value: Integer to double` and `Returns: Twice the input` just to fill sections; they repeat the signature and summary.

## Return, yield and error semantics

For generators, document yielded items using `Yields:`; do not call them a returned list. Separate generator final return values when significant. Generator bodies execute on iteration; consuming an input iterator advances its state, so do not claim the input is unchanged merely because elements are not assigned. For async functions, describe the awaited result and errors during awaiting; distinguish errors raised later by a returned iterator or task.

Only list escaping exceptions supported by code or verified calls. A caught exception converted to None/another value belongs in result semantics. A catch clause alone does not prove its callee raises that exception.

An `async def` containing `yield` is an async generator: document its values under `Yields:` and consumption with `async for`/`anext`, not an awaited function result. Its iteration-time errors belong to iteration, not to an ordinary coroutine return.

```python
def positive_values(values):
    """Yield positive values in their original order.

    Args:
        values: Iterable of values comparable to zero.

    Yields:
        Each input value greater than zero, in iteration order.
    """
    for value in values:
        if value > 0:
            yield value
```

## Docstrings are observable metadata

Normal additions/corrections may change `__doc__`; this is the allowed documentation change, not a promise of identical runtime state. Keep signatures, decorators, control flow and business expressions unchanged. Before editing, inspect relevant consumers/decorators for docstrings used as commands, queries, routes or other runtime configuration. If found, leave the affected symbol untouched, explain the consumer and impact, and ask only about that symbol; continue independent work. Ordinary help/documentation introspection does not require an extra approval.

## Inline comments and validation

Use `#` for implementation comments. Preserve indentation, encoding declarations, type comments, `# type: ignore`, `# noqa` and formatter directives; never turn a string consumed by code into a prose comment. Avoid inserting comments into explicit backslash continuations or expression-only lambdas; place the explanation before the statement without restructuring it.

Read pyproject.toml and other owning-module configuration; reuse its existing environment and docstring/syntax checks. Syntax checks do not prove docstring correctness or framework behavior. Do not import arbitrary modules or execute doctest examples just to inspect documentation. Report missing tools explicitly.

Avoid JSDoc tags, redundant type inventories, fabricated `Raises`, `Returns` for a generator's yielded items, and claims that docstring edits cannot affect runtime consumers.
