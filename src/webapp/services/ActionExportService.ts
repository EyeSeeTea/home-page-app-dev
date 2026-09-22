import { ImportExportClient } from "../../data/clients/importExport/ImportExportClient";
import { ExportActionsUseCase } from "../../domain/usecases/ExportActionsUseCase";

export class ActionExportService {
    constructor(
        private importExportClient: ImportExportClient,
        private exportUseCase: ExportActionsUseCase
    ) {}

    public async execute(ids: string[]): Promise<void> {
        const actions = await this.exportUseCase.execute(ids);
        await this.importExportClient.export(actions);
    }
}
