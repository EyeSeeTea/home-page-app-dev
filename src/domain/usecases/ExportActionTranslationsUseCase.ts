import { UseCase } from "./UseCase";
import { ActionRepository } from "../repositories/ActionRepository";

export class ExportModuleTranslationsUseCase implements UseCase {
    constructor(private actionRepository: ActionRepository) {}

    public async execute(moduleKey: string): Promise<void> {
        await this.actionRepository.exportTranslations(moduleKey);
    }
}
