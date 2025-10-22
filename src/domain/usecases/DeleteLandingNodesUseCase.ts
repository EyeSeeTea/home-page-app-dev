import { ConfigRepository } from "../repositories/ConfigRepository";
import { LandingNodeRepository } from "../repositories/LandingNodeRepository";
import { UseCase } from "./UseCase";

export class DeleteLandingNodesUseCase implements UseCase {
    constructor(private landingPagesRepository: LandingNodeRepository, private configRepository: ConfigRepository) {}

    public async execute(ids: string[]): Promise<void> {
        await this.landingPagesRepository.deleteNodes(ids);
        await this.configRepository.deleteLandingPagesPermissions(ids);
    }
}
