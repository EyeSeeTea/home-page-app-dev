import { ConfigRepository } from "../repositories/ConfigRepository";
import { UseCase } from "./UseCase";

export class GeShowtAllActionsUseCase implements UseCase {
    constructor(private configRepository: ConfigRepository) {}

    public async execute(): Promise<boolean> {
        return this.configRepository.getShowAllActions();
    }
}
