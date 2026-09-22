## Context

`ImportLandingNodesUseCase` and `ImportActionsUseCase` declare `execute(files: File[])`, coupling the domain layer to the browser-specific `File` API. The downstream `ImportExportClient.import<T>` currently accepts `Blob[]` and passes each blob to `JSZip.loadAsync()`, which accepts `Blob | ArrayBuffer | Uint8Array | string | ReadableStream`.

## Goals / Non-Goals

**Goals:**
- Remove browser `File` and `Blob` dependencies from domain use case signatures.
- Define a domain-level value object for binary import data.
- Keep the web layer responsible for converting `File` objects into the domain type.

**Non-Goals:**
- Abstracting `ImportExportClient` behind a domain port (proposal #2).
- Changing import/export runtime behavior.

## Decisions

**Introduce a domain value object `BinaryData` instead of using `Blob` or `ArrayBuffer` directly.**

Both `Blob` and `File` are Web API types — using either in the domain layer violates the dependency rule. `ArrayBuffer` is a JS language primitive available everywhere, but wrapping it in a named domain type makes the intent explicit and is consistent with how the domain already uses named types (`TranslatableText`, `LandingPagePermission`).

```ts
// src/domain/entities/BinaryData.ts
export interface BinaryData {
    readonly content: ArrayBuffer;
}
```

The conversion chain becomes:
```
webapp (File[]) → map to BinaryData[] via file.arrayBuffer() → use case → data layer
```

`ImportExportClient.import<T>` changes from `Blob[]` to `ReadonlyArray<BinaryData>` and calls `JSZip.loadAsync(data.content)` instead of `JSZip.loadAsync(blob)`. This is safe because `JSZip.loadAsync` already accepts `ArrayBuffer`.

**Alternative considered: use `ArrayBuffer` directly without a wrapper.**
Simpler, but loses semantic naming. A `BinaryData` type also keeps the door open for adding `mimeType` or `filename` if future use cases need it, without changing signatures again.

**No tests for `BinaryData` itself.**
It is a behavior-free value object (plain interface, no logic, no invariants). Testing it would only assert what the TypeScript compiler already guarantees.

## Risks / Trade-offs

- **Async conversion**: `File.arrayBuffer()` is async, so the webapp layer needs an `await` before calling the use case. This is a minor change in the UI component call sites.
- **Memory**: `ArrayBuffer` loads the full file into memory (same as current `Blob` behavior with JSZip, so no regression).
- **Scope creep**: This design intentionally does NOT address the other data-layer dependencies in these use cases (`ImportExportClient`, `PersistedLandingNode*`). Those are separate proposals (#2, #4).
