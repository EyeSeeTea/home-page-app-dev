import { ConfigRepository } from "../repositories/ConfigRepository";
import { UseCase } from "./UseCase";

export class SetShowAllModulesUseCase implements UseCase {
    constructor(private configRepository: ConfigRepository) {}

    public async execute(flag: boolean): Promise<void> {
        return this.configRepository.setShowAllActions(flag);
    }
}
