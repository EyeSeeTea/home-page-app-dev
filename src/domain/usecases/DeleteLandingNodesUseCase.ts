import { LandingNodeV1Repository } from "../repositories/LandingNodeV1Repository";
import { UseCase } from "./UseCase";

export class DeleteLandingNodesUseCase implements UseCase {
    constructor(private landingPagesRepository: LandingNodeV1Repository) {}

    public async execute(ids: string[]): Promise<void> {
        return this.landingPagesRepository.deleteNodes(ids);
    }
}
