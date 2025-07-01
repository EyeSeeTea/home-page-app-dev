import { LandingNode } from "../entities/LandingNode";
import { LandingNodeV1Repository } from "../repositories/LandingNodeV1Repository";
import { UseCase } from "./UseCase";

export class ListLandingChildrenUseCase implements UseCase {
    constructor(private landingNodeRepository: LandingNodeV1Repository) {}

    public async execute(): Promise<LandingNode[]> {
        return this.landingNodeRepository.getAll();
    }
}
