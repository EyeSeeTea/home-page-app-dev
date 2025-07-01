import { ImportExportClient } from "../../data/clients/importExport/ImportExportClient";
import { PersistedLandingNode } from "../../data/entities/PersistedLandingNode";
import { updateLandingNode } from "../../data/repositories/LandingNodeDefaultRepository";
import { LandingNodeV1Repository } from "../repositories/LandingNodeV1Repository";
import { UseCase } from "./UseCase";

export class ImportLandingNodesUseCase implements UseCase {
    constructor(
        private landingNodeRepository: LandingNodeV1Repository,
        private importExportClient: ImportExportClient
    ) {}

    public async execute(files: File[]): Promise<PersistedLandingNode[]> {
        const items = await this.importExportClient.import<PersistedLandingNode>(files);
        const persisted = await this.landingNodeRepository.getPersistedLandingPages();
        /* Now: If some items are saved in dataStore, only the ones saved in dataStore will be saved,
        so other items will not be imported. Although that should not be the case, at least when there is no item saved
        on dataStore the items are just concatenated */
        const mergedLandings = updateLandingNode(persisted, items, true);
        await this.landingNodeRepository.save(mergedLandings);

        return items;
    }
}
