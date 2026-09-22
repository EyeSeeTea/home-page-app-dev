import { PersistedLandingNode, PersistedLandingNodeWithPermissions } from "../../data/entities/PersistedLandingNode";
import { LandingPagePermission } from "../../domain/entities/Permission";
import { Settings } from "../entities/Settings";
import { updateLandingNode } from "../../data/repositories/LandingNodeDefaultRepository";
import { LandingNodeRepository } from "../repositories/LandingNodeRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { UseCase } from "./UseCase";

export class ImportLandingNodesUseCase implements UseCase {
    constructor(
        private landingNodeRepository: LandingNodeRepository,
        private settingsRepository: SettingsRepository
    ) {}

    public async execute(items: PersistedLandingNodeWithPermissions[]): Promise<PersistedLandingNode[]> {
        const nodes: PersistedLandingNode[] = items.map(page => {
            const { sharingSettings: _sharingSettings, ...rest } = page;
            return rest;
        });
        const persisted = await this.landingNodeRepository.getPersistedLandingPages();
        /* Now: If some items are saved in dataStore, only the ones saved in dataStore will be saved,
        so other items will not be imported. Although that should not be the case, at least when there is no item saved
        on dataStore the items are just concatenated */
        const mergedLandings = updateLandingNode(persisted, nodes, true);
        await this.landingNodeRepository.save(mergedLandings);

        const newPermissions: LandingPagePermission[] = items.flatMap(page =>
            page.sharingSettings ? page.sharingSettings : []
        );

        const currentSettings = await this.settingsRepository.get().toPromise();
        const mergedPermissions = Array.from(
            newPermissions
                .reduce(
                    (acc, perm) => acc.set(perm.id, perm),
                    new Map(currentSettings.landingPagePermissions.map(p => [p.id, p] as const))
                )
                .values()
        );
        const updatedSettings = { ...currentSettings, landingPagePermissions: mergedPermissions };

        await this.settingsRepository.save(new Settings(updatedSettings)).toPromise();

        return nodes;
    }
}
