import { ImportExportClient } from "../../data/clients/importExport/ImportExportClient";
import { ExportLandingNodesUseCase } from "../../domain/usecases/ExportLandingNodesUseCase";

export class LandingExportService {
    constructor(
        private importExportClient: ImportExportClient,
        private exportUseCase: ExportLandingNodesUseCase
    ) {}

    public async execute(ids: string[]): Promise<void> {
        const pages = await this.exportUseCase.execute(ids);
        // Each page triggers a FileSaver download. Parallel fan-out matches the
        // previous behavior; if browsers start prompting on multi-downloads,
        // sequence here instead (e.g. via promiseMap with concurrency 1).
        await Promise.all(pages.map(page => this.importExportClient.export(page)));
    }
}
