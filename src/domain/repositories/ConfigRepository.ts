import { Instance } from "../../data/entities/Instance";
import { Permission } from "../entities/Permission";
import { User } from "../entities/User";

export interface ConfigRepository {
    getUser(): Promise<User>;
    getInstance(): Instance;
    getSettingsPermissions(): Promise<Permission>;
    updateSettingsPermissions(update: Partial<Permission>): Promise<void>;
    getShowAllModules(): Promise<boolean>;
    setShowAllModules(flag: boolean): Promise<void>;
}
