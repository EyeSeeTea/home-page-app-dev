import i18n from "../../utils/i18n";
import { PersistedAction } from "../../data/entities/PersistedAction";
import { ActionRepository } from "../repositories/ActionRepository";
import { LandingNodeRepository } from "../repositories/LandingNodeRepository";
import { UseCase } from "./UseCase";

export class ImportActionsUseCase implements UseCase {
    constructor(
        private actionRepository: ActionRepository,
        private landingRepository: LandingNodeRepository
    ) {}

    public async execute(items: PersistedAction[]): Promise<PersistedAction[]> {
        const nodes = await this.landingRepository.getAll();
        const valid = items.every(action => {
            if (action.type !== "page") return true;
            const landing = nodes.find(node => node.id === action.launchPageId);
            if (!landing) return false;
            return !landing.actions.includes(action.id);
        });

        if (!valid) {
            return Promise.reject(i18n.t("Unable to import actions. Some action is referencing an invalid page."));
        }
        return this.actionRepository.save(items);
    }
}
