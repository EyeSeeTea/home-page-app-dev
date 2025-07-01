import { LandingNode } from "../entities/LandingNode";
import { FutureData } from "../types/Future";

export interface LandingNodeRepository {
    list(): FutureData<LandingNode[]>;
    // delete(landingNodes: LandingNode[]): FutureData<void>;
    save(landingNodes: LandingNode[]): FutureData<void>;
}
