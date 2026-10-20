## 1. Make use cases pure (remove `ImportExportClient`)

- [x] 1.1 [BE] `ImportLandingNodesUseCase`: remove `importExportClient` from constructor, change `execute(files: BinaryData[])` → `execute(items: ReadonlyArray<PersistedLandingNodeWithPermissions>)`, remove the `.import()` call (items already arrive parsed)
- [x] 1.2 [BE] `ImportActionsUseCase`: remove `importExportClient` from constructor, change `execute(files: BinaryData[])` → `execute(items: ReadonlyArray<PersistedAction>)`, remove the `.import()` call
- [x] 1.3 [BE] `ExportLandingNodesUseCase`: remove `importExportClient` from constructor, change return type to `Promise<PersistedLandingPageWithPermissions[]>`, return the composed pages instead of calling `importExportClient.export()`
- [x] 1.4 [BE] `ExportActionsUseCase`: remove `importExportClient` from constructor, change return type to `Promise<PersistedAction[]>`, return the filtered actions instead of calling `importExportClient.export()`

## 2. Create webapp-layer services

- [x] 2.1 [FE] Create `src/webapp/services/LandingImportService.ts` — constructor takes `ImportExportClient` and `ImportLandingNodesUseCase`; `execute(files: File[])` does `File[] → ArrayBuffer[] → importExportClient.import<PersistedLandingNodeWithPermissions> → useCase.execute`
- [x] 2.2 [FE] Create `src/webapp/services/LandingExportService.ts` — constructor takes `ImportExportClient` and `ExportLandingNodesUseCase`; `execute(ids: string[]): Promise<void>` calls `useCase.execute` then `Promise.all(pages.map(p => importExportClient.export(p)))`
- [x] 2.3 [FE] Create `src/webapp/services/ActionImportService.ts` — analogue for actions; note that the old use case returned the saved items on success, so the service should preserve that return type (`Promise<PersistedAction[]>`)
- [x] 2.4 [FE] Create `src/webapp/services/ActionExportService.ts` — constructor takes `ImportExportClient` and `ExportActionsUseCase`; `execute(ids: string[]): Promise<void>` calls `useCase.execute` then `importExportClient.export(actions)`

## 3. Data layer

- [x] 3.1 [BE] Change `ImportExportClient.import<T>(files: ReadonlyArray<BinaryData>)` → `import<T>(files: ReadonlyArray<ArrayBuffer>)` in `src/data/clients/importExport/ImportExportClient.ts`; pass `buffer` directly to `JSZip.loadAsync`
- [x] 3.2 [BE] Delete `src/domain/entities/BinaryData.ts`
- [x] 3.3 [FE] Delete `src/webapp/utils/binary-data.ts` (no longer needed — orchestration lives inside services)

## 4. CompositionRoot wiring

- [x] 4.1 [BE] In `getCompositionRoot()`, construct the four use cases without the `ImportExportClient` argument
- [x] 4.2 [BE] Construct the four services, injecting `importExportClientLandings` / `importExportClientActions` and the corresponding pure use case
- [x] 4.3 [BE] Bind `landingImportService.execute` / `landingExportService.execute` into the `landings.import` / `landings.export` slots; same pattern for actions. Preserve the existing public API of `CompositionRoot`. Do not expose `ImportExportClient` instances on the returned object.

## 5. Webapp call sites

- [x] 5.1 [FE] Remove the `filesToBinaryData` import and inline conversion from `src/webapp/components/landing-page-list-table/LandingPageListTable.tsx` — call `compositionRoot.landings.import(files)` directly (public API preserved, service handles parsing internally)
- [x] 5.2 [FE] Remove the `filesToBinaryData` import and inline conversion from `src/webapp/components/action-list-table/ActionListTable.tsx` — call `compositionRoot.actions.import(files)` directly

## 6. Boy Scout cleanups (files already being touched)

- [x] 6.1 [BE] In `ExportLandingNodesUseCase.ts`, replace `.map(...).flat()` with `.flatMap(...)` when collecting `nodesToSaveIds`
- [x] 6.2 [BE] In `ExportLandingNodesUseCase.ts`, replace `nodes.filter(node => node.find(item => ids.includes(item.id)))` with `.some(...)` — the result is used as a boolean
- [x] 6.3 [BE] In `ExportLandingNodesUseCase.ts`, remove the misleading optional chain `sharings?.find(...)` — `sharings` is a `.then()` result and never undefined
- [x] 6.4 [BE] Replace the `await … .toPromise().then(…)` pattern with an intermediate `await` + separate transformation in both `ExportLandingNodesUseCase.ts` and `ImportLandingNodesUseCase.ts`. Mixing `await` and `.then()` splits the error-handling model
- [x] 6.5 [BE] In `ImportActionsUseCase.ts`, replace `landing.actions.some(actionId => actionId === action.id)` with `landing.actions.includes(action.id)` — clearer intent
- [x] 6.6 [BE] In `ImportActionsUseCase.ts`, remove redundant `else` after `return` — restructure as early return or ternary

## 7. Verification

- [x] 7.1 [BE] Run `yarn lint` and `yarn test` to verify no type errors or regressions
- [x] 7.2 [FE] Manually verify in the dev server: import a landing page ZIP, import an actions ZIP, export a landing page, export an action — confirm all four flows behave identically to before
