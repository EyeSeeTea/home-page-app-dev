## Context

Four use cases currently depend on `ImportExportClient`:

| Use case | Current input | Current behavior |
| --- | --- | --- |
| `ImportLandingNodesUseCase` | `ReadonlyArray<BinaryData>` (ZIP blobs) | Unzips → merges → saves |
| `ImportActionsUseCase` | `ReadonlyArray<BinaryData>` (ZIP blobs) | Unzips → validates → saves |
| `ExportLandingNodesUseCase` | `string[]` (ids) | Fetches → zips → triggers download |
| `ExportActionsUseCase` | `string[]` (ids) | Fetches → zips → triggers download |

`ImportExportClient` uses `JSZip`, `FileSaver`, `fetch`, and `moment` — all browser/infrastructure concerns. Injecting it into use cases pulls that infrastructure into the domain.

A naive fix would expose `ImportExportClient` directly through `CompositionRoot` and have UI components call it around the use case. That works but leaks infrastructure into the public API: `CompositionRoot` should expose **application capabilities**, not raw infrastructure.

The right shape is a **webapp-layer orchestration service** per flow: each service takes a pure use case + the `ImportExportClient`, handles the File/ArrayBuffer/Zip conversions, and exposes a single `execute()` method with the same signature the use case used to have. `CompositionRoot` wires these services in place of the old use cases, so UI call sites don't change.

## Goals / Non-Goals

**Goals:**
- Remove `ImportExportClient` and `BinaryData` from the domain layer entirely.
- Use cases receive parsed domain input and return domain data; ZIP handling lives at the edge.
- Preserve the public API of `CompositionRoot` and all UI call sites.
- Preserve all observable behavior (same user flows, same outputs).

**Non-Goals:**
- Introducing a domain-level `ImportExportPort` interface. `ImportExportClient` is infrastructure that the webapp layer calls directly — no domain abstraction needed.
- Reshaping `PersistedLandingNode*` or `PersistedAction` types. Proposal #4 addresses that separately.
- Exposing raw `ImportExportClient` instances through `CompositionRoot`.
- Unit tests for the decoupled use cases (viable follow-up, not required here).

## Decisions

### Webapp-layer services encapsulate the orchestration

Each service lives in `src/webapp/services/` and composes two dependencies: the `ImportExportClient` for its namespace and the corresponding pure domain use case.

```ts
// src/webapp/services/LandingImportService.ts
export class LandingImportService {
    constructor(
        private importExportClient: ImportExportClient,
        private importUseCase: ImportLandingNodesUseCase
    ) {}

    public async execute(files: File[]): Promise<PersistedLandingNode[]> {
        const buffers = await Promise.all(files.map(f => f.arrayBuffer()));
        const items = await this.importExportClient.import<PersistedLandingNodeWithPermissions>(buffers);
        return this.importUseCase.execute(items);
    }
}
```

```ts
// src/webapp/services/LandingExportService.ts
export class LandingExportService {
    constructor(
        private importExportClient: ImportExportClient,
        private exportUseCase: ExportLandingNodesUseCase
    ) {}

    public async execute(ids: string[]): Promise<void> {
        const pages = await this.exportUseCase.execute(ids);
        await Promise.all(pages.map(page => this.importExportClient.export(page)));
    }
}
```

`ActionImportService` and `ActionExportService` follow the same shape.

### Use cases become pure

**`ImportLandingNodesUseCase`**:
```ts
execute(items: ReadonlyArray<PersistedLandingNodeWithPermissions>): Promise<PersistedLandingNode[]>
```
Strips `sharingSettings`, merges with existing landings, saves, merges permissions into `Settings`, returns the stripped nodes. Same body as today minus the `importExportClient.import()` call at the top.

**`ExportLandingNodesUseCase`**:
```ts
execute(ids: string[]): Promise<PersistedLandingPageWithPermissions[]>
```
Fetches persisted pages, filters by ids, composes with permissions from `Settings`, returns the result. No longer calls `importExportClient.export()`.

`ImportActionsUseCase` and `ExportActionsUseCase` are the simpler analogues.

### CompositionRoot wires services into the existing slots

