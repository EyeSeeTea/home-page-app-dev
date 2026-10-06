## 1. Domain entity

- [x] 1.1 [BE] Create `BinaryData` value object in `src/domain/entities/BinaryData.ts` with `readonly content: ArrayBuffer`

## 2. Use case signatures

- [x] 2.1 [BE] Change `ImportLandingNodesUseCase.execute(files: File[])` to `execute(files: ReadonlyArray<BinaryData>)` in `src/domain/usecases/ImportLandingNodesUseCase.ts`
- [x] 2.2 [BE] Change `ImportActionsUseCase.execute(files: File[])` to `execute(files: ReadonlyArray<BinaryData>)` in `src/domain/usecases/ImportActionsUseCase.ts`

## 3. Data layer

- [x] 3.1 [BE] Change `ImportExportClient.import<T>(files: Blob[])` to accept `ReadonlyArray<BinaryData>` and use `JSZip.loadAsync(data.content)` in `src/data/clients/importExport/ImportExportClient.ts`

## 4. Webapp call sites

- [x] 4.1 [FE] Convert `File[]` to `BinaryData[]` before calling `compositionRoot.landings.import()` in `src/webapp/components/landing-page-list-table/LandingPageListTable.tsx:71`
- [x] 4.2 [FE] Convert `File[]` to `BinaryData[]` before calling `.import(files)` in `src/webapp/components/action-list-table/ActionListTable.tsx:58`

## 5. Verification

- [x] 5.1 [BE] Run `yarn lint` and `yarn test` to verify no type errors or regressions
