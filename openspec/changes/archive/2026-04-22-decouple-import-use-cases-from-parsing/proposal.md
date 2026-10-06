## Why

Four use cases — `ImportLandingNodesUseCase`, `ExportLandingNodesUseCase`, `ImportActionsUseCase`, `ExportActionsUseCase` — depend directly on `ImportExportClient` from the data layer. This breaks Clean Architecture's dependency rule: domain use cases must depend only on domain contracts, not on infrastructure classes. As a result, use cases own ZIP parsing/generation orchestration that belongs at the edge.

A prior narrow refactor (archived `remove-file-type-from-use-cases`) introduced a `BinaryData` value object and replaced `File[]` with `BinaryData[]` in use case signatures. This addressed the letter of the issue but not its spirit — the use case still imported `ImportExportClient` and still orchestrated ZIP unpacking. This proposal completes that work properly.

## What Changes

- Remove `ImportExportClient` from all four use case constructors.
- Change **import** use case signatures to accept already-parsed domain input (e.g., `ReadonlyArray<PersistedLandingNodeWithPermissions>`) instead of binary files.
- Change **export** use case signatures to return the data to be exported (e.g., `Promise<PersistedLandingPageWithPermissions[]>`) instead of triggering the ZIP download themselves.
- Introduce four **webapp-layer services** that orchestrate the infrastructure work around each pure use case:
  - `LandingImportService` — parses `File[]` → calls import use case
  - `LandingExportService` — calls export use case → triggers ZIP downloads
  - `ActionImportService` / `ActionExportService` — same pattern for actions
- Services live in `src/webapp/services/` and take `ImportExportClient` + the corresponding pure use case as constructor dependencies.
- `CompositionRoot` instantiates the services and binds their `execute` methods into the existing `landings.import` / `landings.export` / `actions.import` / `actions.export` slots. The public API of `CompositionRoot` is preserved.
- Update `ImportExportClient.import<T>` to accept `ReadonlyArray<ArrayBuffer>` directly (no more `BinaryData`).
- Remove the now-redundant `BinaryData` domain type and the `src/webapp/utils/binary-data.ts` helper — both become internal details of the services.

## Capabilities

### New Capabilities

_(none — no new behavior)_

### Modified Capabilities

_(none — no spec-level behavior changes; this is a structural/architectural refactor preserving existing behavior)_

## Impact

- **Domain use cases** (4 files): constructors shrink (no `ImportExportClient`); `execute()` signatures change from binary input/void output to parsed input / returned data.
- **Data layer**: `ImportExportClient.import<T>` signature becomes `(files: ReadonlyArray<ArrayBuffer>)`. `ImportExportClient` remains a concrete data-layer class, just no longer injected into use cases.
- **New webapp services**: Four thin classes in `src/webapp/services/` that compose a pure use case with `ImportExportClient`. Each service has one `execute` method matching the old use case public signature.
- **CompositionRoot**: Constructs services and binds their `execute` into the returned object. External callers (UI components) see the same API they had before.
- **Webapp components** (`LandingPageListTable.tsx`, `ActionListTable.tsx`): No call-site changes needed — public API is preserved.
- **Deleted**: `src/domain/entities/BinaryData.ts`, `src/webapp/utils/binary-data.ts`.
- **Tests**: No existing tests exercise these use cases. Pure use cases become viable for unit testing as a follow-up.
- **Breaking changes**: Internal only — public app behavior unchanged.
