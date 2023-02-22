import { Instance } from "../../data/entities/Instance";
import { LandingPagePermission } from "../../data/entities/PersistedConfig";
import { Permission } from "../entities/Permission";
import { User } from "../entities/User";

export interface ConfigRepository {
    getUser(): Promise<User>;
    getInstance(): Instance;
    getSettingsPermissions(): Promise<Permission>;
    updateSettingsPermissions(update: Partial<Permission>): Promise<void>;
    getLandingPagePermissions(): Promise<LandingPagePermission[]>;
    updateLandingPagePermissions(update: Partial<LandingPagePermission>, id: string): Promise<void>;
    getShowAllActions(): Promise<boolean>;
    setShowAllActions(flag: boolean): Promise<void>;
}
