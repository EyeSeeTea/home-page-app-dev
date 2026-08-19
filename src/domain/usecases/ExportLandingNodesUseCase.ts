import { LandingNodeRepository } from "../repositories/LandingNodeRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { UseCase } from "./UseCase";
import { PersistedLandingPageWithPermissions } from "../../data/entities/PersistedLandingNode";

export class ExportLandingNodesUseCase implements UseCase {
    constructor(
        private landingPageRepository: LandingNodeRepository,
        private settingsRepository: SettingsRepository
    ) {}

    public async execute(ids: string[]): Promise<PersistedLandingPageWithPermissions[]> {
        const nodes = await this.landingPageRepository.getPersistedLandingPages();
        const nodesToSave = nodes.filter(node => node.some(item => ids.includes(item.id)));
        const nodesToSaveIds = nodesToSave.flatMap(page => page.map(item => item.id));
        const settings = await this.settingsRepository.get().toPromise();
        const sharings = settings.landingPagePermissions.filter(perm => nodesToSaveIds.includes(perm.id));

        return nodesToSave.map(page =>
            page.map(item => {
                const sharingSettings = sharings.find(p => p.id === item.id);
                return sharingSettings ? { ...item, sharingSettings } : item;
            })
        );
    }
}
