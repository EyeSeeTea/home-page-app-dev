import { LandingNode } from "../../domain/entities/LandingNode";

export type PersistedLandingNode = Omit<LandingNode, "children">;
