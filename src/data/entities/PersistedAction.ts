import { NamedRef, SharingSetting } from "../../domain/entities/Ref";
import { JSONTrainingModule } from "./JSONActionModule";

export interface PersistedAction extends JSONTrainingModule {
    publicAccess: string;
    userAccesses: SharingSetting[];
    userGroupAccesses: SharingSetting[];
    user: NamedRef;
    created: string;
    lastUpdated: string;
    lastUpdatedBy: NamedRef;
    dirty: boolean;
}
