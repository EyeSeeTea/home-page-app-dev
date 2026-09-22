import { ActionRepository } from "../repositories/ActionRepository";
import { PersistedAction } from "../../data/entities/PersistedAction";
import { UseCase } from "./UseCase";

export class ExportActionsUseCase implements UseCase {
    constructor(private actionRepository: ActionRepository) {}

    public async execute(ids: string[]): Promise<PersistedAction[]> {
        const actions = await this.actionRepository.getPersistedActions();
        const idSet = new Set(ids);
        return actions.filter(action => idSet.has(action.id));
    }
}
