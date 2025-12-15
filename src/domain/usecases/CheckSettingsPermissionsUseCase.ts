import _ from "lodash";
import { NamedRef } from "../entities/Ref";
import { User } from "../entities/User";
import { UseCase } from "./UseCase";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { Config } from "../../data/entities/Config";

export class CheckSettingsPermissionsUseCase implements UseCase {
    constructor(private config: Config, private settingsRepository: SettingsRepository) {}

    public async execute(): Promise<boolean> {
        const user = this.config.currentUser;
        const settings = await this.settingsRepository.get().toPromise();
        const permissions = settings.settingsPermissions;

        const isAdmin = !!user.userRoles.find(role => role.authorities.find(authority => authority === "ALL"));

        const sharedByUser = this.findCurrentUser(user, permissions.users ?? []);
        const sharedByGroup = this.findCurrentUser(user, permissions.userGroups ?? []);

        return isAdmin || sharedByUser || sharedByGroup;
    }

    private findCurrentUser(user: User, collection: NamedRef[]): boolean {
        return !_([user, ...user.userGroups])
            .intersectionBy(collection, userGroup => userGroup.id)
            .isEmpty();
    }
}
