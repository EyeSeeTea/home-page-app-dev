import { LandingNode } from "../../domain/entities/LandingNode";

export type PersistedLandingNode = Omit<LandingNode, "children" | "icon" | "favicon"> & {
    icon: string;
    favicon: string;
};
export type PersistedLandingPage = PersistedLandingNode[];
