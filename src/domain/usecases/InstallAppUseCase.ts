import { InstanceRepository } from "../repositories/InstanceRepository";
import { ActionRepository } from "../repositories/ActionRepository";
import { UseCase } from "./UseCase";

export class InstallAppUseCase implements UseCase {
    constructor(private instanceRepository: InstanceRepository, private actionRepository: ActionRepository) {}

    public async execute(moduleId: string): Promise<boolean> {
        const module = await this.actionRepository.get(moduleId);
        if (!module?.name) return false;

        // TODO: We should store app hub id on model instead of using display name
        return this.instanceRepository.installApp(module.name.referenceValue);
    }
}
