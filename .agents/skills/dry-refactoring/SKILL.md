---
name: dry-refactoring
description: Guided workflow to eliminate copy-paste duplication detected by jscpd. Refactor clones using extract function, module, constant, or base class strategies.
---

# dry-refactoring

Guided workflow to eliminate copy-paste duplication in source code. Use after running [jscpd](../jscpd/SKILL.md) to detect clones.

## Prerequisites

First, run jscpd to identify duplications:

```bash
pnpm.cmd exec jscpd --reporters ai <path>
```

See the **[jscpd](../jscpd/SKILL.md)** skill for full option reference.

## Workflow

1. Run jscpd with `--reporters ai` on the target path
2. Parse each clone line to identify the two duplicated locations (file + line range)
3. Read both code fragments from the source files
4. Understand what the duplicated code does
5. Design a refactoring: extract a shared function, class, module, or constant
6. Apply the refactoring — update both locations and all other usages
7. Re-run jscpd to confirm the clone is eliminated
8. Repeat for remaining clones, highest-impact first

## Refactoring Strategies

**Extract function** — when the duplicate is a block of logic:
```ts
// Before: same block in two places
// After: shared function called from both places
```

**Extract module/utility** — when the duplicate spans multiple files in different domains:
```ts
// Move shared logic to a shared utility file and import it
```

**Extract constant or config** — when the duplicate is repeated data or configuration.

**Template/base class** — when the duplicate is structural (e.g., repeated class shape).

**Parameterize** — for `(renamed)` clones. The two sides are the same algorithm over different names or values, so the things that differ become parameters:
```ts
// Before: computeCartTotal(items) and computeBasketTotal(entries), same body, other names;
//         limits-dev.js and limits-prod.js, same shape, other numbers
// After: one function whose parameters are the identifiers that differed,
//        or one function reading the values that differed from a config object
```
A renamed clone whose only difference is a literal is a missing constant or config entry, not a missing function.

**Unify near-miss copies** — for `[~N gap]` clones. Read the unmatched lines: the gap is the one place the copies diverged, typically a guard, a log call or an extra field. Extract the common body and pass the divergence in:
```ts
// Before: saveUser and saveAccount, identical except one inserted validation line
// After: one saveRecord(record, { validate }) with the inserted line behind the option,
//        or the inserted line moved to the caller before the shared call
```
If the gap changes the meaning rather than adding a step, keep two functions but extract the shared halves.

**Merge similar functions** — for `[~N ast]` clones. The structure matches but names, literals and some statements do not. Diff the two functions first; the `ast` score tells how much is shared (`0.9` is a copy with one edit, `0.75` a copy with a couple of added statements plus renames). Extract the shared skeleton and inject what differs, as arguments, a strategy object, or a callback:
```ts
// Before: buildInvoice(order, customer, taxRate) and buildCreditNote(refund, account, vatRate):
//         same loop, same rounding, one extra guard and one extra log call in the second
// After: buildDocument(source, party, rate, { filter, onBuilt }) used by both
```
Below about `0.8` the pair usually shares an idiom, not an implementation; leave those alone unless the summary shows the file is a hotspot anyway.

Always ensure:
- All call sites are updated, not just the two reported by jscpd
- Tests still pass after refactoring
- The extracted abstraction has a clear, descriptive name
- The re-run uses the same detection flags as the run that found the clone

## Tips

- Start with clones that have the highest line count — they have the most impact
- Use the summary's `dup%` column to order the work: a large file with a high share of duplicated lines pays back first
- A clone between test files may indicate a missing test helper
- Clones across unrelated modules may signal a missing shared utility
- A cross-format clone (same logic in a `.js` and a `.ts` file, found with `--cross-formats`) often means code was ported without deleting the original — consolidate into one implementation (usually the TypeScript one) and update imports, rather than extracting a third shared copy
- Many `(renamed)` clones in one file usually mean one abstraction is missing, not many: look for the shared shape before extracting pair by pair. Many `(renamed)` clones across *test* files usually mean nothing: test cases are supposed to look alike
- Do not gate CI (`--threshold`, `--fail-on-new-clones`) on the Type-2/Type-3 passes until the team has reviewed what they report on this codebase; gate on the exact run
- `--similarity` covers JavaScript, TypeScript, Python, Java, Kotlin, Scala, C#, Go, Rust, C, C++, PHP, Ruby, Swift and Clojure, also inside Markdown code blocks and Vue, Svelte and Astro scripts; for other languages rely on the exact and `--max-gap-lines` passes
- Use `--min-lines 10` to filter noise and focus on meaningful duplications
- Keep a separate `--baseline` per set of detection flags when gating CI: renamed and similar runs fingerprint clones differently from exact runs
