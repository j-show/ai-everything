# Language and Environment Routing

Load during Survey for code comments or project-configuration evidence. Resolve files individually; a root package.json does not make a mixed repository JavaScript.

## Per-file decision

1. Enumerate requested files, applying the SKILL.md ignore rules. Associate each with its owning module using the nearest applicable configuration, workspace membership and build targets; a nearby unrelated manifest is not proof of ownership.
2. Use the extension as a candidate, then check syntax and module/build evidence. Explicit language information must agree with the code; resolve conflicts before editing that file.
3. Record a compact working inventory: `path | language | module | selected rule | existing style | available check or gap`. Load only rules for supported languages actually being edited.
4. If evidence is insufficient, leave the file untouched, ask the narrow question and continue independent files. Unsupported languages are skipped and reported, not silently sent through a default route.

| Candidate | Initial identification | Disambiguation |
| --- | --- | --- |
| JS | `.js`, `.jsx`, `.mjs`, `.cjs` | Package module settings and JSX/tool configuration |
| TS | `.ts`, `.tsx`, `.mts`, `.cts`, including `.d.ts`/`.d.mts`/`.d.cts` | TS configuration; declarations describe contracts, not verified runtime behavior |
| Java | `.java` | Owning Java module and declared source/release level |
| Python | `.py`, `.pyi`; extensionless files with Python shebang | Syntax and module metadata; stubs expose contracts, not runtime bodies |
| C | `.c` | Compiler/build language overrides take precedence over the extension |
| C++ | `.cpp`, `.cc`, `.cxx`, `.c++`, `.hpp`, `.hh`, `.hxx` | Build settings; case-sensitive `.C` needs toolchain evidence |
| C or C++ | `.h`, `.inc`, or shared headers | Compile commands, target language and inclusion from known translation units; C-compatible syntax alone cannot decide |
| Unsupported | `.rb` → Ruby; `.rs` → Rust; other identified languages | Report unsupported; do not generate language-specific comments |

A header used by both C and C++ gets C-compatible shared declarations documented once, with C++-only declarations handled separately. If its actual consumers cannot be established, do not guess from its folder name alone. For mixed-language containers (for example a Vue script block), route only a confidently identified, requested code region; leave other regions untouched. If safe boundaries cannot be established, ask about that file.

## Existing environment, not environment setup

| Language | Read local evidence | Validation candidates, only when already configured/available |
| --- | --- | --- |
| JS/TS | Module package.json, lockfile, tsconfig/jsconfig, doc/lint configuration | Existing doc/lint/type command; JS syntax check where compatible |
| Java | pom.xml, build.gradle / build.gradle.kts, toolchain/release settings | Existing Javadoc/doclint or compile check using the declared version |
| Python | pyproject.toml, setup.cfg/setup.py as text, requirements/lock files, documented virtual environment, Sphinx/docstring lint config | Existing docstring/syntax/type check in the module environment |
| C/C++ | CMakeLists.txt, Makefile, compile_commands.json, Doxyfile, compiler flags | Existing documentation or syntax check with project includes, defines and language standard |

Read configuration without executing setup.py, build scripts or dependency hooks merely to discover metadata. Verify the command target and its effects before running it. A wrapper that downloads its runtime is not an available local check. Reuse an accessible module environment through its executable; do not install dependencies, activate a different global environment, or invent replacement project configuration.

When tools are absent, inspect syntax/placement and implementation evidence, then identify exactly which checks were not run. Check a compiler's real include/define context before treating a missing-header failure as a comment defect. Documentation tools are optional; their absence never justifies changing the requested comment format.