```ts
const importLandingsUseCase = new ImportLandingNodesUseCase(landingPageRepository, settingsRepository);
const exportLandingsUseCase = new ExportLandingNodesUseCase(landingPageRepository, settingsRepository);
const landingImportService = new LandingImportService(importExportClientLandings, importLandingsUseCase);
const landingExportService = new LandingExportService(importExportClientLandings, exportLandingsUseCase);

return {
    landings: {
        // ...
        import: landingImportService.execute.bind(landingImportService),
        export: landingExportService.execute.bind(landingExportService),
        // ...pure use cases for other slots unchanged
    },
    // same pattern for actions
};
```

The existing `getExecute` helper binds `useCase.execute` to its owner. Services expose an `execute` method with the same shape, so they can be passed through `getExecute` too — or bound directly as above. Either approach works; the choice is an implementation detail.

### Alternatives considered

**A) Expose `ImportExportClient` on `CompositionRoot`, let components orchestrate.**
Simpler diff, but leaks infrastructure into the root's public API. UI components would need three calls (parse → use case → nothing for import; use case → zip for export) instead of one, duplicating orchestration at every call site. Rejected.

**B) Domain-level `ImportExportPort` interface, use case depends on it.**
Adds a layer of indirection for a use case that no longer needs to invoke ZIP machinery. If a future use case genuinely needs to parse files itself, a port can be added then. Rejected for now.

**C) Orchestration inside custom React hooks.**
Similar to services, but tied to React. Services are plain classes — they can be tested without a React renderer and don't require a provider. Preferred.

## Risks / Trade-offs

- **Added surface area**: Four new files (one per flow). Accepted cost for keeping the domain clean and `CompositionRoot` focused on capabilities.
- **Binding boilerplate**: `service.execute.bind(service)` repeats in the composition root. Acceptable — it's local and mechanical.
- **`PersistedXxx*` types still cross layers**: Use case signatures still mention `PersistedLandingNodeWithPermissions` (a data-layer type). That's a compromise — proposal #4 will address it by introducing pure domain types.
- **Memory**: Reading all files into `ArrayBuffer` at once matches the current `Blob` behavior (JSZip materializes them anyway), so no regression.

## Known Limitations (out of scope for this change)

This refactor resolves the `ImportExportClient` leak but leaves the following domain purity concerns to be addressed by later proposals:

- **`PersistedLandingNode*`, `PersistedLandingPageWithPermissions`, and `PersistedAction` still live in `src/data/entities/`** and are imported by the four touched use cases (as parameter and return types) and by the new webapp services. The dependency rule is technically still violated by these type imports — the "pure" claim here is narrowly about runtime behavior (no infrastructure class calls), not about layer-type hygiene. Relocating these types (or introducing mirrored domain DTOs with mapping at the repository boundary) is proposal #4.
- **`updateLandingNode` is imported from `src/data/repositories/LandingNodeDefaultRepository.ts`** into `ImportLandingNodesUseCase`. It is a pure helper but its current location crosses the dependency rule. Moving it to the domain layer (or behind the `LandingNodeRepository` interface) is also a proposal #4 concern.
- **Services live in `src/webapp/services/`** rather than a shared application layer. This is a pragmatic choice for a single-frontend project. If a CLI or second UI is ever added, the services should move to `src/application/services/` so they are reachable by any presentation. No action required today.
- **`UseCase` interface is effectively untyped** (`execute: Function`). The services pass the structural check the same way use cases do, which is why `getExecute` accepts them — but nothing verifies that a service's `execute` signature actually matches the use case it replaced. A per-slot typed composition helper would catch drift; out of scope here.

These are tracked as follow-ups; this change is scoped to removing the `ImportExportClient` dependency from the four use cases and pushing file/zip handling to the edge via services.

## Migration Plan

1. Create the four services in `src/webapp/services/`.
2. Update use case constructors and signatures to remove `ImportExportClient` and accept parsed input / return data.
3. Update `CompositionRoot` to construct use cases without `ImportExportClient`, construct services, and bind service `execute` methods into the landings/actions slots.
4. Update `ImportExportClient.import<T>` to take `ReadonlyArray<ArrayBuffer>`.
5. Delete `src/domain/entities/BinaryData.ts` and `src/webapp/utils/binary-data.ts`.
6. Apply the pre-existing Boy Scout cleanups in the use case files we're already touching.
7. Run `yarn lint` and `yarn test`; manually verify import/export flows in the dev server.

No rollback needed beyond git revert — the change is entirely internal and preserves the public API.
