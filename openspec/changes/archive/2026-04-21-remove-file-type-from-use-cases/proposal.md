## Why

`ImportLandingNodesUseCase.execute(files: File[])` and `ImportActionsUseCase.execute(files: File[])` depend on the browser-specific `File` type. This breaks Clean Architecture's dependency rule — domain use cases must not depend on infrastructure/platform types. The use case should receive a domain-level input, with the web layer converting `File` objects before calling the use case.

## What Changes

- Introduce a domain value object `BinaryData` in `src/domain/entities/` to represent raw binary import data.
- Change the `execute` parameter type from `File[]` to `ReadonlyArray<BinaryData>` in `ImportLandingNodesUseCase` and `ImportActionsUseCase`.
- Update `ImportExportClient.import<T>` to accept `ReadonlyArray<BinaryData>` instead of `Blob[]`.
- Add the `File` → `BinaryData` conversion in the webapp layer (call sites) before invoking the use cases.

## Capabilities

### New Capabilities

_(none — this is a type-level refactor with no new behavior)_

### Modified Capabilities

_(none — no spec-level behavior changes, only a signature correction to enforce the dependency rule)_

## Impact

- **Domain use cases**: `ImportLandingNodesUseCase`, `ImportActionsUseCase` — parameter type change.
- **Data layer**: `ImportExportClient.import<T>` — accepts `ReadonlyArray<BinaryData>` instead of `Blob[]`, uses `JSZip.loadAsync(data.content)`.
- **Webapp layer**: Call sites convert `File[]` → `BinaryData[]` via `file.arrayBuffer()` before calling use cases.
- **Tests**: `BinaryData` is a behavior-free value object (plain interface, no logic) — no unit tests needed for the type itself. No existing tests exercise import signatures directly, so no test changes expected.
- **Breaking changes**: None at runtime — only internal type signatures change.
