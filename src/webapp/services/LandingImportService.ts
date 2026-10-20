import { ImportExportClient } from "../../data/clients/importExport/ImportExportClient";
import {
    PersistedLandingNode,
    PersistedLandingNodeWithPermissions,
} from "../../data/entities/PersistedLandingNode";
import { ImportLandingNodesUseCase } from "../../domain/usecases/ImportLandingNodesUseCase";

export class LandingImportService {
    constructor(
        private importExportClient: ImportExportClient,
        private importUseCase: ImportLandingNodesUseCase
    ) {}

    public async execute(files: File[]): Promise<PersistedLandingNode[]> {
        const buffers = await Promise.all(files.map(file => file.arrayBuffer()));
        const items = await this.importExportClient.import<PersistedLandingNodeWithPermissions>(buffers);
        return this.importUseCase.execute(items);
    }
}
