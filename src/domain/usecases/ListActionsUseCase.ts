import _ from "lodash";
import { Action } from "../entities/Action";
import { ActionRepository } from "../repositories/ActionRepository";
import { UseCase } from "./UseCase";
import { Config } from "../../data/entities/Config";
import { InstanceRepository } from "../repositories/InstanceRepository";

export class ListActionsUseCase implements UseCase {
    constructor(
        private config: Config,
        private actionRepository: ActionRepository,
        private instanceRepository: InstanceRepository
    ) {}

    public async execute(): Promise<Action[]> {
        const currentUser = this.config.currentUser;
        const installedApps = await this.instanceRepository.listInstalledApps();
        const actions = await this.actionRepository.getAll(installedApps);
        return actions.filter(({ dhisAuthorities }) => {
            const userAuthorities = currentUser.userRoles.flatMap(({ authorities }) => authorities);

            return _.every(
                dhisAuthorities,
                authority => userAuthorities.includes("ALL") || userAuthorities.includes(authority)
            );
        });
    }
}
