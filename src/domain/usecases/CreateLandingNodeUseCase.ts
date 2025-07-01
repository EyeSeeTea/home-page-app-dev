import { LandingNode } from "../entities/LandingNode";
import { LandingNodeV1Repository } from "../repositories/LandingNodeV1Repository";
import { UseCase } from "./UseCase";

export class CreateLandingNodeUseCase implements UseCase {
    constructor(private landingNodesRepository: LandingNodeV1Repository) {}

    public async execute(node: LandingNode): Promise<void> {
        return this.landingNodesRepository.create(node);
    }
}
