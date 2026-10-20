import { ImportExportClient } from "../../data/clients/importExport/ImportExportClient";
import { PersistedAction } from "../../data/entities/PersistedAction";
import { ImportActionsUseCase } from "../../domain/usecases/ImportActionsUseCase";

export class ActionImportService {
    constructor(
        private importExportClient: ImportExportClient,
        private importUseCase: ImportActionsUseCase
    ) {}

    public async execute(files: File[]): Promise<PersistedAction[]> {
        const buffers = await Promise.all(files.map(file => file.arrayBuffer()));
        const items = await this.importExportClient.import<PersistedAction>(buffers);
        return this.importUseCase.execute(items);
    }
}
