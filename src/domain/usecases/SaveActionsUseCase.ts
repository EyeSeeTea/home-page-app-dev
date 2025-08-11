import i18n from "../../utils/i18n";
import { ActionRepository } from "../repositories/ActionRepository";
import { LandingNodeRepository } from "../repositories/LandingNodeRepository";
import { UseCase } from "./UseCase";
import { Action } from "../entities/Action";

export class SaveActionsUseCase implements UseCase {
    constructor(private actionRepository: ActionRepository, private landingRepository: LandingNodeRepository) {}

    public async execute(actions: Action[]): Promise<void> {
        const nodes = await this.landingRepository.getAll();
        const valid = actions.every(action => {
            if (action.type !== "page") return true;
            const landing = nodes.find(node => node.id === action.launchPageId);
            if (!landing) return false;
            return !landing.actions.some(actionId => actionId === action.id);
        });

        if (valid) return this.actionRepository.save(actions);
        else return Promise.reject(i18n.t("Unable to import actions. Some action is referencing an invalid page."));
    }
}
